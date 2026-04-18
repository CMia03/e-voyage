"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { listDestinations } from "@/lib/api/destinations";
import { destinationsData as fallbackDestinations } from "@/lib/destinations";
import type { DestinationDetails } from "@/lib/type/destination";

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<DestinationDetails[]>(fallbackDestinations);

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        const data = await listDestinations();
        if (data.length > 0) {
          setDestinations(data);
        }
      } catch (error) {
        console.error("Erreur chargement destinations:", error);
      }
    };
    loadDestinations();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Liste des destinations</h1>
      <p className="text-sm text-muted-foreground">
        Explore les destinations disponibles et prépare ton futur voyage.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {destinations.map((destination) => (
          <article key={destination.id} className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="relative h-40 w-full">
              <Image src={destination.image} alt={destination.title} fill className="object-cover" />
            </div>
            <div className="space-y-2 p-4">
              <h3 className="text-base font-semibold">{destination.title}</h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">{destination.description}</p>
              <p className="text-sm font-medium text-emerald-700">{destination.price}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}