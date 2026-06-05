"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, List, MapPinned, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

function getDateValue(value?: string | null) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

const legacyEncodingMap: Record<string, string> = {
  "‚": "é",
  "ƒ": "â",
  "…": "à",
  "‡": "ç",
  "ˆ": "ê",
  "‰": "ë",
  "Š": "è",
  "‹": "ï",
  "Œ": "î",
  "“": "ô",
  "”": "ö",
  "–": "û",
  "—": "ù",
};

function displayText(value?: string | null, fallback = "-") {
  if (!value) return fallback;
  return value.replace(/[‚ƒ…‡ˆ‰Š‹Œ“”–—]/g, (char) => legacyEncodingMap[char] ?? char);
}

function getPlanificationDuration(planification: PlanificationVoyage) {
  if (planification.jours.length > 0) return planification.jours.length;
  if (!planification.dateHeureDebut || !planification.dateHeureFin) return 0;

  const start = new Date(planification.dateHeureDebut);
  const end = new Date(planification.dateHeureFin);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  const startDay = new Date(start);
  const endDay = new Date(end);
  startDay.setHours(0, 0, 0, 0);
  endDay.setHours(0, 0, 0, 0);

  return Math.max(1, Math.floor((endDay.getTime() - startDay.getTime()) / 86400000) + 1);
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
  const [isListOpen, setIsListOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);

  const filteredPlanifications = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return [...planifications]
      .sort((first, second) => {
        const secondDate = getDateValue(second.dateHeureDebut ?? second.dateHeureFin);
        const firstDate = getDateValue(first.dateHeureDebut ?? first.dateHeureFin);
        return secondDate - firstDate;
      })
      .filter((planification) => {
        if (!normalizedSearch) return true;

        const searchableText = [
          displayText(planification.nomPlanification),
          displayText(planification.depart),
          displayText(planification.arriver),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      });
  }, [planifications, searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filteredPlanifications.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visiblePlanifications = filteredPlanifications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const startResult = filteredPlanifications.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endResult = Math.min(currentPage * pageSize, filteredPlanifications.length);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-semibold">Planifications</h2>
          <p className="text-sm text-muted-foreground">
            Choisis la planification sur laquelle travailler, puis organise les jours et les éléments du voyage.
          </p>
        </div>

        <div className="flex shrink-0 flex-nowrap items-center gap-2 md:justify-end">

          <div className="flex gap-2 min-w-[86px] rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] justifiy-center text-slate-500">Total : <span className="text-base font-semibold text-slate-900">{planifications.length}</span></p>
          </div>

          <div className="min-w-[86px] rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Active : <span className="text-base font-semibold text-emerald-700">{planifications.some((item) => item.id === selectedPlanificationId) ? 1 : 0}</span></p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsListOpen((current) => !current)}
            className="h-10 rounded-2xl border-emerald-200 bg-emerald-50 px-4 font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100"
          >
            <List className="h-4 w-4" />
            Liste
            <ChevronDown className={`h-4 w-4 transition ${isListOpen ? "rotate-180" : ""}`} />
          </Button>

          
          {onAddPlanification && (
            <Button
              onClick={onAddPlanification}
              size="icon"
              className="h-10 w-10 shrink-0 rounded-2xl bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
              aria-label="Ajouter une planification"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {!isListOpen ? null : isLoading || isRefreshingPlanifications ? (
        <div className="rounded-[24px] border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-16 text-center text-sm text-slate-500">
          Chargement des planifications...
        </div>
      ) : planifications.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-16 text-center text-sm text-slate-500">
          Aucune planification pour cette destination.
        </div>
      ) : (
        <div className="mx-auto overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-white px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                placeholder="Rechercher par nom, départ ou arrivée..."
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>
                {filteredPlanifications.length} résultat(s) sur {planifications.length}
              </span>
            </div>
          </div>

          {visiblePlanifications.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-slate-500">
              Aucune planification ne correspond à cette recherche.
            </div>
          ) : (
            <table className="w-full table-fixed text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="w-[24%] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Nom</th>
                  <th className="w-[14%] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Depart</th>
                  <th className="w-[14%] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Arriver</th>
                  <th className="w-[16%] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Date début</th>
                  <th className="w-[16%] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Date fin</th>
                  <th className="w-[8%] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Jour(s)</th>
                  <th className="w-[16%] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visiblePlanifications.map((planification) => {
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
                          <p className="font-semibold leading-6 text-slate-900">{displayText(planification.nomPlanification)}</p>
                          {isSelected ? (
                            <Badge className="rounded-full border-0 bg-emerald-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                              Sélectionnée
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-slate-700">
                        <div className="flex items-start gap-2">
                          <MapPinned className="mt-0.5 size-4 text-emerald-600" />
                          <span className="break-words">{displayText(planification.depart, "Non renseigné")}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-slate-700">
                        <span className="break-words">{displayText(planification.arriver, "Non renseignée")}</span>
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
                        {getPlanificationDuration(planification)}
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
                            aria-label={`Activer ${displayText(planification.nomPlanification)}`}
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
          )}

          <div className="grid gap-3 border-t border-slate-100 px-4 py-4 text-sm text-slate-500 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
            <div className="flex items-center gap-2">
              <span>Afficher</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-[82px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
              <span>par page</span>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage <= 1}
                className="h-10 w-10 rounded-xl border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </Button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                <Button
                  key={pageNumber}
                  type="button"
                  variant={pageNumber === currentPage ? "default" : "outline"}
                  size="icon"
                  onClick={() => setPage(pageNumber)}
                  className={`h-10 w-10 rounded-xl ${
                    pageNumber === currentPage
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                      : "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  {pageNumber}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                disabled={currentPage >= pageCount}
                className="h-10 w-10 rounded-xl border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <span className="text-left lg:text-right">
              {startResult} - {endResult} sur {filteredPlanifications.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
