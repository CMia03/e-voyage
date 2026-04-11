"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Liste des planifications</CardTitle>
        <CardDescription>
          Choisis la planification sur laquelle travailler, puis organise les jours et les elements du voyage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || isRefreshingPlanifications ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
            Chargement des planifications...
          </div>
        ) : planifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
            Aucune planification pour cette destination.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {planifications.map((planification) => {
              const isSelected = selectedPlanificationId === planification.id;
              return (
                <div
                  key={planification.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(planification)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(planification);
                    }
                  }}
                  className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
                    isSelected
                      ? "border-emerald-300 bg-emerald-50/60 shadow-sm"
                      : "border-border/50 bg-card/50 hover:border-emerald-200 hover:bg-emerald-50/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">{planification.nomPlanification}</h3>
                        {isSelected ? <Badge variant="secondary">Selectionnee</Badge> : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {planification.depart || "Depart non renseigne"} {"->"}{" "}
                        {planification.arriver || "Arrivee non renseignee"}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full bg-muted px-2.5 py-1">{planification.jours.length} jour(s)</span>
                        <span className="rounded-full bg-muted px-2.5 py-1">
                          {planification.transports.length} transport(s)
                        </span>
                        <span className="rounded-full bg-muted px-2.5 py-1">
                          Budget: {planification.budgetTotal ?? "-"} {planification.deviseBudget || "MGA"}
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
      </CardContent>
    </Card>
  );
}
