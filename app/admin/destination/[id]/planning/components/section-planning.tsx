"use client";

import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ElementJourPlanification, JourPlanificationVoyage, PlanificationVoyage } from "@/lib/type/destination";

type Props = {
  selectedPlanification: PlanificationVoyage;
  sortedDays: JourPlanificationVoyage[];
  openActionMenuKey: string | null;
  setOpenActionMenuKey: (value: string | null | ((current: string | null) => string | null)) => void;
  isDeletingId: string | null;
  onAddJour: () => void;
  onEditJour: (jour: JourPlanificationVoyage) => void;
  onDeleteJour: (jourId: string) => void;
  onJourDetails: (jour: JourPlanificationVoyage) => void;
  onAddElement: (jour: JourPlanificationVoyage, index: number) => void;
  onEditElement: (jourId: string, element: ElementJourPlanification) => void;
  onDeleteElement: (elementId: string) => void;
  onElementDetails: (jour: JourPlanificationVoyage, element: ElementJourPlanification) => void;
  onOpenLinkedDetails: (element: ElementJourPlanification) => void;
  onToggleElementObligatoire: (element: ElementJourPlanification) => void;
  formatDate: (value?: string | null) => string;
  getElementDisplayTitle: (element: ElementJourPlanification) => string;
  getLinkedLabel: (element: ElementJourPlanification) => string | null;
};

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

