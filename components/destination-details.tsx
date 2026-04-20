"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DestinationDetails } from "@/lib/type/destination";
import { Check, X, Phone, Calendar, MapPin, Clock } from "lucide-react";
import { ImageLightbox } from "@/components/image-lightbox";
import { DestinationSidebar } from "@/components/destination-sidebar";
import { useEffect, useState } from "react";
import { getEntrepriseInfoPublic } from "@/lib/api/entreprise-info";

interface DestinationDetailsProps {
  destination: DestinationDetails;
}

export function DestinationDetailsComponent({ destination }: DestinationDetailsProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const galleryAll = destination.galleryAll?.length ? destination.galleryAll : destination.gallery;
  const [reservationContacts, setReservationContacts] = useState({
    phone: destination.reservation?.phone ?? "",
    orangeMoney: destination.reservation?.orangeMoney ?? "",
    infoPhone: destination.reservation?.infoPhone ?? "",
  });

  useEffect(() => {
    let active = true;
    const loadEntrepriseContacts = async () => {
      try {
        const response = await getEntrepriseInfoPublic();
        if (!active || !response.data) return;

        setReservationContacts((current) => ({
          phone: response.data?.contactYas || current.phone,
          orangeMoney: response.data?.contactOrange || current.orangeMoney,
          infoPhone: response.data?.contactPlusInfos || current.infoPhone,
        }));
      } catch {
        // keep destination static contacts on failure
      }
    };

    void loadEntrepriseContacts();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Contenu principal */}
          <div className="flex-1">
        {/* Header avec image */}
        <div className="relative mb-6 sm:mb-8 h-64 sm:h-80 md:h-96 w-full overflow-hidden rounded-lg">
          <Image
            src={destination.image}
            alt={destination.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8">
            <h1 className="mb-2 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              {destination.title}
            </h1>
            <p className="text-sm sm:text-base md:text-xl text-white/90">{destination.description}</p>
          </div>
        </div>

        {/* Informations principales */}
        <div className="mb-6 sm:mb-8 grid gap-4 sm:gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Durée
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{destination.duration}</p>
              {destination.dates && (
                <p className="mt-2 text-sm text-muted-foreground">Dates : {destination.dates}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💰 Tarifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {destination.priceDetails ? (
                <div className="space-y-2">
                  {destination.priceDetails.shared4 && (
                    <p className="font-semibold">{destination.priceDetails.shared4}</p>
                  )}
                  {destination.priceDetails.shared2 && (
                    <p className="font-semibold">{destination.priceDetails.shared2}</p>
                  )}
                  {destination.priceDetails.children && (
                    <p className="font-semibold text-primary">{destination.priceDetails.children}</p>
                  )}
                </div>
              ) : (
                <p className="text-2xl font-bold text-primary">{destination.price}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Point de départ */}
        {destination.departure && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Point de départ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{destination.departure.time}</span>
              </div>
              <p className="mt-2">{destination.departure.location}</p>
            </CardContent>
          </Card>
        )}

          {/* Services inclus et non inclus */}
          <div className="mb-6 sm:mb-8 grid gap-4 sm:gap-6 sm:grid-cols-1 md:grid-cols-2">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Check className="h-5 w-5" />
                Inclus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {destination.included.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <X className="h-5 w-5" />
                Non inclus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {destination.notIncluded.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Réservation */}
        {destination.reservation && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>📱 Réservation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 font-semibold">Acompte : {destination.reservation.deposit}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="font-medium">Mvola :</span>
                  <a href={`tel:${reservationContacts.phone}`} className="text-primary hover:underline">
                    {reservationContacts.phone}
                  </a>
                </div>
                {reservationContacts.orangeMoney && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="font-medium">Orange Money :</span>
                    <a href={`tel:${reservationContacts.orangeMoney}`} className="text-primary hover:underline">
                      {reservationContacts.orangeMoney}
                    </a>
                  </div>
                )}
                {reservationContacts.infoPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="font-medium">Plus d infos :</span>
                    <a href={`tel:${reservationContacts.infoPhone}`} className="text-primary hover:underline">
                      {reservationContacts.infoPhone}
                    </a>
                  </div>
                )}
              </div>
              <Button className="w-full mt-4" size="lg">
                Réserver maintenant
              </Button>
            </CardContent>
          </Card>
        )}

          {/* Galerie d'images */}
          {galleryAll.length > 1 && (
            <div className="mb-6 sm:mb-8">
              <h2 className="mb-4 text-xl sm:text-2xl font-bold">Galerie</h2>
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3">
              {galleryAll.map((img, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedImageIndex(index);
                    setLightboxOpen(true);
                  }}
                  className="group relative h-48 w-full overflow-hidden rounded-lg cursor-pointer transition-transform hover:scale-105"
                >
                  <Image
                    src={img}
                    alt={`${destination.title} - Image ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={galleryAll}
        currentIndex={selectedImageIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={destination.title}
      />

          {/* Barre latérale droite */}
          <DestinationSidebar
            destinationId={destination.id}
            destinationName={destination.title}
            averageRating={destination.rating || 0}
          />
        </div>
      </div>
    </div>
  );
}

