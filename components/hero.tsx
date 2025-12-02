import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AnimatedBackground } from "@/components/animated-background";

export function Hero() {
  return (
    <section className="relative flex min-h-[500px] sm:min-h-[600px] flex-col items-center justify-center overflow-hidden px-4 py-12 sm:py-20 text-center">
      <AnimatedBackground />
      <div className="relative z-10 max-w-4xl">
        <h1 className="mb-4 sm:mb-6 text-3xl sm:text-5xl font-bold tracking-tight text-white drop-shadow-lg md:text-6xl lg:text-7xl">
          Découvrez Madagascar
          <span className="block text-white">avec Cool Voyage</span>
        </h1>
        <p className="mb-6 sm:mb-8 text-base sm:text-xl text-white drop-shadow-md md:text-2xl px-4">
          Des voyages organisés à prix abordables vers les plus belles destinations de l'île rouge
        </p>
        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-center px-4">
          <Button asChild size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90">
            <Link href="#destinations">Découvrir nos destinations</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20">
            <Link href="#contact">Nous contacter</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

