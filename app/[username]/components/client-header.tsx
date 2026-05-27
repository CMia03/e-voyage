"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { SearchBar } from "@/components/search-bar";
import type { DestinationDetails } from "@/lib/type/destination";
import { getProfile } from "@/lib/api/auth";
import { loadAuth } from "@/lib/auth";

type ClientHeaderProfile = {
  nom?: string | null;
  prenom?: string | null;
  email?: string | null;
  telephone?: string | null;
  nationalite?: string | null;
  role?: string | null;
  estActif?: boolean | null;
};

export function ClientHeader({
  username,
  profilePath,
  onLogout,
  destinations,
}: {
  username: string;
  profilePath: string;
  onLogout: () => void;
  destinations?: DestinationDetails[];
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState<ClientHeaderProfile | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = [profile?.prenom, profile?.nom].filter(Boolean).join(" ").trim() || username;
  const email = profile?.email || loadAuth()?.login || "";
  const initial = displayName.trim().charAt(0).toUpperCase() || "C";
  const roleLabel = profile?.role === "ADMIN" ? "Administrateur" : "Utilisateur";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const session = loadAuth();
      if (!session?.accessToken) return;

      try {
        const response = await getProfile(session.accessToken);
        if (mounted && response.data) {
          setProfile(response.data as ClientHeaderProfile);
        }
      } catch (error) {
        console.error("Erreur chargement profil client:", error);
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center">
          <BrandLogo className="h-16 w-44 sm:h-18 sm:w-52" priority />
        </Link>
        <div className="hidden w-full max-w-xl lg:mx-6 sm:block">
          <SearchBar destinations={destinations} compact />
        </div>
        <div className="flex shrink-0 items-center gap-4">
          
          {/* <p className="hidden text-sm text-muted-foreground xl:block">Bonjour {username}</p> */}

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((current) => !current)}
              className="flex items-center gap-3 rounded-full px-2 py-1.5 text-left transition hover:bg-emerald-50"
              aria-expanded={isProfileOpen}
              aria-label="Menu profil"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-emerald-50 text-lg font-semibold text-emerald-700 ring-1 ring-emerald-100">
                {initial}
              </span>
              <span className="hidden max-w-[220px] truncate text-sm font-semibold text-slate-900 sm:block">
                {displayName}
              </span>
              <ChevronDown
                className={`size-5 text-slate-700 transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isProfileOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <span className="absolute -top-2 right-12 size-4 rotate-45 border-l border-t border-slate-200 bg-white" />
                <div className="flex items-center gap-4 px-5 py-5">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xl font-semibold text-white">
                    {initial}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-950">{displayName}</p>
                    {email ? (
                      <p className="truncate text-sm text-slate-500">{email}</p>
                    ) : null}
                  </div>
                </div>

                {/* <div className="border-y border-slate-100 px-5 py-4">
                  <ProfileMenuRow label="Role" value={roleLabel} badge />
                  <ProfileMenuRow label="Telephone" value={profile?.telephone || "-"} />
                  <ProfileMenuRow label="Nationalite" value={profile?.nationalite || "-"} />
                  <ProfileMenuRow
                    label="Statut"
                    value={profile?.estActif === false ? "Inactif" : "Actif"}
                    badge
                  />
                </div> */}

                <Link
                  href={profilePath}
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-4 px-5 py-4 text-slate-900 transition hover:bg-emerald-50"
                >
                  <User className="size-5 text-emerald-700" />
                  <span className="text-base font-medium">Mon profil</span>
                </Link>
                <div className="border-t border-slate-100" />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onLogout}
                  className="flex h-auto w-full justify-start gap-4 rounded-none px-5 py-4 text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="size-5" />
                  Se deconnecter
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function ProfileMenuRow({
  label,
  value,
  badge = false,
}: {
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      {badge ? (
        <span className="rounded-full bg-emerald-100 px-3 py-0.5 font-semibold text-emerald-700">
          {value}
        </span>
      ) : (
        <span className="max-w-[160px] truncate text-right font-semibold text-slate-900" title={value}>
          {value}
        </span>
      )}
    </div>
  );
}
