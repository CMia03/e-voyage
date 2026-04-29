"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BellRing, Expand } from "lucide-react";

import { useSimulation } from "@/lib/hooks/useSimulation";
import { ElementSimulation, JourSimulation, VoyageurProfile } from "@/lib/type/simulation.types";
import { DestinationSelector } from "./components/DestinationSelector";
import { PlanificationSelector } from "./components/PlanificationSelector";
import { BudgetInput } from "./components/BudgetInput";
import { CategoryGammeSelector } from "./components/CategoryGammeSelector";
import { PlanningJournalier } from "./components/PlanningJournalier";
import { BudgetSummary } from "./components/BudgetSummary";
import { ActionButtons } from "./components/ActionButtons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type SuggestedElement = {
  id: string;
  titre: string;
  prix: number;
  type: string;
};

type ReservationElementPreview = {
  id: string;
  titre: string;
  prix: number;
  type: string;
  jourNumero?: number;
  jourTitre?: string;
};

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeGamme(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toUpperCase();
  return normalized === "LUXE" ? "LUXE" : "MOYENNE";
}

function parseVoyageurProfiles(
  value: string | null,
  fallbackCategorieId: string | null,
  fallbackGamme: string,
  fallbackNombrePersonnes: number
): VoyageurProfile[] {
  if (value) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const profiles = parsed
          .map((item) => ({
            categorieClientId:
              typeof item?.categorieClientId === "string" ? item.categorieClientId : "",
            gamme:
              typeof item?.gamme === "string" && item.gamme.trim()
                ? item.gamme.trim().toUpperCase()
                : fallbackGamme,
            nombrePersonnes:
              typeof item?.nombrePersonnes === "number" && item.nombrePersonnes > 0
                ? item.nombrePersonnes
                : 1,
          }))
          .filter((item) => !!item.categorieClientId);

        if (profiles.length > 0) {
          return profiles;
        }
      }
    } catch {
      return [];
    }
  }

  return fallbackCategorieId
    ? [{ categorieClientId: fallbackCategorieId, gamme: fallbackGamme, nombrePersonnes: fallbackNombrePersonnes }]
    : [];
}

function totalVoyageurs(profiles: VoyageurProfile[]): number {
  return profiles.reduce((sum, profile) => sum + Math.max(profile.nombrePersonnes || 0, 0), 0);
}

function parseSimulationElementCards(value: string | null): ReservationElementPreview[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        id: typeof item?.id === "string" ? item.id : "",
        titre: typeof item?.titre === "string" ? item.titre : "",
        prix: typeof item?.prix === "number" ? item.prix : 0,
        type: typeof item?.type === "string" ? item.type : "",
        jourNumero: typeof item?.jourNumero === "number" ? item.jourNumero : undefined,
        jourTitre: typeof item?.jourTitre === "string" ? item.jourTitre : undefined,
      }))
      .filter((item) => item.id);
  } catch {
    return [];
  }
}

function getOptionalSuggestions(
  jours: JourSimulation[] | undefined,
  deficit: number
): SuggestedElement[] {
  if (!jours || deficit <= 0) return [];

  const optionnels = jours
    .flatMap((jour) => jour.elements)
    .filter((element: ElementSimulation) => !element.obligatoire && element.coche)
    .sort((a, b) => b.prix - a.prix);

  const suggestions: SuggestedElement[] = [];
  let montantCouvre = 0;

  for (const element of optionnels) {
    if (montantCouvre >= deficit) break;

    suggestions.push({
      id: element.id,
      titre: element.titre,
      prix: element.prix,
      type: element.type,
    });

    montantCouvre += element.prix;
  }

  return suggestions;
}

