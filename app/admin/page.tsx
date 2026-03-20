"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/app/admin/components/header";
import { AdminSidebar } from "@/app/admin/components/sidebar";
import { AdminFooter } from "@/app/admin/components/footer";
import { AdminDashboard } from "@/app/admin/dashboard";
import { AdminDestinations } from "@/app/admin/destinations";
import { AdminHebergements } from "@/app/admin/hebergements/page";
import { AuthSession, loadAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type AdminSection =
  | "dashboard"
  | "destinations"
  | "hebergements"
  | "hebergements-create"
  | "hebergements-edit"
  | "hebergements-types"
  | "hebergements-equipements";

export default function AdminPage() {
  const [active, setActive] = useState<AdminSection>("dashboard");
  const [selectedHebergementId, setSelectedHebergementId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const role = session?.role ?? null;
  const accessToken = session?.accessToken ?? null;

  useEffect(() => {
    // Load localStorage auth only on the client to avoid hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(loadAuth());
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background text-foreground">
        <AdminHeader />
        <main className="mx-auto w-full max-w-[800px] px-4 py-10 sm:py-16">
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
        </main>
        <AdminFooter />
      </div>
    );
  }

  if (role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background text-foreground">
        <AdminHeader />
        <main className="mx-auto w-full max-w-[800px] px-4 py-10 sm:py-16">
          <div className="rounded-2xl border border-border/50 bg-card/50 p-8 text-center backdrop-blur-sm">
            <h1 className="text-2xl font-semibold">Back office</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Access is limited for standard users.
            </p>
          </div>
        </main>
        <AdminFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background text-foreground">
      <AdminHeader />
      <div className="mx-auto flex w-full max-w-[1400px] flex-1">
        <AdminSidebar active={active} onSelect={setActive} />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {active === "dashboard" ? (
            <AdminDashboard accessToken={accessToken ?? ""} role={role} />
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
          ) : active === "hebergements-edit" ? (
            <AdminHebergements
              accessToken={accessToken ?? ""}
              initialView="modif"
              editId={selectedHebergementId}
            />
          ) : active === "hebergements-types" ? (
            <AdminHebergements accessToken={accessToken ?? ""} initialView="types" />
          ) : active === "hebergements-equipements" ? (
            <AdminHebergements
              accessToken={accessToken ?? ""}
              initialView="equipements"
            />
          ) : (
            <AdminDestinations />
          )}
        </main>
      </div>
      <AdminFooter />
    </div>
  );
}
