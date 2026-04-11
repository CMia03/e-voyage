"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Compass, CreditCard, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminHeader } from "@/app/admin/components/header";
import { Button } from "@/components/ui/button";
import { loadAuth } from "@/lib/auth";
import { resolvePostLoginPath } from "@/lib/auth-redirect";
import { destinationsData } from "@/lib/destinations";

type UserSection = "destinations" | "planifications" | "reservations" | "profile";

export function UserHomeClient({ username }: { username: string }) {
  const router = useRouter();
  const [session, setSession] = useState<ReturnType<typeof loadAuth>>(null);
  const [activeSection, setActiveSection] = useState<UserSection>("destinations");

  const userDisplayName = useMemo(() => {
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

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminHeader />
      <div className="mx-auto flex w-full max-w-[1400px] gap-0 px-0 sm:px-6">
        <aside className="hidden w-72 border-r border-border/50 bg-card/50 p-5 md:block">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Espace utilisateur</p>
            <h2 className="mt-1 text-lg font-semibold">{userDisplayName}</h2>
          </div>
          <nav className="space-y-2">
            <SidebarButton
              active={activeSection === "destinations"}
              icon={<Compass className="size-4" />}
              label="Liste destinations"
              onClick={() => setActiveSection("destinations")}
            />
            <SidebarButton
              active={activeSection === "planifications"}
              icon={<CalendarDays className="size-4" />}
              label="Planifications"
              onClick={() => setActiveSection("planifications")}
            />
            <SidebarButton
              active={activeSection === "reservations"}
              icon={<CreditCard className="size-4" />}
              label="Reservations"
              onClick={() => setActiveSection("reservations")}
            />
            <SidebarButton
              active={activeSection === "profile"}
              icon={<UserRound className="size-4" />}
              label="Profil"
              onClick={() => setActiveSection("profile")}
            />
          </nav>
        </aside>

        <main className="min-h-[70vh] flex-1 p-4 sm:p-6">
          {activeSection === "destinations" ? (
            <section className="space-y-4">
              <h1 className="text-2xl font-semibold">Liste des destinations</h1>
              <p className="text-sm text-muted-foreground">Explore les destinations disponibles et prepare ton futur voyage.</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {destinationsData.map((destination) => (
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
            <PlaceholderCard
              title="Planification de destination"
              description="Section pas encore faite. Ici on affichera les planifications de voyage de l'utilisateur."
            />
          ) : null}

          {activeSection === "reservations" ? (
            <PlaceholderCard
              title="Reservations"
              description="Section pas encore faite. Ici on affichera l'etat des reservations et les paiements."
            />
          ) : null}

          {activeSection === "profile" ? (
            <section className="space-y-4">
              <h1 className="text-2xl font-semibold">Profil utilisateur</h1>
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
        </main>
      </div>
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-4 text-xs text-muted-foreground sm:px-6">
          <span>Cool Voyage</span>
          <span>Espace utilisateur</span>
        </div>
      </footer>
    </div>
  );
}

function SidebarButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
        active ? "bg-emerald-500/10 font-medium text-emerald-700" : "text-muted-foreground hover:bg-primary/10"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function PlaceholderCard({ title, description }: { title: string; description: string }) {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="rounded-xl border border-dashed border-border/70 bg-card p-6">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/destinations">Retour vers destinations</Link>
          </Button>
        </div>
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
