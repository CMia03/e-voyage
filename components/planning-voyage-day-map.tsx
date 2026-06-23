"use client";

import "leaflet/dist/leaflet.css";

import { Fragment, useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { GeoJsonObject } from "geojson";
import { MapPinned, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DestinationAssociationItem,
  ElementJourPlanification,
  JourPlanificationVoyage,
  PlanificationVoyage,
  Transport,
} from "@/lib/type/destination";

type PlanningVoyageDayMapProps = {
  planification: PlanificationVoyage;
  activites: DestinationAssociationItem[];
  hebergements: DestinationAssociationItem[];
  onEditDay: (day: JourPlanificationVoyage) => void;
  onDeleteDay: (dayId: string) => void;
  onAddElement: (day: JourPlanificationVoyage, insertIndex?: number) => void;
  onEditElement: (dayId: string, element: ElementJourPlanification) => void;
  onDeleteElement: (elementId: string) => void;
};

function buildTransportPointIcon(label: string, color: string) {
  return L.divIcon({
    className: "custom-planning-transport-pin",
    html: `<div style="width:24px;height:24px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 4px rgba(15,23,42,.15);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;">${label}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function buildImagePinIcon(imageUrl: string | null, color: string, fallbackLabel: string) {
  return L.divIcon({
    className: "custom-planning-day-image-pin",
    html: imageUrl
      ? `<div style="width:30px;height:30px;border-radius:9999px;border:2px solid ${color};box-shadow:0 0 0 4px rgba(15,23,42,.12);overflow:hidden;background:white;"><img src="${imageUrl}" alt="" style="width:100%;height:100%;object-fit:cover;" /></div>`
      : `<div style="width:30px;height:30px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 4px rgba(15,23,42,.12);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700;">${fallbackLabel}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

const transportDepartIcon = buildTransportPointIcon("D", "#dc2626");
const transportArriveeIcon = buildTransportPointIcon("A", "#16a34a");

function ResizeMapOnChange({ watchKey }: { watchKey: string }) {
  const map = useMap();

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (cancelled) return;

      try {
        const container = map.getContainer();
        if (!container.isConnected) return;
        map.invalidateSize();
      } catch {
        // Leaflet can throw while this map is being updated or unmounted.
      }
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [map, watchKey]);

  return null;
}

function FitMapToSelection({
  positions,
  fallbackCenter,
  watchKey,
}: {
  positions: [number, number][];
  fallbackCenter: [number, number];
  watchKey: string;
}) {
  const map = useMap();

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (cancelled) return;

      try {
        const container = map.getContainer();
        if (!container.isConnected) return;
        map.invalidateSize();

        if (positions.length > 1) {
          map.fitBounds(positions, { padding: [32, 32], maxZoom: 11, animate: false });
          return;
        }

        if (positions.length === 1) {
          map.setView(positions[0], Math.max(map.getZoom(), 11), { animate: false });
          return;
        }

        map.setView(fallbackCenter, 7, { animate: false });
      } catch {
        // Leaflet can throw while this map is being updated or unmounted.
      }
    }, 100);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [fallbackCenter, map, positions, watchKey]);

  return null;
}

function transportColor(typeName: string) {
  const value = typeName.toLowerCase();
  if (value.includes("avion")) return "#2563eb";
  if (value.includes("bateau")) return "#0891b2";
  if (value.includes("train")) return "#7c3aed";
  if (value.includes("marche")) return "#16a34a";
  return "#dc2626";
}

function isTransportInDay(transport: Transport, dayTransportIds: Set<string>) {
  if (dayTransportIds.size === 0) return false;
  return dayTransportIds.has(transport.id);
}

