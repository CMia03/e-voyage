"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { useAdminNavigation } from "../contexts/admin-navigation-context";
import { useBreadcrumbs } from "../contexts/breadcrumbs-context";
import { type AdminSection } from "./sidebar";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface AdminBreadcrumbsProps {
  noMargin?: boolean;
}

export function AdminBreadcrumbs({ noMargin = false }: AdminBreadcrumbsProps = {}) {
  const { active, setActive } = useAdminNavigation();
  const { breadcrumbs: customBreadcrumbs, resetBreadcrumbs } = useBreadcrumbs();

  // Handle breadcrumb click to reset navigation and breadcrumbs
  const handleBreadcrumbClick = (href: string, section?: AdminSection) => {
    resetBreadcrumbs();
    if (section) {
      setActive(section);
    }
  };

  // Reset custom breadcrumbs when navigating to main sections
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const baseBreadcrumbs: BreadcrumbItem[] = [
      { label: "Admin", href: "/admin" },
    ];

    // If custom breadcrumbs are set, use them
    if (customBreadcrumbs.length > 1) {
      return customBreadcrumbs;
    }

    switch (active) {
      case "dashboard":
        return [
          ...baseBreadcrumbs,
          { label: "Dashboard", isActive: true }
        ];

      case "destinations":
        return [
          ...baseBreadcrumbs,
          { label: "Destinations", isActive: true }
        ];

      case "destinations-create":
        return [
          ...baseBreadcrumbs,
          { label: "Destinations", href: "/admin?section=destinations" },
          { label: "Ajouter destination", isActive: true }
        ];

      case "destinations-edit":
        return [
          ...baseBreadcrumbs,
          { label: "Destinations", href: "/admin?section=destinations" },
          { label: "Modifier destination", isActive: true }
        ];

      case "hebergements":
        return [
          ...baseBreadcrumbs,
          { label: "Hébergements", isActive: true }
        ];

      case "hebergements-create":
        return [
          ...baseBreadcrumbs,
          { label: "Hébergements", href: "/admin?section=hebergements" },
          { label: "Ajouter Hébergements", isActive: true }
        ];

      case "hebergements-edit":
        return [
          ...baseBreadcrumbs,
          { label: "Hébergements", href: "/admin?section=hebergements" },
          { label: "Modifier Hébergements", isActive: true }
        ];

      case "hebergements-tarifs":
        return [
          ...baseBreadcrumbs,
          { label: "Hébergements", href: "/admin?section=hebergements" },
          { label: "Tarifs", isActive: true }
        ];

      case "hebergements-types":
        return [
          ...baseBreadcrumbs,
          { label: "Hébergements", href: "/admin?section=hebergements" },
          { label: "Types", isActive: true }
        ];

      case "hebergements-equipements":
        return [
          ...baseBreadcrumbs,
          { label: "Hébergements", href: "/admin?section=hebergements" },
          { label: "Ã‰quipements", isActive: true }
        ];

      case "activites":
        return [
          ...baseBreadcrumbs,
          { label: "Activités", isActive: true }
        ];

      case "activites-create":
        return [
          ...baseBreadcrumbs,
          { label: "Activités", href: "/admin?section=activites" },
          { label: "Ajouter activitÃ©", isActive: true }
        ];

      case "activites-edit":
        return [
          ...baseBreadcrumbs,
          { label: "Activités", href: "/admin?section=activites" },
          { label: "Modifier activitÃ©", isActive: true }
        ];

      case "activites-categories":
        return [
          ...baseBreadcrumbs,
          { label: "Activités", href: "/admin?section=activites" },
          { label: "CatÃ©gories", isActive: true }
        ];

      case "utilisateurs":
        return [
          ...baseBreadcrumbs,
          { label: "Utilisateurs", isActive: true }
        ];

      case "reservations":
        return [
          ...baseBreadcrumbs,
          { label: "RÃ©servations", isActive: true }
        ];

      case "reservations-liste":
        return [
          ...baseBreadcrumbs,
          { label: "RÃ©servations", href: "/admin?section=reservations" },
          { label: "Liste des rÃ©servations", isActive: true }
        ];

      case "reservations-ajout":
        return [
          ...baseBreadcrumbs,
          { label: "RÃ©servations", href: "/admin?section=reservations" },
          { label: "Ajouter une rÃ©servation", isActive: true }
        ];

      case "avis":
        return [
          ...baseBreadcrumbs,
          { label: "Avis", isActive: true }
        ];

      case "notifications":
        return [
          ...baseBreadcrumbs,
          { label: "Notifications", isActive: true }
        ];

      case "statistiques":
        return [
          ...baseBreadcrumbs,
          { label: "Statistiques", isActive: true }
        ];

      case "entreprise-info":
        return [
          ...baseBreadcrumbs,
          { label: "Info entreprise", isActive: true }
        ];

      case "planification":
        return [
          ...baseBreadcrumbs,
          { label: "Planification", isActive: true }
        ];

      default:
        return baseBreadcrumbs;
    }
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className={`flex items-center space-x-1 text-sm text-muted-foreground ${noMargin ? '' : 'mb-6'}`}>
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center">
          {index === 0 && <Home className="h-4 w-4 mr-1" />}
          {item.href && !item.isActive ? (
            <Link 
              href={item.href} 
              className="hover:text-foreground transition-colors"
              onClick={() => {
                const href = item.href;
                if (!href) return;

                if (href === "/admin") {
                  handleBreadcrumbClick(href, "dashboard");
                } else {
                  const sectionMatch = href.match(/section=([^&]+)/);
                  const section = sectionMatch ? sectionMatch[1] as AdminSection : undefined;
                  handleBreadcrumbClick(href, section);
                }
              }}
            >
              {item.label}
            </Link>
          ) : (
            <span className={item.isActive ? "text-foreground font-medium" : ""}>
              {item.label}
            </span>
          )}
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
          )}
        </div>
      ))}
    </nav>
  );
}



