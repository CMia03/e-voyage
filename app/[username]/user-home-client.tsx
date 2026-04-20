"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { loadAuth } from "@/lib/auth";
import { resolvePostLoginPath } from "@/lib/auth-redirect";
import { GoogleUserWelcome } from "@/components/google-user-welcome";
import { UserInfoDisplay } from "@/components/user-info-display";

export function UserHomeClient({ username }: { username: string }) {
  const router = useRouter();
  const session = useMemo(() => loadAuth(), []);

  useEffect(() => {
    if (!session?.accessToken) {
      router.replace("/login");
      return;
    }

    const expectedPath = resolvePostLoginPath({
      role: session.role,
      login: session.login,
      userId: session.userId,
    });

    if (expectedPath === "/admin") {
      router.replace("/admin");
      return;
    }

    const expectedUsername = expectedPath.replace("/", "");
    if (expectedUsername && expectedUsername !== username) {
      router.replace(expectedPath);
    }
  }, [router, session, username]);

  return (
    <>
      <GoogleUserWelcome />
      <main className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col items-start justify-center gap-4 px-6 py-12">
        <div className="w-full space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Espace utilisateur</p>
              <h1 className="text-3xl font-semibold">Bonjour {username}</h1>
              <p className="text-muted-foreground">
                Votre URL personnalisée est active: <span className="font-medium">/{username}</span>
              </p>
            </div>
            <UserInfoDisplay variant="compact" />
          </div>
          
          <UserInfoDisplay variant="detailed" className="bg-card rounded-lg p-6 border" />
        </div>
        
        <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild>
              <Link href="/destinations">Voir les destinations</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/galerie">Voir la galerie</Link>
            </Button>
          </div>
      </main>
    </>
  );
}

