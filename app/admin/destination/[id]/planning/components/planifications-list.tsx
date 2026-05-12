"use client";

import { CalendarDays, MapPinned, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlanificationVoyage } from "@/lib/type/destination";

type Props = {
  isLoading: boolean;
  isRefreshingPlanifications: boolean;
  planifications: PlanificationVoyage[];
  selectedPlanificationId: string;
  isDeletingId: string | null;
  togglingVisibilityId?: string | null;
  onSelect: (planification: PlanificationVoyage) => void;
  onEdit: (planification: PlanificationVoyage) => void;
  onDelete: (planificationId: string) => void;
  onToggleActive: (planification: PlanificationVoyage, nextValue: boolean) => void;
  onAddPlanification?: () => void;
};

function formatDate(value?: string | null) {
  return value
    ? new Date(value).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Non defini";
}

export function PlanificationsList({
  isLoading,
  isRefreshingPlanifications,
  planifications,
  selectedPlanificationId,
  isDeletingId,
  togglingVisibilityId,
  onSelect,
  onEdit,
  onDelete,
  onToggleActive,
onAddPlanification,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Planifications</h2>
          <p className="text-sm text-muted-foreground">
            Choisis la planification sur laquelle travailler, puis organise les jours et les elements du voyage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <div className="min-w-[90px] rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Total</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{planifications.length}</p>
          </div>
          <div className="min-w-[90px] rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Active</p>
            <p className="mt-1 text-base font-semibold text-emerald-700">
              {planifications.some((item) => item.id === selectedPlanificationId) ? 1 : 0}
            </p>
          </div>
          <div className="min-w-[120px] rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Etat</p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {isLoading || isRefreshingPlanifications ? "Actualisation..." : "Pret a organiser"}
            </p>
          </div>
          {onAddPlanification && (
            <Button
              onClick={onAddPlanification}
              size="sm"
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isLoading || isRefreshingPlanifications ? (
        <div className="rounded-[24px] border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-16 text-center text-sm text-slate-500">
          Chargement des planifications...
        </div>
      ) : planifications.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-16 text-center text-sm text-slate-500">
          Aucune planification pour cette destination.
        </div>
      ) : (
        <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <table className="w-full table-fixed text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="w-[24%] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Nom</th>
                <th className="w-[14%] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Depart</th>
                <th className="w-[14%] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Arriver</th>
                <th className="w-[16%] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Date debut</th>
                <th className="w-[16%] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Date fin</th>
                <th className="w-[8%] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Jour(s)</th>
                <th className="w-[16%] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {planifications.map((planification) => {
                const isSelected = selectedPlanificationId === planification.id;

                return (
                  <tr
                    key={planification.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      onSelect(planification);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelect(planification);
                      }
                    }}
                    className={`border-b border-slate-100 transition hover:bg-emerald-50/40 ${
                      isSelected ? "bg-emerald-50/70" : "bg-white"
                    }`}
                  >
                    <td className="px-4 py-4 align-top">
                      <div className="space-y-2">
                        <p className="font-semibold leading-6 text-slate-900">{planification.nomPlanification}</p>
                        {isSelected ? (
                          <Badge className="rounded-full border-0 bg-emerald-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                            Selectionnee
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-slate-700">
                      <div className="flex items-start gap-2">
                        <MapPinned className="mt-0.5 size-4 text-emerald-600" />
                        <span className="break-words">{planification.depart || "Non renseigne"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-slate-700">
                      <span className="break-words">{planification.arriver || "Non renseignee"}</span>
                    </td>
                    <td className="px-4 py-4 align-top text-slate-700">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-4 text-emerald-600" />
                        <span>{formatDate(planification.dateHeureDebut)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-slate-700">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-4 text-emerald-600" />
                        <span>{formatDate(planification.dateHeureFin)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top font-medium text-slate-800">
                      {planification.jours.length}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-center justify-center gap-3">
                        <input
                          type="checkbox"
                          checked={Boolean(planification.estVisibleClient)}
                          disabled={togglingVisibilityId === planification.id}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => {
                            event.stopPropagation();
                            onToggleActive(planification, event.target.checked);
                          }}
                          className="size-4 cursor-pointer rounded border-slate-300 accent-emerald-600 disabled:cursor-not-allowed"
                          aria-label={`Activer ${planification.nomPlanification}`}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="rounded-xl"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEdit(planification);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="rounded-xl"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDelete(planification.id);
                          }}
                          disabled={isDeletingId === planification.id}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
