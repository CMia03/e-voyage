"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DestinationDetails } from "@/lib/type/destination";

interface DestinationCardProps {
  destination: DestinationDetails;
}

const FALLBACK_DESTINATION_IMAGE = "/images/Manbt1.jpg";

const legacyEncodingMap: Record<string, string> = {
  "‚": "é",
  "ƒ": "â",
  "…": "à",
  "‡": "ç",
  "ˆ": "ê",
  "‰": "ë",
  "Š": "è",
  "‹": "ï",
  "Œ": "î",
  "“": "ô",
  "”": "ö",
  "–": "û",
  "—": "ù",
  "×": "Î",
};

function displayText(value?: string | null, fallback = "-") {
  if (!value) return fallback;
  return value.replace(/[‚ƒ…‡ˆ‰Š‹Œ“”–—×]/g, (char) => legacyEncodingMap[char] ?? char);
}

export function DestinationCard({ destination }: DestinationCardProps) {
  const { title, description, image, price, marketing, marketingDetails, features, gallery = [], id } = destination;
  const displayPrice = price?.trim() || "Prix sur demande";
  const marketingItems = marketingDetails?.length
    ? marketingDetails
        .filter((item) => item.estActif !== false)
        .map((item) => ({
          label: item.libelle,
          description: item.description?.trim() || null,
        }))
    : (marketing?.length ? marketing : (features ?? [])).map((item) => ({
        label: item,
        description: null,
      }));
  const images = [...gallery, image]
    .filter((src): src is string => typeof src === "string" && src.trim().length > 0)
    .filter((src, index, all) => all.indexOf(src) === index);
  const displayImages = images.length > 0 ? images : [FALLBACK_DESTINATION_IMAGE];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (displayImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [displayImages.length]);

  return (
    <Card className="group relative flex h-full flex-col overflow-visible rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:z-30 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/20">
      <div className="relative h-48 w-full flex-shrink-0 overflow-hidden rounded-t-2xl sm:h-56 md:h-64">
        {displayImages.map((img, index) => (
          <div
            key={img}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? "z-10 opacity-100" : "z-0 opacity-0"
            }`}
          >
            <Image
              src={img}
              alt={`${displayText(title)} - Image ${index + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              priority={index === 0}
            />
          </div>
        ))}
        <Badge className="absolute right-4 top-4 z-20 max-w-[calc(100%-2rem)] bg-primary/90 text-white shadow-lg">
          {displayPrice}
        </Badge>
        {displayImages.length > 1 ? (
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {displayImages.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
      <CardHeader className="flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl sm:text-2xl">{displayText(title)}</CardTitle>
            <CardDescription className="text-sm leading-6 sm:text-base">
              <span className="line-clamp-2">{displayText(description)}</span>
              {description && description.length > 90 ? (
                <Link
                  href={`/destinations/${id}`}
                  className="mt-1 inline-flex text-xs font-medium text-muted-foreground underline-offset-4 transition hover:text-emerald-700 hover:underline"
                >
                  Lire la suite
                </Link>
              ) : null}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-2.5">
          {marketingItems.map((feature, index) => (
            <li
              key={`${feature.label}-${index}`}
              className="group/marketing relative flex w-fit max-w-full items-start gap-2 text-sm text-muted-foreground"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span
                tabIndex={feature.description ? 0 : -1}
                className={`line-clamp-1 outline-none ${
                  feature.description
                    ? "cursor-help rounded-sm focus-visible:ring-2 focus-visible:ring-emerald-200"
                    : ""
                }`}
              >
                {displayText(feature.label)}
              </span>
              {feature.description ? (
                <span className="invisible pointer-events-none absolute left-0 top-full z-50 mt-2 w-72 max-w-[72vw] translate-y-1 scale-95 rounded-2xl border border-emerald-100 bg-white p-3.5 text-left text-xs leading-5 text-slate-600 opacity-0 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-900/5 transition-all delay-300 duration-200 group-hover/marketing:visible group-hover/marketing:translate-y-0 group-hover/marketing:scale-100 group-hover/marketing:opacity-100 group-focus-within/marketing:visible group-focus-within/marketing:translate-y-0 group-focus-within/marketing:scale-100 group-focus-within/marketing:opacity-100 sm:left-full sm:top-1/2 sm:ml-3 sm:mt-0 sm:-translate-y-1/2 sm:group-hover/marketing:-translate-y-1/2 sm:group-focus-within/marketing:-translate-y-1/2">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-950">
                    <span className="line-clamp-2">{feature.label}</span>
                  </span>
                  <span className="block">{displayText(feature.description)}</span>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex-shrink-0">
        <Button variant="default" asChild size="sm" className="w-full">
          <Link href={`/destinations/${id}`}>En savoir plus</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
