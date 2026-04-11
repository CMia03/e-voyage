"use client";

import dynamic from "next/dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DestinationAssociationItem, ElementJourPlanification, JourPlanificationVoyage, PlanificationVoyage } from "@/lib/type/destination";

const PlanningVoyageDayMap = dynamic(
  () => import("@/components/planning-voyage-day-map").then((mod) => mod.PlanningVoyageDayMap),
  { ssr: false }
);

type Props = {
  planification: PlanificationVoyage;
  activites: DestinationAssociationItem[];
  hebergements: DestinationAssociationItem[];
  onEditDay: (day: JourPlanificationVoyage) => void;
  onDeleteDay: (dayId: string) => void;
  onAddElement: (day: JourPlanificationVoyage, insertIndex?: number) => void;
  onEditElement: (dayId: string, element: ElementJourPlanification) => void;
  onDeleteElement: (elementId: string) => void;
};

export function SectionCarte({
  planification,
  activites,
  hebergements,
  onEditDay,
  onDeleteDay,
  onAddElement,
  onEditElement,
  onDeleteElement,
}: Props) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Carte du voyage</CardTitle>
        <CardDescription>Visualisation des trajets et du planning par jour dans une vue combinee.</CardDescription>
      </CardHeader>
      <CardContent>
        <PlanningVoyageDayMap
          planification={planification}
          activites={activites}
          hebergements={hebergements}
          onEditDay={onEditDay}
          onDeleteDay={onDeleteDay}
          onAddElement={onAddElement}
          onEditElement={onEditElement}
          onDeleteElement={onDeleteElement}
        />
      </CardContent>
    </Card>
  );
}
