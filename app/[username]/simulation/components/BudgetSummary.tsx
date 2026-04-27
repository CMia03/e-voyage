"use client";

type BudgetSummaryProps = {
  totalCoche: number;
  totalAvecMarge?: number;
  budgetClient: number;
  adminBudget?: number | null;
  reste: number;
  totalOptionnel: number;
  seuilMinimum: number;
};

function formatAr(value: number) {
  return `${value.toLocaleString()} Ar`;
}

export function BudgetSummary({
  totalCoche,
  totalAvecMarge,
  budgetClient,
  adminBudget,
  reste,
  totalOptionnel,
  seuilMinimum,
}: BudgetSummaryProps) {
  const totalFacture = totalAvecMarge ?? totalCoche;
  const estDansBudget = reste >= 0;
  const hasMinimumBudget = seuilMinimum > 0;
  const minimumBudget = hasMinimumBudget ? seuilMinimum : 0;
  const maxBudget =
    adminBudget && adminBudget > 0
      ? Math.max(adminBudget, totalFacture, minimumBudget, 1)
      : Math.max(budgetClient, totalFacture, minimumBudget, 1);
  const budgetRange = Math.max(maxBudget - minimumBudget, 1);
  const clampedBudgetClient = Math.min(Math.max(budgetClient, minimumBudget), maxBudget);
  const clampedSelection = Math.min(Math.max(totalFacture, minimumBudget), maxBudget);
  const budgetClientRatio = ((clampedBudgetClient - minimumBudget) / budgetRange) * 100;
  const selectionRatio = ((clampedSelection - minimumBudget) / budgetRange) * 100;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Recapitulatif budget
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            Une lecture simple de votre equilibre budgetaire
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            La barre ci-dessous compare le budget min, votre budget et le total
            actuellement selectionne.
          </p>
        </div>

        <div
          className={`rounded-2xl border px-4 py-3 text-right ${
            estDansBudget
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <p className="text-xs uppercase tracking-[0.18em]">
            Statut
          </p>
          <p className="mt-2 text-lg font-semibold">
            {estDansBudget ? "Dans le budget" : "Au-dessus du budget"}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
        <div className="mb-3 flex justify-between text-sm font-semibold text-slate-700">
          <span>{hasMinimumBudget ? formatAr(minimumBudget) : "A calculer"}</span>
          <span>{formatAr(maxBudget)}</span>
        </div>

        <div className="relative h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all ${
              estDansBudget
                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                : "bg-gradient-to-r from-amber-400 to-red-500"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, selectionRatio))}%` }}
          />
          <div
            className="absolute inset-y-[-3px] z-10 w-2 rounded-full bg-slate-950 shadow-[0_0_0_3px_rgba(255,255,255,0.85)]"
            style={{ left: `calc(${Math.min(100, Math.max(0, budgetClientRatio))}% - 4px)` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
            <span>Total selectionne</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-950" />
            <span>Budget client</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Total obligatoire
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatAr(seuilMinimum)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Total selectionne
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatAr(totalFacture)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Optionnel
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatAr(totalOptionnel)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Budget min
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatAr(seuilMinimum)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Budget max
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatAr(maxBudget)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Budget client
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatAr(budgetClient)}
          </p>
        </div>
      </div>
    </div>
  );
}
