"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { clearAuth, loadAuth, type AuthSession } from "@/lib/auth";
import { resolvePostLoginPath } from "@/lib/auth-redirect";

import { ClientHeader } from "./components/client-header";
import { ClientFooter } from "./components/client-footer";
import { ClientSidebar, type ClientSection } from "./components/client-sidebar";

function resolveSection(pathname: string): ClientSection {
  if (pathname.includes("/destinations")) return "destinations";
  if (pathname.includes("/planifications")) return "destinations";
  if (pathname.includes("/reservations")) return "reservations";
  if (pathname.includes("/profile")) return "profile";
  if (pathname.includes("/simulation")) return "simulation";
  return "home";
}

export function ClientLayoutShell({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
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

  const activeSection = resolveSection(pathname || "");

  return (
    <div className="min-h-screen bg-muted/30">
      <ClientHeader username={displayName} onLogout={handleLogout} />
      <div className="mx-auto flex w-full max-w-[1400px] gap-0 px-0 sm:px-6">
        <ClientSidebar active={activeSection} username={username} />
        <main className="min-h-[70vh] flex-1 p-4 sm:p-6">{children}</main>
      </div>
      <ClientFooter />
    </div>
  );
}
