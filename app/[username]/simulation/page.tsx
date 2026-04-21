"use client";

import { useMemo, useState } from "react";
import { BellRing } from "lucide-react";

import { useSimulation } from "@/lib/hooks/useSimulation";
import { ElementSimulation } from "@/lib/type/simulation.types";
import { DestinationSelector } from "./components/DestinationSelector";
import { PlanificationSelector } from "./components/PlanificationSelector";
import { BudgetInput } from "./components/BudgetInput";
import { CategoryGammeSelector } from "./components/CategoryGammeSelector";
import { PlanningJournalier } from "./components/PlanningJournalier";
import { BudgetSummary } from "./components/BudgetSummary";
import { ActionButtons } from "./components/ActionButtons";

type SuggestedElement = {
  id: string;
  titre: string;
  prix: number;
  type: string;
};

function getOptionalSuggestions(
  jours: typeof import("@/lib/type/simulation.types").JourSimulation[] | undefined,
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

function formatAr(value?: number | null) {
  return `${(value ?? 0).toLocaleString()} Ar`;
}

export default function SimulationPage() {
  const {
    destinations,
    planifications,
    categories,
    loading,
    error,
    result,
    minimumBudget,
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
  } = useSimulation();

  const selectedDestination = useMemo(
    () => destinations.find((destination) => destination.id === selectedDestinationId) ?? null,
    [destinations, selectedDestinationId]
  );

  const selectedPlanification = useMemo(
    () => planifications.find((planification) => planification.id === selectedPlanificationId) ?? null,
    [planifications, selectedPlanificationId]
  );

  const adminBudget = selectedPlanification?.budgetTotal ?? null;
  const seuilMinimum = minimumBudget?.seuilMinimum ?? result?.recap?.seuilMinimum ?? 0;
  const depassement = Math.max(0, -(result?.resume?.reste ?? 0));

  const suggestionsOptionnelles = useMemo(
    () => getOptionalSuggestions(result?.jours, depassement),
    [result?.jours, depassement]
  );

  const totalSuggestions = suggestionsOptionnelles.reduce(
    (total, element) => total + element.prix,
    0
  );
  const [dismissedBudgetAlertKey, setDismissedBudgetAlertKey] = useState<string | null>(null);
  const budgetAlertKey = useMemo(
    () =>
      result?.success && depassement > 0 && suggestionsOptionnelles.length > 0
        ? `${selectedPlanificationId}-${selectedCategorieId}-${selectedGamme}-${nombrePersonnes}-${depassement}-${suggestionsOptionnelles
            .map((element) => element.id)
            .join(",")}`
        : null,
    [
      result?.success,
      depassement,
      suggestionsOptionnelles,
      selectedPlanificationId,
      selectedCategorieId,
      selectedGamme,
      nombrePersonnes,
    ]
  );
  const showBudgetAlertModal =
    budgetAlertKey !== null && dismissedBudgetAlertKey !== budgetAlertKey;
  const showBudgetAlertIndicator =
    budgetAlertKey !== null && dismissedBudgetAlertKey === budgetAlertKey;

  const canSimulate =
    !loading &&
    !!selectedPlanificationId &&
    !!selectedCategorieId &&
    budgetClient > 0;

  const handleLancerSimulation = async () => {
    await lancerSimulation();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_38%),linear-gradient(180deg,_#f7faf8_0%,_#ffffff_42%,_#f8fafc_100%)]">
      {showBudgetAlertIndicator ? (
        <button
          type="button"
          onClick={() => setDismissedBudgetAlertKey(null)}
          className="fixed right-4 top-28 z-40 inline-flex items-center gap-3 rounded-full border border-amber-300 bg-white/95 px-4 py-3 text-left shadow-[0_16px_45px_-24px_rgba(217,119,6,0.75)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-amber-50 sm:right-6"
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

      {showBudgetAlertModal ? (
        <section className="fixed right-4 top-44 z-40 w-[min(360px,calc(100vw-2rem))] rounded-[24px] border border-amber-200 bg-[linear-gradient(180deg,_rgba(255,251,235,0.99),_rgba(255,247,214,0.97))] p-4 shadow-[0_24px_80px_-38px_rgba(217,119,6,0.65)] sm:right-6">
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

              <div className="grid gap-3 sm:grid-cols-3">
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
              </div>
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
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
                />

                <CategoryGammeSelector
                  categories={categories}
                  selectedCategorieId={selectedCategorieId}
                  onCategorieChange={setSelectedCategorieId}
                  selectedGamme={selectedGamme}
                  onGammeChange={setSelectedGamme}
                  nombrePersonnes={nombrePersonnes}
                  onNombrePersonnesChange={setNombrePersonnes}
                  disabled={loading}
                />

                <BudgetInput
                  value={budgetClient}
                  onChange={setBudgetClient}
                  minBudget={seuilMinimum}
                  adminBudget={adminBudget}
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
                    budgetClient={result.recap?.budgetClient || budgetClient}
                    adminBudget={adminBudget}
                    reste={result.resume?.reste || 0}
                    totalObligatoire={result.resume?.totalObligatoire || 0}
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
                      </div>

                      <ActionButtons
                        onToutCocher={toutCocher}
                        onToutDecocher={toutDecocher}
                      />
                    </section>

                    {result.jours ? (
                      <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_60px_-40px_rgba(15,23,42,0.45)] sm:p-6">
                        <div className="mb-4">
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
                <div className="grid gap-4 md:grid-cols-3">
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
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_60px_-40px_rgba(15,23,42,0.45)] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Vue rapide
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                Votre cap budgetaire
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Cette colonne vous aide a garder une vision simple de votre marge de
                manoeuvre avant et apres simulation.
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Minimum accepte
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {seuilMinimum > 0 ? formatAr(seuilMinimum) : "A calculer"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Budget admin
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {adminBudget ? formatAr(adminBudget) : "A choisir"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Votre budget
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {budgetClient > 0 ? formatAr(budgetClient) : "Non renseigne"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_20px_65px_-40px_rgba(15,23,42,0.95)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Conseil pro
              </p>
              <h3 className="mt-3 text-xl font-semibold">
                Commencez par le coeur du voyage.
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
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
