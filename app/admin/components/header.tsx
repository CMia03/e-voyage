"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { loadAuth, clearAuth, AuthSession } from "@/lib/auth";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { getProfile } from "@/lib/api/auth";
import { useEffect, useState } from "react";
import Image from "next/image";

type UserProfile = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  adress: string;
  login: string;
  role: string;
  nationalite: string;
  estActif: boolean;
  dateCreation: string;
  derniereConnexion: string;
  photoProfilUrl: string | null;
};

export function AdminHeader() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const authData = loadAuth();
      if (!authData?.accessToken) {
        setIsLoading(false);
        return;
      }

      setAuth(authData);

      try {
        const result = await getProfile(authData.accessToken);
        if (result?.data) {
          setProfile(result.data as UserProfile);
        }
      } catch (error) {
        const message = getErrorMessage(error, "Erreur reseau.");
        const normalizedMessage = message
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const userNotFound =
          error instanceof ApiError &&
          (error.status === 404 || error.status === 400) &&
          normalizedMessage.toLowerCase().includes("utilisateur non trouve");

        if (!userNotFound) {
          console.error("Erreur lors du chargement du profil:", message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const getInitials = () => {
    if (profile?.prenom && profile?.nom) {
      return `${profile.prenom[0]}${profile.nom[0]}`.toUpperCase();
    }
    if (auth?.login) {
      return auth.login.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrateur";
      case "USER":
        return "Utilisateur";
      default:
        return role;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Ne pas afficher le menu si pas authentifié
  if (!auth && !isLoading) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent sm:text-2xl">
            🌴 Cool Voyage
          </span>
          {/* <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600">
            Admin
          </span> */}
        </Link>

        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/">Voir site</Link>
          </Button>

          {/* Menu profil utilisateur */}
          {auth && (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 p-0.5 pr-2 transition-all hover:shadow-lg hover:shadow-emerald-500/25 focus:outline-none"
              >
                {profile?.photoProfilUrl ? (
                  <div className="relative h-8 w-8 overflow-hidden rounded-full">
                    <Image
                      src={profile.photoProfilUrl}
                      alt={profile.prenom}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-emerald-700">
                    {getInitials()}
                  </div>
                )}
                <span className="hidden text-sm font-medium text-white sm:block">
                  {profile?.prenom || auth.login || "Utilisateur"}
                </span>
                <svg
                  className={`mr-1 h-4 w-4 text-white transition-transform duration-200 ${
                    isMenuOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown menu */}
              {isMenuOpen && (
                <>
                  {/* Overlay pour fermer le menu en cliquant à l'extérieur */}
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  
                  <div className="absolute right-0 mt-2 w-80 z-40 rounded-lg border border-border/50 bg-white shadow-xl dark:bg-gray-900">
                    {/* En-tête du profil */}
                    <div className="p-4 border-b border-border/50">
                      <div className="flex items-center gap-3">
                        {profile?.photoProfilUrl ? (
                          <div className="relative h-12 w-12 overflow-hidden rounded-full">
                            <Image
                              src={profile.photoProfilUrl}
                              alt={profile.prenom}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-lg font-semibold text-white">
                            {getInitials()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {profile ? `${profile.prenom} ${profile.nom}` : auth.login}
                          </p>
                          {profile?.email && (
                            <p className="text-xs text-muted-foreground truncate">
                              {profile.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Informations détaillées */}
                    {profile && (
                      <div className="p-3 border-b border-border/50 bg-muted/30 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Rôle</span>
                          <span className="font-medium capitalize bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                            {getRoleLabel(profile.role)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Téléphone</span>
                          <span className="font-medium text-foreground">
                            {profile.telephone}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Nationalité</span>
                          <span className="font-medium text-foreground">
                            {profile.nationalite}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Statut</span>
                          <span className={`font-medium px-2 py-0.5 rounded-full ${
                            profile.estActif 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {profile.estActif ? 'Actif' : 'Inactif'}
                          </span>
                        </div>

                      </div>
                    )}

                    <div className="p-2">
                      {/* <Link
                        href="/admin/profile"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <svg
                          className="h-4 w-4 text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Mon profil
                      </Link> */}

                      {/* <Link
                        href="/admin/settings"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <svg
                          className="h-4 w-4 text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Paramètres
                      </Link> */}

                      {profile?.role === "ADMIN" && (
                        <Link
                          href="/admin/users"
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg
                            className="h-4 w-4 text-emerald-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                          </svg>
                          Gestion des utilisateurs
                        </Link>
                      )}

                      <div className="my-2 border-t border-border/50" />

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
