"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DestinationDetails, PublicDestinationPlanification } from "@/lib/type/destination";
import {
  Calculator,
  Calendar,
  Check,
  Clock,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import { ImageLightbox } from "@/components/image-lightbox";
import { DestinationSidebar } from "@/components/destination-sidebar";
import { ModalMap } from "@/components/modal-map";
import { getEntrepriseInfoPublic } from "@/lib/api/entreprise-info";
import { listPublicDestinationPlanifications } from "@/lib/api/destinations";
import { loadAuth } from "@/lib/auth";
import { resolvePostLoginPath } from "@/lib/auth-redirect";

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

function toCoordinate(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return null;
  const coordinate = typeof value === "number" ? value : Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

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

function isTodayOrFuture(dateValue?: string | null) {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date.getTime() >= today.getTime();
}

export function DestinationDetailsComponent({ destination }: DestinationDetailsProps) {
  const router = useRouter();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [publicPlanifications, setPublicPlanifications] = useState<PublicDestinationPlanification[]>([]);
  const [selectedPlanificationId, setSelectedPlanificationId] = useState<string | null>(null);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [isLoadingPlanifications, setIsLoadingPlanifications] = useState(false);
  const [planificationError, setPlanificationError] = useState<string | null>(null);
  const galleryAll = destination.galleryAll?.length ? destination.galleryAll : destination.gallery;
  const destinationCoordinates = useMemo(() => {
    const lat = toCoordinate(destination.latitude);
    const lng = toCoordinate(destination.longitude);

    if (lat === null || lng === null) {
      return undefined;
    }

    return { lat, lng };
  }, [destination.latitude, destination.longitude]);
  const selectedPlanification = useMemo(
    () =>
      publicPlanifications.find((planification) => planification.id === selectedPlanificationId) ??
      publicPlanifications[0] ??
      null,
    [publicPlanifications, selectedPlanificationId]
  );
  const selectedBudget = useMemo(() => {
    if (!selectedPlanification?.budgets.length) return null;
    return (
      selectedPlanification.budgets.find((budget) => budget.id === selectedBudgetId) ??
      selectedPlanification.budgets[0]
    );
  }, [selectedBudgetId, selectedPlanification]);
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
        const items = (response.data ?? [])
          .filter((item) => isTodayOrFuture(item.dateHeureDebut))
          .sort(
            (a, b) =>
              new Date(a.dateHeureDebut ?? 0).getTime() -
              new Date(b.dateHeureDebut ?? 0).getTime()
          );
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

  useEffect(() => {
    setSelectedBudgetId(selectedPlanification?.budgets[0]?.id ?? null);
  }, [selectedPlanification?.budgets, selectedPlanification?.id]);

  const buildClientPath = (pathname: "simulation" | "reservations") => {
    const session = loadAuth();
    if (!session) {
      return "/login";
    }

    const basePath = resolvePostLoginPath(session);
    if (basePath === "/admin") {
      return "/login";
    }

    return `${basePath}/${pathname}`;
  };

  const handleClientAction = (mode: "simulation" | "reservation") => {
    if (!selectedPlanification) return;

    const params = new URLSearchParams();
    params.set("destinationId", destination.id);
    params.set("destinationTitle", displayText(destination.title));
    params.set("planificationId", selectedPlanification.id);
    params.set("planificationTitle", displayText(selectedPlanification.nomPlanification));

    if (selectedBudget?.idCategorieClient) {
      params.set("categorieId", selectedBudget.idCategorieClient);
    }
    if (selectedBudget?.nomCategorieClient) {
      params.set("categorieTitle", selectedBudget.nomCategorieClient);
    }
    if (selectedBudget?.gamme) {
      params.set("gamme", selectedBudget.gamme);
    }
    if (selectedBudget?.nombrePersonnes) {
      params.set("nombrePersonnes", String(selectedBudget.nombrePersonnes));
    }

    if (mode === "reservation") {
      params.set("source", "PRIX_DIRECT");
      router.push(`${buildClientPath("reservations")}?${params.toString()}`);
      return;
    }

    router.push(`${buildClientPath("simulation")}?${params.toString()}`);
  };

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
              alt={displayText(destination.title)}
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
              {displayText(destination.title)}
            </h1>
            <p className="text-sm sm:text-base md:text-xl text-white/90">{displayText(destination.description)}</p>
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
                Tarifs
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

        <div className="mb-6 grid gap-5 sm:mb-8 xl:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Voyage</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">Période du voyage</h2>
              </div>
              <Calendar className="mt-1 h-5 w-5 text-slate-400" />
            </div>

            {isLoadingPlanifications ? (
              <div className="rounded-2xl border border-slate-200 px-5 py-8 text-sm text-muted-foreground">
                Chargement des dates disponibles...
              </div>
            ) : publicPlanifications.length > 0 ? (
              <div className="space-y-3">
                {publicPlanifications.map((planification) => {
                  const isSelected = selectedPlanification?.id === planification.id;

                  return (
                    <button
                      key={planification.id}
                      type="button"
                      onClick={() => setSelectedPlanificationId(planification.id)}
                      className={`relative w-full rounded-xl border px-4 py-4 text-left transition sm:px-5 ${
                        isSelected
                          ? "border-emerald-600 bg-white shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {isSelected ? <span className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-emerald-600" /> : null}
                      <span className="flex items-start justify-between gap-4">
                        <span className="min-w-0">
                          <span className="block text-base font-semibold text-slate-950">{displayText(planification.nomPlanification)}</span>
                          <span className="mt-2 block text-sm font-medium text-emerald-700">
                            {formatDateRange(planification.dateHeureDebut, planification.dateHeureFin)}
                          </span>
                        </span>
                        {isSelected ? (
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                            <Check className="h-4 w-4" />
                          </span>
                        ) : null}
                      </span>
                      {planification.dureeJours ? (
                        <span className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="h-4 w-4" />
                          <span>{planification.dureeJours} jour(s)</span>
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 px-5 py-6">
                <p className="text-2xl font-bold text-primary">{destination.duration || "Non renseignée"}</p>
                {destination.dates ? (
                  <p className="mt-2 text-sm text-muted-foreground">Dates : {destination.dates}</p>
                ) : null}
                {planificationError ? (
                  <p className="mt-3 text-sm text-red-600">{planificationError}</p>
                ) : null}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Tarification</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">Tarifs du forfait</h2>
                <p className="mt-1 text-sm text-slate-500">Détail par catégorie de voyageur</p>
              </div>
              <Calculator className="mt-1 h-5 w-5 text-slate-400" />
            </div>

            {selectedPlanification ? (
              <div className="space-y-5">
                <div>
                  {/* <h3 className="text-lg font-semibold text-slate-950">{displayText(selectedPlanification.nomPlanification)}</h3> */}
                  {/* <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span>{formatDateRange(selectedPlanification.dateHeureDebut, selectedPlanification.dateHeureFin)}</span>
                    {selectedPlanification.dureeJours ? (
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {selectedPlanification.dureeJours} jour(s)
                      </span>
                    ) : null}
                  </div> */}
                  <p className="mt-3 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">Départ</span>
                    <span> : </span>
                    <span className="font-semibold text-emerald-700">{displayText(selectedPlanification.depart)}</span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span className="font-medium text-slate-900">Arrivée</span>
                    <span> : </span>
                    <span className="font-semibold text-emerald-700">{displayText(selectedPlanification.arriver)}</span>
                  </p>
                </div>

                {selectedPlanification.budgets.length > 0 ? (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {selectedPlanification.budgets.map((budget) => {
                      const devise = selectedPlanification.deviseBudget || "MGA";
                      const price = budget.prixAvecReduction ?? budget.prixNormal;
                      const categoryName = budget.nomCategorieClient || "Catégorie client";

                      return (
                        <button
                          key={budget.id}
                          type="button"
                          onClick={() => setSelectedBudgetId(budget.id)}
                          className={`w-full px-4 py-4 text-left transition first:rounded-t-xl last:rounded-b-xl sm:px-5 ${
                            selectedBudget?.id === budget.id ? "bg-emerald-50/70" : "bg-white hover:bg-slate-50"
                          }`}
                        >
                          <span className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="min-w-0 flex-1">
                              <span className="block text-base font-semibold text-slate-950">{categoryName}</span>
                              <span className="mt-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                                {budget.gamme || "Gamme"} - {budget.nombrePersonnes || 1} personne(s)
                              </span>
                            </span>
                            <span className="flex items-center justify-between gap-4 sm:justify-end">
                              {selectedBudget?.id === budget.id ? (
                                <Check className="h-4 w-4 text-emerald-700" />
                              ) : null}
                              <span className="text-lg font-semibold text-emerald-700 sm:text-right">
                                {formatMoney(price, devise)}
                              </span>
                            </span>
                          </span>
                          {budget.reduction && budget.reduction > 0 ? (
                            <p className="mt-3 text-sm text-muted-foreground">
                              Prix normal : {formatMoney(budget.prixNormal, devise)} - Réduction : {budget.reduction}%
                            </p>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-5 text-sm text-muted-foreground">
                    Aucun tarif public n&apos;est encore configuré pour cette date.
                  </p>
                )}

                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    onClick={() => handleClientAction("simulation")}
                    className="h-12 border border-emerald-600 bg-white font-semibold text-emerald-700 shadow-none hover:bg-emerald-50"
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    Simuler
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleClientAction("reservation")}
                    disabled={!selectedBudget}
                    className="h-12 bg-emerald-700 font-semibold text-white hover:bg-emerald-800 disabled:bg-slate-300"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Réserver
                  </Button>
                </div>
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
          </section>
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
              {/* <Button className="w-full mt-4" size="lg">
                Réserver maintenant
              </Button> */}
            </CardContent>
          </Card>
        )}

          {/* Galerie d'images */}
          {galleryAll.length > 1 && (
            <div className="mb-6 sm:mb-8">
              <h2 className="mb-4 text-xl sm:text-2xl font-bold">Galérie</h2>
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
                    alt={`${displayText(destination.title)} - Image ${index + 1}`}
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
        title={displayText(destination.title)}
      />

          {/* Barre latérale droite */}
          <DestinationSidebar
            destinationId={destination.id}
            destinationName={displayText(destination.title)}
            averageRating={destination.rating || 0}
          />
        </div>
      </div>
      
      {/* Modal carte */}
      <ModalMap
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        destinationName={displayText(destination.title)}
        location={displayText(destination.departure?.location, "")}
        coordinates={destinationCoordinates}
      />
    </div>
  );
}

