"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Compass, CreditCard, Sparkles, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listDestinations } from "@/lib/api/destinations";
import { destinationsData as fallbackDestinations } from "@/lib/destinations";
import type { DestinationDetails } from "@/lib/type/destination";

export default function UserHomePage() {
  const params = useParams<{ username: string }>();
  const username = typeof params?.username === "string" ? params.username : "client";
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

    void loadDestinations();
  }, []);

  const featuredDestinations = useMemo(() => destinations.slice(0, 3), [destinations]);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-[linear-gradient(135deg,rgba(236,253,245,0.88),rgba(255,255,255,1))] shadow-sm">
        <div className="grid gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1.1fr)_360px] lg:px-8 lg:py-10">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              <Sparkles className="size-4" />
              Bienvenue
            </span>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Preparez votre prochain voyage selon votre envie et votre budget.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600">
                Explorez les destinations, comparez les forfaits disponibles et choisissez entre une reservation
                directe ou une simulation personnalisee.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href={`/${username}/destinations`}>
                  <Compass className="mr-2 size-4" />
                  Explorer les destinations
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                <Link href={`/${username}/simulation`}>
                  <TrendingUp className="mr-2 size-4" />
                  Lancer une simulation
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="rounded-full px-6 text-slate-700">
                <Link href={`/${username}/reservations`}>
                  <CreditCard className="mr-2 size-4" />
                  Voir mes reservations
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Parcours direct</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Choisissez une destination puis reservez directement a partir du prix normal.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Parcours simulation</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Ajustez les profils voyageurs, les blocs du planning et le budget avant de confirmer.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Suivi simple</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Retrouvez ensuite toutes vos reservations et leurs details dans un seul espace.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Destinations a decouvrir</h2>
            <p className="text-sm text-slate-600">
              Commencez par une destination, puis choisissez le parcours qui vous convient.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/${username}/destinations`}>Voir toutes les destinations</Link>
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {featuredDestinations.map((destination) => (
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
              </div>
              <div className="space-y-4 p-5">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-slate-900">{destination.title}</h3>
                  <p className="line-clamp-3 text-sm leading-6 text-slate-600">{destination.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" className="rounded-full">
                    <Link href={`/${username}/simulation?destinationId=${encodeURIComponent(destination.id)}`}>
                      Simuler ce voyage
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="rounded-full">
                    <Link href={`/${username}/planifications?destinationId=${encodeURIComponent(destination.id)}`}>
                      Voir les forfaits
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
