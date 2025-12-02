"use client";

import { Button } from "@/components/ui/button";
import { handleSmoothScrollClick } from "@/lib/smooth-scroll";

export function SmoothScrollButtons() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-center">
      <Button asChild size="lg" className="text-base sm:text-lg px-6 sm:px-8">
        <a href="#contact" onClick={(e) => handleSmoothScrollClick(e, "#contact", 80)}>
          Nous contacter
        </a>
      </Button>
      <Button asChild size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8">
        <a href="#destinations" onClick={(e) => handleSmoothScrollClick(e, "#destinations", 80)}>
          Voir les destinations
        </a>
      </Button>
    </div>
  );
}

