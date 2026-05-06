"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DestinationDetails, PublicDestinationPlanification } from "@/lib/type/destination";
import { Check, X, Phone, Calendar, MapPin, Clock } from "lucide-react";
import { ImageLightbox } from "@/components/image-lightbox";
import { DestinationSidebar } from "@/components/destination-sidebar";
import { ModalMap } from "@/components/modal-map";
import { getEntrepriseInfoPublic } from "@/lib/api/entreprise-info";
import { listPublicDestinationPlanifications } from "@/lib/api/destinations";

interface DestinationDetailsProps {
  destination: DestinationDetails;
}

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start && !end) return "Date non renseignee";

  const formatter = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  const startLabel = startDate && !Number.isNaN(startDate.getTime()) ? formatter.format(startDate) : start;
  const endLabel = endDate && !Number.isNaN(endDate.getTime()) ? formatter.format(endDate) : end;

  if (startLabel && endLabel && startLabel !== endLabel) {
    return `${startLabel} - ${endLabel}`;
  }

  return startLabel || endLabel || "Date non renseignee";
}

function formatMoney(value?: number | null, devise = "Ar") {
  if (value === null || value === undefined) return "-";
  return `${Math.round(value).toLocaleString("fr-MG")} ${devise || "Ar"}`;
}

export function DestinationDetailsComponent({ destination }: DestinationDetailsProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [publicPlanifications, setPublicPlanifications] = useState<PublicDestinationPlanification[]>([]);
  const [selectedPlanificationId, setSelectedPlanificationId] = useState<string | null>(null);
  const [isLoadingPlanifications, setIsLoadingPlanifications] = useState(false);
  const [planificationError, setPlanificationError] = useState<string | null>(null);
  const galleryAll = destination.galleryAll?.length ? destination.galleryAll : destination.gallery;
  const selectedPlanification = useMemo(
    () =>
      publicPlanifications.find((planification) => planification.id === selectedPlanificationId) ??
      publicPlanifications[0] ??
      null,
    [publicPlanifications, selectedPlanificationId]
  );
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

  useEffect(() => {
    let active = true;
    const loadPlanifications = async () => {
      setIsLoadingPlanifications(true);
      setPlanificationError(null);

      try {
        const response = await listPublicDestinationPlanifications(destination.id);
        const items = response.data ?? [];
        if (!active) return;

        setPublicPlanifications(items);
        setSelectedPlanificationId((current) =>
          current && items.some((item) => item.id === current) ? current : items[0]?.id ?? null
        );
      } catch {
        if (!active) return;
        setPublicPlanifications([]);
        setSelectedPlanificationId(null);
        setPlanificationError("Impossible de charger les dates disponibles.");
      } finally {
        if (active) {
          setIsLoadingPlanifications(false);
        }
      }
    };

    void loadPlanifications();
    return () => {
      active = false;
    };
  }, [destination.id]);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Contenu principal */}
          <div className="flex-1">
        {/* Header avec image */}
        <div className="relative mb-6 sm:mb-8 h-64 sm:h-80 md:h-96 w-full overflow-hidden rounded-lg">
          {destination.image?.trim() ? (
            <Image
              src={destination.image}
              alt={destination.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(16,185,129,0.2),_rgba(15,23,42,0.18))]" />
          )}
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8">
            <h1 className="mb-2 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              {destination.title}
            </h1>
            <p className="text-sm sm:text-base md:text-xl text-white/90">{destination.description}</p>
          </div>
          
          {/* Bouton Voir carte */}
          <Button
            onClick={() => setMapModalOpen(true)}
            className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-primary hover:text-primary shadow-lg flex items-center gap-2"
            size="sm"
          >
            <MapPin className="h-4 w-4" />
            Voir carte
          </Button>
        </div>

        {/* Informations principales */}
        <div className="hidden">
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

        <div className="mb-6 sm:mb-8 grid gap-4 sm:gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Duree
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingPlanifications ? (
                <p className="text-sm text-muted-foreground">Chargement des dates disponibles...</p>
              ) : publicPlanifications.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {publicPlanifications.map((planification) => {
                      const isSelected = selectedPlanification?.id === planification.id;

                      return (
                        <button
                          key={planification.id}
                          type="button"
                          onClick={() => setSelectedPlanificationId(planification.id)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                            isSelected
                              ? "border-emerald-400 bg-emerald-50 shadow-sm"
                              : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
                          }`}
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            {planification.nomPlanification}
                          </p>
                          <p className="mt-1 text-sm text-emerald-700">
                            {formatDateRange(planification.dateHeureDebut, planification.dateHeureFin)}
                          </p>
                          {planification.dureeJours ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {planification.dureeJours} jour(s)
                            </p>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  {selectedPlanification ? (
                    <p className="text-xs text-muted-foreground">
                      Depart : {selectedPlanification.depart || "-"} - Arrivee : {selectedPlanification.arriver || "-"}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-primary">{destination.duration || "Non renseignee"}</p>
                  {destination.dates ? (
                    <p className="mt-2 text-sm text-muted-foreground">Dates : {destination.dates}</p>
                  ) : null}
                  {planificationError ? (
                    <p className="text-sm text-red-600">{planificationError}</p>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💰 Tarifs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPlanification ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selectedPlanification.nomPlanification}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateRange(selectedPlanification.dateHeureDebut, selectedPlanification.dateHeureFin)}
                    </p>
                  </div>

                  {selectedPlanification.budgets.length > 0 ? (
                    <div className="grid gap-2">
                      {selectedPlanification.budgets.map((budget) => {
                        const devise = selectedPlanification.deviseBudget || "Ar";
                        const price = budget.prixAvecReduction ?? budget.prixNormal;

                        return (
                          <div
                            key={budget.id}
                            className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {budget.nomCategorieClient || "Categorie client"}
                                </p>
                                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-emerald-700">
                                  {budget.gamme || "Gamme"} - {budget.nombrePersonnes || 1} personne(s)
                                </p>
                              </div>
                              <p className="text-base font-bold text-emerald-700">
                                {formatMoney(price, devise)}
                              </p>
                            </div>
                            {budget.reduction && budget.reduction > 0 ? (
                              <p className="mt-2 text-xs text-muted-foreground">
                                Prix normal : {formatMoney(budget.prixNormal, devise)} - Reduction : {budget.reduction}%
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Aucun tarif public n&apos;est encore configure pour cette date.
                    </p>
                  )}
                </div>
              ) : destination.priceDetails ? (
                <div className="space-y-2">
                  {destination.priceDetails.shared4 ? <p className="font-semibold">{destination.priceDetails.shared4}</p> : null}
                  {destination.priceDetails.shared2 ? <p className="font-semibold">{destination.priceDetails.shared2}</p> : null}
                  {destination.priceDetails.children ? (
                    <p className="font-semibold text-primary">{destination.priceDetails.children}</p>
                  ) : null}
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
              {galleryAll.filter((img) => !!img?.trim()).map((img, index) => (
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
      
      {/* Modal carte */}
      <ModalMap
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        destinationName={destination.title}
        location={destination.departure?.location}
        // You can add coordinates if available in destination object
        // coordinates={{
        //   lat: destination.latitude,
        //   lng: destination.longitude
        // }}
      />
    </div>
  );
}

