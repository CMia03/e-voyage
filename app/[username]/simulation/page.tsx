// app/[username]/simulation/page.tsx
"use client";

import { useMemo } from "react";
import { useSimulation } from "@/lib/hooks/useSimulation";
import { DestinationSelector } from "./components/DestinationSelector";
import { PlanificationSelector } from "./components/PlanificationSelector";
import { BudgetInput } from "./components/BudgetInput";
import { CategoryGammeSelector } from "./components/CategoryGammeSelector";
import { PlanningJournalier } from "./components/PlanningJournalier";
import { BudgetSummary } from "./components/BudgetSummary";
import { ActionButtons } from "./components/ActionButtons";

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

    const selectedPlanification = useMemo(
        () => planifications.find((planification) => planification.id === selectedPlanificationId) ?? null,
        [planifications, selectedPlanificationId]
    );
    const adminBudget = selectedPlanification?.budgetTotal ?? null;
    const seuilMinimum = minimumBudget?.seuilMinimum ?? result?.recap?.seuilMinimum ?? 0;

    const handleLancerSimulation = async () => {
        await lancerSimulation();
    };

    return (
        <div className="mx-auto max-w-4xl space-y-6 py-8">
            <h1 className="text-2xl font-bold">Simulation de budget</h1>
            <p className="text-muted-foreground">
                Personnalisez votre voyage en fonction de votre budget.
            </p>

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

            <BudgetInput
                value={budgetClient}
                onChange={setBudgetClient}
                minBudget={seuilMinimum}
                adminBudget={adminBudget}
                disabled={loading}
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

            <div className="flex flex-col gap-3 sm:flex-row">
                <button
                    onClick={handleLancerSimulation}
                    disabled={loading || !selectedPlanificationId || !selectedCategorieId || budgetClient <= 0}
                    className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? "Simulation en cours..." : result ? "Relancer la simulation" : "Simuler"}
                </button>
                <button
                    onClick={resetSimulation}
                    disabled={loading && !result}
                    className="rounded-lg border border-gray-300 px-4 py-3 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Reinitialiser
                </button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                    {error}
                </div>
            )}

            {result && (
                <>
                    <BudgetSummary
                        totalCoche={result.resume?.totalCoche || 0}
                        budgetClient={result.recap?.budgetClient || budgetClient}
                        adminBudget={adminBudget}
                        reste={result.resume?.reste || 0}
                        totalObligatoire={result.resume?.totalObligatoire || 0}
                        totalOptionnel={result.resume?.totalOptionnel || 0}
                        seuilMinimum={result.recap?.seuilMinimum || 0}
                    />

                    {result.success && (
                        <>
                            <ActionButtons
                                onToutCocher={toutCocher}
                                onToutDecocher={toutDecocher}
                            />

                            {result.jours && (
                                <PlanningJournalier
                                    jours={result.jours}
                                    elementsSelectionnes={elementsSelectionnes}
                                    onToggleElement={toggleElement}
                                />
                            )}
                        </>
                    )}

                    <div
                        className={`rounded-lg p-4 ${
                            result.success
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border border-yellow-200 bg-yellow-50 text-yellow-700"
                        }`}
                    >
                        <p className="font-semibold">{result.message}</p>
                        {!result.success &&
                            result.suggestions?.suggestions.map((suggestion, index) => (
                                <p key={`${suggestion.type}-${index}`} className="mt-1 text-sm">
                                    {suggestion.message}
                                </p>
                            ))}
                    </div>
                </>
            )}
        </div>
    );
}
