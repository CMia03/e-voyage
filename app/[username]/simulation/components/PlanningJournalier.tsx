"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, MapPinned, Users } from "lucide-react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { ElementSelection, ElementSimulation, JourSimulation } from "@/lib/type/simulation.types";

type PlanningJournalierProps = {
  jours: JourSimulation[];
  elementsSelectionnes: ElementSelection[];
  onChangeElementQuantity: (elementId: string, quantite: number) => void;
  totalVoyageurs: number;
  readOnly?: boolean;
};

function formatAr(value: number) {
  return `${value.toLocaleString("fr-MG")} Ar`;
}

function getTypeLabel(type: string) {
  const normalized = type.trim().toUpperCase();
  if (normalized === "HEBERGEMENT") return "Hebergement";
  if (normalized === "TRANSPORT") return "Transport";
  if (normalized === "ACTIVITE") return "Activite";
  return type;
}

function getDayHeading(jour: JourSimulation) {
  const title = (jour.titre || "").trim();
  const defaultTitle = `Jour ${jour.numeroJour}`;
  return title && title.toLowerCase() !== defaultTitle.toLowerCase() ? title : defaultTitle;
}

type MapMarkerItem = {
  id: string;
  title: string;
  type: string;
  dayLabel: string;
  position: [number, number];
  subtitle?: string;
  images: string[];
  description?: string;
  details: ElementSimulation["details"];
};

type MapTransportSegment = {
  id: string;
  title: string;
  dayLabel: string;
  points: [[number, number], [number, number]];
  depart?: string;
  arrivee?: string;
};

function isFiniteCoordinate(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value);
}

function createMapIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="width:16px;height:16px;background:${color};border:3px solid white;border-radius:9999px;box-shadow:0 0 0 4px ${color}33;"></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const activityIcon = createMapIcon("#f59e0b");
const hebergementIcon = createMapIcon("#10b981");
const transportPointIcon = createMapIcon("#3b82f6");

