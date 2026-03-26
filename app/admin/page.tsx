"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/app/admin/components/header";
import { AdminSidebar } from "@/app/admin/components/sidebar";
import { AdminFooter } from "@/app/admin/components/footer";
import { AdminDashboard } from "@/app/admin/dashboard";
import { AdminDestinations } from "@/app/admin/destinations";
import { loadAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type AdminSection = "dashboard" | "destinations" | "hebergements" | "activites" | "utilisateurs" | "reservations" | "avis" | "notifications" | "statistiques";

export default function AdminPage() {
  const [active, setActive] = useState<AdminSection>("dashboard");
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const session = loadAuth();
    setRole(session?.role ?? null);
    setAccessToken(session?.accessToken ?? null);
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
          ) : (
            <AdminDestinations />
          )}
        </main>
      </div>
      <AdminFooter />
    </div>
  );
}