function formatDayDate(dateJour?: string | null) {
  if (!dateJour) return "Date non renseignee";
  const parsed = new Date(dateJour);
  if (Number.isNaN(parsed.getTime())) return dateJour;
  return parsed.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const legacyEncodingMap: Record<string, string> = {
  "‚": "é",
  "ƒ": "è",
  "…": "à",
  "‡": "ç",
  "ˆ": "ê",
  "‰": "ë",
  "Š": "è",
  "‹": "ï",
  "Œ": "î",
  "“": "ô",
  "”": "ù",
  "–": "û",
  "—": "ü",
  "×": "Î",
};

function displayText(value?: string | number | null, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value)
    .replace(/[‚ƒ…‡ˆ‰Š‹Œ“”–—×]/g, (char) => legacyEncodingMap[char] ?? char)
    .replace(/Ã©/g, "é")
    .replace(/Ã¨/g, "è")
    .replace(/Ãª/g, "ê")
    .replace(/Ã«/g, "ë")
    .replace(/Ã /g, "à")
    .replace(/Ã¢/g, "â")
    .replace(/Ã®/g, "î")
    .replace(/Ã´/g, "ô")
    .replace(/Ã»/g, "û")
    .replace(/Ã¹/g, "ù")
    .replace(/Ã§/g, "ç");
}

function getElementTitle(element: ElementJourPlanification) {
  return displayText(
    element.titre || element.nomTransport || element.nomActivite || element.nomHebergement || element.nomTypeElementJour,
    "Bloc"
  );
}

function getElementMeta(element: ElementJourPlanification) {
  const parts = [
    element.nomTypeElementJour || "Element",
    element.nomTransport,
    element.nomActivite,
    element.nomHebergement,
  ].filter((part): part is string => Boolean(part));

  return parts.map((part) => displayText(part)).join(" • ");
}

function getElementTone(element: ElementJourPlanification) {
  if (element.idTransport || element.codeTypeElementJour?.includes("TRANSPORT")) {
    return "bg-orange-50 text-orange-700";
  }
  if (element.idHebergement || element.codeTypeElementJour === "HEBERGEMENT") {
    return "bg-purple-50 text-purple-700";
  }
  if (element.idActivite || element.codeTypeElementJour === "ACTIVITE") {
    return "bg-emerald-50 text-emerald-700";
  }
  return "bg-slate-100 text-slate-600";
}

