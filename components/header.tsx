"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { handleSmoothScrollClick } from "@/lib/smooth-scroll";

export function Header() {
  const [open, setOpen] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    handleSmoothScrollClick(e, href, 80);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent sm:text-2xl">🌴 Cool Voyage</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <a 
            href="#destinations" 
            onClick={(e) => handleClick(e, "#destinations")}
            className="text-sm font-medium transition-colors hover:text-primary cursor-pointer"
          >
            Destinations
          </a>
          <a 
            href="#about" 
            onClick={(e) => handleClick(e, "#about")}
            className="text-sm font-medium transition-colors hover:text-primary cursor-pointer"
          >
            À propos
          </a>
          <a 
            href="#qui-sommes-nous" 
            onClick={(e) => handleClick(e, "#qui-sommes-nous")}
            className="text-sm font-medium transition-colors hover:text-primary cursor-pointer"
          >
            Qui sommes nous
          </a>
          <Link 
            href="/galerie"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Galerie
          </Link>
          <a 
            href="#contact" 
            onClick={(e) => handleClick(e, "#contact")}
            className="text-sm font-medium transition-colors hover:text-primary cursor-pointer"
          >
            Contact
          </a>
          <Button asChild size="sm">
            <a href="#contact" onClick={(e) => handleClick(e, "#contact")}>Réserver</a>
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
          <SheetContent side="right" className="w-[85vw] sm:w-[400px] p-0">
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
                <a 
                  href="#destinations" 
                  onClick={(e) => handleClick(e, "#destinations")}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all hover:bg-primary/10 hover:text-primary group cursor-pointer"
                >
                  <span className="text-xl">🗺️</span>
                  <span>Destinations</span>
                </a>
                <a 
                  href="#about" 
                  onClick={(e) => handleClick(e, "#about")}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all hover:bg-primary/10 hover:text-primary group cursor-pointer"
                >
                  <span className="text-xl">ℹ️</span>
                  <span>À propos</span>
                </a>
                <a 
                  href="#qui-sommes-nous" 
                  onClick={(e) => handleClick(e, "#qui-sommes-nous")}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all hover:bg-primary/10 hover:text-primary group cursor-pointer"
                >
                  <span className="text-xl">👥</span>
                  <span>Qui sommes nous</span>
                </a>
                <Link 
                  href="/galerie"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all hover:bg-primary/10 hover:text-primary group"
                >
                  <span className="text-xl">📸</span>
                  <span>Galerie</span>
                </Link>
                <a 
                  href="#contact" 
                  onClick={(e) => handleClick(e, "#contact")}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all hover:bg-primary/10 hover:text-primary group cursor-pointer"
                >
                  <span className="text-xl">📞</span>
                  <span>Contact</span>
                </a>
              </nav>
              
              {/* Footer avec bouton */}
              <div className="border-t px-6 py-6 bg-muted/30">
                <Button asChild className="w-full" size="lg">
                  <a href="#contact" onClick={(e) => handleClick(e, "#contact")}>
                    Réserver maintenant
                  </a>
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  📱 034 66 885 42
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
