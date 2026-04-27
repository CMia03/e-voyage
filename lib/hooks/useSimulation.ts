import { useState, useEffect, useCallback } from "react";
import { calculerSeuilMinimum, simulerPlanification } from "@/lib/api/simulationService";
import {
    SeuilMinimumResponse,
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
import { listBudgetisationsByPlanification } from "@/lib/api/budgetisation-planification";
import { BudgetisationPlanificationVoyage } from "@/lib/type/budgetisation-planification";
import { loadAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";

function normalizeValue(value: string | number | null | undefined): string {
    return String(value ?? "").trim().toUpperCase();
}

function resolveBudgetForPlanification(
    budgetisations: BudgetisationPlanificationVoyage[],
    gamme: string,
    nombrePersonnes: number
): number | null {
    const gammeNormalisee = normalizeValue(gamme);
    const nombreAttendu = Number(nombrePersonnes);

    const budgetisationsFiltrees = budgetisations.filter(
        (item) => normalizeValue(item.gamme) === gammeNormalisee
    );

    if (budgetisationsFiltrees.length === 0) {
        return null;
    }

    const exacte = budgetisationsFiltrees.find(
        (item) => Number(item.nombrePersonnes) === nombreAttendu
    );

    if (exacte) {
        return Number(exacte.prixAvecReduction);
    }

    const plusProche = [...budgetisationsFiltrees].sort(
        (a, b) => Math.abs(Number(a.nombrePersonnes) - nombreAttendu) - Math.abs(Number(b.nombrePersonnes) - nombreAttendu)
    )[0];

    return plusProche ? Number(plusProche.prixAvecReduction) : null;
}

function hasMatchingBudgetisation(
    budgetisations: BudgetisationPlanificationVoyage[],
    categorieClientId: string,
    gamme: string,
    nombrePersonnes: number
): boolean {
    const categorieNormalisee = normalizeValue(categorieClientId);
    const gammeNormalisee = normalizeValue(gamme);
    const nombreAttendu = Number(nombrePersonnes);

    return budgetisations.some((item) => {
        const memeCategorie =
            normalizeValue(item.idCategorieClient) === categorieNormalisee;
        const memeGamme = normalizeValue(item.gamme) === gammeNormalisee;
        const memeNombre = Number(item.nombrePersonnes) === nombreAttendu;

        return memeCategorie && memeGamme && memeNombre;
    });
}

export function useSimulation() {
    const [destinations, setDestinations] = useState<DestinationType[]>([]);
    const [planifications, setPlanifications] = useState<PlanificationType[]>([]);
    const [categories, setCategories] = useState<CategorieType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SimulationResponse | null>(null);
    const [minimumBudget, setMinimumBudget] = useState<SeuilMinimumResponse | null>(null);
    const [budgetByPlanification, setBudgetByPlanification] = useState<Record<string, number | null>>({});
    const [budgetisationsByPlanification, setBudgetisationsByPlanification] = useState<Record<string, BudgetisationPlanificationVoyage[]>>({});

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

    useEffect(() => {
        const loadDestinations = async () => {
            try {
                const data = await listDestinations();
                setDestinations(data);
                setSelectedDestinationId((current) => {
                    if (current && data.some((destination) => destination.id === current)) {
                        return current;
                    }
                    return data.length > 0 ? data[0].id : "";
                });
            } catch (err) {
                console.error("Erreur chargement destinations:", err);
                setError("Impossible de charger les destinations");
            }
        };
        loadDestinations();
    }, []);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const session = loadAuth();
                const token = session?.accessToken;
                const response = await listCategorieClientActivites(token);
                const data = response.data;
                if (data && data.length > 0) {
                    setCategories(data);
                    setSelectedCategorieId((current) => {
                        if (current && data.some((categorie) => categorie.id === current)) {
                            return current;
                        }
                        return data[0].id;
                    });
                }
            } catch (err) {
                console.error("Erreur chargement categories:", err);
            }
        };
        loadCategories();
    }, []);

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
                    setSelectedPlanificationId((current) => {
                        if (current && data.some((planification) => planification.id === current)) {
                            return current;
                        }
                        return data[0].id;
                    });
                } else {
                    setPlanifications([]);
                    setSelectedPlanificationId("");
                    setResult(null);
                    setMinimumBudget(null);
                    setBudgetByPlanification({});
                    setBudgetisationsByPlanification({});
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

    useEffect(() => {
        if (planifications.length === 0) {
            setBudgetisationsByPlanification({});
            return;
        }

        let active = true;

        const loadBudgets = async () => {
            try {
                const session = loadAuth();
                const token = session?.accessToken;
                const budgets = await Promise.all(
                    planifications.map(async (planification) => {
                        const response = await listBudgetisationsByPlanification(
                            planification.id,
                            token
                        );

                        return [planification.id, response.data ?? []] as const;
                    })
                );

                if (active) {
                    setBudgetisationsByPlanification(Object.fromEntries(budgets));
                }
            } catch (err) {
                console.error("Erreur chargement budgetisation planification:", err);
                if (active) {
                    setBudgetisationsByPlanification({});
                }
            }
        };

        void loadBudgets();

        return () => {
            active = false;
        };
    }, [planifications]);

    useEffect(() => {
        if (!selectedCategorieId || !selectedGamme || nombrePersonnes <= 0) {
            setBudgetByPlanification({});
            return;
        }

        const budgetsSelectionnes = Object.fromEntries(
            Object.entries(budgetisationsByPlanification).map(([planificationId, budgetisations]) => {
                const budgetisationsFiltrees = budgetisations.filter(
                    (item) => normalizeValue(item.idCategorieClient) === normalizeValue(selectedCategorieId)
                );

                return [
                    planificationId,
                    resolveBudgetForPlanification(budgetisationsFiltrees, selectedGamme, nombrePersonnes),
                ];
            })
        );

        setBudgetByPlanification(budgetsSelectionnes);
    }, [budgetisationsByPlanification, selectedCategorieId, selectedGamme, nombrePersonnes]);

    useEffect(() => {
        if (!selectedPlanificationId || !selectedCategorieId || !selectedGamme || nombrePersonnes <= 0) {
            setMinimumBudget(null);
            return;
        }

        const budgetisationsSelectionnees =
            budgetisationsByPlanification[selectedPlanificationId] ?? [];

        if (
            budgetisationsSelectionnees.length > 0 &&
            !hasMatchingBudgetisation(
                budgetisationsSelectionnees,
                selectedCategorieId,
                selectedGamme,
                nombrePersonnes
            )
        ) {
            setMinimumBudget(null);
            return;
        }

        let active = true;

        const loadMinimumBudget = async () => {
            try {
                const session = loadAuth();
                const token = session?.accessToken;
                const response = await calculerSeuilMinimum(
                    {
                        destinationId: selectedDestinationId,
                        planificationId: selectedPlanificationId,
                        idCategorieClient: selectedCategorieId,
                        gamme: selectedGamme,
                        nombrePersonnes,
                    },
                    token
                );

                if (active) {
                    setMinimumBudget(response);
                }
            } catch (err) {
                if (active) {
                    setMinimumBudget(null);
                }

                if (
                    err instanceof ApiError &&
                    err.status === 400 &&
                    err.message.includes("Aucune budgetisation")
                ) {
                    return;
                }

                console.error("Erreur calcul seuil minimum:", err);
            }
        };

        void loadMinimumBudget();

        return () => {
            active = false;
        };
    }, [
        selectedDestinationId,
        selectedPlanificationId,
        selectedCategorieId,
        selectedGamme,
        nombrePersonnes,
        budgetisationsByPlanification,
    ]);

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
        minimumBudget,
        budgetByPlanification,
        budgetisationsByPlanification,
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
        setElementsSelectionnes,
        lancerSimulation,
        toggleElement,
        toutCocher,
        toutDecocher,
        resetSimulation,
    };
}
