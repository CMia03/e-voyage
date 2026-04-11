"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { clearAuth, loadAuth, type AuthSession } from "@/lib/auth";
import { resolvePostLoginPath } from "@/lib/auth-redirect";
import { listDestinations } from "@/lib/api/destinations";
import { destinationsData as fallbackDestinations } from "@/lib/destinations";
import type { DestinationDetails } from "@/lib/type/destination";

import { ClientHeader } from "./components/client-header";
import { ClientFooter } from "./components/client-footer";
import { ClientSidebar, type ClientSection } from "./components/client-sidebar";

export function ClientHome({ username }: { username: string }) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<ClientSection>("destinations");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [destinations, setDestinations] = useState<DestinationDetails[]>(fallbackDestinations);
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

  useEffect(() => {
    let active = true;

    const loadDestinations = async () => {
      try {
        const apiDestinations = await listDestinations();
        if (!active) return;
        if (apiDestinations.length > 0) {
          setDestinations(apiDestinations);
        } else {
          setDestinations(fallbackDestinations);
        }
      } catch {
        if (!active) return;
        setDestinations(fallbackDestinations);
      }
    };

    void loadDestinations();
    return () => {
      active = false;
    };
  }, []);

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <ClientHeader username={displayName} onLogout={handleLogout} />
      <div className="mx-auto flex w-full max-w-[1400px] gap-0 px-0 sm:px-6">
        <ClientSidebar active={activeSection} onSelect={setActiveSection} />

        <main className="min-h-[70vh] flex-1 p-4 sm:p-6">
          {activeSection === "destinations" ? (
            <section className="space-y-4">
              <h1 className="text-2xl font-semibold">Liste des destinations</h1>
              <p className="text-sm text-muted-foreground">Explore les destinations disponibles et prepare ton futur voyage.</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {destinations.map((destination) => (
                  <article key={destination.id} className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
                    <div className="relative h-40 w-full">
                      <Image src={destination.image} alt={destination.title} fill className="object-cover" />
                    </div>
                    <div className="space-y-2 p-4">
                      <h3 className="text-base font-semibold">{destination.title}</h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{destination.description}</p>
                      <p className="text-sm font-medium text-emerald-700">{destination.price}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {activeSection === "planifications" ? (
            <PlaceholderCard title="Planifications destination" description="Section pas encore faite." />
          ) : null}

          {activeSection === "reservations" ? (
            <PlaceholderCard title="Reservations" description="Section pas encore faite." />
          ) : null}

          {activeSection === "profile" ? (
            <section className="space-y-4">
              <h1 className="text-2xl font-semibold">Profil</h1>
              <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <InfoItem label="Login" value={session?.login || "-"} />
                  <InfoItem label="Role" value={session?.role || "-"} />
                  <InfoItem label="Nom" value={session?.nom || "-"} />
                  <InfoItem label="Prenom" value={session?.prenom || "-"} />
                </dl>
              </div>
            </section>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/destinations">Voir les destinations</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/galerie">Voir la galerie</Link>
            </Button>
          </div>
        </main>
      </div>
      <ClientFooter />
    </div>
  );
}

function PlaceholderCard({ title, description }: { title: string; description: string }) {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="rounded-xl border border-dashed border-border/70 bg-card p-6">
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </section>
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
