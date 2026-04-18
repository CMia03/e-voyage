"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { clearAuth, loadAuth, type AuthSession } from "@/lib/auth";
import { resolvePostLoginPath } from "@/lib/auth-redirect";

import { ClientHeader } from "./components/client-header";
import { ClientFooter } from "./components/client-footer";
import { ClientSidebar, type ClientSection } from "./components/client-sidebar";

// Import des pages
import SimulationPage from "./simulation/page";
import DestinationsPage from "./destinations/page";
import PlanificationsPage from "./planifications/page";
import ReservationsPage from "./reservations/page";

export function ClientHome({ username }: { username: string }) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<ClientSection>("simulation");
  const [session, setSession] = useState<AuthSession | null>(null);
  const displayName = useMemo(() => {
    if (!session) return username;
    const fullName = [session.prenom, session.nom].filter(Boolean).join(" ").trim();
    return fullName || session.login || username;
  }, [session, username]);

  useEffect(() => {
    const currentSession = loadAuth();
    setSession(currentSession);

    if (!currentSession?.accessToken) {
      router.replace("/login");
      return;
    }

    const expectedPath = resolvePostLoginPath({
      role: currentSession.role,
      login: currentSession.login,
      userId: currentSession.userId,
    });

    if (expectedPath === "/admin") {
      router.replace("/admin");
      return;
    }

    const expectedUsername = expectedPath.replace("/", "");
    if (expectedUsername && expectedUsername !== username) {
      router.replace(expectedPath);
    }
  }, [router, username]);

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  const renderContent = () => {
    switch (activeSection) {
      case "simulation":
        return <SimulationPage />;
      case "destinations":
        return <DestinationsPage />;
      case "planifications":
        return <PlanificationsPage />;
      case "reservations":
        return <ReservationsPage />;
      case "profile":
        return (
          <section className="space-y-4">
            <h1 className="text-2xl font-semibold">Profil</h1>
            <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <dl className="grid gap-3 sm:grid-cols-2">
                <InfoItem label="Login" value={session?.login || "-"} />
                <InfoItem label="Role" value={session?.role || "-"} />
                <InfoItem label="Nom" value={session?.nom || "-"} />
                <InfoItem label="Prénom" value={session?.prenom || "-"} />
              </dl>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <ClientHeader username={displayName} onLogout={handleLogout} />
      <div className="mx-auto flex w-full max-w-[1400px] gap-0 px-0 sm:px-6">
        <ClientSidebar active={activeSection} onSelect={setActiveSection} />
        <main className="min-h-[70vh] flex-1 p-4 sm:p-6">
          {renderContent()}
        </main>
      </div>
      <ClientFooter />
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}