"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { clearAuth } from "@/lib/auth";
import { BrandLogo } from "@/components/brand-logo";

export function AdminHeader() {
  const { session } = useAuth();

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/admin" className="flex items-center">
          <BrandLogo className="h-16 w-44 sm:h-18 sm:w-52" priority />
        </Link>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {session?.login || 'Admin'}
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Déconnexion
          </Button>
        </div>
      </div>
    </header>
  );
}