function getAffordableOptionalSuggestions(
  jours: JourSimulation[] | undefined,
  resteBudget: number
): SuggestedElement[] {
  if (!jours || resteBudget <= 0) return [];

  return jours
    .flatMap((jour) => jour.elements)
    .filter(
      (element: ElementSimulation) =>
        !element.obligatoire && !element.coche && element.prix > 0 && element.prix <= resteBudget
    )
    .sort((a, b) => a.prix - b.prix)
    .map((element) => ({
      id: element.id,
      titre: element.titre,
      prix: element.prix,
      type: element.type,
    }));
}

function formatAr(value?: number | null) {
  return `${(value ?? 0).toLocaleString()} Ar`;
}

function buildSimulationSummary(
  destinationTitle: string | undefined,
  planificationTitle: string | undefined,
  nombrePersonnes: number,
  budgetClient: number | undefined,
  totalAvecMarge: number | undefined,
  reste: number | undefined
) {
  return [
    destinationTitle ? `Destination: ${destinationTitle}` : null,
    planificationTitle ? `Planification: ${planificationTitle}` : null,
    `Nombre de personnes: ${nombrePersonnes}`,
    budgetClient !== undefined && budgetClient > 0 ? `Budget client: ${formatAr(budgetClient)}` : null,
    totalAvecMarge !== undefined ? `Total selectionne: ${formatAr(totalAvecMarge)}` : null,
    reste !== undefined ? `Reste budgetaire: ${formatAr(reste)}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function SimulationPage() {
  const params = useParams<{ username: string }>();
  const username = typeof params?.username === "string" ? params.username : "client";
  const router = useRouter();
  const query = useSearchParams();
  const [isPlanningExpanded, setIsPlanningExpanded] = useState(false);
  const prefillAppliedRef = useRef(false);
  const autoSimulationLaunchedRef = useRef(false);
  const {
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
  } = useSimulation();

  const reservationEditPrefill = useMemo(
    () => ({
      editReservationId: query?.get("editReservationId") || null,
      commentaireClient: query?.get("commentaireClient") || null,
      budgetClient: parsePositiveInteger(query?.get("budgetClient"), 0),
      destinationId: query?.get("destinationId") || null,
      planificationId: query?.get("planificationId") || null,
      categorieId: query?.get("categorieId") || null,
      gamme: normalizeGamme(query?.get("gamme")),
      nombrePersonnes: parsePositiveInteger(query?.get("nombrePersonnes"), 1),
      voyageurProfiles: parseVoyageurProfiles(
        query?.get("voyageurProfiles"),
        query?.get("categorieId"),
        normalizeGamme(query?.get("gamme")),
        parsePositiveInteger(query?.get("nombrePersonnes"), 1)
      ),
      elementsSelectionnes: (query?.get("elementsSelectionnes") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      elementsDetails: parseSimulationElementCards(query?.get("elementsDetails")),
    }),
    [query]
  );

  useEffect(() => {
    if (!query || prefillAppliedRef.current) return;
    if (!reservationEditPrefill.destinationId && !reservationEditPrefill.planificationId) return;

    prefillAppliedRef.current = true;

    if (reservationEditPrefill.destinationId) {
      setSelectedDestinationId(reservationEditPrefill.destinationId);
    }
    if (reservationEditPrefill.voyageurProfiles.length > 0) {
      setVoyageurProfiles(reservationEditPrefill.voyageurProfiles);
    }
    if (reservationEditPrefill.budgetClient > 0) {
      setBudgetClient(reservationEditPrefill.budgetClient);
    }
    if (reservationEditPrefill.elementsSelectionnes.length > 0) {
      setElementsSelectionnes(reservationEditPrefill.elementsSelectionnes);
    }
  }, [
    query,
    reservationEditPrefill,
    setBudgetClient,
    setElementsSelectionnes,
    setSelectedDestinationId,
    setVoyageurProfiles,
  ]);

  useEffect(() => {
    if (!reservationEditPrefill.planificationId || planifications.length === 0) return;
    if (!planifications.some((planification) => planification.id === reservationEditPrefill.planificationId)) return;

    setSelectedPlanificationId(reservationEditPrefill.planificationId);
  }, [planifications, reservationEditPrefill.planificationId, setSelectedPlanificationId]);

  useEffect(() => {
    if (autoSimulationLaunchedRef.current) return;
    if (!reservationEditPrefill.editReservationId) return;
    if (!selectedDestinationId || !selectedPlanificationId || voyageurProfiles.length === 0) return;
    if (budgetClient <= 0) return;

    autoSimulationLaunchedRef.current = true;
    void lancerSimulation(
      reservationEditPrefill.elementsSelectionnes.length > 0
        ? reservationEditPrefill.elementsSelectionnes
        : undefined
    );
  }, [
    budgetClient,
    lancerSimulation,
    reservationEditPrefill.editReservationId,
    reservationEditPrefill.elementsSelectionnes,
    selectedDestinationId,
    selectedPlanificationId,
    voyageurProfiles,
  ]);

  const selectedDestination = useMemo(
    () => destinations.find((destination) => destination.id === selectedDestinationId) ?? null,
    [destinations, selectedDestinationId]
  );

  const selectedPlanification = useMemo(
    () => planifications.find((planification) => planification.id === selectedPlanificationId) ?? null,
    [planifications, selectedPlanificationId]
  );

  const budgetCategorieSelectionnee = selectedPlanificationId
    ? budgetByPlanification[selectedPlanificationId] ?? null
    : null;
  const seuilMinimum = minimumBudget?.seuilMinimum ?? result?.recap?.seuilMinimum ?? 0;
  const depassement = Math.max(0, -(result?.resume?.reste ?? 0));
  const resteDisponible = Math.max(0, result?.resume?.reste ?? 0);

  const suggestionsOptionnelles = useMemo(
    () => getOptionalSuggestions(result?.jours, depassement),
    [result?.jours, depassement]
  );
  const suggestionsDisponibles = useMemo(
    () => getAffordableOptionalSuggestions(result?.jours, resteDisponible),
    [result?.jours, resteDisponible]
  );

  const totalSuggestions = suggestionsOptionnelles.reduce(
    (total, element) => total + element.prix,
    0
  );
  const [dismissedBudgetAlertKey, setDismissedBudgetAlertKey] = useState<string | null>(null);
  const [dismissedPositiveBudgetKey, setDismissedPositiveBudgetKey] = useState<string | null>(null);
  const budgetAlertKey = useMemo(
    () =>
      result?.success && depassement > 0 && suggestionsOptionnelles.length > 0
        ? `${selectedPlanificationId}-${JSON.stringify(voyageurProfiles)}-${depassement}-${suggestionsOptionnelles
            .map((element) => element.id)
            .join(",")}`
        : null,
    [
      result?.success,
      depassement,
      suggestionsOptionnelles,
      selectedPlanificationId,
      voyageurProfiles,
    ]
  );
  const positiveBudgetKey = useMemo(
    () =>
      result?.success && resteDisponible > 0 && suggestionsDisponibles.length > 0
        ? `${selectedPlanificationId}-${JSON.stringify(voyageurProfiles)}-${resteDisponible}-${suggestionsDisponibles
            .map((element) => element.id)
            .join(",")}`
        : null,
    [
      result?.success,
      resteDisponible,
      suggestionsDisponibles,
      selectedPlanificationId,
      voyageurProfiles,
    ]
  );
  const showBudgetAlertModal =
      budgetAlertKey !== null && dismissedBudgetAlertKey !== budgetAlertKey;
  const showBudgetAlertIndicator =
      budgetAlertKey !== null && dismissedBudgetAlertKey === budgetAlertKey;
  const showPositiveBudgetModal =
      positiveBudgetKey !== null && dismissedPositiveBudgetKey !== positiveBudgetKey;
  const showPositiveBudgetIndicator =
      positiveBudgetKey !== null && dismissedPositiveBudgetKey === positiveBudgetKey;
  const handlePlanningExpandedChange = (open: boolean) => {
    setIsPlanningExpanded(open);
  };

  const canSimulate =
    !loading &&
    !!selectedPlanificationId &&
    voyageurProfiles.length > 0 &&
    budgetClient > 0;

  const canReserveSimulation =
    !!result?.success &&
    !!selectedDestinationId &&
    !!selectedPlanificationId &&
    voyageurProfiles.length > 0;

  const simulationElements = useMemo(() => {
    if (elementsSelectionnes.length > 0) {
      return elementsSelectionnes;
    }
    if (!result?.jours) {
      return [];
    }
    return result.jours.flatMap((jour) =>
      jour.elements.filter((element) => element.coche).map((element) => element.id)
    );
  }, [elementsSelectionnes, result?.jours]);
  const simulationElementDetails = useMemo<ReservationElementPreview[]>(() => {
    if (!result?.jours) {
      return [];
    }

    return result.jours.flatMap((jour) =>
      jour.elements
        .filter((element) => element.coche)
        .map((element) => ({
          id: element.id,
          titre: element.titre,
          prix: element.prix,
          type: element.type,
          jourNumero: jour.numeroJour,
          jourTitre: jour.titre,
        }))
    );
  }, [result?.jours]);

  const simulationSummary = useMemo(
    () =>
      buildSimulationSummary(
        selectedDestination?.title,
        selectedPlanification?.nomPlanification,
        totalVoyageurs(voyageurProfiles),
        budgetClient,
        result?.resume?.totalAvecMarge ?? result?.resume?.totalCoche,
        result?.resume?.reste
      ),
    [
      selectedDestination?.title,
      selectedPlanification?.nomPlanification,
      voyageurProfiles,
      budgetClient,
      result?.resume?.totalAvecMarge,
      result?.resume?.totalCoche,
      result?.resume?.reste,
    ]
  );

  const handleLancerSimulation = async () => {
    await lancerSimulation();
  };

  const handleReserveSimulation = () => {
    if (!canReserveSimulation) return;

    const params = new URLSearchParams();
    params.set("source", "SIMULATION");
    params.set("destinationId", selectedDestinationId);
    params.set("planificationId", selectedPlanificationId);
    params.set("gamme", selectedGamme);
    params.set("nombrePersonnes", String(totalVoyageurs(voyageurProfiles)));
    if (voyageurProfiles.length > 0) {
      params.set("categorieId", voyageurProfiles[0].categorieClientId);
      params.set("voyageurProfiles", JSON.stringify(voyageurProfiles));
    }
    if (budgetClient > 0) {
      params.set("budgetClient", String(budgetClient));
    }
    if (reservationEditPrefill.editReservationId) {
      params.set("editReservationId", reservationEditPrefill.editReservationId);
    }
    if (reservationEditPrefill.commentaireClient) {
      params.set("commentaireClient", reservationEditPrefill.commentaireClient);
    }
    if (selectedDestination?.title) {
      params.set("destinationTitle", selectedDestination.title);
    }
    if (selectedPlanification?.nomPlanification) {
      params.set("planificationTitle", selectedPlanification.nomPlanification);
    }
    const selectedCategorie = categories.find(
      (categorie) => categorie.id === voyageurProfiles[0]?.categorieClientId
    );
    if (selectedCategorie?.nom) {
      params.set("categorieTitle", selectedCategorie.nom);
    }
    if (simulationElements.length > 0) {
      params.set("elementsSelectionnes", simulationElements.join(","));
    }
    if (simulationElementDetails.length > 0) {
      params.set("elementsDetails", JSON.stringify(simulationElementDetails));
    }
    if (simulationSummary) {
      params.set("resumeSimulation", simulationSummary);
    }

    router.push(`/${username}/reservations?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_38%),linear-gradient(180deg,_#f7faf8_0%,_#ffffff_42%,_#f8fafc_100%)]">
      {showBudgetAlertIndicator ? (
          <button
            type="button"
            onClick={() => setDismissedBudgetAlertKey(null)}
            className="pointer-events-auto fixed right-4 top-28 z-[120] inline-flex items-center gap-3 rounded-full border border-amber-300 bg-white/95 px-4 py-3 text-left shadow-[0_16px_45px_-24px_rgba(217,119,6,0.75)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-amber-50 sm:right-6"
          >
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300/70" />
            <BellRing className="relative z-10 h-5 w-5" />
          </span>
          <span className="hidden sm:block">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Message
            </span>
            <span className="mt-1 block text-sm font-medium text-slate-900">
              Voir l&apos;ajustement recommande
            </span>
          </span>
        </button>
      ) : null}

        {showPositiveBudgetIndicator ? (
          <button
            type="button"
            onClick={() => setDismissedPositiveBudgetKey(null)}
            className="pointer-events-auto fixed right-4 top-28 z-[120] inline-flex items-center gap-3 rounded-full border border-emerald-300 bg-white/95 px-4 py-3 text-left shadow-[0_16px_45px_-24px_rgba(16,185,129,0.75)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-emerald-50 sm:right-6"
          >
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300/70" />
            <BellRing className="relative z-10 h-5 w-5" />
          </span>
          <span className="hidden sm:block">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Suggestion
            </span>
            <span className="mt-1 block text-sm font-medium text-slate-900">
              Voir les blocs encore disponibles
            </span>
          </span>
        </button>
      ) : null}

      {showBudgetAlertModal ? (
        <section className="pointer-events-auto fixed right-4 top-44 z-[120] w-[min(360px,calc(100vw-2rem))] rounded-[24px] border border-amber-200 bg-[linear-gradient(180deg,_rgba(255,251,235,0.99),_rgba(255,247,214,0.97))] p-4 shadow-[0_24px_80px_-38px_rgba(217,119,6,0.65)] sm:right-6">
          <div className="absolute -top-2 right-7 h-4 w-4 rotate-45 border-l border-t border-amber-200 bg-amber-50" />

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                Ajustement recommande
              </p>
              <h3 className="mt-2 text-base font-semibold leading-6 text-amber-950">
                Votre budget est proche. Quelques options peuvent suffire.
              </h3>
              <p className="mt-2 text-sm leading-6 text-amber-900/85">
                Il manque <span className="font-semibold">{formatAr(depassement)}</span>{" "}
                pour couvrir tous les blocs coches.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (budgetAlertKey) {
                  setDismissedBudgetAlertKey(budgetAlertKey);
                }
              }}
              className="shrink-0 rounded-full border border-amber-300 bg-white/80 px-2.5 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-50"
            >
              Fermer
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-300 bg-white/75 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
              Total suggere
            </p>
            <p className="mt-1 text-lg font-semibold text-amber-950">
              {formatAr(totalSuggestions)}
            </p>
          </div>

          <div className="mt-4 space-y-2.5">
            {suggestionsOptionnelles.slice(0, 3).map((element) => (
              <div
                key={element.id}
                className="rounded-2xl border border-amber-200 bg-white/88 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{element.titre}</p>
                    <p className="mt-1 text-xs text-amber-700">
                      Option {element.type.toLowerCase()}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-slate-900">
                    {formatAr(element.prix)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs leading-5 text-amber-900/80">
            Vous pouvez continuer a modifier le budget, decocher des options et relancer
            la simulation sans fermer ce panneau.
          </p>
        </section>
      ) : null}

        {showPositiveBudgetModal ? (
        <section className="pointer-events-auto fixed right-4 top-44 z-[120] w-[min(360px,calc(100vw-2rem))] rounded-[24px] border border-emerald-200 bg-[linear-gradient(180deg,_rgba(236,253,245,0.99),_rgba(220,252,231,0.97))] p-4 shadow-[0_24px_80px_-38px_rgba(16,185,129,0.55)] sm:right-6">
          <div className="absolute -top-2 right-7 h-4 w-4 rotate-45 border-l border-t border-emerald-200 bg-emerald-50" />

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Suggestions budget
              </p>
              <h3 className="mt-2 text-base font-semibold leading-6 text-emerald-950">
                Vous pouvez encore enrichir votre voyage
              </h3>
              <p className="mt-2 text-sm leading-6 text-emerald-900/85">
                Il vous reste <span className="font-semibold">{formatAr(resteDisponible)}</span>. Voici les blocs optionnels que vous pouvez encore cocher sans depasser votre budget.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (positiveBudgetKey) {
                  setDismissedPositiveBudgetKey(positiveBudgetKey);
                }
              }}
              className="shrink-0 rounded-full border border-emerald-300 bg-white/80 px-2.5 py-1 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-50"
            >
              Fermer
            </button>
          </div>

          <div className="mt-4 space-y-2.5">
            {suggestionsDisponibles.slice(0, 4).map((element) => (
              <div
                key={element.id}
                className="rounded-2xl border border-emerald-200 bg-white/88 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{element.titre}</p>
                    <p className="mt-1 text-xs text-emerald-700">
                      {element.type}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-slate-900">
                    {formatAr(element.prix)}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                  onClick={() => void toggleElement(element.id)}
                >
                  Cocher ce bloc
                </Button>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs leading-5 text-emerald-900/80">
            Vous pouvez cocher directement un bloc propose ou continuer a ajuster votre simulation.
          </p>
        </section>
      ) : null}

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white/90 shadow-[0_20px_70px_-35px_rgba(15,118,110,0.45)] backdrop-blur">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:px-8 lg:py-10">
            <div className="space-y-5">
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Simulation budget voyage
              </div>

              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  Concevez un voyage plus clair, plus serein et adapte a votre budget reel.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Choisissez votre destination, votre forfait, votre categorie et votre
                  gamme. Ensuite, nous vous aidons a construire une proposition plus
                  ambitieuse, mais toujours realiste et facile a ajuster.
                </p>
              </div>

              {/* <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Destination
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedDestination?.title ?? "A choisir"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Forfait
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedPlanification?.nomPlanification ?? "A choisir"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Budget minimum
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {seuilMinimum > 0 ? formatAr(seuilMinimum) : "A calculer"}
                  </p>
                </div>
              </div> */}
              
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.9)]">
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">
                Notre ambition
              </p>
              <h2 className="mt-4 text-xl font-semibold leading-8">
                Donner a chaque voyageur une experience lisible, elegante et rassurante.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Vous visualisez tout de suite ce qui est obligatoire, ce qui est
                optionnel et ce qu&apos;il faut ajuster pour rester dans votre budget,
                sans perdre la qualite du voyage.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_60px_-40px_rgba(15,23,42,0.45)] sm:p-6">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                    Etape 1
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">
                    Configurez votre simulation
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Renseignez les informations principales pour lancer une estimation
                    adaptee a votre profil.
                  </p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600">
                  Simple, rapide et modifiable a tout moment
                </div>
              </div>

              <div className="space-y-4">
                <DestinationSelector
                  destinations={destinations}
                  value={selectedDestinationId}
                  onChange={setSelectedDestinationId}
                />

                <PlanificationSelector
                  planifications={planifications}
                  value={selectedPlanificationId}
                  onChange={setSelectedPlanificationId}
                  loading={loading}
                  budgetisationsByPlanification={budgetisationsByPlanification}
                />

                <CategoryGammeSelector
                  categories={categories}
                  profiles={voyageurProfiles}
                  onProfilesChange={setVoyageurProfiles}
                  disabled={loading}
                />

                <BudgetInput
                  value={budgetClient}
                  onChange={setBudgetClient}
                  minBudget={seuilMinimum}
                  adminBudget={budgetCategorieSelectionnee}
                  disabled={loading}
                />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleLancerSimulation}
                  disabled={!canSimulate}
                  className="inline-flex flex-1 items-center justify-center rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading
                    ? "Simulation en cours..."
                    : result
                      ? "Relancer la simulation"
                      : "Lancer la simulation"}
                </button>
                <button
                  onClick={resetSimulation}
                  disabled={loading && !result}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reinitialiser
                </button>
              </div>
            </section>

            {error ? (
              <div className="rounded-[24px] border border-red-200 bg-red-50/90 p-5 text-red-700 shadow-sm">
                <p className="text-sm font-semibold">Une erreur est survenue</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            ) : null}

            {result ? (
              <>
                <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_60px_-40px_rgba(15,23,42,0.45)] sm:p-6">
                  <BudgetSummary
                    totalCoche={result.resume?.totalCoche || 0}
                    totalAvecMarge={result.resume?.totalAvecMarge || result.resume?.totalCoche || 0}
                    budgetClient={result.recap?.budgetClient || budgetClient}
                    adminBudget={budgetCategorieSelectionnee}
                    reste={result.resume?.reste || 0}
                    totalOptionnel={result.resume?.totalOptionnel || 0}
                    seuilMinimum={result.recap?.seuilMinimum || 0}
                  />
                </section>

                {result.success ? (
                  <>
                    <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_60px_-40px_rgba(15,23,42,0.45)] sm:p-6">
                      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                            Etape 2
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-slate-900">
                            Ajustez votre planning
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            Cochez ou decochez les elements optionnels selon vos priorites.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {reservationEditPrefill.editReservationId ? (
                            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700">
                              Mode modification de reservation
                            </div>
                          ) : null}
                          <Button onClick={handleReserveSimulation} disabled={!canReserveSimulation}>
                            {reservationEditPrefill.editReservationId
                              ? "Mettre a jour depuis cette simulation"
                              : "Reserver cette simulation"}
                          </Button>
                        </div>
                      </div>

                      <ActionButtons
                        onToutCocher={toutCocher}
                        onToutDecocher={toutDecocher}
                      />
                    </section>

                      {result.jours ? (
                        <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_60px_-40px_rgba(15,23,42,0.45)] sm:p-6">
                          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                              Etape 3
                            </p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">
                              Planning journalier recommande
                            </h3>
                              <p className="mt-1 text-sm text-slate-600">
                                Visualisez votre voyage jour par jour, avec les blocs
                                obligatoires et optionnels.
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Dialog open={isPlanningExpanded} onOpenChange={handlePlanningExpandedChange}>
                                <DialogTrigger asChild>
                                  <Button type="button" variant="outline" size="icon" aria-label="Ouvrir le planning en grand ecran">
                                    <Expand className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent
                                  className="!h-[92vh] !w-[94vw] !max-w-[1400px] overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 sm:!max-w-[1400px]"
                                  onInteractOutside={(event) => {
                                    event.preventDefault();
                                  }}
                                  onEscapeKeyDown={(event) => {
                                    event.preventDefault();
                                  }}
                                >
                                  <DialogHeader className="border-b border-slate-200 bg-slate-50/90 px-6 py-5">
                                    <DialogTitle className="text-xl font-semibold text-slate-900">
                                      Planning journalier recommande
                                    </DialogTitle>
                                    <DialogDescription className="text-sm text-slate-600">
                                      Visualisez votre voyage en grand format et ajustez les blocs obligatoires et optionnels plus confortablement.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="h-full overflow-auto px-6 py-5">
                                    <PlanningJournalier
                                      jours={result.jours}
                                      elementsSelectionnes={elementsSelectionnes}
                                      onToggleElement={toggleElement}
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {/* <Button asChild variant="outline">
                                <Link href={`/${username}/reservations`}>Voir mes reservations</Link>
                              </Button> */}

                              
                            </div>
                          </div>

                        <PlanningJournalier
                          jours={result.jours}
                          elementsSelectionnes={elementsSelectionnes}
                          onToggleElement={toggleElement}
                        />
                      </section>
                    ) : null}
                  </>
                ) : null}

                <section
                  className={`rounded-[28px] border p-5 shadow-sm sm:p-6 ${
                    result.success
                      ? "border-emerald-200 bg-emerald-50/90 text-emerald-800"
                      : "border-yellow-200 bg-yellow-50/95 text-yellow-800"
                  }`}
                >
                  <p className="text-sm font-semibold">{result.message}</p>
                  {!result.success &&
                    result.suggestions?.suggestions.map((suggestion, index) => (
                      <p key={`${suggestion.type}-${index}`} className="mt-2 text-sm leading-6">
                        {suggestion.message}
                      </p>
                    ))}
                </section>
              </>
            ) : (

              
              <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_60px_-40px_rgba(15,23,42,0.45)] sm:p-6">
                {/* <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      1. Choisissez
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Destination, forfait, categorie et gamme.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      2. Ajustez
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Indiquez votre budget et le nombre de voyageurs.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      3. Decidez
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Activez les options qui vous donnent le meilleur voyage.
                    </p>
                  </div>
                </div> */}

                {query?.get("planificationId") ? (
                  <p className="mt-4 text-sm text-emerald-700">
                    Une planification a ete preselectionnee depuis votre parcours precedent.
                  </p>
                ) : null}
              </section>
            )}
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <section className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_16px_60px_-40px_rgba(15,23,42,0.45)] sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Vue rapide
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Votre cap budgetaire
              </h2>

              {/* <p className="mt-2 text-sm leading-6 text-slate-600">
                Cette colonne vous aide a garder une vision simple de votre marge de
                manoeuvre avant et apres simulation.
              </p> */}

              <div className="mt-4 space-y-2.5">
                <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Budget min
                  </p>
                  <p className="mt-1.5 text-base font-semibold text-slate-900">
                    {seuilMinimum > 0 ? formatAr(seuilMinimum) : "A calculer"}
                  </p>
                </div>
                <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Budget max
                  </p>
                  <p className="mt-1.5 text-base font-semibold text-slate-900">
                    {budgetCategorieSelectionnee ? formatAr(budgetCategorieSelectionnee) : "A choisir"}
                  </p>
                </div>
                <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Votre budget
                  </p>
                  <p className="mt-1.5 text-base font-semibold text-slate-900">
                    {budgetClient > 0 ? formatAr(budgetClient) : "Non renseigne"}
                  </p>
                </div>
                  <div
                    className={`rounded-[20px] border p-3 ${
                      result
                        ? (result.resume?.reste ?? 0) >= 0
                          ? "border-emerald-200 bg-emerald-50/80"
                        : "border-amber-200 bg-amber-50/80"
                      : "border-slate-200 bg-slate-50/80"
                  }`}
                >
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Reste budgetaire
                    </p>
                    <p
                      className={`mt-1.5 text-base font-semibold ${
                        result
                          ? (result.resume?.reste ?? 0) >= 0
                            ? "text-emerald-800"
                          : "text-amber-800"
                        : "text-slate-900"
                    }`}
                  >
                    {result ? formatAr(result.resume?.reste ?? 0) : "A calculer"}
                  </p>
                </div>
              </div>
            </section>

              <section className="rounded-[24px] border border-slate-200/80 bg-slate-950 p-5 text-white shadow-[0_20px_65px_-40px_rgba(15,23,42,0.95)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  Conseil pro
                </p>
                <h3 className="mt-3 text-lg font-semibold">
                  Commencez par le coeur du voyage.
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Lancez d&apos;abord une simulation avec les blocs essentiels, puis
                  ajoutez progressivement les options qui augmentent la valeur de
                  l&apos;experience.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
