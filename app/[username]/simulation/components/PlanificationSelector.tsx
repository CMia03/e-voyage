"use client";

import { CalendarDays, MapPin } from "lucide-react";
import { BudgetisationPlanificationVoyage } from "@/lib/type/budgetisation-planification";
import { PlanificationType } from "@/lib/type/simulation.types";

type PlanificationSelectorProps = {
  planifications: PlanificationType[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  loading?: boolean;
  budgetisationsByPlanification?: Record<string, BudgetisationPlanificationVoyage[]>;
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAr(value?: number | null) {
  return `${(value ?? 0).toLocaleString("fr-MG")} Ar`;
}

export function PlanificationSelector({
  planifications,
  value,
  onChange,
  disabled,
  loading,
  budgetisationsByPlanification = {},
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
          Chaque carte affiche maintenant toutes les budgetisations disponibles pour ce forfait.
        </p>
      </div>

      {planifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
          {loading ? "Chargement des planifications..." : "Aucune planification disponible."}
        </div>
      ) : (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {planifications.map((planification) => {
            const selected = value === planification.id;
            const dateDebut = formatDate(planification.dateHeureDebut);
            const dateFin = formatDate(planification.dateHeureFin);
            const budgetisations = budgetisationsByPlanification[planification.id] ?? [];

            return (
              <button
                key={planification.id}
                type="button"
                onClick={() => onChange(planification.id)}
                disabled={isDisabled}
                className={`min-w-[235px] max-w-[235px] rounded-[20px] border p-2 text-left transition ${
                  selected
                    ? "border-emerald-500 bg-emerald-50 shadow-[0_20px_45px_-30px_rgba(16,185,129,0.65)]"
                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="line-clamp-2 text-[13px] font-semibold leading-4.5 text-slate-900">
                      {planification.nomPlanification}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {(planification.jours?.length ?? 0)} jour(s)
                    </p>
                  </div>
                  {selected ? (
                    <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white">
                      Selectionne
                    </span>
                  ) : null}
                </div>

                <div className="mt-1.5 grid gap-1">
                  <div className="rounded-[14px] bg-slate-50 px-2.5 py-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Budgets disponibles
                    </p>
                    {budgetisations.length > 0 ? (
                      <div className="mt-1 space-y-1">
                        {budgetisations.slice(0, 1).map((budgetisation) => (
                          <div key={budgetisation.id} className="rounded-xl border border-slate-200 bg-white px-2 py-1">
                            <div className="flex flex-wrap items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                                {budgetisation.nomCategorieClient}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                                {budgetisation.gamme}
                              </span>
                              <span>{budgetisation.nombrePersonnes} pers</span>
                            </div>
                            <p className="mt-0.5 text-xs font-semibold text-emerald-700">
                              {formatAr(Number(budgetisation.prixAvecReduction))}
                            </p>
                          </div>
                        ))}
                        {budgetisations.length > 1 ? (
                          <p className="text-[11px] text-slate-500">+ {budgetisations.length - 1} autre(s)</p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        Aucune budgetisation
                      </p>
                    )}
                  </div>

                  <div className="grid gap-1">
                    <div className="rounded-[14px] border border-slate-200 px-2.5 py-1.5">
                      <div className="flex items-center gap-2 text-slate-500">
                        <CalendarDays className="h-4 w-4" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
                          Dates
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-medium leading-4.5 text-slate-900">
                        {dateDebut && dateFin ? `${dateDebut} - ${dateFin}` : "Dates non renseignees"}
                      </p>
                    </div>

                    <div className="rounded-[14px] border border-slate-200 px-2.5 py-1.5">
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="h-4 w-4" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
                          Trajet
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-medium leading-4.5 text-slate-900">
                        {planification.depart && planification.arriver
                          ? `${planification.depart} - ${planification.arriver}`
                          : "Trajet non renseigne"}
                      </p>
                    </div>
                  </div>

                  {planification.description ? (
                    <p className="line-clamp-2 text-xs leading-5 text-slate-600">
                      {planification.description}
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
