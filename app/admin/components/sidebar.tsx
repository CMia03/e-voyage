"use client";

import { useState } from "react";
import { Home, MapPin, Building, Play, ChevronDown, Users, Calendar, Bell, Briefcase, ClipboardList, Settings } from "lucide-react";

export type AdminSection =
  | "dashboard"
  | "destinations"
  | "destinations-create"
  | "destinations-edit"
  | "hebergements"
  | "hebergements-create"
  | "hebergements-edit"
  | "hebergements-tarifs"
  | "hebergements-types"
  | "hebergements-equipements"
  | "activites"
  | "activites-create"
  | "activites-edit"
  | "activites-categories"
  | "utilisateurs"
  | "reservations"
  | "reservations-liste"
  | "reservations-ajout"
  | "avis"
  | "commentaires"
  | "notifications"
  | "statistiques"
  | "planification"
  | "entreprise-info";

interface AdminSidebarProps {
  active: AdminSection;
  onSelect: (section: AdminSection) => void;
}

export function AdminSidebar({ active, onSelect }: AdminSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((item) => item !== section) : [...prev, section]
    );
  };

  return (
    <aside className="hidden w-64 overflow-y-auto border-r border-border/50 bg-card/50 px-4 py-6 backdrop-blur-sm sm:block">
      <nav className="space-y-1">
        <button
          type="button"
          onClick={() => onSelect("dashboard")}
          className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${
            active === "dashboard" ? "bg-emerald-500/10 font-medium text-emerald-600" : "text-muted-foreground hover:bg-primary/10"
          }`}
        >
          <Home className="mr-3 h-4 w-4" />
          Dashboard
        </button>

        <button
          type="button"
          onClick={() => toggleSection("destinations")}
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
        >
          <div className="flex items-center">
            <MapPin className="mr-3 h-4 w-4" />
            Destinations
          </div>
          <ChevronDown className={`h-4 w-4 transition-all ${expandedSections.includes("destinations") ? "rotate-180" : "rotate-0"}`} />
        </button>

        {expandedSections.includes("destinations") ? (
          <div className="ml-4 space-y-1 border-l-2 border-emerald-200 pl-4">
            <button type="button" onClick={() => onSelect("destinations")} className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10">Liste des destinations</button>
            <button type="button" onClick={() => onSelect("destinations-create")} className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10">Ajouter destination</button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => toggleSection("hebergements")}
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
        >
          <div className="flex items-center">
            <Building className="mr-3 h-4 w-4" />
            Hebergements
          </div>
          <ChevronDown className={`h-4 w-4 transition-all ${expandedSections.includes("hebergements") ? "rotate-180" : "rotate-0"}`} />
        </button>

        <button
          type="button"
          onClick={() => toggleSection("activites")}
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
        >
          <div className="flex items-center">
            <Play className="mr-3 h-4 w-4" />
            Activites
          </div>
          <ChevronDown className={`h-4 w-4 transition-all ${expandedSections.includes("activites") ? "rotate-180" : "rotate-0"}`} />
        </button>

        <button
          type="button"
          onClick={() => toggleSection("notifications")}
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
        >
          <div className="flex items-center">
            <Bell className="mr-3 h-4 w-4" />
            Notifications & Avis
          </div>
          <ChevronDown className={`h-4 w-4 transition-all ${expandedSections.includes("notifications") ? "rotate-180" : "rotate-0"}`} />
        </button>

        <button
          type="button"
          onClick={() => toggleSection("reservations")}
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
        >
          <div className="flex items-center">
            <ClipboardList className="mr-3 h-4 w-4" />
            Reservations
          </div>
          <ChevronDown className={`h-4 w-4 transition-all ${expandedSections.includes("reservations") ? "rotate-180" : "rotate-0"}`} />
        </button>

        <button
          type="button"
          onClick={() => onSelect("utilisateurs")}
          className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${
            active === "utilisateurs" ? "bg-emerald-500/10 font-medium text-emerald-600" : "text-muted-foreground hover:bg-primary/10"
          }`}
        >
          <Users className="mr-3 h-4 w-4" />
          Gestion des utilisateurs
        </button>

        <button
          type="button"
          onClick={() => onSelect("planification")}
          className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${
            active === "planification" ? "bg-emerald-500/10 font-medium text-emerald-600" : "text-muted-foreground hover:bg-primary/10"
          }`}
        >
          <Calendar className="mr-3 h-4 w-4" />
          Planification
        </button>

        <button
          type="button"
          onClick={() => toggleSection("parametrage")}
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
        >
          <div className="flex items-center">
            <Settings className="mr-3 h-4 w-4" />
            Parametrage
          </div>
          <ChevronDown className={`h-4 w-4 transition-all ${expandedSections.includes("parametrage") ? "rotate-180" : "rotate-0"}`} />
        </button>

        {expandedSections.includes("parametrage") ? (
          <div className="ml-4 space-y-1 border-l-2 border-emerald-200 pl-4">
            <button
              type="button"
              onClick={() => onSelect("entreprise-info")}
              className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${
                active === "entreprise-info" ? "bg-emerald-500/10 font-medium text-emerald-600" : "text-muted-foreground hover:bg-primary/10"
              }`}
            >
              <Briefcase className="mr-2 h-4 w-4" />
              Info d&apos;entreprise
            </button>
          </div>
        ) : null}
      </nav>
    </aside>
  );
}
