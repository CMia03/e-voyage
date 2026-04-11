"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanificationVoyage } from "@/lib/type/destination";

type Props = {
  planification: PlanificationVoyage;
};

export function SectionResume({ planification }: Props) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Resume du voyage</CardTitle>
        <CardDescription>Vue synthetique de la planification selectionnee.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border/60 bg-card/60 p-3">
            <p className="text-xs text-muted-foreground">Nom</p>
            <p className="text-sm font-medium">{planification.nomPlanification || "-"}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/60 p-3">
            <p className="text-xs text-muted-foreground">Periode</p>
            <p className="text-sm font-medium">
              {(planification.dateHeureDebut ?? "-")} {"->"} {(planification.dateHeureFin ?? "-")}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/60 p-3">
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="text-sm font-medium">
              {planification.budgetTotal ?? "-"} {planification.deviseBudget || "MGA"}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/60 p-3">
            <p className="text-xs text-muted-foreground">Trajets</p>
            <p className="text-sm font-medium">{planification.transports.length} transport(s)</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 p-3">
          <p className="text-xs text-muted-foreground">Itineraire</p>
          <p className="text-sm font-medium">
            {planification.depart || "Depart non renseigne"} {"->"} {planification.arriver || "Arrivee non renseignee"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{planification.jours.length} jour(s)</Badge>
          <Badge variant="outline">{planification.transports.length} transport(s)</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
