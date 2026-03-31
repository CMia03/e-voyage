"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SessionGuard } from "@/components/session-guard";
import { loadAuth } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const auth = loadAuth();
    if (auth) {
      // Rediriger vers le profil de l'utilisateur
      router.push("/dashboard/profile");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <SessionGuard>
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    </SessionGuard>
  );
}
