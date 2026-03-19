"use client";

import Link from "next/link";
import { useState } from "react";

type AdminSection =
  | "dashboard"
  | "destinations"
  | "hebergements"
  | "hebergements-create"
  | "hebergements-types"
  | "hebergements-equipements"
  | "activites"
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
          className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${active === "dashboard"
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
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
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
                className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${active === "destinations"
                    ? "bg-emerald-500/10 font-medium text-emerald-600"
                    : "text-muted-foreground hover:bg-primary/10"
                  }`}
              >
                <span className="mr-2">•</span>
                Toutes les destinations
              </button>
              <button
                type="button"
                onClick={() => console.log("Ajouter une destination")}
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
              >
                <span className="mr-2">•</span>

                <Link href="/admin/addDestination">  Ajouter une destination </Link>

              </button>
              <button
                type="button"
                onClick={() => console.log("Catégories")}
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
              >
                <span className="mr-2">•</span>
                Catégories
              </button>
              <button
                type="button"
                onClick={() => console.log("Régions")}
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
              >
                <span className="mr-2">•</span>
                Régions
              </button>
              <button
                type="button"
                onClick={() => console.log("Saisons")}
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
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
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
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
                className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${
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
                className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${
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
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
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
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
              >
                <span className="mr-2">•</span>
                Toutes les activités
              </button>
              <button
                type="button"
                onClick={() => console.log("Ajouter une activité")}
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
              >
                <span className="mr-2">•</span>
                Ajouter une activité
              </button>
              <button
                type="button"
                onClick={() => console.log("Catégories d'activités")}
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
              >
                <span className="mr-2">•</span>
                Catégories
              </button>
            </div>
          )}
        </div>

        {/* Sections simples (sans sous-menus) */}
        <button
          type="button"
          onClick={() => onSelect("utilisateurs")}
          className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${active === "utilisateurs"
              ? "bg-emerald-500/10 font-medium text-emerald-600"
              : "text-muted-foreground hover:bg-primary/10"
            }`}
        >
          <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Utilisateurs
        </button>

        {/* <button
          type="button"
          onClick={() => onSelect("reservations")}
          className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${active === "reservations"
              ? "bg-emerald-500/10 font-medium text-emerald-600"
              : "text-muted-foreground hover:bg-primary/10"
            }`}
        >
          <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Réservations
        </button> */}

        {/* <button
          type="button"
          onClick={() => onSelect("avis")}
          className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${active === "avis"
              ? "bg-emerald-500/10 font-medium text-emerald-600"
              : "text-muted-foreground hover:bg-primary/10"
            }`}
        >
          <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Avis et notes
        </button> */}

        {/* <button
          type="button"
          onClick={() => onSelect("notifications")}
          className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${active === "notifications"
              ? "bg-emerald-500/10 font-medium text-emerald-600"
              : "text-muted-foreground hover:bg-primary/10"
            }`}
        >
          <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Notifications
        </button> */}

        {/* <button
          type="button"
          onClick={() => onSelect("statistiques")}
          className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${active === "statistiques"
              ? "bg-emerald-500/10 font-medium text-emerald-600"
              : "text-muted-foreground hover:bg-primary/10"
            }`}
        >
          <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Statistiques
        </button> */}

        
      </nav>
    </aside>
  );
}
