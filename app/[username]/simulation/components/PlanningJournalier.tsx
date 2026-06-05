"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, MapPinned, Users } from "lucide-react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { ElementSelection, ElementSimulation, JourSimulation } from "@/lib/type/simulation.types";
import { ImageGalleryDialog, ImageGalleryState } from "./ImageGalleryDialog";

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

function fixLegacyEncoding(value: string) {
  const replacements: Array<[string, string]> = [
    ["Ã¢â‚¬Å¡", "é"],
    ["Ã†â€™", "â"],
    ["Ã¢â‚¬Â¦", "à"],
    ["Ã¢â‚¬Â¡", "ç"],
    ["Ã‹â€ ", "ê"],
    ["Ã¢â‚¬Â°", "ë"],
    ["Ã…Â ", "è"],
    ["Ã¢â‚¬Â¹", "ï"],
    ["Ã…â€™", "î"],
    ["Ã¢â‚¬Å“", "ô"],
    ["Ã¢â‚¬Â", "ö"],
    ["Ã¢â‚¬â€œ", "û"],
    ["Ã¢â‚¬â€", "ù"],
    ["Ãƒâ€”", "Î"],
    ["ÃƒÂ©", "é"],
    ["ÃƒÂ¨", "è"],
    ["ÃƒÂª", "ê"],
    ["ÃƒÂ ", "à"],
    ["ÃƒÂ®", "î"],
    ["ÃƒÂ´", "ô"],
    ["ÃƒÂ»", "û"],
    ["ÃƒÂ§", "ç"],
    ["Ã©", "é"],
    ["Ã¨", "è"],
    ["Ãª", "ê"],
    ["Ã«", "ë"],
    ["Ã ", "à"],
    ["Ã¢", "â"],
    ["Ã®", "î"],
    ["Ã¯", "ï"],
    ["Ã´", "ô"],
    ["Ã»", "û"],
    ["Ã¹", "ù"],
    ["Ã§", "ç"],
    ["Ã‰", "É"],
    ["ÃŽ", "Î"],
    ["‚", "é"],
    ["Š", "è"],
    ["Œ", "î"],
    ["“", "ô"],
    ["”", "ö"],
    ["–", "û"],
    ["—", "ù"],
    ["…", "à"],
    ["×", "Î"],
  ];

  return replacements.reduce(
    (text, [broken, fixed]) => text.split(broken).join(fixed),
    value
  );
}

function displayText(value?: string | number | null, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return fixLegacyEncoding(String(value));
}

function getElementImages(element: ElementSimulation) {
  const details = element.details as ElementSimulation["details"] & {
    image?: string | null;
    imagePrincipale?: string | null;
    urlImage?: string | null;
    urlImagePrincipale?: string | null;
    photos?: Array<{ urlImage?: string | null; image?: string | null } | string | null | undefined>;
    tarifs?: Array<{
      image?: string | null;
      urlImage?: string | null;
      images?: Array<string | null | undefined>;
      photos?: Array<{ urlImage?: string | null; image?: string | null } | string | null | undefined>;
    } | null | undefined>;
    chambres?: Array<{
      image?: string | null;
      urlImage?: string | null;
      images?: Array<string | null | undefined>;
      photos?: Array<{ urlImage?: string | null; image?: string | null } | string | null | undefined>;
    } | null | undefined>;
  };
  const collectPhotoUrls = (
    photos?: Array<{ urlImage?: string | null; image?: string | null } | string | null | undefined>
  ) =>
    (photos ?? []).flatMap((photo) => {
      if (typeof photo === "string") return [photo];
      if (!photo) return [];
      return [photo.urlImage, photo.image];
    });
  const nestedImages = [...(details.tarifs ?? []), ...(details.chambres ?? [])].flatMap((item) =>
    item
      ? [
          item.urlImage,
          item.image,
          ...(Array.isArray(item.images) ? item.images : []),
          ...collectPhotoUrls(item.photos),
        ]
      : []
  );

  return Array.from(
    new Set(
      [
        details.urlImagePrincipale,
        details.imagePrincipale,
        details.urlImage,
        details.image,
        ...(Array.isArray(details.images) ? details.images : []),
        ...collectPhotoUrls(details.photos),
        ...nestedImages,
      ].filter((image): image is string => typeof image === "string" && image.trim().length > 0)
    )
  );
}

function getTypeLabel(type: string) {
  const normalized = type.trim().toUpperCase();
  if (normalized === "HEBERGEMENT") return "Hébergement";
  if (normalized === "TRANSPORT") return "Transport";
  if (normalized === "ACTIVITE") return "Activité";
  return displayText(type);
}