function createPreviewIcon(title: string, image?: string | null, color = "#10b981") {
  const safeTitle = title.length > 18 ? `${title.slice(0, 18)}…` : title;
  const imageHtml = image
    ? `<img src="${image}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;" />`
    : `<div style="width:100%;height:100%;border-radius:9999px;background:${color};"></div>`;

  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 10px 6px 6px;background:white;border:1px solid rgba(226,232,240,.95);border-radius:9999px;box-shadow:0 10px 30px -18px rgba(15,23,42,.45);min-width:92px;max-width:168px;">
        <div style="width:32px;height:32px;border-radius:9999px;overflow:hidden;flex:none;border:2px solid ${color}33;">
          ${imageHtml}
        </div>
        <span style="font-size:12px;line-height:1.2;font-weight:600;color:#0f172a;white-space:normal;">${safeTitle}</span>
      </div>
    `,
    iconSize: [140, 44],
    iconAnchor: [18, 22],
  });
}

function FitMapToContent({
  center,
  points,
}: {
  center: [number, number];
  points: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      map.setView(center, 6);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }

    map.fitBounds(points, { padding: [50, 50] });
  }, [center, map, points]);

  return null;
}

export function PlanningJournalier({
  jours,
  elementsSelectionnes,
  onChangeElementQuantity,
  totalVoyageurs,
  readOnly = false,
}: PlanningJournalierProps) {
  const [gallery, setGallery] = useState<{ title: string; images: string[]; activeIndex: number } | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const quantityMap = new Map(elementsSelectionnes.map((item) => [item.elementId, item.quantite]));
  const mapData = useMemo(() => {
    const markers: MapMarkerItem[] = [];
    const segments: MapTransportSegment[] = [];

    jours.forEach((jour) => {
      const dayLabel = getDayHeading(jour);

      jour.elements.forEach((element) => {
        const details = element.details;

        if (isFiniteCoordinate(details.latitude) && isFiniteCoordinate(details.longitude)) {
          markers.push({
            id: `${element.id}-point`,
            title: element.titre,
            type: getTypeLabel(element.type),
            dayLabel,
            position: [details.latitude, details.longitude],
            subtitle: details.adresse || details.duree,
            images: details.images ?? [],
            description: element.obligatoire
              ? "Bloc obligatoire du voyage"
              : `${Math.max(quantityMap.get(element.id) ?? element.quantiteSelectionnee ?? 0, 0)} personne(s) sur ce bloc`,
            details,
          });
        }

        if (
          isFiniteCoordinate(details.latitudeDepart) &&
          isFiniteCoordinate(details.longitudeDepart) &&
          isFiniteCoordinate(details.latitudeArrivee) &&
          isFiniteCoordinate(details.longitudeArrivee)
        ) {
          segments.push({
            id: `${element.id}-segment`,
            title: element.titre,
            dayLabel,
            points: [
              [details.latitudeDepart, details.longitudeDepart],
              [details.latitudeArrivee, details.longitudeArrivee],
            ],
            depart: details.depart,
            arrivee: details.arrivee,
          });

          markers.push({
            id: `${element.id}-depart`,
            title: details.depart || `${element.titre} - depart`,
            type: "Transport",
            dayLabel,
            position: [details.latitudeDepart, details.longitudeDepart],
            subtitle: "Point de depart",
            images: [],
            description: details.distance || element.titre,
            details,
          });
          markers.push({
            id: `${element.id}-arrivee`,
            title: details.arrivee || `${element.titre} - arrivee`,
            type: "Transport",
            dayLabel,
            position: [details.latitudeArrivee, details.longitudeArrivee],
            subtitle: "Point d'arrivee",
            images: [],
            description: details.distance || element.titre,
            details,
          });
        }
      });
    });

    const allPoints = [
      ...markers.map((marker) => marker.position),
      ...segments.flatMap((segment) => segment.points),
    ];

    const center: [number, number] =
      allPoints.length > 0
        ? [
            allPoints.reduce((sum, point) => sum + point[0], 0) / allPoints.length,
            allPoints.reduce((sum, point) => sum + point[1], 0) / allPoints.length,
          ]
        : [-18.8792, 47.5079];

    return { markers, segments, center };
  }, [jours, quantityMap]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedMarkerImageIndex, setSelectedMarkerImageIndex] = useState(0);
  const selectedMarker = useMemo(
    () => mapData.markers.find((marker) => marker.id === selectedMarkerId) ?? mapData.markers[0] ?? null,
    [mapData.markers, selectedMarkerId]
  );
  const selectedMarkerQuantity = selectedMarker
    ? (quantityMap.get(selectedMarker.id.replace(/-(point|depart|arrivee)$/, "")) ?? 0)
    : 0;
  const selectedMarkerQuantityLabel =
    selectedMarkerQuantity > 0 ? `${selectedMarkerQuantity} personne(s) sur ce bloc` : null;

  useEffect(() => {
    setSelectedMarkerImageIndex(0);
  }, [selectedMarkerId]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        
        {/* <h2 className="text-xl font-semibold text-slate-900">Planning journalier</h2>
        <p className="text-sm text-slate-600">
          Visualisez votre voyage jour par jour et ajustez les options selon vos envies.
        </p> */}

      </div>

      {mapData.markers.length > 0 || mapData.segments.length > 0 ? (
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => setIsMapOpen(true)}>
            <MapPinned className="mr-2 h-4 w-4" />
            Voir sur la carte
          </Button>
        </div>
      ) : null}

      <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
        {jours.map((jour) => {
          const totalElements = jour.elements.length;
          const totalSelectionnes = jour.elements.filter(
            (element) => (quantityMap.get(element.id) ?? element.quantiteSelectionnee ?? 0) > 0
          ).length;

          return (
            <section
              key={jour.numeroJour}
              className="min-w-[300px] max-w-[300px] shrink-0 snap-start rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_50px_-40px_rgba(15,23,42,0.45)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    <CalendarDays className="h-3.5 w-3.5 text-emerald-600" />
                    Jour {jour.numeroJour}
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
                      {getDayHeading(jour)}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {totalSelectionnes} selectionne(s) sur {totalElements} bloc(s)
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Total du jour
                  </p>
                  <p className="mt-1 text-sm font-semibold text-emerald-900">
                    {formatAr(jour.totalJour)}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {jour.elements.map((element: ElementSimulation) => {
                  const quantiteCourante = Math.max(
                    quantityMap.get(element.id) ?? element.quantiteSelectionnee ?? 0,
                    0
                  );
                  const quantiteMax = Math.max(element.quantiteMax ?? totalVoyageurs, 0);
                  const estSelectionne = quantiteCourante > 0;

                  return (
                    <article
                      key={element.id}
                      className={`rounded-[24px] border p-4 transition ${
                        estSelectionne
                          ? "border-emerald-200 bg-emerald-50/70"
                          : "border-slate-200 bg-slate-50/70"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-[84px] shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Pers.
                            </p>
                            <input
                              type="number"
                              min={element.obligatoire ? quantiteMax : 0}
                              max={quantiteMax}
                              value={element.obligatoire ? quantiteMax : quantiteCourante}
                              readOnly={element.obligatoire || readOnly}
                              disabled={readOnly}
                              onChange={(event) =>
                                void onChangeElementQuantity(
                                  element.id,
                                  Math.max(
                                    element.obligatoire ? quantiteMax : 0,
                                    Math.min(Number(event.target.value) || 0, quantiteMax)
                                  )
                                )
                              }
                              className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-center text-sm font-semibold text-slate-900 outline-none"
                            />
                          </div>

                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-col gap-3">
                              <div className="min-w-0">
                                <h4 className="text-lg font-semibold leading-7 text-slate-900">
                                  {element.titre}
                                </h4>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                                    {getTypeLabel(element.type)}
                                  </span>
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                      element.obligatoire
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {element.obligatoire ? "Obligatoire" : "Optionnel"}
                                  </span>
                                </div>
                              </div>

                              <div className="rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-sm">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                  Montant
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                  {formatAr(element.prix)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                          <div className="pl-[97px]">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              {element.details?.duree ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                                  <Clock3 className="h-3.5 w-3.5 text-violet-500" />
                                  {element.details.duree}
                                </span>
                              ) : null}

                              {element.details?.capacite ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                                  <Users className="h-3.5 w-3.5 text-violet-500" />
                                  Capacite : {element.details.capacite} pers
                                </span>
                              ) : null}

                              {element.details?.images && element.details.images.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setGallery({
                                      title: element.titre,
                                      images: element.details?.images?.filter(Boolean) ?? [],
                                      activeIndex: 0,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  Voir les images
                                </button>
                              ) : null}
                            </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="text-xs text-slate-500">
        Faites glisser horizontalement pour parcourir tous les jours du voyage.
      </div>

      <Dialog open={Boolean(gallery)} onOpenChange={(open) => !open && setGallery(null)}>
        <DialogContent className="!h-[92vh] !w-[94vw] !max-w-[1200px] overflow-hidden rounded-[28px] p-0 sm:!max-w-[1200px]">
          <DialogHeader>
            <div className="border-b border-slate-200 px-6 py-5">
              <DialogTitle>{gallery?.title ?? "Images du bloc"}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="h-[calc(92vh-88px)] overflow-y-auto bg-[linear-gradient(180deg,_rgba(248,250,252,0.94),_rgba(255,255,255,0.98))] px-6 py-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
              <section className="rounded-[30px] border border-slate-200/90 bg-white/92 p-5 shadow-[0_18px_55px_-36px_rgba(15,23,42,0.45)]">
                <div className="flex h-[48vh] min-h-[300px] items-center justify-center overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,_rgba(15,23,42,0.94),_rgba(30,41,59,0.96))] p-5 sm:h-[54vh]">
                  {gallery?.images?.[gallery.activeIndex] ? (
                    <img
                      src={gallery.images[gallery.activeIndex]}
                      alt={`${gallery.title} ${gallery.activeIndex + 1}`}
                      className="max-h-full w-auto max-w-full rounded-[18px] object-contain shadow-[0_24px_55px_-30px_rgba(15,23,42,0.85)] transition duration-300 hover:scale-[1.03]"
                    />
                  ) : null}
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{gallery?.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                      Image {(gallery?.activeIndex ?? 0) + 1} sur {gallery?.images.length ?? 0}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    Survolez l&apos;image pour l&apos;agrandir legerement.
                  </p>
                </div>
              </section>

              {(gallery?.images.length ?? 0) > 1 ? (
                <aside className="rounded-[28px] border border-slate-200/90 bg-white/88 p-4 shadow-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Galerie
                  </p>
                  <div className="grid max-h-[62vh] gap-3 overflow-y-auto pr-1">
                    {(gallery?.images ?? []).map((image, index) => {
                      const isActive = index === gallery?.activeIndex;
                      return (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() =>
                            setGallery((current) =>
                              current ? { ...current, activeIndex: index } : current
                            )
                          }
                          className={`overflow-hidden rounded-2xl border bg-white text-left transition ${
                            isActive
                              ? "border-emerald-400 ring-2 ring-emerald-200"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${gallery?.title ?? "Bloc"} miniature ${index + 1}`}
                            className="h-24 w-full object-cover"
                          />
                          <div className="px-3 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Image {index + 1}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </aside>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="!h-[92vh] !w-[94vw] !max-w-[1440px] overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 sm:!max-w-[1440px]">
          <DialogHeader className="border-b border-slate-200 bg-slate-50/90 px-6 py-5">
            <DialogTitle>Voyage sur la carte</DialogTitle>
          </DialogHeader>
          <div className="grid h-[calc(92vh-76px)] gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="h-full border-b border-slate-200 lg:border-b-0 lg:border-r">
              <MapContainer
                key={`${mapData.center[0]}-${mapData.center[1]}-${mapData.markers.length}-${mapData.segments.length}`}
                center={mapData.center}
                zoom={mapData.markers.length + mapData.segments.length > 0 ? 9 : 6}
                scrollWheelZoom
                className="h-full w-full"
              >
                <FitMapToContent
                  center={mapData.center}
                  points={[
                    ...mapData.markers.map((marker) => marker.position),
                    ...mapData.segments.flatMap((segment) => segment.points),
                  ]}
                />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mapData.segments.map((segment) => (
                  <Polyline
                    key={segment.id}
                    positions={segment.points}
                    pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.7 }}
                  />
                ))}
                {mapData.markers.map((marker) => {
                  const icon =
                    marker.type === "Hebergement"
                      ? createPreviewIcon(marker.title, marker.images[0], "#10b981")
                      : marker.type === "Transport"
                        ? transportPointIcon
                        : createPreviewIcon(marker.title, marker.images[0], "#f59e0b");

                  return (
                    <Marker
                      key={marker.id}
                      position={marker.position}
                      icon={icon}
                      eventHandlers={{
                        click: () => setSelectedMarkerId(marker.id),
                      }}
                    />
                  );
                })}
              </MapContainer>
            </div>

            <aside className="h-full overflow-y-auto bg-white px-5 py-5">
              <div className="space-y-5">
                {false && selectedMarker ? (
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Detail du bloc
                    </p>
                    <h3 className="mt-3 text-lg font-semibold text-slate-900">{selectedMarker.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedMarker.type} • {selectedMarker.dayLabel}
                    </p>
                    {selectedMarker.subtitle ? (
                      <p className="mt-2 text-sm text-slate-600">{selectedMarker.subtitle}</p>
                    ) : null}
                    {selectedMarker.description ? (
                      <p className="mt-2 text-sm text-slate-600">{selectedMarker.description}</p>
                    ) : null}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {selectedMarker.details.adresse ? (
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Adresse
                          </p>
                          <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.adresse}</p>
                        </div>
                      ) : null}
                      {selectedMarker.details.nombreEtoiles ? (
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Etoiles
                          </p>
                          <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.nombreEtoiles}</p>
                        </div>
                      ) : null}
                      {selectedMarker.details.capacite ? (
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Capacite
                          </p>
                          <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.capacite} pers</p>
                        </div>
                      ) : null}
                      {selectedMarker.details.duree ? (
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Duree
                          </p>
                          <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.duree}</p>
                        </div>
                      ) : null}
                      {selectedMarker.details.difficulte ? (
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Difficulte
                          </p>
                          <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.difficulte}</p>
                        </div>
                      ) : null}
                      {selectedMarker.details.participantMin ? (
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Participants min
                          </p>
                          <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.participantMin}</p>
                        </div>
                      ) : null}
                      {selectedMarker.details.participantsMax ? (
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Participants max
                          </p>
                          <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.participantsMax}</p>
                        </div>
                      ) : null}
                      {selectedMarker.details.depart ? (
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Depart
                          </p>
                          <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.depart}</p>
                        </div>
                      ) : null}
                      {selectedMarker.details.arrivee ? (
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Arrivee
                          </p>
                          <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.arrivee}</p>
                        </div>
                      ) : null}
                      {selectedMarker.details.distance ? (
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Distance
                          </p>
                          <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.distance}</p>
                        </div>
                      ) : null}
                      {selectedMarker.details.telephone ? (
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Telephone
                          </p>
                          <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.telephone}</p>
                        </div>
                      ) : null}
                      {selectedMarker.details.email ? (
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Email
                          </p>
                          <p className="mt-1 text-sm text-slate-800 break-all">{selectedMarker.details.email}</p>
                        </div>
                      ) : null}
                      {selectedMarker.details.siteWeb ? (
                        <div className="rounded-2xl bg-white px-3 py-2 sm:col-span-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Site web
                          </p>
                          <p className="mt-1 text-sm text-slate-800 break-all">{selectedMarker.details.siteWeb}</p>
                        </div>
                      ) : null}
                    </div>

                    {selectedMarker.details.description ? (
                      <div className="mt-4 rounded-2xl bg-white px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Description
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {selectedMarker.details.description}
                        </p>
                      </div>
                    ) : null}

                    {selectedMarker.images.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        <img
                          src={selectedMarker.images[0]}
                          alt={selectedMarker.title}
                          className="h-44 w-full rounded-2xl object-cover shadow-sm"
                        />
                        {selectedMarker.images.length > 1 ? (
                          <div className="grid grid-cols-3 gap-2">
                            {selectedMarker.images.slice(1, 4).map((image, index) => (
                              <img
                                key={`${selectedMarker.id}-thumb-${index}`}
                                src={image}
                                alt={`${selectedMarker.title} ${index + 2}`}
                                className="h-20 w-full rounded-xl object-cover"
                              />
                            ))}
                          </div>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            setGallery({
                              title: selectedMarker.title,
                              images: selectedMarker.images,
                              activeIndex: 0,
                            })
                          }
                        >
                          Voir toutes les images
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Legende</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full bg-emerald-500" />
                      Hebergement
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full bg-amber-500" />
                      Activite
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full bg-blue-500" />
                      Transport
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Blocs localises</p>
                  <div className="mt-3 space-y-3">
                    {jours.map((jour) => {
                      const localisedElements = jour.elements.filter((element) => {
                        const details = element.details;
                        return (
                          (isFiniteCoordinate(details.latitude) && isFiniteCoordinate(details.longitude)) ||
                          (isFiniteCoordinate(details.latitudeDepart) &&
                            isFiniteCoordinate(details.longitudeDepart) &&
                            isFiniteCoordinate(details.latitudeArrivee) &&
                            isFiniteCoordinate(details.longitudeArrivee))
                        );
                      });

                      if (localisedElements.length === 0) {
                        return null;
                      }

                      return (
                        <div key={`map-day-${jour.numeroJour}`} className="rounded-2xl border border-slate-200 p-3">
                          <p className="text-sm font-semibold text-slate-900">{getDayHeading(jour)}</p>
                          <div className="mt-2 space-y-2">
                            {localisedElements.map((element) => (
                              <button
                                key={`map-list-${element.id}`}
                                type="button"
                                onClick={() => setSelectedMarkerId(`${element.id}-point`)}
                                className="block w-full rounded-xl bg-slate-50 px-3 py-2 text-left transition hover:bg-slate-100"
                              >
                                <p className="text-sm font-medium text-slate-900">{element.titre}</p>
                                <p className="mt-0.5 text-xs text-slate-500">{getTypeLabel(element.type)}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedMarkerId)} onOpenChange={(open) => !open && setSelectedMarkerId(null)}>
        <DialogContent className="!h-[88vh] !w-[92vw] !max-w-[900px] overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 sm:!max-w-[900px]">
          <DialogHeader className="border-b border-emerald-100 bg-[linear-gradient(135deg,rgba(236,253,245,0.78),rgba(255,255,255,1))] px-6 py-5">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-slate-900">
              {selectedMarker?.title ?? "Detail du bloc"}
            </DialogTitle>
          </DialogHeader>
          <div className="h-[calc(88vh-76px)] overflow-y-auto px-6 py-5">
            {selectedMarker ? (
              <div className="space-y-5">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                      {selectedMarker.type}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {selectedMarker.dayLabel}
                    </span>
                    {selectedMarker.details.duree ? (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                        {selectedMarker.details.duree}
                      </span>
                    ) : null}
                  </div>
                  {selectedMarker.subtitle ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600">{selectedMarker.subtitle}</p>
                  ) : null}
                  {selectedMarker.description && selectedMarker.description !== selectedMarkerQuantityLabel ? (
                    <p className="mt-2 text-sm leading-6 text-slate-600">{selectedMarker.description}</p>
                  ) : null}
                  {selectedMarkerQuantityLabel ? (
                    <p className="mt-3 text-sm font-medium text-slate-700">{selectedMarkerQuantityLabel}</p>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedMarker.details.adresse ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Adresse</p>
                      <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.adresse}</p>
                    </div>
                  ) : null}
                  {selectedMarker.details.nombreEtoiles ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Etoiles</p>
                      <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.nombreEtoiles}</p>
                    </div>
                  ) : null}
                  {selectedMarker.details.capacite ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Capacite</p>
                      <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.capacite} pers</p>
                    </div>
                  ) : null}
                  {selectedMarker.details.duree ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Duree</p>
                      <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.duree}</p>
                    </div>
                  ) : null}
                  {selectedMarker.details.difficulte ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Difficulte</p>
                      <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.difficulte}</p>
                    </div>
                  ) : null}
                  {selectedMarker.details.participantMin ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Participants min</p>
                      <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.participantMin}</p>
                    </div>
                  ) : null}
                  {selectedMarker.details.participantsMax ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Participants max</p>
                      <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.participantsMax}</p>
                    </div>
                  ) : null}
                  {selectedMarker.details.depart ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Depart</p>
                      <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.depart}</p>
                    </div>
                  ) : null}
                  {selectedMarker.details.arrivee ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Arrivee</p>
                      <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.arrivee}</p>
                    </div>
                  ) : null}
                  {selectedMarker.details.distance ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Distance</p>
                      <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.distance}</p>
                    </div>
                  ) : null}
                  {selectedMarker.details.telephone ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Telephone</p>
                      <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.telephone}</p>
                    </div>
                  ) : null}
                  {selectedMarker.details.email ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Email</p>
                      <p className="mt-1 text-sm text-slate-800 break-all">{selectedMarker.details.email}</p>
                    </div>
                  ) : null}
                  {selectedMarker.details.siteWeb ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Site web</p>
                      <p className="mt-1 text-sm text-slate-800 break-all">{selectedMarker.details.siteWeb}</p>
                    </div>
                  ) : null}
                </div>

                {selectedMarker.details.description ? (
                  <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,1),rgba(255,255,255,1))] px-5 py-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Description</p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">{selectedMarker.details.description}</p>
                  </div>
                ) : null}

                {selectedMarker.images.length > 0 ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(15,23,42,0.94),_rgba(30,41,59,0.96))] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3 text-white/85">
                        {/* <p className="text-sm font-medium text-white">{selectedMarker.title}</p> */}
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium">
                          Image {selectedMarkerImageIndex + 1} sur {selectedMarker.images.length}
                        </span>
                      </div>
                      <div className="flex h-[360px] items-center justify-center overflow-hidden rounded-[20px] bg-slate-950/20">
                        <img
                          src={selectedMarker.images[selectedMarkerImageIndex] ?? selectedMarker.images[0]}
                          alt={`${selectedMarker.title} image ${selectedMarkerImageIndex + 1}`}
                          className="max-h-full w-auto max-w-full rounded-[18px] object-contain shadow-[0_20px_45px_-28px_rgba(15,23,42,0.9)]"
                        />
                      </div>
                    </div>

                    {selectedMarker.images.length > 1 ? (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Galerie complete
                        </p>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                          {selectedMarker.images.map((image, index) => (
                            <button
                              key={`${selectedMarker.id}-detail-image-${index}`}
                              type="button"
                              onClick={() => setSelectedMarkerImageIndex(index)}
                              className={`shrink-0 overflow-hidden rounded-2xl border bg-white transition ${
                                index === selectedMarkerImageIndex
                                  ? "border-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <img
                                src={image}
                                alt={`${selectedMarker.title} miniature ${index + 1}`}
                                className="h-24 w-32 object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