export function PlanningVoyageDayMap({
  planification,
  activites,
  hebergements,
  onEditDay,
  onDeleteDay,
  onAddElement,
  onEditElement,
  onDeleteElement,
}: PlanningVoyageDayMapProps) {
  const sortedDays = useMemo(
    () => [...(planification.jours ?? [])].sort((a, b) => (a.numeroJour ?? 9999) - (b.numeroJour ?? 9999)),
    [planification.jours]
  );

  const [selectedDayId, setSelectedDayId] = useState<string>(sortedDays[0]?.id ?? "");
  const [openActionMenuKey, setOpenActionMenuKey] = useState<string | null>(null);
  const [detailDialogContent, setDetailDialogContent] = useState<{ title: string; description: string } | null>(null);

  const selectedDay = useMemo(
    () => sortedDays.find((day) => day.id === selectedDayId) ?? sortedDays[0] ?? null,
    [sortedDays, selectedDayId]
  );

  const dayTransportIds = useMemo(() => {
    if (!selectedDay) return new Set<string>();
    return new Set(
      (selectedDay.elements ?? [])
        .map((element) => element.idTransport)
        .filter((id): id is string => Boolean(id))
    );
  }, [selectedDay]);

  const activiteById = useMemo(() => {
    const map = new Map<string, DestinationAssociationItem>();
    for (const item of activites) {
      map.set(item.id, item);
    }
    return map;
  }, [activites]);

  const hebergementById = useMemo(() => {
    const map = new Map<string, DestinationAssociationItem>();
    for (const item of hebergements) {
      map.set(item.id, item);
    }
    return map;
  }, [hebergements]);

  const validSegments = useMemo(
    () =>
      planification.transports.filter(
        (transport) =>
          transport.latitudeDepart !== null &&
          transport.longitudeDepart !== null &&
          transport.latitudeArrivee !== null &&
          transport.longitudeArrivee !== null &&
          isTransportInDay(transport, dayTransportIds)
      ),
    [planification.transports, dayTransportIds]
  );

  const geojsonSegments = useMemo(
    () =>
      validSegments.map((transport) => {
        if (!transport.geojsonTrajet) return { transport, geojson: null as GeoJsonObject | null };
        try {
          return { transport, geojson: JSON.parse(transport.geojsonTrajet) as GeoJsonObject };
        } catch {
          return { transport, geojson: null as GeoJsonObject | null };
        }
      }),
    [validSegments]
  );

  const dayPlaceMarkers = useMemo(() => {
    if (!selectedDay)
      return [] as Array<{
        id: string;
        type: "ACTIVITE" | "HEBERGEMENT";
        name: string;
        position: [number, number];
        image: string | null;
        description: string | null;
      }>;

    const markers: Array<{
      id: string;
      type: "ACTIVITE" | "HEBERGEMENT";
      name: string;
      position: [number, number];
      image: string | null;
      description: string | null;
    }> = [];

    for (const element of selectedDay.elements ?? []) {
      if (element.idActivite) {
        const activite = activiteById.get(element.idActivite);
        const latitude = Number(activite?.latitude);
        const longitude = Number(activite?.longitude);
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          const description = [activite?.place, activite?.region, activite?.meta]
            .filter((part): part is string => Boolean(part && part.trim()))
            .join(" • ");
          markers.push({
            id: `act-${element.id}`,
            type: "ACTIVITE",
            name: displayText(activite?.nom || element.nomActivite, "Activité"),
            position: [latitude, longitude],
            image: activite?.image || null,
            description: description ? displayText(description) : null,
          });
        }
      }

      if (element.idHebergement) {
        const hebergement = hebergementById.get(element.idHebergement);
        const latitude = Number(hebergement?.latitude);
        const longitude = Number(hebergement?.longitude);
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          const description = [hebergement?.place, hebergement?.region, hebergement?.meta]
            .filter((part): part is string => Boolean(part && part.trim()))
            .join(" • ");
          markers.push({
            id: `heb-${element.id}`,
            type: "HEBERGEMENT",
            name: displayText(hebergement?.nom || element.nomHebergement, "Hébergement"),
            position: [latitude, longitude],
            image: hebergement?.image || null,
            description: description ? displayText(description) : null,
          });
        }
      }
    }

    return markers;
  }, [selectedDay, activiteById, hebergementById]);

  const mapCenter = useMemo<[number, number]>(() => {
    const firstSegment = validSegments[0];
    if (firstSegment && firstSegment.latitudeDepart !== null && firstSegment.longitudeDepart !== null) {
      return [firstSegment.latitudeDepart, firstSegment.longitudeDepart];
    }

    const firstMarker = dayPlaceMarkers[0];
    if (firstMarker) return firstMarker.position;

    return [-18.8792, 47.5079];
  }, [validSegments, dayPlaceMarkers]);

  function openDayDetails(day: JourPlanificationVoyage) {
    setDetailDialogContent({
      title: displayText(day.titre, `Jour ${day.numeroJour ?? "-"}`),
      description: `Date: ${formatDayDate(day.dateJour)}\nBlocs: ${(day.elements ?? []).length}\nDescription: ${displayText(day.description)}`,
    });
  }

  function openElementDetails(element: ElementJourPlanification) {
    setDetailDialogContent({
      title: displayText(element.titre || element.nomTypeElementJour, "Bloc"),
      description: `Type: ${displayText(element.nomTypeElementJour)}\nDébut: ${element.heureDebut || "-"}\nFin: ${element.heureFin || "-"}\nBudget: ${element.budgetPrevu ?? "-"} ${element.devise || "MGA"}\nDescription: ${displayText(element.description)}`,
    });
  }

  const mapPositions = useMemo<[number, number][]>(() => {
    const segmentPoints = validSegments.flatMap((transport) => {
      if (
        transport.latitudeDepart === null ||
        transport.longitudeDepart === null ||
        transport.latitudeArrivee === null ||
        transport.longitudeArrivee === null
      ) {
        return [];
      }

      return [
        [transport.latitudeDepart, transport.longitudeDepart] as [number, number],
        [transport.latitudeArrivee, transport.longitudeArrivee] as [number, number],
      ];
    });

    return [...segmentPoints, ...dayPlaceMarkers.map((marker) => marker.position)];
  }, [dayPlaceMarkers, validSegments]);

  const mapWatchKey = `${selectedDay?.id ?? "none"}-${validSegments.length}-${dayPlaceMarkers.length}`;

  return (
    <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,1fr)]">
      <div className="min-h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {validSegments.length === 0 && dayPlaceMarkers.length === 0 ? (
          <div className="flex h-full min-h-[520px] items-center justify-center bg-slate-50 px-6 text-center text-sm text-slate-500">
            Aucun point geographique lie au jour selectionne. Ajoute un transport, une activite ou un hebergement.
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={7}
            className="h-full min-h-[520px] w-full"
            preferCanvas
            fadeAnimation={false}
            markerZoomAnimation={false}
            zoomAnimation={false}
          >
            <ResizeMapOnChange watchKey={mapWatchKey} />
            <FitMapToSelection positions={mapPositions} fallbackCenter={mapCenter} watchKey={mapWatchKey} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {geojsonSegments.map(({ transport, geojson }) => {
              const points: [number, number][] = [
                [transport.latitudeDepart!, transport.longitudeDepart!],
                [transport.latitudeArrivee!, transport.longitudeArrivee!],
              ];
              const color = transportColor(transport.nomTypeTransport);
              return (
                <Fragment key={transport.id}>
                  {geojson ? (
                    <GeoJSON data={geojson} style={{ color, weight: 5 }} />
                  ) : (
                    <Polyline positions={points} pathOptions={{ color, weight: 5 }} />
                  )}
                  <Marker position={points[0]} icon={transportDepartIcon}>
                    <Popup>
                      <strong>{displayText(transport.depart)}</strong>
                      <br />
                      Départ (Transport)
                    </Popup>
                  </Marker>
                  <Marker position={points[1]} icon={transportArriveeIcon}>
                    <Popup>
                      <strong>{displayText(transport.arrivee)}</strong>
                      <br />
                      Arrivée (Transport)
                    </Popup>
                  </Marker>
                </Fragment>
              );
            })}

            {dayPlaceMarkers.map((marker) => (
              <Marker
                key={marker.id}
                position={marker.position}
                icon={
                  marker.type === "ACTIVITE"
                    ? buildImagePinIcon(marker.image, "#2563eb", "A")
                    : buildImagePinIcon(marker.image, "#f59e0b", "H")
                }
              >
                <Popup>
                  <strong>{marker.name}</strong>
                  <br />
                  {marker.type === "ACTIVITE" ? "Activité" : "Hébergement"}
                  {marker.image ? (
                    <>
                      <br />
                      <img
                        src={marker.image}
                        alt={marker.name}
                        style={{
                          marginTop: "6px",
                          width: "140px",
                          height: "90px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid rgba(15,23,42,.12)",
                        }}
                      />
                    </>
                  ) : null}
                  {marker.description ? (
                    <>
                      <br />
                      <span style={{ fontSize: "12px", color: "#475569" }}>{marker.description}</span>
                    </>
                  ) : null}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-950">Planning par jour</h3>
          <p className="text-sm text-slate-500">Détail des trajets, hébergements et activités par jour.</p>
        </div>
        <div className="max-h-[520px] space-y-4 overflow-y-auto pr-1">
          {sortedDays.map((day) => {
            const isActive = day.id === (selectedDay?.id ?? "");
            const sortedElements = [...(day.elements ?? [])].sort((a, b) => (a.ordreAffichage ?? 9999) - (b.ordreAffichage ?? 9999));
            return (
              <div
                key={day.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedDayId(day.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedDayId(day.id);
                  }
                }}
                className={`relative w-full rounded-2xl border p-4 text-left transition ${
                  isActive
                    ? "border-emerald-200 bg-white shadow-sm"
                    : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/20"
                }`}
              >
                <span
                  className={`absolute -left-[5px] top-5 size-3 rounded-full ${
                    isActive ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                />
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <Badge className="bg-emerald-50 text-emerald-800 hover:bg-emerald-50">
                      Jour {day.numeroJour ?? "-"}
                    </Badge>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {displayText(day.titre, `Jour ${day.numeroJour ?? ""}`)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{formatDayDate(day.dateJour)}</span>
                    <div className="relative">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-8 rounded-xl border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenActionMenuKey((current) => (current === `day-${day.id}` ? null : `day-${day.id}`));
                        }}
                      >
                        <MoreVertical className="size-3.5" />
                      </Button>
                      {openActionMenuKey === `day-${day.id}` ? (
                        <div className="absolute right-0 top-9 z-20 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenActionMenuKey(null);
                              onEditDay(day);
                            }}
                          >
                            <Pencil className="size-3.5" />
                            Modifier
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenActionMenuKey(null);
                              openDayDetails(day);
                            }}
                          >
                            Détaille
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full justify-start text-destructive hover:text-destructive"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenActionMenuKey(null);
                              onDeleteDay(day.id);
                            }}
                          >
                            <Trash2 className="size-3.5" />
                            Supprimer
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {sortedElements.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucun bloc pour ce jour.</p>
                  ) : (
                    sortedElements.map((element, index) => (
                      <div key={element.id} className="space-y-2">
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 gap-3">
                              <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${getElementTone(element)}`}>
                                <MapPinned className="size-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-slate-950">{getElementTitle(element)}</p>
                                <p className="truncate text-[11px] text-slate-500">{getElementMeta(element)}</p>
                              </div>
                            </div>
                            <div className="relative">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="size-7 rounded-lg border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenActionMenuKey((current) =>
                                    current === `element-${element.id}` ? null : `element-${element.id}`
                                  );
                                }}
                              >
                                <MoreVertical className="size-3" />
                              </Button>
                              {openActionMenuKey === `element-${element.id}` ? (
                                <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full justify-start"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setOpenActionMenuKey(null);
                                      onEditElement(day.id, element);
                                    }}
                                  >
                                    <Pencil className="size-3" />
                                    Modifier
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full justify-start"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setOpenActionMenuKey(null);
                                      openElementDetails(element);
                                    }}
                                  >
                                    Détaille
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full justify-start text-destructive hover:text-destructive"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setOpenActionMenuKey(null);
                                      onDeleteElement(element.id);
                                    }}
                                  >
                                    <Trash2 className="size-3" />
                                    Supprimer
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        {index < sortedElements.length - 1 ? (
                          <div className="flex justify-center">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="size-8 rounded-full border-emerald-200 bg-white text-emerald-700 shadow-sm hover:bg-emerald-50"
                              onClick={(event) => {
                                event.stopPropagation();
                                onAddElement(day, index + 1);
                              }}
                            >
                              <Plus className="size-4" />
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-3 h-9 justify-start px-0 text-sm font-semibold text-emerald-700 hover:bg-transparent hover:text-emerald-800"
                  onClick={(event) => {
                    event.stopPropagation();
                    onAddElement(day, sortedElements.length);
                  }}
                >
                  <Plus className="size-4" />
                  Ajouter une activité / élément
                </Button>
              </div>
            );
          })}
        </div>
      </div>
      <Dialog open={Boolean(detailDialogContent)} onOpenChange={(open) => !open && setDetailDialogContent(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailDialogContent?.title || "Détaille"}</DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {detailDialogContent?.description || "-"}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
