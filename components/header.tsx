"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Settings, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { SearchDropdown } from "@/components/search-dropdown";
import { DestinationDetails } from "@/lib/type/destination";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { handleSmoothScrollClick } from "@/lib/smooth-scroll";
import { useAuth } from "@/hooks/useAuth";
import { BrandLogo } from "@/components/brand-logo";

export function Header() {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  // Initialiser la recherche depuis l'URL au chargement du composant
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('search') || '';
    }
    return '';
  });
  const pathname = usePathname();
  const router = useRouter();
  const { session, isAuthenticated, logout } = useAuth();
  const isHomePage = pathname === "/";

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Si on est sur la page d'accueil, faire un smooth scroll
    if (isHomePage) {
      handleSmoothScrollClick(e, href, 80);
      setOpen(false);
    } else {
      // Sinon, laisser le lien normal fonctionner (redirection vers la page d'accueil)
      setOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Ouvrir le dropdown s'il y a du texte
    if (query.trim()) {
      setSearchDropdownOpen(true);
    } else {
      setSearchDropdownOpen(false);
    }
    
    // Mettre à jour l'URL avec le paramètre de recherche
    const url = new URL(window.location.href);
    if (query.trim()) {
      url.searchParams.set('search', query.trim());
    } else {
      url.searchParams.delete('search');
    }
    
    // Remplacer l'URL sans recharger la page
    window.history.replaceState({}, '', url.toString());
    
    // Émettre un événement pour notifier la page d'accueil du changement de recherche
    window.dispatchEvent(new CustomEvent('searchChange', { detail: { query: query.trim() } }));
  };

  const handleDestinationSelect = (destination: DestinationDetails) => {
    // Rediriger vers la page de destination
    router.push(`/destinations/${destination.id}`);
    setSearchDropdownOpen(false);
  };

  const getUserDisplayName = () => {
    if (!session) return "";
    return session.prenom && session.nom 
      ? `${session.prenom} ${session.nom}`
      : session.userId || session.login || "Utilisateur";
  };

  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center">
          <BrandLogo className="h-16 w-44 sm:h-18 sm:w-52" priority />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-6 md:flex">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher une destination..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery.trim() && setSearchDropdownOpen(true)}
              className="w-64 bg-background/50 pl-10 border-border/50 focus:border-primary/50 lg:w-80"
            />
            {searchDropdownOpen && (
              <SearchDropdown
                searchQuery={searchQuery}
                onSelect={handleDestinationSelect}
                onClose={() => setSearchDropdownOpen(false)}
              />
            )}
          </div>
          <Link 
            href="/#destinations" 
            onClick={(e) => handleClick(e, "#destinations")}
            className="text-sm font-medium transition-colors hover:text-primary cursor-pointer"
          >
            Destinations
          </Link>
          <Link 
            href="/#about" 
            onClick={(e) => handleClick(e, "#about")}
            className="text-sm font-medium transition-colors hover:text-primary cursor-pointer"
          >
            À propos
          </Link>
          <Link 
            href="/#qui-sommes-nous" 
            onClick={(e) => handleClick(e, "#qui-sommes-nous")}
            className="text-sm font-medium transition-colors hover:text-primary cursor-pointer"
          >
            Qui sommes nous
          </Link>
          <Link 
            href="/galerie"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Galerie
          </Link>
          <Link 
            href="/#contact" 
            onClick={(e) => handleClick(e, "#contact")}
            className="text-sm font-medium transition-colors hover:text-primary cursor-pointer"
          >
            Contact
          </Link>
        </nav>

        <div className="hidden shrink-0 md:block">
          {isAuthenticated ? (
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{getUserDisplayName()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/${session?.login || session?.userId || 'utilisateur'}`} className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Mon espace</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Se connecter</Link>
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] sm:w-[400px] p-0">
            <div className="flex flex-col h-full">
              {/* Header avec gradient */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-6 py-8 border-b">
                <SheetHeader>
                  <SheetTitle className="inline-flex items-center">
                    <BrandLogo className="h-16 w-44" priority />
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Votre agence de voyage à Madagascar
                  </p>
                </SheetHeader>
              </div>
              
              {/* Navigation */}
              <nav className="flex-1 px-6 py-6 space-y-2">
                {/* Zone de recherche mobile */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher une destination..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 w-full bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>
                
                <Link 
                  href="/#destinations" 
                  onClick={(e) => handleClick(e, "#destinations")}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all hover:bg-primary/10 hover:text-primary group cursor-pointer"
                >
                  <span className="text-xl">🗺️</span>
                  <span>Destinations</span>
                </Link>
                <Link 
                  href="/#about" 
                  onClick={(e) => handleClick(e, "#about")}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all hover:bg-primary/10 hover:text-primary group cursor-pointer"
                >
                  <span className="text-xl">ℹ️</span>
                  <span>À propos</span>
                </Link>
                <Link 
                  href="/#qui-sommes-nous" 
                  onClick={(e) => handleClick(e, "#qui-sommes-nous")}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all hover:bg-primary/10 hover:text-primary group cursor-pointer"
                >
                  <span className="text-xl">👥</span>
                  <span>Qui sommes nous</span>
                </Link>
                <Link 
                  href="/galerie"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all hover:bg-primary/10 hover:text-primary group"
                >
                  <span className="text-xl">📸</span>
                  <span>Galerie</span>
                </Link>
                <Link 
                  href="/#contact" 
                  onClick={(e) => handleClick(e, "#contact")}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all hover:bg-primary/10 hover:text-primary group cursor-pointer"
                >
                  <span className="text-xl">📞</span>
                  <span>Contact</span>
                </Link>
              </nav>
              

              {/* Footer avec informations */}
              <div className="border-t px-6 py-6 bg-muted/30">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Bienvenue sur Cool Voyage
                  </p>
                  <p className="text-xs text-muted-foreground">
                    📱 034 66 885 42
                  </p>
                </div>
                
                {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-800/50">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{getUserDisplayName()}</span>
                  </div>
                  <Link
                    href={`/${session?.login || session?.userId || 'utilisateur'}`}
                    className="cursor-pointer flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50"
                  >
                    <User className="h-4 w-4" />
                    <span>Mon espace</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-800/50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full mt-3 px-4 py-3 rounded-lg text-sm font-medium transition-all bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Se connecter</span>
                </Link>
              )}
                
                <p className="text-xs text-center text-muted-foreground mt-4">
                  Accédez à votre espace personnel pour gérer vos réservations
                </p>
                
              </div>

            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}



