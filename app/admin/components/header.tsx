"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { loadAuth, clearAuth, AuthSession } from "@/lib/auth";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { getProfile } from "@/lib/api/auth";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Menu, Home, MapPin, Building, Play, ChevronDown, Calendar } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AdminSearchBar } from "@/components/admin-search-bar";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

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
          // Erreur silencieuse pour les erreurs de profil
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

  // Ne pas afficher le menu si pas authentifié
  if (!auth && !isLoading) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          {/* Menu Hamburger Mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu mobile</span>
          </Button>
          
          <Link href="/" className="flex cursor-pointer items-center gap-3">
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent sm:text-2xl">
              Cool Voyage
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <AdminSearchBar />
          
          <Button asChild variant="outline" size="sm">
            <Link href="/">Voir site</Link>
          </Button>

          {/* Menu profil utilisateur */}
          {auth && (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex cursor-pointer items-center gap-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 p-0.5 pr-2 transition-all hover:shadow-lg hover:shadow-emerald-500/25 focus:outline-none"
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

                      {profile?.role === "ADMIN" && (
                        <Link
                          href="/admin/users"
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
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
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
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
      
      {/* Mobile Menu Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[85vw] sm:w-[400px] p-0">
          <div className="flex flex-col h-full">
            {/* Header avec gradient */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-6 py-8 border-b">
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Admin Cool Voyage
                </SheetTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Menu administration
                </p>
              </SheetHeader>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1">
              {/* Search Bar for Mobile */}
              <div className="px-3 pb-4">
                <AdminSearchBar />
              </div>
              
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
                  window.location.search.includes('section=dashboard')
                    ? "bg-emerald-500/10 font-medium text-emerald-600"
                    : "text-muted-foreground hover:bg-primary/10"
                }`}
              >
                <Home className="mr-3 h-4 w-4" />
                Dashboard
              </button>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSection("destinations")}
                  className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
                >
                  <div className="flex items-center">
                    <MapPin className="mr-3 h-4 w-4" />
                    Destinations
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-all duration-300 ease-in-out transform ${
                      expandedSections.includes("destinations") ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>

                {expandedSections.includes("destinations") && (
                  <div className="ml-4 space-y-1 pl-4 border-l-2 border-emerald-200 dark:border-emerald-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        window.location.href = '/admin?section=destinations';
                      }}
                      className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
                        window.location.search.includes('section=destinations')
                          ? "bg-emerald-500/10 font-medium text-emerald-600"
                          : "text-muted-foreground hover:bg-primary/10"
                      }`}
                    >
                      <span className="mr-2"></span>
                      Liste des destinations
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        window.location.href = '/admin?section=destinations-create';
                      }}
                      className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
                        window.location.search.includes('section=destinations-create')
                          ? "bg-emerald-500/10 font-medium text-emerald-600"
                          : "text-muted-foreground hover:bg-primary/10"
                      }`}
                    >
                      <span className="mr-2"></span>
                      Ajouter destination
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSection("hebergements")}
                  className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
                >
                  <div className="flex items-center">
                    <Building className="mr-3 h-4 w-4" />
                    Hébergements
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-all duration-300 ease-in-out transform ${
                      expandedSections.includes("hebergements") ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>

                {expandedSections.includes("hebergements") && (
                  <div className="ml-4 space-y-1 pl-4 border-l-2 border-emerald-200 dark:border-emerald-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        window.location.href = '/admin?section=hebergements';
                      }}
                      className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
                        window.location.search.includes('section=hebergements')
                          ? "bg-emerald-500/10 font-medium text-emerald-600"
                          : "text-muted-foreground hover:bg-primary/10"
                      }`}
                    >
                      <span className="mr-2"></span>
                      Liste des hébergements
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        window.location.href = '/admin?section=hebergements-create';
                      }}
                      className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
                        window.location.search.includes('section=hebergements-create')
                          ? "bg-emerald-500/10 font-medium text-emerald-600"
                          : "text-muted-foreground hover:bg-primary/10"
                      }`}
                    >
                      <span className="mr-2"></span>
                      Ajouter hébergement
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSection("activites")}
                  className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-primary/10"
                >
                  <div className="flex items-center">
                    <Play className="mr-3 h-4 w-4" />
                    Activités
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-all duration-300 ease-in-out transform ${
                      expandedSections.includes("activites") ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>

                {expandedSections.includes("activites") && (
                  <div className="ml-4 space-y-1 pl-4 border-l-2 border-emerald-200 dark:border-emerald-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        window.location.href = '/admin?section=activites';
                      }}
                      className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
                        window.location.search.includes('section=activites')
                          ? "bg-emerald-500/10 font-medium text-emerald-600"
                          : "text-muted-foreground hover:bg-primary/10"
                      }`}
                    >
                      <span className="mr-2"></span>
                      Liste des activités
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        window.location.href = '/admin?section=activites-create';
                      }}
                      className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
                        window.location.search.includes('section=activites-create')
                          ? "bg-emerald-500/10 font-medium text-emerald-600"
                          : "text-muted-foreground hover:bg-primary/10"
                      }`}
                    >
                      <span className="mr-2"></span>
                      Ajouter activité
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  window.location.href = '/admin?section=planification';
                }}
                className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm ${
                  window.location.search.includes('section=planification')
                    ? "bg-emerald-500/10 font-medium text-emerald-600"
                    : "text-muted-foreground hover:bg-primary/10"
                }`}
              >
                <Calendar className="mr-3 h-4 w-4" />
                Planification
              </button>
            </nav>
            
            {/* Footer avec lien vers site */}
            <div className="border-t px-6 py-6 bg-muted/30">
              <Button asChild variant="outline" className="w-full">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                  Voir le site
                </Link>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}