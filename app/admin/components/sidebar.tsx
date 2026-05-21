"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Briefcase,
  Building,
  Calendar,
  ChevronDown,
  ClipboardList,
  Home,
  MapPin,
  Play,
  Settings,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getAllCommentairesAdmin } from "@/lib/api/commentaires";

export type AdminSection =
  | "dashboard"
  | "destinations"
  | "destinations-create"
  | "destinations-edit"
  | "destinations-view"
  | "hebergements"
  | "hebergements-create"
  | "hebergements-edit"
  | "hebergements-view"
  | "hebergements-tarifs"
  | "hebergements-types"
  | "hebergements-equipements"
  | "activites"
  | "activites-create"
  | "activites-edit"
  | "activites-view"
  | "activites-categories"
  | "utilisateurs"
  | "reservations"
  | "reservations-liste"
  | "reservations-view"
  | "reservations-ajout"
  | "avis"
  | "notifications"
  | "commentaires"
  | "statistiques"
  | "entreprise-info"
  | "planification";

interface AdminSidebarProps {
  active: AdminSection;
  onSelect: (section: AdminSection) => void;
}

export function AdminSidebar({ active, onSelect }: AdminSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [commentairesNonLus, setCommentairesNonLus] = useState(0);
  const { session } = useAuth();

  useEffect(() => {
    const loadCommentairesEnAttente = async () => {
      if (!session?.accessToken) return;

      try {
        const response = await getAllCommentairesAdmin(session.accessToken);
        if (response.success) {
          const commentairesCount =
            response.data?.filter((commentaire) => commentaire.status === false).length || 0;
          setCommentairesNonLus(commentairesCount);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des commentaires:", error);
      }
    };

    void loadCommentairesEnAttente();
    const interval = setInterval(() => {
      void loadCommentairesEnAttente();
    }, 30000);
    return () => clearInterval(interval);
  }, [session?.accessToken]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((item) => item !== section) : [...prev, section]
    );
  };

  const itemClassName = (isActive: boolean) =>
    `flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
      isActive
        ? "bg-emerald-500/10 font-medium text-emerald-600"
        : "text-muted-foreground hover:bg-primary/10"
    }`;

  const groupButtonClassName =
    "flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10";

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 self-start overflow-y-auto border-r border-border/50 bg-card/50 px-4 py-6 backdrop-blur-sm sm:block">
      <nav className="space-y-1">
        <button type="button" onClick={() => onSelect("dashboard")} className={itemClassName(active === "dashboard")}>
          <Home className="mr-3 h-4 w-4" />
          Dashboard
        </button>

        <div className="space-y-1">
          <button type="button" onClick={() => toggleSection("destinations")} className={groupButtonClassName}>
            <div className="flex items-center">
              <MapPin className="mr-3 h-4 w-4" />
              Destinations
            </div>
            <ChevronDown
              className={`h-4 w-4 transform transition-all duration-300 ease-in-out ${
                expandedSections.includes("destinations") ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {expandedSections.includes("destinations") ? (
            <div className="ml-4 space-y-1 border-l-2 border-emerald-200 pl-4 dark:border-emerald-800">
              <button type="button" onClick={() => onSelect("destinations")} className={itemClassName(active === "destinations")}>
                Liste des destinations
              </button>
              <button
                type="button"
                onClick={() => onSelect("destinations-create")}
                className={itemClassName(active === "destinations-create")}
              >
                Ajouter destination
              </button>
            </div>
          ) : null}
        </div>

        <div className="space-y-1">
          <button type="button" onClick={() => toggleSection("hebergements")} className={groupButtonClassName}>
            <div className="flex items-center">
              <Building className="mr-3 h-4 w-4" />
              Hebergements
            </div>
            <ChevronDown
              className={`h-4 w-4 transform transition-all duration-300 ease-in-out ${
                expandedSections.includes("hebergements") ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {expandedSections.includes("hebergements") ? (
            <div className="ml-4 space-y-1 border-l-2 border-emerald-200 pl-4 dark:border-emerald-800">
              <button type="button" onClick={() => onSelect("hebergements")} className={itemClassName(active === "hebergements")}>
                Liste des hebergements
              </button>
              <button
                type="button"
                onClick={() => onSelect("hebergements-create")}
                className={itemClassName(active === "hebergements-create")}
              >
                Ajouter hebergement
              </button>
            </div>
          ) : null}
        </div>

        <div className="space-y-1">
          <button type="button" onClick={() => toggleSection("activites")} className={groupButtonClassName}>
            <div className="flex items-center">
              <Play className="mr-3 h-4 w-4" />
              Activites
            </div>
            <ChevronDown
              className={`h-4 w-4 transform transition-all duration-300 ease-in-out ${
                expandedSections.includes("activites") ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {expandedSections.includes("activites") ? (
            <div className="ml-4 space-y-1 border-l-2 border-emerald-200 pl-4 dark:border-emerald-800">
              <button type="button" onClick={() => onSelect("activites")} className={itemClassName(active === "activites")}>
                Liste des activites
              </button>
              <button
                type="button"
                onClick={() => onSelect("activites-create")}
                className={itemClassName(active === "activites-create")}
              >
                Ajouter activite
              </button>
            </div>
          ) : null}
        </div>


        <button type="button" onClick={() => onSelect("planification")} className={itemClassName(active === "planification")}>
          <Calendar className="mr-3 h-4 w-4" />
          Planification
        </button>

        <div className="space-y-1">
          <button type="button" onClick={() => toggleSection("reservations")} className={groupButtonClassName}>
            <div className="flex items-center">
              <ClipboardList className="mr-3 h-4 w-4" />
              Reservations
            </div>
            <ChevronDown
              className={`h-4 w-4 transform transition-all duration-300 ease-in-out ${
                expandedSections.includes("reservations") ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {expandedSections.includes("reservations") ? (
            <div className="ml-4 space-y-1 border-l-2 border-emerald-200 pl-4 dark:border-emerald-800">
              <button
                type="button"
                onClick={() => onSelect("reservations-liste")}
                className={itemClassName(active === "reservations-liste")}
              >
                Liste reservations
              </button>
              <button
                type="button"
                onClick={() => onSelect("reservations-ajout")}
                className={itemClassName(active === "reservations-ajout")}
              >
                Ajout reservation
              </button>
            </div>
          ) : null}
        </div>

        <div className="space-y-1">
          <button type="button" onClick={() => toggleSection("notifications-avis")} className={groupButtonClassName}>
            <div className="flex items-center">
              <Bell className="mr-3 h-4 w-4" />
              Notifications & Avis
            </div>
            <ChevronDown
              className={`h-4 w-4 transform transition-all duration-300 ease-in-out ${
                expandedSections.includes("notifications-avis") ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {expandedSections.includes("notifications-avis") ? (
            <div className="ml-4 space-y-1 border-l-2 border-emerald-200 pl-4 dark:border-emerald-800">
              <button type="button" onClick={() => onSelect("notifications")} className={itemClassName(active === "notifications")}>
                Notifications
              </button>
              <button type="button" onClick={() => onSelect("avis")} className={itemClassName(active === "avis")}>
                Avis
              </button>
              <button
                type="button"
                onClick={() => onSelect("commentaires")}
                className={itemClassName(active === "commentaires")}
              >
                <span className="flex items-center gap-2">
                  Commentaires
                  {commentairesNonLus > 0 ? (
                    <Badge variant="destructive" className="flex h-5 w-5 items-center justify-center p-0 text-xs">
                      {commentairesNonLus > 99 ? "99+" : commentairesNonLus}
                    </Badge>
                  ) : null}
                </span>
              </button>
            </div>
          ) : null}
        </div>
        

        <div className="space-y-1">
          <button type="button" onClick={() => toggleSection("parametrage")} className={groupButtonClassName}>
            <div className="flex items-center">
              <Settings className="mr-3 h-4 w-4" />
              Parametrage
            </div>
            <ChevronDown
              className={`h-4 w-4 transform transition-all duration-300 ease-in-out ${
                expandedSections.includes("parametrage") ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {expandedSections.includes("parametrage") ? (
            <div className="ml-4 space-y-1 border-l-2 border-emerald-200 pl-4 dark:border-emerald-800">
              <button type="button" onClick={() => onSelect("utilisateurs")} className={itemClassName(active === "utilisateurs")}>
                <Users className="mr-3 h-4 w-4" />
                Gestion des utilisateurs
              </button>
              <button
                type="button"
                onClick={() => onSelect("entreprise-info")}
                className={itemClassName(active === "entreprise-info")}
              >
                <Briefcase className="mr-3 h-4 w-4" />
                Info entreprise
              </button>
            </div>
          ) : null}
        </div>
      </nav>
    </aside>
  );
}
