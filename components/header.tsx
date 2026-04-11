"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { handleSmoothScrollClick } from "@/lib/smooth-scroll";
import { SearchBar } from "@/components/search-bar";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const mobileSheetId = "public-mobile-menu-sheet";

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isHomePage) {
      handleSmoothScrollClick(e, href, 80);
      setOpen(false);
    } else {
      setOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent sm:text-2xl">🌴 Cool Voyage</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
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

          <SearchBar />

          <Button asChild variant="outline" size="sm">
            <Link href="/login">Se connecter</Link>
          </Button>



        </nav>

        {/* Mobile Navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent id={mobileSheetId} side="right" className="w-[85vw] sm:w-[400px] p-0">
            <div className="flex flex-col h-full">
              {/* Header avec gradient */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-6 py-8 border-b">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    🌴 Cool Voyage
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Votre agence de voyage à Madagascar
                  </p>
                </SheetHeader>
              </div>
              
              {/* Navigation */}
              <nav className="flex-1 px-6 py-6 space-y-2">
                {/* Search Bar for Mobile */}
                <div className="px-4 pb-4">
                  <SearchBar />
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
              
              {/* Footer avec bouton */}
              <div className="border-t px-6 py-6 bg-muted/30">
                <p className="text-xs text-center text-muted-foreground mt-4">
                  📱 034 66 885 42
                </p>
                
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full mt-3 px-4 py-3 rounded-lg text-sm font-medium transition-all bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Se connecter</span>
                </Link>
                
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



