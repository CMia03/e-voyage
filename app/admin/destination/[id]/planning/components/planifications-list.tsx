"use client";

import { useState } from "react";
import { CalendarDays, List, MapPinned, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Planifications</h2>
        <p className="text-sm text-muted-foreground">
          Choisis la planification sur laquelle travailler, puis organise les jours et les elements du voyage.
        </p>
      </div>

      <Dialog  open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2 self-start md:self-auto">
            <List className="h-4 w-4" />
            Liste des planifications
          </Button>
        </DialogTrigger>

        <DialogContent className="flex !h-[90vh] !w-[92vw] !max-w-[1320px] flex-col overflow-hidden rounded-[28px] border border-emerald-100 bg-white p-0 shadow-2xl sm:!max-w-[1320px]">
          <DialogHeader className="border-b border-emerald-100 bg-[linear-gradient(135deg,rgba(236,253,245,0.88),rgba(255,255,255,1))] px-6 py-5">
            <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="w-fit rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700"
                >
                  Organisation voyage
                </Badge>
                <DialogTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                  Liste des planifications
                </DialogTitle>
                <DialogDescription className="max-w-2xl text-sm leading-6 text-slate-600">
                  Choisis rapidement le bon forfait, puis passe au planning, au budget et a la reservation dans une
                  interface plus claire.
                </DialogDescription>
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
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
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-6">
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
                        <th className="w-[8%] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Actif</th>
                        <th className="w-[8%] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Action</th>
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
                              setIsModalOpen(false);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                onSelect(planification);
                                setIsModalOpen(false);
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
                            <td className="px-4 py-4 align-top text-center">
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
                            </td>
                            <td className="px-4 py-4 align-top">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="rounded-xl"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onEdit(planification);
                                    setIsModalOpen(false);
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
