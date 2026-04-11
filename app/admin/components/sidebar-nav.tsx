"use client";

import { useState } from "react";

type AdminSection =
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
  | "entreprise-info";

interface AdminSidebarProps {
  active: AdminSection;
  onSelect: (section: AdminSection) => void;
}

export function AdminSidebar({ active, onSelect }: AdminSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  function toggleSection(section: string) {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((item) => item !== section)
        : [...prev, section]
    );
  }

  return (
    <aside className="hidden w-64 overflow-y-auto border-r border-border/50 bg-card/50 px-4 py-6 backdrop-blur-sm sm:block">
      <nav className="space-y-1">
        <button
          type="button"
          onClick={() => onSelect("dashboard")}
          className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
            active === "dashboard"
              ? "bg-emerald-500/10 font-medium text-emerald-600"
              : "text-muted-foreground hover:bg-primary/10"
          }`}
        >
          Dashboard
        </button>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => toggleSection("destinations")}
            className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
          >
            <span>Destinations</span>
            <span className={expandedSections.includes("destinations") ? "rotate-180" : ""}>
              ˅
            </span>
          </button>
          {expandedSections.includes("destinations") ? (
            <div className="ml-4 space-y-1 border-l-2 border-emerald-200 pl-4 dark:border-emerald-800">
              <button
                type="button"
                onClick={() => onSelect("destinations")}
                className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
                  active === "destinations"
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
                Ajouter destination
              </button>
            </div>
          ) : null}
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => toggleSection("hebergements")}
            className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
          >
            <span>Hebergements</span>
            <span className={expandedSections.includes("hebergements") ? "rotate-180" : ""}>
              ˅
            </span>
          </button>
          {expandedSections.includes("hebergements") ? (
            <div className="ml-4 space-y-1 border-l-2 border-emerald-200 pl-4 dark:border-emerald-800">
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
                Tous les hebergements
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
                Ajouter un hebergement
              </button>
              <button
                type="button"
                onClick={() => onSelect("hebergements-tarifs")}
                className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
                  active === "hebergements-tarifs"
                    ? "bg-emerald-500/10 font-medium text-emerald-600"
                    : "text-muted-foreground hover:bg-primary/10"
                }`}
              >
                <span className="mr-2">•</span>
                Tarifs chambres
              </button>
            </div>
          ) : null}
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => toggleSection("activites")}
            className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
          >
            <span>Activites</span>
            <span className={expandedSections.includes("activites") ? "rotate-180" : ""}>
              ˅
            </span>
          </button>
          {expandedSections.includes("activites") ? (
            <div className="ml-4 space-y-1 border-l-2 border-emerald-200 pl-4 dark:border-emerald-800">
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
                Toutes les activites
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
                Ajouter une activite
              </button>
              <button
                type="button"
                onClick={() => onSelect("activites-categories")}
                className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
                  active === "activites-categories"
                    ? "bg-emerald-500/10 font-medium text-emerald-600"
                    : "text-muted-foreground hover:bg-primary/10"
                }`}
              >
                <span className="mr-2">•</span>
                Categories
              </button>
            </div>
          ) : null}
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
          <svg
            className="mr-3 h-4 w-4 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          Gestion des utilisateurs
        </button>

        
      </nav>
    </aside>
  );
}
