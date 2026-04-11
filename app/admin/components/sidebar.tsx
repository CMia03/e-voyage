"use client";

import { useState } from "react";
import { Home, MapPin, Building, Play, ChevronDown, Users, Calendar, Bell, Star } from "lucide-react";

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
  | "planification";

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
                Liste des destinations
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
                Ajouter destination
              </button>
            </div>
          )}
        </div>

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
                className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${active === "hebergements"
                    ? "bg-emerald-500/10 font-medium text-emerald-600"
                    : "text-muted-foreground hover:bg-primary/10"
                  }`}
              >
                <span className="mr-2">•</span>
                Liste des hébergements
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
                Ajouter hébergement
              </button>
            </div>
          )}
        </div>

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
                className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${active === "activites"
                    ? "bg-emerald-500/10 font-medium text-emerald-600"
                    : "text-muted-foreground hover:bg-primary/10"
                  }`}
              >
                <span className="mr-2">•</span>
                Liste des activités
              </button>
              <button
                type="button"
                onClick={() => onSelect("activites-create")}
                className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
                  active === "activites-create"
                    ? "bg-emerald-500/10 font-medium text-emerald-600"
                    : "text-muted-foreground hover:bg-primary/10"
                }`}
              >
                <span className="mr-2">•</span>
                Ajouter activité
              </button>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => toggleSection("notifications-avis")}
            className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
          >
            <div className="flex items-center">
              <Bell className="mr-3 h-4 w-4" />
              Notifications & Avis
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-all duration-300 ease-in-out transform ${
                expandedSections.includes("notifications-avis") ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {expandedSections.includes("notifications-avis") && (
            <div className="ml-4 space-y-1 pl-4 border-l-2 border-emerald-200 dark:border-emerald-800">
              <button
                type="button"
                onClick={() => onSelect("notifications")}
                className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${active === "notifications"
                    ? "bg-emerald-500/10 font-medium text-emerald-600"
                    : "text-muted-foreground hover:bg-primary/10"
                  }`}
              >
                <span className="mr-2">·</span>
                Notifications
              </button>
              <button
                type="button"
                onClick={() => onSelect("avis")}
                className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
                  active === "avis"
                    ? "bg-emerald-500/10 font-medium text-emerald-600"
                    : "text-muted-foreground hover:bg-primary/10"
                }`}
              >
                <span className="mr-2">·</span>
                Avis
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onSelect("planification")}
          className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${active === "planification"
              ? "bg-emerald-500/10 font-medium text-emerald-600"
              : "text-muted-foreground hover:bg-primary/10"
            }`}
        >
          <Calendar className="mr-3 h-4 w-4" />
          Planification
        </button>
      </nav>
    </aside>
  );
}
