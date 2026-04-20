import { CalendarDays, CheckCircle2, List, Map } from "lucide-react";

export type PlanningSection = "planning" | "resume" | "carte" | "budget" | "reservation";

export const sectionOptions: Array<{ id: PlanningSection; label: string; icon: typeof CalendarDays }> = [
  { id: "planning", label: "Planning", icon: CalendarDays },
  { id: "resume", label: "Resume", icon: List },
  { id: "carte", label: "Carte", icon: Map },
  { id: "budget", label: "Budget", icon: CheckCircle2 },
  { id: "reservation", label: "Reservation", icon: CheckCircle2 },
];

export function isPlanningSection(value: string | null | undefined): value is PlanningSection {
  return sectionOptions.some((section) => section.id === value);
}

export function getSectionDescription(section: PlanningSection) {
  if (section === "planning") {
    return "Organisation jour par jour du voyage avec trajets, activites, hebergements et notes.";
  }

  if (section === "resume") {
    return "Vue synthetique des informations principales du voyage.";
  }

  if (section === "carte") {
    return "Visualisation cartographique des trajets, activites et hebergements.";
  }

  if (section === "budget") {
    return "Suivi du budget prevu et des estimations de couts du voyage.";
  }

  return "Informations de reservation pour finaliser le voyage.";
}
