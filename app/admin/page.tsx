"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { useAdminNavigation } from "@/app/admin/contexts/admin-navigation-context";
import { AdminSection } from "./components/sidebar";
import { AdminDashboard } from "@/app/admin/dashboard";
import { AdminDestinations } from "@/app/admin/destinations";
import { AdminActivites } from "@/app/admin/activites/page";
import { AdminHebergements } from "@/app/admin/hebergements/page";
import { AdminNotifications } from "@/app/admin/notifications/page";
import { AdminAvis } from "@/app/admin/avis/page";
import { AdminCommentaires } from "@/app/admin/commentaires/page";
import { AdminEntrepriseInfo } from "@/app/admin/entreprise-info-next";
import { AdminPlanificationCalendar } from "@/app/admin/planification/components/admin-planification-calendar";
import { AdminUsers } from "@/app/admin/users/page";
import ListeReservationsPage from "@/app/admin/reservations/liste/page";
import AjoutReservationPage from "@/app/admin/reservations/ajout/page";
import { useAuth } from "@/hooks/useAuth";
import { clearAuth, loadAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

function isValidAdminSection(section: string): section is AdminSection {
  const validSections: AdminSection[] = [
    "dashboard",
    "destinations",
    "destinations-create",
    "destinations-edit",
    "hebergements",
    "hebergements-create",
    "hebergements-edit",
    "hebergements-tarifs",
    "hebergements-types",
    "hebergements-equipements",
    "activites",
    "activites-create",
    "activites-edit",
    "activites-categories",
    "utilisateurs",
    "reservations",
    "reservations-liste",
    "reservations-ajout",
    "avis",
    "commentaires",
    "notifications",
    "statistiques",
    "entreprise-info",
    "planification",
  ];

  return validSections.includes(section as AdminSection);
}

function AdminPageWithSearchParams() {
  const searchParams = useSearchParams();
  const section = searchParams.get("section");
  const destinationId = searchParams.get("destinationId");
  const activiteId = searchParams.get("activiteId");
  const hebergementId = searchParams.get("id");

  return (
    <AdminPageContent
      initialSection={section as AdminSection}
      initialDestinationId={destinationId}
      initialActiviteId={activiteId}
      initialHebergementId={hebergementId}
    />
  );
}

function AdminPageContent({
  initialSection,
  initialDestinationId,
  initialActiviteId,
  initialHebergementId,
}: {
  initialSection?: AdminSection;
  initialDestinationId?: string | null;
  initialActiviteId?: string | null;
  initialHebergementId?: string | null;
}) {
  const { session, isLoading, isAuthenticated } = useAuth();
  const { active, setActive } = useAdminNavigation();
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(
    initialDestinationId || null
  );
  const [selectedActiviteId, setSelectedActiviteId] = useState<string | null>(
    initialActiviteId || null
  );
  const [selectedHebergementId, setSelectedHebergementId] = useState<string | null>(
    initialHebergementId || null
  );

  useEffect(() => {
    if (initialSection) {
      setActive(initialSection);
    }
  }, [initialSection, setActive]);

  useEffect(() => {
    if (active !== "dashboard") {
      const url = new URL(window.location.href);
      url.searchParams.set("section", active);
      window.history.replaceState({}, "", url.toString());
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("section");
      window.history.replaceState({}, "", url.toString());
    }
  }, [active]);

  useEffect(() => {
    const handlePopState = () => {
      const url = new URL(window.location.href);
      const section = url.searchParams.get("section");

      if (section && isValidAdminSection(section)) {
        setActive(section);
      } else {
        setActive("dashboard");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setActive]);

  const accessToken = session?.accessToken ?? null;
  const role = session?.role ?? null;

  useEffect(() => {
    const checkSessionExpiration = () => {
      const currentSession = loadAuth();
      if (!currentSession) {
        clearAuth();
        window.location.href = "/login";
        return;
      }

      try {
        const tokenPayload = JSON.parse(atob(currentSession.accessToken.split(".")[1]));
        const currentTime = Date.now() / 1000;

        if (tokenPayload.exp && tokenPayload.exp < currentTime) {
          clearAuth();
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("Erreur lors de la verification du token:", error);
        clearAuth();
        window.location.href = "/login";
      }
    };

    checkSessionExpiration();
    const interval = setInterval(checkSessionExpiration, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      const currentSession = loadAuth();
      if (!currentSession) {
        clearAuth();
        window.location.href = "/login";
        return;
      }

      try {
        const tokenPayload = JSON.parse(atob(currentSession.accessToken.split(".")[1]));
        const currentTime = Date.now() / 1000;

        if (tokenPayload.exp && tokenPayload.exp < currentTime) {
          clearAuth();
          window.location.href = "/login";
        }
      } catch {
        clearAuth();
        window.location.href = "/login";
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Acces non autorise</h1>
          <p className="text-muted-foreground">
            Vous devez etre connecte pour acceder a cette page.
          </p>
          <Link href="/login">
            <Button>Se connecter</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/50 p-8 text-center backdrop-blur-sm">
        <h1 className="text-2xl font-semibold">Back office</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please login to access the admin area.
        </p>
        <div className="mt-6">
          <Button asChild variant="default">
            <Link href="/login">Se connecter</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (role !== "ADMIN") {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/50 p-8 text-center backdrop-blur-sm">
        <h1 className="text-2xl font-semibold">Back office</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Access is limited for standard users.
        </p>
      </div>
    );
  }

  if (active === "planification") {
    return <AdminPlanificationCalendar accessToken={accessToken ?? ""} />;
  }

  return (
    <div className="w-full">
      {active === "dashboard" ? (
        <AdminDashboard accessToken={accessToken ?? ""} role={role} />
      ) : active === "destinations" ? (
        <AdminDestinations
          accessToken={accessToken ?? ""}
          initialView="liste"
          onRequestCreate={() => setActive("destinations-create")}
          onRequestEdit={(id) => {
            setSelectedDestinationId(id);
            setActive("destinations-edit");
          }}
        />
      ) : active === "destinations-create" ? (
        <AdminDestinations accessToken={accessToken ?? ""} initialView="creation" />
      ) : active === "destinations-edit" ? (
        <AdminDestinations
          accessToken={accessToken ?? ""}
          initialView="modif"
          editId={selectedDestinationId}
        />
      ) : active === "activites" ? (
        <AdminActivites
          accessToken={accessToken ?? ""}
          initialView="liste"
          onRequestCreate={() => setActive("activites-create")}
          onRequestEdit={(id) => {
            setSelectedActiviteId(id);
            setActive("activites-edit");
          }}
        />
      ) : active === "activites-create" ? (
        <AdminActivites accessToken={accessToken ?? ""} initialView="creation" />
      ) : active === "activites-edit" ? (
        <AdminActivites
          accessToken={accessToken ?? ""}
          initialView="modif"
          editId={selectedActiviteId}
        />
      ) : active === "activites-categories" ? (
        <AdminActivites accessToken={accessToken ?? ""} initialView="categories" />
      ) : active === "hebergements" ? (
        <AdminHebergements
          accessToken={accessToken ?? ""}
          initialView="liste"
          onRequestCreate={() => setActive("hebergements-create")}
          onRequestEdit={(id) => {
            setSelectedHebergementId(id);
            setActive("hebergements-edit");
          }}
        />
      ) : active === "hebergements-create" ? (
        <AdminHebergements accessToken={accessToken ?? ""} initialView="creation" />
      ) : active === "hebergements-tarifs" ? (
        <AdminHebergements accessToken={accessToken ?? ""} initialView="tarifs" />
      ) : active === "hebergements-edit" ? (
        <AdminHebergements
          accessToken={accessToken ?? ""}
          initialView="modif"
          editId={selectedHebergementId}
        />
      ) : active === "hebergements-types" ? (
        <AdminHebergements accessToken={accessToken ?? ""} initialView="types" />
      ) : active === "hebergements-equipements" ? (
        <AdminHebergements accessToken={accessToken ?? ""} initialView="equipements" />
      ) : active === "notifications" ? (
        <AdminNotifications />
      ) : active === "avis" ? (
        <AdminAvis />
      ) : active === "commentaires" ? (
        <AdminCommentaires />
      ) : active === "utilisateurs" ? (
        <AdminUsers />
      ) : active === "reservations-liste" ? (
        <ListeReservationsPage />
      ) : active === "reservations-ajout" ? (
        <AjoutReservationPage />
      ) : active === "entreprise-info" ? (
        <AdminEntrepriseInfo accessToken={accessToken ?? ""} />
      ) : (
        <AdminDestinations accessToken={accessToken ?? ""} initialView="liste" />
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-lg">Chargement...</div>
        </div>
      }
    >
      <AdminPageWithSearchParams />
    </Suspense>
  );
}