function getDayHeading(jour: JourSimulation) {
  const title = displayText(jour.titre, "").trim();
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
  const normalizedTitle = displayText(title);
  const safeTitle = normalizedTitle.length > 18 ? `${normalizedTitle.slice(0, 18)}...` : normalizedTitle;
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
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;

      const container = map.getContainer();
      if (!container || !container.isConnected) return;

      map.invalidateSize();
      window.requestAnimationFrame(() => {
        if (cancelled) return;

        try {
          if (points.length === 0) {
            map.setView(center, 6);
            return;
          }

          if (points.length === 1) {
            map.setView(points[0], 12);
            return;
          }

          map.fitBounds(points, { padding: [50, 50] });
        } catch {
          // Leaflet may not have its pane ready while the dialog is opening.
        }
      });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
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
  const [gallery, setGallery] = useState<ImageGalleryState | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const quantityMap = useMemo(
    () => new Map(elementsSelectionnes.map((item) => [item.elementId, item.quantite])),
    [elementsSelectionnes]
  );
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
            title: displayText(element.titre),
            type: getTypeLabel(element.type),
            dayLabel,
            position: [details.latitude!, details.longitude!],
            subtitle: details.adresse || details.duree,
            images: getElementImages(element),
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
            title: displayText(element.titre),
            dayLabel,
            points: [
              [details.latitudeDepart!, details.longitudeDepart!],
              [details.latitudeArrivee!, details.longitudeArrivee!],
            ],
            depart: details.depart,
            arrivee: details.arrivee,
          });

          if (details.latitudeDepart != null && details.longitudeDepart != null) {
            markers.push({
              id: `${element.id}-depart`,
              title: displayText(details.depart || `${element.titre} - départ`),
              type: "Transport",
              dayLabel,
              position: [details.latitudeDepart, details.longitudeDepart],
              subtitle: "Point de départ",
              images: [],
              description: displayText(details.distance || element.titre),
              details,
            });
          }
          if (details.latitudeArrivee != null && details.longitudeArrivee != null) {
            markers.push({
              id: `${element.id}-arrivee`,
              title: displayText(details.arrivee || `${element.titre} - arrivée`),
              type: "Transport",
              dayLabel,
              position: [details.latitudeArrivee, details.longitudeArrivee],
              subtitle: "Point d'arrivée",
              images: [],
              description: displayText(details.distance || element.titre),
              details,
            });
          }
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
  
  // Reset image index when marker changes
  const handleMarkerSelect = (markerId: string) => {
    setSelectedMarkerId(markerId);
    setSelectedMarkerImageIndex(0);
  };
  
  const selectedMarkerQuantity = selectedMarker
    ? (quantityMap.get(selectedMarker.id.replace(/-(point|depart|arrivee)$/, "")) ?? 0)
    : 0;
  const selectedMarkerQuantityLabel =
    selectedMarkerQuantity > 0 ? `${selectedMarkerQuantity} personne(s) sur ce bloc` : null;

  return (
    <div className="space-y-2">

      {mapData.markers.length > 0 || mapData.segments.length > 0 ? (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => setIsMapOpen(true)}>
            <MapPinned className="mr-2 h-4 w-4" />
            Voir sur la carte
          </Button>
        </div>
      ) : null}

      <div className="flex gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
        {jours.map((jour) => {
          const totalElements = jour.elements.length;
          const totalSelectionnes = jour.elements.filter(
            (element) => (quantityMap.get(element.id) ?? element.quantiteSelectionnee ?? 0) > 0
          ).length;

          return (
            <section
              key={jour.numeroJour}
              className="min-w-[860px] max-w-[860px] shrink-0 snap-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                    <CalendarDays className="h-3.5 w-3.5 text-emerald-600" />
                    Jour {jour.numeroJour}
                  </div>
                  <div>
                    {/* <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                      {getDayHeading(jour)}
                    </h3> */}
                    <p className="text-sm text-slate-600">
                      {totalSelectionnes} selectionne(s) sur {totalElements} bloc(s)
                    </p>
                  </div>
                </div>

                {/* <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Total du jour
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatAr(jour.totalJour)}
                  </p>
                </div> */}
              </div>

              <div className="max-h-[360px] overflow-y-auto pr-1">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {jour.elements.map((element: ElementSimulation) => {
                  const quantiteCourante = Math.max(
                    quantityMap.get(element.id) ?? element.quantiteSelectionnee ?? 0,
                    0
                  );
                  const quantiteMax = Math.max(element.quantiteMax ?? totalVoyageurs, 0);
                  const estSelectionne = quantiteCourante > 0;
                  const elementImages = getElementImages(element);

                  return (
                    <article
                      key={element.id}
                      className={`group relative flex min-h-[205px] flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                        estSelectionne
                          ? "border-emerald-300"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* Header avec badge de statut et icône */}
                      <div className="flex flex-1 flex-col p-4 pb-3">

                        <div className="flex flex-1 items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="mb-2 flex items-center gap-3">
                              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                                estSelectionne
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                                  : "bg-slate-100 text-slate-600"
                              }`}>
                                {element.obligatoire ? (
                                  <><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /><span>Essentiel</span></>
                                ) : (
                                  <><span className="h-1.5 w-1.5 rounded-full bg-slate-400" /><span>Option</span></>
                                )}
                              </span>
                                                          </div>
                            <h4 className="text-base font-semibold leading-tight text-slate-900">
                              {displayText(element.titre)}
                            </h4>
                            <p className="mt-1.5 text-sm font-medium text-slate-500">
                              {getTypeLabel(element.type)}
                            </p>
                          </div>
                        </div>

                        {/* Prix et quantité avec meilleur alignement */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Quantité
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
                              className={`h-9 w-20 rounded-lg border text-center text-sm font-semibold transition-all ${
                                estSelectionne
                                  ? "border-emerald-200 bg-white text-emerald-700 placeholder-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                  : "border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-300"
                              } outline-none`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Détails et actions avec design amélioré */}
                      <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {element.details?.duree && (
                            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                              <Clock3 className="h-4 w-4" />
                              <span>{displayText(element.details.duree)}</span>
                            </div>
                          )}

                          {element.details?.capacite && (
                            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                              <Users className="h-4 w-4" />
                              <span>Capacité : {element.details.capacite} pers</span>
                            </div>
                          )}

                          {elementImages.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setGallery({
                                  title: displayText(element.titre),
                                  images: elementImages,
                                  activeIndex: 0,
                                })
                              }
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <span>Voir les photos</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
                  </div>
                </div>
            </section>
          );
        })}
      </div>

      <div className="pt-1 text-xs text-slate-500">
        Faites glisser horizontalement pour parcourir tous les jours du voyage.
      </div>

      <ImageGalleryDialog
        gallery={gallery}
        onChange={setGallery}
        description="Images associees au bloc selectionne."
      />

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
                    marker.type === "Hébergement"
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
                        click: () => handleMarkerSelect(marker.id),
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
                      Détail du bloc
                    </p>
                    <h3 className="mt-3 text-lg font-semibold text-slate-900">{selectedMarker.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {displayText(selectedMarker.type)} - {displayText(selectedMarker.dayLabel)}
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
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Légende</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full bg-emerald-500" />
                      Hébergement
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full bg-amber-500" />
                      Activité
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full bg-blue-500" />
                      Transport
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Blocs localisés</p>
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
                                onClick={() => handleMarkerSelect(`${element.id}-point`)}
                                className="block w-full rounded-xl bg-slate-50 px-3 py-2 text-left transition hover:bg-slate-100"
                              >
                                <p className="text-sm font-medium text-slate-900">{displayText(element.titre)}</p>
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
              {displayText(selectedMarker?.title, "Détail du bloc")}
            </DialogTitle>
          </DialogHeader>
          <div className="h-[calc(88vh-76px)] overflow-y-auto px-6 py-5">
            {selectedMarker ? (
              <div className="space-y-5">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                      {displayText(selectedMarker.type)}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {displayText(selectedMarker.dayLabel)}
                    </span>
                    {selectedMarker.details.duree ? (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                        {displayText(selectedMarker.details.duree)}
                      </span>
                    ) : null}
                  </div>
                  {selectedMarker.subtitle ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600">{displayText(selectedMarker.subtitle)}</p>
                  ) : null}
                  {selectedMarker.description && selectedMarker.description !== selectedMarkerQuantityLabel ? (
                    <p className="mt-2 text-sm leading-6 text-slate-600">{displayText(selectedMarker.description)}</p>
                  ) : null}
                  {selectedMarkerQuantityLabel ? (
                    <p className="mt-3 text-sm font-medium text-slate-700">{selectedMarkerQuantityLabel}</p>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedMarker.details.adresse ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Adresse</p>
                      <p className="mt-1 text-sm text-slate-800">{displayText(selectedMarker.details.adresse)}</p>
                    </div>
                  ) : null}
                  {selectedMarker.details.nombreEtoiles ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Étoiles</p>
                      <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.nombreEtoiles}</p>
                    </div>
                  ) : null}
                  {selectedMarker.details.capacite ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Capacité</p>
                      <p className="mt-1 text-sm text-slate-800">{selectedMarker.details.capacite} pers</p>
                    </div>
                  ) : null}
                  {selectedMarker.details.duree ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Durée</p>
                      <p className="mt-1 text-sm text-slate-800">{displayText(selectedMarker.details.duree)}</p>
                    </div>
                  ) : null}
                  {selectedMarker.details.difficulte ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Difficulté</p>
                      <p className="mt-1 text-sm text-slate-800">{displayText(selectedMarker.details.difficulte)}</p>
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
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Départ</p>
                      <p className="mt-1 text-sm text-slate-800">{displayText(selectedMarker.details.depart)}</p>
                    </div>
                  ) : null}
                  {selectedMarker.details.arrivee ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Arrivée</p>
                      <p className="mt-1 text-sm text-slate-800">{displayText(selectedMarker.details.arrivee)}</p>
                    </div>
                  ) : null}
                  {selectedMarker.details.distance ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Distance</p>
                      <p className="mt-1 text-sm text-slate-800">{displayText(selectedMarker.details.distance)}</p>
                    </div>
                  ) : null}
                  {selectedMarker.details.telephone ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Téléphone</p>
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
                    <p className="mt-3 text-sm leading-7 text-slate-700">{displayText(selectedMarker.details.description)}</p>
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
                          Galérie complete
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
