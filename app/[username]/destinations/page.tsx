"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Compass, MapPinned, Sparkles, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listDestinations } from "@/lib/api/destinations";
import { destinationsData as fallbackDestinations } from "@/lib/destinations";
import type { DestinationDetails } from "@/lib/type/destination";

export default function DestinationsPage() {
  const params = useParams<{ username: string }>();
  const username = typeof params?.username === "string" ? params.username : "client";
  const [destinations, setDestinations] = useState<DestinationDetails[]>(fallbackDestinations);
  const [search, setSearch] = useState("");

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

    void loadDestinations();
  }, []);

  const filteredDestinations = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return destinations;

    return destinations.filter((destination) => {
      const haystack = `${destination.title} ${destination.description}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [destinations, search]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,1),rgba(236,253,245,0.75))] p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              <Compass className="size-4" />
              Destinations
            </span>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Choisissez votre prochain voyage</h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-600">
                Explorez les destinations disponibles, consultez les forfaits proposes et choisissez entre une
                reservation directe au prix normal ou une simulation personnalisee.
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Recherche rapide</p>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une destination"
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredDestinations.map((destination) => (
          <article
            key={destination.id}
            className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative h-52 w-full">
              {destination.image?.trim() ? (
                <Image src={destination.image} alt={destination.title} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(16,185,129,0.22),_rgba(15,23,42,0.08))]" />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.64))] p-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800">
                  <MapPinned className="size-3.5 text-emerald-600" />
                  Destination
                </span>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-900">{destination.title}</h2>
                <p className="line-clamp-3 text-sm leading-6 text-slate-600">{destination.description}</p>
              </div>

              <div className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Deux parcours</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 size-4 text-emerald-600" />
                    Reserver directement en consultant les forfaits et leurs prix normaux.
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="mt-0.5 size-4 text-amber-500" />
                    Passer par la simulation pour ajuster les profils et les options.
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="rounded-full">
                  <Link href={`/${username}/planifications?destinationId=${encodeURIComponent(destination.id)}`}>
                    Voir les forfaits
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link href={`/${username}/simulation?destinationId=${encodeURIComponent(destination.id)}`}>
                    Simuler ce voyage
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filteredDestinations.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
          Aucune destination ne correspond a votre recherche.
        </div>
      ) : null}
    </div>
  );
}
