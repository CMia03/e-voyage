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
  ElementSimulation,
  VoyageurProfile,
} from "@/lib/type/simulation.types";
import { listDestinations, listPlanificationsByDestination } from "@/lib/api/destinations";
import { listCategorieClientActivites } from "@/lib/api/activites";
import { listBudgetisationsByPlanification } from "@/lib/api/budgetisation-planification";
import { BudgetisationPlanificationVoyage } from "@/lib/type/budgetisation-planification";
import { loadAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";

function normalizeValue(value: string | number | null | undefined): string {
  return String(value ?? "").trim().toUpperCase();
}

function ensureValidProfiles(
  profiles: VoyageurProfile[],
  categories: CategorieType[]
): VoyageurProfile[] {
  const defaultCategoryId = categories[0]?.id ?? "";
  const normalized = profiles
    .map((profile) => ({
      categorieClientId: profile.categorieClientId || defaultCategoryId,
      gamme: profile.gamme || "MOYENNE",
      nombrePersonnes: Math.max(Number(profile.nombrePersonnes) || 1, 1),
    }))
    .filter((profile) => !!profile.categorieClientId);

  if (normalized.length > 0) {
    return normalized;
  }

  if (!defaultCategoryId) {
    return [];
  }

  return [{ categorieClientId: defaultCategoryId, gamme: "MOYENNE", nombrePersonnes: 1 }];
}

function resolveBudgetForProfile(
  budgetisations: BudgetisationPlanificationVoyage[],
  profile: VoyageurProfile
): number | null {
  const categorieNormalisee = normalizeValue(profile.categorieClientId);
  const gammeNormalisee = normalizeValue(profile.gamme);
  const nombreAttendu = Number(profile.nombrePersonnes);

  const budgetisationsFiltrees = budgetisations.filter(
    (item) =>
      normalizeValue(item.idCategorieClient) === categorieNormalisee &&
      normalizeValue(item.gamme) === gammeNormalisee
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

  const baseBudgetisation = [...budgetisationsFiltrees].sort(
    (a, b) => Number(a.nombrePersonnes) - Number(b.nombrePersonnes)
  )[0];

  if (!baseBudgetisation) {
    return null;
  }

  const nombreReference = Math.max(Number(baseBudgetisation.nombrePersonnes) || 1, 1);
  const prixReference = Number(baseBudgetisation.prixAvecReduction ?? baseBudgetisation.prixNormal ?? 0);

  if (prixReference <= 0) {
    return null;
  }

  const prixParPersonne = prixReference / nombreReference;
  return prixParPersonne * nombreAttendu;
}

function resolveBudgetForPlanification(
  budgetisations: BudgetisationPlanificationVoyage[],
  profiles: VoyageurProfile[]
): number | null {
  const validProfiles = profiles.filter((profile) => !!profile.categorieClientId && profile.nombrePersonnes > 0);
  if (validProfiles.length === 0) {
    return null;
  }

  let total = 0;
  for (const profile of validProfiles) {
    const budget = resolveBudgetForProfile(budgetisations, profile);
    if (budget === null) {
      return null;
    }
    total += budget;
  }

  return total;
}

function hasMatchingBudgetisation(
  budgetisations: BudgetisationPlanificationVoyage[],
  profiles: VoyageurProfile[]
): boolean {
  return profiles.every((profile) => resolveBudgetForProfile(budgetisations, profile) !== null);
}

function totalVoyageurs(profiles: VoyageurProfile[]): number {
  return profiles.reduce((sum, profile) => sum + Math.max(profile.nombrePersonnes || 0, 0), 0);
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
  const [voyageurProfiles, setVoyageurProfiles] = useState<VoyageurProfile[]>([]);
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
    void loadDestinations();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const session = loadAuth();
        const token = session?.accessToken;
        const response = await listCategorieClientActivites(token);
        const data = response.data ?? [];
        setCategories(data);
        setVoyageurProfiles((current) => ensureValidProfiles(current, data));
      } catch (err) {
        console.error("Erreur chargement categories:", err);
      }
    };
    void loadCategories();
  }, []);

  useEffect(() => {
    if (!selectedDestinationId) return;

    const loadPlanifications = async () => {
      setLoading(true);
      try {
        const session = loadAuth();
        const token = session?.accessToken;
        const response = await listPlanificationsByDestination(selectedDestinationId, token);
        const data = response.data ?? [];
        if (data.length > 0) {
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
    void loadPlanifications();
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
            const response = await listBudgetisationsByPlanification(planification.id, token);
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
    const validProfiles = ensureValidProfiles(voyageurProfiles, categories);
    if (validProfiles.length === 0) {
      setBudgetByPlanification({});
      return;
    }

    const budgetsSelectionnes = Object.fromEntries(
      Object.entries(budgetisationsByPlanification).map(([planificationId, budgetisations]) => [
        planificationId,
        resolveBudgetForPlanification(budgetisations, validProfiles),
      ])
    );

    setBudgetByPlanification(budgetsSelectionnes);
  }, [budgetisationsByPlanification, categories, voyageurProfiles]);

  useEffect(() => {
    const validProfiles = ensureValidProfiles(voyageurProfiles, categories);
    if (!selectedPlanificationId || validProfiles.length === 0) {
      setMinimumBudget(null);
      return;
    }

    const budgetisationsSelectionnees = budgetisationsByPlanification[selectedPlanificationId] ?? [];
    if (
      budgetisationsSelectionnees.length > 0 &&
      !hasMatchingBudgetisation(budgetisationsSelectionnees, validProfiles)
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
            idCategorieClient: validProfiles[0]?.categorieClientId ?? "",
            gamme: validProfiles[0]?.gamme ?? "MOYENNE",
            nombrePersonnes: totalVoyageurs(validProfiles),
            profilsVoyageurs: validProfiles,
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
    budgetisationsByPlanification,
    categories,
    selectedDestinationId,
    selectedPlanificationId,
    voyageurProfiles,
  ]);

  const lancerSimulation = useCallback(async (selection?: string[]) => {
    const validProfiles = ensureValidProfiles(voyageurProfiles, categories);
    if (!selectedPlanificationId || validProfiles.length === 0 || budgetClient <= 0) {
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
      idCategorieClient: validProfiles[0]?.categorieClientId ?? "",
      gamme: validProfiles[0]?.gamme ?? "MOYENNE",
      nombrePersonnes: totalVoyageurs(validProfiles),
      profilsVoyageurs: validProfiles,
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
    budgetClient,
    categories,
    collectElementIds,
    elementsSelectionnes,
    selectedDestinationId,
    selectedPlanificationId,
    voyageurProfiles,
  ]);

  const selectedGamme = voyageurProfiles[0]?.gamme ?? "MOYENNE";
  const setSelectedGamme = (gamme: string) => {
    setVoyageurProfiles((current) =>
      current.map((profile, index) =>
        index === 0 ? { ...profile, gamme } : profile
      )
    );
  };

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
    selectedGamme,
    setSelectedGamme,
    voyageurProfiles,
    setVoyageurProfiles,
    elementsSelectionnes,
    setElementsSelectionnes,
    lancerSimulation,
    toggleElement,
    toutCocher,
    toutDecocher,
    resetSimulation,
  };
}
