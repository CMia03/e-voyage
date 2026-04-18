// lib/api/hooks/useSimulation.ts

import { useState, useEffect, useCallback } from "react";
import { simulerPlanification } from "@/lib/api/simulationService";
import { 
    SimulationRequest, 
    SimulationResponse, 
    DestinationType, 
    PlanificationType, 
    CategorieType,
    JourSimulation,
    ElementSimulation
} from "@/lib/type/simulation.types";
import { listDestinations } from "@/lib/api/destinations";
import { listPlanificationsByDestination } from "@/lib/api/destinations";
import { listCategorieClientActivites } from "@/lib/api/activites";
import { loadAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";

export function useSimulation() {
    const [destinations, setDestinations] = useState<DestinationType[]>([]);
    const [planifications, setPlanifications] = useState<PlanificationType[]>([]);
    const [categories, setCategories] = useState<CategorieType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SimulationResponse | null>(null);

    const [selectedDestinationId, setSelectedDestinationId] = useState("");
    const [selectedPlanificationId, setSelectedPlanificationId] = useState("");
    const [budgetClient, setBudgetClient] = useState(0);
    const [selectedCategorieId, setSelectedCategorieId] = useState("");
    const [selectedGamme, setSelectedGamme] = useState("MOYENNE");
    const [nombrePersonnes, setNombrePersonnes] = useState(1);
    const [elementsSelectionnes, setElementsSelectionnes] = useState<string[]>([]);

    const collectElementIds = useCallback((jours: JourSimulation[] | undefined): string[] => {
        if (!jours) return [];
        return jours.flatMap((jour: JourSimulation) =>
            jour.elements.map((el: ElementSimulation) => el.id)
        );
    }, []);

    const collectObligatoiresIds = useCallback((jours: JourSimulation[] | undefined): string[] => {
        if (!jours) return [];
        return jours.flatMap((jour: JourSimulation) =>
            jour.elements
                .filter((el: ElementSimulation) => el.obligatoire)
                .map((el: ElementSimulation) => el.id)
        );
    }, []);

    // Charger les destinations
    useEffect(() => {
        const loadDestinations = async () => {
            try {
                const data = await listDestinations();
                setDestinations(data);
                if (data.length > 0) {
                    setSelectedDestinationId(data[0].id);
                }
            } catch (err) {
                console.error("Erreur chargement destinations:", err);
                setError("Impossible de charger les destinations");
            }
        };
        loadDestinations();
    }, []);

    // Charger les catégories client
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const session = loadAuth();
                const token = session?.accessToken;
                const response = await listCategorieClientActivites(token);
                const data = response.data;
                if (data && data.length > 0) {
                    setCategories(data);
                    setSelectedCategorieId(data[0].id);
                }
            } catch (err) {
                console.error("Erreur chargement catégories:", err);
            }
        };
        loadCategories();
    }, []);

    // Charger les planifications quand la destination change
    useEffect(() => {
        if (!selectedDestinationId) return;

        const loadPlanifications = async () => {
            setLoading(true);
            try {
                const session = loadAuth();
                const token = session?.accessToken;
                const response = await listPlanificationsByDestination(selectedDestinationId, token);
                const data = response.data;
                if (data && data.length > 0) {
                    setPlanifications(data);
                    setSelectedPlanificationId(data[0].id);
                } else {
                    setPlanifications([]);
                    setSelectedPlanificationId("");
                    setResult(null);
                    setElementsSelectionnes([]);
                }
            } catch (err) {
                console.error("Erreur chargement planifications:", err);
                setError("Impossible de charger les planifications");
            } finally {
                setLoading(false);
            }
        };
        loadPlanifications();
    }, [selectedDestinationId]);

    // Lancer la simulation
    const lancerSimulation = useCallback(async (selection?: string[]) => {
        if (!selectedPlanificationId || !selectedCategorieId || budgetClient <= 0) {
            setError("Veuillez remplir tous les champs");
            return false;
        }

        setLoading(true);
        setError(null);

        const selectionCourante = selection ?? elementsSelectionnes;

        const request: SimulationRequest = {
            destinationId: selectedDestinationId,
            planificationId: selectedPlanificationId,
            budgetClient,
            idCategorieClient: selectedCategorieId,
            gamme: selectedGamme,
            nombrePersonnes,
            elementsSelectionnes: selectionCourante.length > 0 ? selectionCourante : undefined,
        };

        try {
            const session = loadAuth();
            const token = session?.accessToken;
            const response = await simulerPlanification(request, token);
            setResult(response);

            if (response.success) {
                if (selection !== undefined) {
                    setElementsSelectionnes(selectionCourante);
                } else if (response.jours && elementsSelectionnes.length === 0) {
                    setElementsSelectionnes(collectElementIds(response.jours));
                }
            }

            return true;
        } catch (err) {
            console.error("Erreur simulation:", err);
            setResult(null);
            if (err instanceof ApiError) {
                setError(err.message);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Erreur lors de la simulation");
            }
            return false;
        } finally {
            setLoading(false);
        }
    }, [
        selectedDestinationId,
        selectedPlanificationId,
        budgetClient,
        selectedCategorieId,
        selectedGamme,
        nombrePersonnes,
        elementsSelectionnes,
        collectElementIds,
    ]);

    const toggleElement = useCallback(async (elementId: string) => {
        if (!result?.jours) return;

        const prochaineSelection = elementsSelectionnes.includes(elementId)
            ? elementsSelectionnes.filter((id) => id !== elementId)
            : [...elementsSelectionnes, elementId];

        await lancerSimulation(prochaineSelection);
    }, [elementsSelectionnes, lancerSimulation, result?.jours]);

    const toutCocher = useCallback(async () => {
        if (!result?.jours) return;
        await lancerSimulation(collectElementIds(result.jours));
    }, [collectElementIds, lancerSimulation, result?.jours]);

    const toutDecocher = useCallback(async () => {
        if (!result?.jours) return;
        await lancerSimulation(collectObligatoiresIds(result.jours));
    }, [collectObligatoiresIds, lancerSimulation, result?.jours]);

    const resetSimulation = () => {
        setResult(null);
        setElementsSelectionnes([]);
        setError(null);
    };

    return {
        destinations,
        planifications,
        categories,
        loading,
        error,
        result,
        selectedDestinationId,
        setSelectedDestinationId,
        selectedPlanificationId,
        setSelectedPlanificationId,
        budgetClient,
        setBudgetClient,
        selectedCategorieId,
        setSelectedCategorieId,
        selectedGamme,
        setSelectedGamme,
        nombrePersonnes,
        setNombrePersonnes,
        elementsSelectionnes,
        lancerSimulation,
        toggleElement,
        toutCocher,
        toutDecocher,
        resetSimulation,
    };
}
