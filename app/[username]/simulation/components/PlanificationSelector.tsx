"use client";

import { PlanificationType } from "@/lib/type/simulation.types";

type PlanificationSelectorProps = {
  planifications: PlanificationType[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  loading?: boolean;
};

export function PlanificationSelector({
  planifications,
  value,
  onChange,
  disabled,
  loading,
}: PlanificationSelectorProps) {
  const isDisabled = disabled || loading || planifications.length === 0;

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="mb-3 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Forfait
        </p>
        <h3 className="text-base font-semibold text-slate-900">
          Selectionnez le voyage a personnaliser
        </h3>
        <p className="text-sm text-slate-600">
          Le budget admin et le planning journalier dependront du forfait choisi.
        </p>
      </div>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isDisabled}
        className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100"
      >
        {planifications.length === 0 ? (
          <option value="">Aucune planification disponible</option>
        ) : (
          planifications.map((planification) => (
            <option key={planification.id} value={planification.id}>
              {planification.nomPlanification} - {planification.budgetTotal?.toLocaleString()} Ar
            </option>
          ))
        )}
      </select>
    </div>
  );
}