export function SectionPlanning({
  selectedPlanification,
  sortedDays,
  openActionMenuKey,
  setOpenActionMenuKey,
  isDeletingId,
  onAddJour,
  onEditJour,
  onDeleteJour,
  onJourDetails,
  onAddElement,
  onEditElement,
  onDeleteElement,
  onElementDetails,
  onOpenLinkedDetails,
  onToggleElementObligatoire,
  formatDate,
  getElementDisplayTitle,
  getLinkedLabel,
}: Props) {
  const formatTimeOnly = (value?: string | null) => {
    if (!value) return "";

    const timeMatch = value.match(/(?:T|\s)(\d{2}:\d{2})(?::\d{2})?/);
    if (timeMatch?.[1]) return timeMatch[1];

    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return value;
  };

  const getLinkedHref = (element: ElementJourPlanification) => {
    if (element.idHebergement) {
      return `/admin/hebergements/${element.idHebergement}`;
    }

    if (element.idActivite) {
      return `/admin/activites/${element.idActivite}`;
    }

    return null;
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Planning</CardTitle>
            <CardDescription>
              {displayText(selectedPlanification.nomPlanification)} avec {getPlanificationDuration(selectedPlanification)} jours.
              {/* et{" "} {selectedPlanification.transports.length} transport(s) */}
            </CardDescription>
          </div>
          <Button size="sm" onClick={onAddJour}>
            <Plus className="size-4" />
            Ajouter jour
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sortedDays.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
            Aucun jour de planning pour cette planification.
          </div>
        ) : (
          // Conteneur avec scroll horizontal
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4" style={{ minWidth: "max-content" }}>
              {sortedDays.map((jour) => {
                const sortedElements = [...(jour.elements ?? [])].sort(
                  (a, b) => (a.ordreAffichage ?? 9999) - (b.ordreAffichage ?? 9999)
                );

                return (
                  <div 
                    key={jour.id} 
                    className="w-[400px] flex-shrink-0 rounded-3xl border border-border/60 bg-card/40 p-4 shadow-sm"
                  >
                    {/* En-tête du jour */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Jour {jour.numeroJour ?? "-"}</Badge>
                          {jour.dateJour ? <span className="text-xs text-muted-foreground">{formatDate(jour.dateJour)}</span> : null}
                        </div>
                        <h3 className="text-base font-semibold">{displayText(jour.titre, `Jour ${jour.numeroJour ?? ""}`)}</h3>
                        {jour.description ? (
                          <p className="text-sm text-muted-foreground line-clamp-2">{displayText(jour.description)}</p>
                        ) : null}
                      </div>
                      <div className="relative">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                          onClick={() =>
                            setOpenActionMenuKey((current) => (current === `jour-${jour.id}` ? null : `jour-${jour.id}`))
                          }
                        >
                          <MoreVertical className="size-4" />
                        </Button>

                        
                        {openActionMenuKey === `jour-${jour.id}` ? (
                          <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-200/70">
                            <button
                              type="button"
                              className="flex h-9 w-full items-center px-3 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                              onClick={() => {
                                setOpenActionMenuKey(null);
                                onEditJour(jour);
                              }}
                            >
                              <Pencil className="mr-2 size-3.5 text-slate-500" />
                              Modifier
                            </button>


                            <button
                              type="button"
                              className="flex h-9 w-full items-center px-3 pl-9 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                              onClick={() => {
                                setOpenActionMenuKey(null);
                                onJourDetails(jour);
                              }}
                            >
                              Détaille
                            </button>


                            <div className="my-1 h-px bg-slate-100" />
                            <button
                              type="button"
                              className="flex h-9 w-full items-center px-3 text-left text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 disabled:pointer-events-none disabled:opacity-50"
                              onClick={() => {
                                setOpenActionMenuKey(null);
                                onDeleteJour(jour.id);
                              }}
                              disabled={isDeletingId === jour.id}
                            >
                              <Trash2 className="mr-2 size-3.5 text-red-500" />
                              {isDeletingId === jour.id ? "Suppression..." : "Supprimer"}
                            </button>


                          </div>
                        ) : null}


                      </div>
                    </div>

                    {/* Bouton ajouter un bloc (si vide) */}
                    {sortedElements.length === 0 ? (
                      <div className="mt-4 flex justify-center">
                        <Button type="button" size="sm" variant="outline" onClick={() => onAddElement(jour, 0)}>
                          <Plus className="size-4" />
                          Ajouter un bloc
                        </Button>
                      </div>
                    ) : null}

                    {/* Liste des éléments - scroll vertical à l'intérieur du jour */}
                    <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto">
                      {sortedElements.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                          Aucun bloc pour ce jour.
                        </div>
                      ) : (
                        sortedElements.map((element, index) => {
                          const linkedLabel = getLinkedLabel(element);
                          const linkedHref = getLinkedHref(element);

                          return (
                          <div key={element.id} className="space-y-3">
                            <div className="rounded-2xl border border-border/50 bg-background/70 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <Badge variant="outline" className="text-[10px]">{displayText(element.nomTypeElementJour, "Element")}</Badge>
                                    {element.estActif ? (
                                      <Badge variant="secondary" className="text-[10px]">Actif</Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px]">Inactif</Badge>
                                    )}
                                    {element.estObligatoire ? (
                                      <Badge variant="secondary" className="text-[10px]">Obligatoire</Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px]">Optionnel</Badge>
                                    )}
                                  </div>
                                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <input
                                      type="checkbox"
                                      checked={element.estObligatoire}
                                      onChange={() => onToggleElementObligatoire(element)}
                                      className="size-4 rounded border-input"
                                    />
                                    Bloc obligatoire
                                  </label>
                                  <h4 className="font-medium text-sm line-clamp-2">{displayText(getElementDisplayTitle(element))}</h4>
                                  {element.description ? (
                                    <p className="text-xs text-muted-foreground line-clamp-2">{displayText(element.description)}</p>
                                  ) : null}
                                  <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                                    {element.heureDebut ? (
                                      <span className="rounded-full bg-muted px-2 py-0.5">
                                        Debut: {formatTimeOnly(element.heureDebut)}
                                      </span>
                                    ) : null}
                                    {element.heureFin ? (
                                      <span className="rounded-full bg-muted px-2 py-0.5">
                                        Fin: {formatTimeOnly(element.heureFin)}
                                      </span>
                                    ) : null}
                                    {/* <span className="rounded-full bg-muted px-2 py-0.5">
                                      Budget: {element.budgetPrevu ?? "-"} {element.devise || "MGA"}
                                    </span> */}

                                  </div>
                                  {linkedLabel && linkedHref ? (
                                    <Link
                                      href={linkedHref}
                                      className="text-left text-[10px] font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
                                    >
                                      Lié à: {linkedLabel}
                                    </Link>
                                  ) : linkedLabel ? (
                                    <button
                                      type="button"
                                      className="text-left text-[10px] font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
                                      onClick={() => onOpenLinkedDetails(element)}
                                    >
                                      Lié à: {linkedLabel}
                                    </button>
                                  ) : null}
                                </div>
                                <div className="relative shrink-0">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    onClick={() =>
                                      setOpenActionMenuKey((current) =>
                                        current === `element-${element.id}` ? null : `element-${element.id}`
                                      )
                                    }
                                  >
                                    <MoreVertical className="size-3.5" />
                                  </Button>
                                  {openActionMenuKey === `element-${element.id}` ? (
                                    <div className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-200/70">
                                      <button
                                        type="button"
                                        className="flex h-9 w-full items-center px-3 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                                        onClick={() => {
                                          setOpenActionMenuKey(null);
                                          onEditElement(jour.id, element);
                                        }}
                                      >
                                        <Pencil className="mr-2 size-3.5 text-slate-500" />
                                        Modifier
                                      </button>
                                      <button
                                        type="button"
                                        className="flex h-9 w-full items-center px-3 pl-9 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                                        onClick={() => {
                                          setOpenActionMenuKey(null);
                                          onElementDetails(jour, element);
                                        }}
                                      >
                                        Détail
                                      </button>
                                      <div className="my-1 h-px bg-slate-100" />
                                      <button
                                        type="button"
                                        className="flex h-9 w-full items-center px-3 text-left text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 disabled:pointer-events-none disabled:opacity-50"
                                        onClick={() => {
                                          setOpenActionMenuKey(null);
                                          onDeleteElement(element.id);
                                        }}
                                        disabled={isDeletingId === element.id}
                                      >
                                        <Trash2 className="mr-2 size-3.5 text-red-500" />
                                        {isDeletingId === element.id ? "Suppression..." : "Supprimer"}
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            {/* Bouton + entre les éléments */}
                            {index < sortedElements.length - 1 && (
                              <div className="flex justify-center">
                                <Button 
                                  type="button" 
                                  size="icon" 
                                  variant="outline" 
                                  className="rounded-full h-6 w-6"
                                  onClick={() => onAddElement(jour, index + 1)}
                                >
                                  <Plus className="size-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          );
                        })
                      )}
                    </div>
                    
                    {/* Bouton ajouter à la fin du jour */}
                    {sortedElements.length > 0 && (
                      <div className="mt-3 flex justify-center pt-2 border-t border-border/40">
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="ghost" 
                          className="text-xs"
                          onClick={() => onAddElement(jour, sortedElements.length)}
                        >
                          <Plus className="size-3 mr-1" />
                          Ajouter un bloc
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
