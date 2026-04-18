"use client";

import { useState } from "react";
import { Home, MapPin, Building, Play, ChevronDown, Users, Calendar, Bell, Briefcase, Settings, TrendingUp } from "lucide-react";

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
  | "avis"
  | "notifications"
  | "statistiques"
  | "planification"
  // Sous-sections du paramétrage
  | "entreprise-info"
  | "parametrage-marge-brute";

interface AdminSidebarProps {
  active: AdminSection;
  onSelect: (section: AdminSection) => void;
}

export function AdminSidebar({ active, onSelect }: AdminSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  return (
    <aside className="hidden w-64 border-r border-border/50 bg-card/50 backdrop-blur-sm px-4 py-6 sm:block overflow-y-auto">
      <nav className="space-y-1">
        {/* Dashboard */}
        <button
          onClick={() => onSelect("dashboard")}
          className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${active === "dashboard" ? "bg-emerald-500/10 font-medium text-emerald-600" : "text-muted-foreground hover:bg-primary/10"}`}
        >
          <Home className="mr-3 h-4 w-4" />
          Dashboard
        </button>

        {/* Destinations avec sous-menus */}
        <div className="space-y-1">
          <button
            onClick={() => toggleSection("destinations")}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
          >
            <div className="flex items-center">
              <MapPin className="mr-3 h-4 w-4" />
              Destinations
            </div>
            <ChevronDown className={`h-4 w-4 transition-all ${expandedSections.includes("destinations") ? "rotate-180" : "rotate-0"}`} />
          </button>
          {expandedSections.includes("destinations") && (
            <div className="ml-4 space-y-1 pl-4 border-l-2 border-emerald-200">
              <button onClick={() => onSelect("destinations")} className={`w-full text-left px-3 py-2 text-sm ${active === "destinations" ? "bg-emerald-500/10 font-medium text-emerald-600" : "text-muted-foreground hover:bg-primary/10"}`}>
                <span className="mr-2">•</span> Liste des destinations
              </button>
              <button onClick={() => onSelect("destinations-create")} className={`w-full text-left px-3 py-2 text-sm ${active === "destinations-create" ? "bg-emerald-500/10 font-medium text-emerald-600" : "text-muted-foreground hover:bg-primary/10"}`}>
                <span className="mr-2">•</span> Ajouter destination
              </button>
            </div>
          )}
        </div>

        {/* Hébergements avec sous-menus */}
        <div className="space-y-1">
          <button
            onClick={() => toggleSection("hebergements")}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
          >
            <div className="flex items-center">
              <Building className="mr-3 h-4 w-4" />
              Hébergements
            </div>
            <ChevronDown className={`h-4 w-4 transition-all ${expandedSections.includes("hebergements") ? "rotate-180" : "rotate-0"}`} />
          </button>
          {expandedSections.includes("hebergements") && (
            <div className="ml-4 space-y-1 pl-4 border-l-2 border-emerald-200">
              <button onClick={() => onSelect("hebergements")} className={`w-full text-left px-3 py-2 text-sm ${active === "hebergements" ? "bg-emerald-500/10 font-medium text-emerald-600" : "text-muted-foreground hover:bg-primary/10"}`}>
                <span className="mr-2">•</span> Liste des hébergements
              </button>
              <button onClick={() => onSelect("hebergements-create")} className={`w-full text-left px-3 py-2 text-sm ${active === "hebergements-create" ? "bg-emerald-500/10 font-medium text-emerald-600" : "text-muted-foreground hover:bg-primary/10"}`}>
                <span className="mr-2">•</span> Ajouter hébergement
              </button>
            </div>
          )}
        </div>

        {/* Activités avec sous-menus */}
        <div className="space-y-1">
          <button
            onClick={() => toggleSection("activites")}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
          >
            <div className="flex items-center">
              <Play className="mr-3 h-4 w-4" />
              Activités
            </div>
            <ChevronDown className={`h-4 w-4 transition-all ${expandedSections.includes("activites") ? "rotate-180" : "rotate-0"}`} />
          </button>
          {expandedSections.includes("activites") && (
            <div className="ml-4 space-y-1 pl-4 border-l-2 border-emerald-200">
              <button onClick={() => onSelect("activites")} className={`w-full text-left px-3 py-2 text-sm ${active === "activites" ? "bg-emerald-500/10 font-medium text-emerald-600" : "text-muted-foreground hover:bg-primary/10"}`}>
                <span className="mr-2">•</span> Liste des activités
              </button>
              <button onClick={() => onSelect("activites-create")} className={`w-full text-left px-3 py-2 text-sm ${active === "activites-create" ? "bg-emerald-500/10 font-medium text-emerald-600" : "text-muted-foreground hover:bg-primary/10"}`}>
                <span className="mr-2">•</span> Ajouter activité
              </button>
            </div>
          )}
        </div>

        {/* Notifications & Avis avec sous-menus */}
        <div className="space-y-1">
          <button
            onClick={() => toggleSection("notifications-avis")}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
          >
            <div className="flex items-center">
              <Bell className="mr-3 h-4 w-4" />
              Notifications & Avis
            </div>
            <ChevronDown className={`h-4 w-4 transition-all ${expandedSections.includes("notifications-avis") ? "rotate-180" : "rotate-0"}`} />
          </button>
          {expandedSections.includes("notifications-avis") && (
            <div className="ml-4 space-y-1 pl-4 border-l-2 border-emerald-200">
              <button onClick={() => onSelect("notifications")} className={`w-full text-left px-3 py-2 text-sm ${active === "notifications" ? "bg-emerald-500/10 font-medium text-emerald-600" : "text-muted-foreground hover:bg-primary/10"}`}>
                <span className="mr-2">·</span> Notifications
              </button>
              <button onClick={() => onSelect("avis")} className={`w-full text-left px-3 py-2 text-sm ${active === "avis" ? "bg-emerald-500/10 font-medium text-emerald-600" : "text-muted-foreground hover:bg-primary/10"}`}>
                <span className="mr-2">·</span> Avis
              </button>
            </div>
          )}
        </div>

        {/* Utilisateurs */}
        <button
          onClick={() => onSelect("utilisateurs")}
          className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${active === "utilisateurs" ? "bg-emerald-500/10 font-medium text-emerald-600" : "text-muted-foreground hover:bg-primary/10"}`}
        >
          <Users className="mr-3 h-4 w-4" />
          Gestion des utilisateurs
        </button>

        {/* Planification */}
        <button
          onClick={() => onSelect("planification")}
          className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${active === "planification" ? "bg-emerald-500/10 font-medium text-emerald-600" : "text-muted-foreground hover:bg-primary/10"}`}
        >
          <Calendar className="mr-3 h-4 w-4" />
          Planification
        </button>

        {/* PARAMÉTRAGE - Menu déroulant avec deux sous-sections */}
        <div className="space-y-1">
          <button
            onClick={() => toggleSection("parametrage")}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
          >
            <div className="flex items-center">
              <Settings className="mr-3 h-4 w-4" />
              Paramétrage
            </div>
            <ChevronDown className={`h-4 w-4 transition-all ${expandedSections.includes("parametrage") ? "rotate-180" : "rotate-0"}`} />
          </button>

          {expandedSections.includes("parametrage") && (
            <div className="ml-4 space-y-1 pl-4 border-l-2 border-emerald-200">
              {/* Info entreprise */}
              <button
                onClick={() => onSelect("entreprise-info")}
                className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${active === "entreprise-info"
                    ? "bg-emerald-500/10 font-medium text-emerald-600"
                    : "text-muted-foreground hover:bg-primary/10"
                  }`}
              >
                <Briefcase className="mr-2 h-4 w-4" />
                Info d'entreprise
              </button>

              {/* Marge brute */}
              <button
                onClick={() => onSelect("parametrage-marge-brute")}
                className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${active === "parametrage-marge-brute"
                    ? "bg-emerald-500/10 font-medium text-emerald-600"
                    : "text-muted-foreground hover:bg-primary/10"
                  }`}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Marge brute
              </button>
            </div>
          )}
        </div>

      </nav>
    </aside>
  );
}