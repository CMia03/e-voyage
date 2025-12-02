"use client";

import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/animated-background";
import { handleSmoothScrollClick } from "@/lib/smooth-scroll";

export function Hero() {
  return (
    <section className="relative flex min-h-[550px] sm:min-h-[650px] md:min-h-[700px] flex-col items-center justify-center overflow-hidden px-4 py-16 sm:py-24 text-center">
      <AnimatedBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
      <div className="relative z-10 max-w-5xl">
        <h1 className="mb-6 sm:mb-8 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-white drop-shadow-2xl">
          <span className="block bg-gradient-to-r from-white via-emerald-50 to-teal-50 bg-clip-text text-transparent">
            Découvrez Madagascar
          </span>
          <span className="block mt-2 text-white">avec Cool Voyage</span>
        </h1>
        <p className="mb-8 sm:mb-10 text-lg sm:text-xl md:text-2xl text-white/95 drop-shadow-lg px-4 leading-relaxed max-w-3xl mx-auto">
          Des voyages organisés à prix abordables vers les plus belles destinations de l'île rouge
        </p>
        <div className="flex flex-col gap-4 sm:gap-5 sm:flex-row sm:justify-center px-4">
          <Button asChild size="lg" className="text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xl shadow-emerald-500/30 hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 hover:scale-105">
            <a href="#destinations" onClick={(e) => handleSmoothScrollClick(e, "#destinations", 80)}>
              Découvrir nos destinations
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 bg-white/10 backdrop-blur-md border-white/40 text-white hover:bg-white/20 hover:border-white/60 transition-all duration-300 hover:scale-105">
            <a href="#contact" onClick={(e) => handleSmoothScrollClick(e, "#contact", 80)}>
              Nous contacter
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

