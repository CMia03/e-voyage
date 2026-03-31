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
          <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
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
              <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Destinations
            </div>
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${expandedSections.includes("destinations") ? "rotate-180" : ""
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
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
              <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Hébergements
            </div>
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${expandedSections.includes("hebergements") ? "rotate-180" : ""
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
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
              <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Activités
            </div>
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${expandedSections.includes("activites") ? "rotate-180" : ""
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
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
