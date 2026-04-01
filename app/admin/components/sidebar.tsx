"use client";

import { useState } from "react";
import { Home, MapPin, Building, Play, ChevronDown, Users } from "lucide-react";
type AdminSection =
  | "dashboard"
  | "destinations"
  | "destinations-create"
  | "destinations-edit"
  | "hebergements"
  | "hebergements-create"
  | "hebergements-edit"
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
  | "statistiques";

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
        {/* Dashboard - toujours visible */}
        <button
          type="button"
          onClick={() => onSelect("dashboard")}
          className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${active === "dashboard"
              ? "bg-emerald-500/10 font-medium text-emerald-600"
              : "text-muted-foreground hover:bg-primary/10"
            }`}
        >
          <Home className="mr-3 h-4 w-4" />
          Dashboard
        </button>

        {/* Section Destinations avec sous-sections */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => toggleSection("destinations")}
            className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
          >
            <div className="flex items-center">
              <MapPin className="mr-3 h-4 w-4" />
              Destinations
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-all duration-300 ease-in-out transform ${
                expandedSections.includes("destinations") ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {expandedSections.includes("destinations") && (
            <div className="ml-4 space-y-1 pl-4 border-l-2 border-emerald-200 dark:border-emerald-800">
              <button
                type="button"
                onClick={() => onSelect("destinations")}
                className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${active === "destinations"
                    ? "bg-emerald-500/10 font-medium text-emerald-600"
                    : "text-muted-foreground hover:bg-primary/10"
                  }`}
              >
                <span className="mr-2">•</span>
                Toutes les destinations
              </button>
              <button
                type="button"
                onClick={() => onSelect("destinations-create")}
                className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
                  active === "destinations-create"
                    ? "bg-emerald-500/10 font-medium text-emerald-600"
                    : "text-muted-foreground hover:bg-primary/10"
                }`}
              >
                <span className="mr-2">•</span>

              </button>
              <button
                type="button"
                onClick={() => {}}
                className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
                  active === "activites"
                    ? "bg-emerald-500/10 font-medium text-emerald-600"
                    : "text-muted-foreground hover:bg-primary/10"
                }`}
              >
                <span className="mr-2">•</span>
                Catégories
              </button>
              <button
                type="button"
                onClick={() => {}}
                className="flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
              >
                <span className="mr-2">•</span>
                Régions
              </button>
              <button
                type="button"
                onClick={() => {}}
                className="flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
              >
                <span className="mr-2">•</span>
                Saisons recommandées
              </button>
            </div>
          )}
        </div>

        {/* Section Hébergements avec sous-sections */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => toggleSection("hebergements")}
            className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
          >
            <div className="flex items-center">
              <Building className="mr-3 h-4 w-4" />
              Hébergements
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-all duration-300 ease-in-out transform ${
                expandedSections.includes("hebergements") ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {expandedSections.includes("hebergements") && (
            <div className="ml-4 space-y-1 pl-4 border-l-2 border-emerald-200 dark:border-emerald-800">
              <button
                type="button"
                onClick={() => onSelect("hebergements")}
                className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
                  active === "hebergements"
                    ? "bg-emerald-500/10 font-medium text-emerald-600"
                    : "text-muted-foreground hover:bg-primary/10"
                }`}
              >
                <span className="mr-2">•</span>
                Tous les hébergements
              </button>
              
              <button
                type="button"
                onClick={() => onSelect("hebergements-create")}
                className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
                  active === "hebergements-create"
                    ? "bg-emerald-500/10 font-medium text-emerald-600"
                    : "text-muted-foreground hover:bg-primary/10"
                }`}
              >
                <span className="mr-2">•</span>
                Ajouter un hébergement
              </button>

            </div>
          )}
        </div>
        

        {/* Section Activités avec sous-sections */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => toggleSection("activites")}
            className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
          >
            <div className="flex items-center">
              <Play className="mr-3 h-4 w-4" />
              Activités
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-all duration-300 ease-in-out transform ${
                expandedSections.includes("activites") ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {expandedSections.includes("activites") && (
            <div className="ml-4 space-y-1 pl-4 border-l-2 border-emerald-200 dark:border-emerald-800">
              <button
                type="button"
                onClick={() => onSelect("activites")}
                className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
                  active === "activites"
                    ? "bg-emerald-500/10 font-medium text-emerald-600"
                    : "text-muted-foreground hover:bg-primary/10"
                }`}
              >
                <span className="mr-2">•</span>
                Toutes les activités
              </button>
              <button
                type="button"
                onClick={() => {}}
                className="flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
              >
                <span className="mr-2">•</span>
                Ajouter une activité
              </button>
              <button
                type="button"
                onClick={() => {}}
                className="flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
              >
                <span className="mr-2">•</span>
                Catégories
              </button>
            </div>
          )}
        </div>
        
        {/* Utilisateurs */}
        <button
          type="button"
          onClick={() => onSelect("utilisateurs")}
          className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
            active === "utilisateurs"
              ? "bg-emerald-500/10 font-medium text-emerald-600"
              : "text-muted-foreground hover:bg-primary/10"
          }`}
        >
          <Users className="mr-3 h-4 w-4 text-emerald-600" />
          Gestion des utilisateurs
        </button>
        
      </nav>
    </aside>
  );
}
