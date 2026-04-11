"use client";

import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";

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
  formatDate: (value?: string | null) => string;
  formatDateTime: (value?: string | null) => string;
  getElementDisplayTitle: (element: ElementJourPlanification) => string;
  getLinkedLabel: (element: ElementJourPlanification) => string | null;
};

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
  formatDate,
  formatDateTime,
  getElementDisplayTitle,
  getLinkedLabel,
}: Props) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Planning</CardTitle>
            <CardDescription>
              {selectedPlanification.nomPlanification} avec {selectedPlanification.jours.length} jour(s) et{" "}
              {selectedPlanification.transports.length} transport(s).
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
          <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-4">
            {sortedDays.map((jour) => {
              const sortedElements = [...(jour.elements ?? [])].sort(
                (a, b) => (a.ordreAffichage ?? 9999) - (b.ordreAffichage ?? 9999)
              );

              return (
                <div key={jour.id} className="rounded-3xl border border-border/60 bg-card/40 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Jour {jour.numeroJour ?? "-"}</Badge>
                        {jour.dateJour ? <span className="text-xs text-muted-foreground">{formatDate(jour.dateJour)}</span> : null}
                      </div>
                      <h3 className="text-base font-semibold">{jour.titre || `Jour ${jour.numeroJour ?? ""}`}</h3>
                      {jour.description ? <p className="text-sm text-muted-foreground">{jour.description}</p> : null}
                    </div>
                    <div className="relative">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          setOpenActionMenuKey((current) => (current === `jour-${jour.id}` ? null : `jour-${jour.id}`))
                        }
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                      {openActionMenuKey === `jour-${jour.id}` ? (
                        <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-border bg-background p-1.5 shadow-lg">
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              setOpenActionMenuKey(null);
                              onEditJour(jour);
                            }}
                          >
                            <Pencil className="size-4" />
                            Modifier
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              setOpenActionMenuKey(null);
                              onJourDetails(jour);
                            }}
                          >
                            Détaille
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full justify-start text-destructive hover:text-destructive"
                            onClick={() => {
                              setOpenActionMenuKey(null);
                              onDeleteJour(jour.id);
                            }}
                            disabled={isDeletingId === jour.id}
                          >
                            <Trash2 className="size-4" />
                            {isDeletingId === jour.id ? "Suppression..." : "Supprimer"}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {sortedElements.length === 0 ? (
                    <div className="mt-4 flex justify-center">
                      <Button type="button" size="sm" variant="outline" onClick={() => onAddElement(jour, 0)}>
                        <Plus className="size-4" />
                        Ajouter un bloc
                      </Button>
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-3">
                    {sortedElements.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                        Aucun bloc pour ce jour.
                      </div>
                    ) : (
                      sortedElements.map((element, index) => (
                        <div key={element.id} className="space-y-3">
                          <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline">{element.nomTypeElementJour || "Element"}</Badge>
                                  {element.estActif ? <Badge variant="secondary">Actif</Badge> : <Badge variant="outline">Inactif</Badge>}
                                </div>
                                <h4 className="font-medium">{getElementDisplayTitle(element)}</h4>
                                {element.description ? <p className="text-sm text-muted-foreground">{element.description}</p> : null}
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  <span className="rounded-full bg-muted px-2.5 py-1">Debut: {formatDateTime(element.heureDebut)}</span>
                                  <span className="rounded-full bg-muted px-2.5 py-1">Fin: {formatDateTime(element.heureFin)}</span>
                                  <span className="rounded-full bg-muted px-2.5 py-1">
                                    Budget: {element.budgetPrevu ?? "-"} {element.devise || "MGA"}
                                  </span>
                                </div>
                                {getLinkedLabel(element) ? (
                                  <button
                                    type="button"
                                    className="text-left text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
                                    onClick={() => onOpenLinkedDetails(element)}
                                  >
                                    Lie a: {getLinkedLabel(element)} (voir details)
                                  </button>
                                ) : null}
                              </div>
                              <div className="relative">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  onClick={() =>
                                    setOpenActionMenuKey((current) =>
                                      current === `element-${element.id}` ? null : `element-${element.id}`
                                    )
                                  }
                                >
                                  <MoreVertical className="size-4" />
                                </Button>
                                {openActionMenuKey === `element-${element.id}` ? (
                                  <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-border bg-background p-1.5 shadow-lg">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="w-full justify-start"
                                      onClick={() => {
                                        setOpenActionMenuKey(null);
                                        onEditElement(jour.id, element);
                                      }}
                                    >
                                      <Pencil className="size-4" />
                                      Modifier
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="w-full justify-start"
                                      onClick={() => {
                                        setOpenActionMenuKey(null);
                                        onElementDetails(jour, element);
                                      }}
                                    >
                                      Détaille
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="w-full justify-start text-destructive hover:text-destructive"
                                      onClick={() => {
                                        setOpenActionMenuKey(null);
                                        onDeleteElement(element.id);
                                      }}
                                      disabled={isDeletingId === element.id}
                                    >
                                      <Trash2 className="size-4" />
                                      {isDeletingId === element.id ? "Suppression..." : "Supprimer"}
                                    </Button>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-center">
                            <Button type="button" size="icon" variant="outline" className="rounded-full" onClick={() => onAddElement(jour, index + 1)}>
                              <Plus className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
