"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanificationVoyage } from "@/lib/type/destination";

type Props = {
  planification: PlanificationVoyage;
};

export function SectionReservation({ planification }: Props) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Reservation</CardTitle>
        <CardDescription>Informations de depart et d'arrivee utiles pour la reservation.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <p className="text-xs text-muted-foreground">Depart</p>
          <p className="text-sm font-medium">{planification.depart || "-"}</p>
          <p className="mt-2 text-xs text-muted-foreground">Date/heure debut</p>
          <p className="text-sm">{planification.dateHeureDebut || "-"}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <p className="text-xs text-muted-foreground">Arrivee</p>
          <p className="text-sm font-medium">{planification.arriver || "-"}</p>
          <p className="mt-2 text-xs text-muted-foreground">Date/heure fin</p>
          <p className="text-sm">{planification.dateHeureFin || "-"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
