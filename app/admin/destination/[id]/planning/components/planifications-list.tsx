"use client";

import { useState } from "react";
import { Pencil, Trash2, List } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlanificationVoyage } from "@/lib/type/destination";

type Props = {
  isLoading: boolean;
  isRefreshingPlanifications: boolean;
  planifications: PlanificationVoyage[];
  selectedPlanificationId: string;
  isDeletingId: string | null;
  onSelect: (planification: PlanificationVoyage) => void;
  onEdit: (planification: PlanificationVoyage) => void;
  onDelete: (planificationId: string) => void;
};

export function PlanificationsList({
  isLoading,
  isRefreshingPlanifications,
  planifications,
  selectedPlanificationId,
  isDeletingId,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold">Planifications</h2>
        <p className="text-sm text-muted-foreground">
          Choisis la planification sur laquelle travailler, puis organise les jours et les éléments du voyage.
        </p>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Liste des planifications
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[98vw] h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Liste des planifications</DialogTitle>
            <DialogDescription>
              Choisis la planification sur laquelle travailler, puis organise les jours et les éléments du voyage.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-4">
            {isLoading || isRefreshingPlanifications ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
                Chargement des planifications...
              </div>
            ) : planifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
                Aucune planification pour cette destination.
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {planifications.map((planification) => {
                  const isSelected = selectedPlanificationId === planification.id;
                  return (
                    <div
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
                      className={`rounded-2xl border p-6 text-left transition cursor-pointer h-full ${
                        isSelected
                          ? "border-emerald-300 bg-emerald-50/60 shadow-sm"
                          : "border-border/50 bg-card/50 hover:border-emerald-200 hover:bg-emerald-50/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <h3 className="text-lg font-bold">{planification.nomPlanification}</h3>
                            {isSelected ? <Badge variant="secondary" className="text-xs">Selectionnee</Badge> : null}
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            {planification.depart || "Depart non renseigne"} {"->"}{" "}
                            {planification.arriver || "Arrivee non renseignee"}
                          </p>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                            <span className="rounded-full bg-muted px-3 py-1.5">
                              <span className="font-medium">Début:</span> {planification.dateHeureDebut ? new Date(planification.dateHeureDebut).toLocaleDateString('fr-FR') : 'Non défini'}
                            </span>
                            <span className="rounded-full bg-muted px-3 py-1.5">
                              <span className="font-medium">Fin:</span> {planification.dateHeureFin ? new Date(planification.dateHeureFin).toLocaleDateString('fr-FR') : 'Non défini'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span className="rounded-full bg-muted px-3 py-1.5">{planification.jours.length} jour(s)</span>
                            <span className="rounded-full bg-muted px-3 py-1.5">
                              {planification.transports.length} transport(s)
                            </span>
                            <span className="rounded-full bg-muted px-3 py-1.5">
                              <span className="font-medium">Budget:</span> {planification.budgetTotal ?? "-"} {planification.deviseBudget || "MGA"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
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
                            onClick={(event) => {
                              event.stopPropagation();
                              onDelete(planification.id);
                            }}
                            disabled={isDeletingId === planification.id}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
