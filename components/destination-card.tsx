"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { DestinationDetails } from "@/lib/type/destination";

interface DestinationCardProps {
  destination: DestinationDetails;
}

const FALLBACK_DESTINATION_IMAGE = "/images/Manbt1.jpg";

export function DestinationCard({ destination }: DestinationCardProps) {
  const { title, description, image, price, marketing, features, gallery = [], id } = destination;
  const displayPrice = price?.trim() || "Prix sur demande";
  const marketingItems = marketing?.length ? marketing : (features ?? []);
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
    <Card className="group flex h-full flex-col overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-2 border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="relative h-48 sm:h-56 md:h-64 w-full flex-shrink-0 overflow-hidden">
        {displayImages.map((img, index) => (
          <div
            key={img}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={img}
              alt={`${title} - Image ${index + 1}`}
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
        {/* Indicateurs de progression */}
        {displayImages.length > 1 && (
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
        )}
      </div>
      <CardHeader className="flex-shrink-0">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl sm:text-2xl">{title}</CardTitle>
            <CardDescription className="text-sm sm:text-base line-clamp-2">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-2">
          {marketingItems.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-muted-foreground">
              <span className="mr-2 text-primary">✓</span>
              <span className="line-clamp-1">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex-shrink-0">
        <Button variant="default" asChild size="sm" className="w-full">
            <Link href={`/destinations/${id}`}>
              En savoir plus
            </Link>
          </Button>
      </CardFooter>
    </Card>
  );
}

