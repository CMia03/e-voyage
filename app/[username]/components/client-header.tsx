"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export function ClientHeader({ username, onLogout }: { username: string; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent sm:text-2xl">
          Cool Voyage
        </Link>
        <div className="flex items-center gap-3">
          <p className="hidden text-sm text-muted-foreground sm:block">Bonjour {username}</p>

          {/* <Button asChild variant="outline" size="sm">
            <Link href="/destinations">Destinations</Link>
          </Button> */}

          <Button type="button" variant="destructive" size="sm" onClick={onLogout}>
            Se deconnecter
          </Button>
        </div>
      </div>
    </header>
  );
}
