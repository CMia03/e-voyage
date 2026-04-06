"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import type { GeoJsonObject } from "geojson";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    if (!sortedDays.length) {
      setSelectedDayId("");
      return;
    }
    if (!sortedDays.some((day) => day.id === selectedDayId)) {
      setSelectedDayId(sortedDays[0].id);
    }
  }, [sortedDays, selectedDayId]);

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
            name: activite?.nom || element.nomActivite || "Activite",
            position: [latitude, longitude],
            image: activite?.image || null,
            description: description || null,
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
            name: hebergement?.nom || element.nomHebergement || "Hebergement",
            position: [latitude, longitude],
            image: hebergement?.image || null,
            description: description || null,
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

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
      <div className="overflow-hidden rounded-2xl border border-border/60">
        {validSegments.length === 0 && dayPlaceMarkers.length === 0 ? (
          <div className="flex h-[620px] items-center justify-center bg-muted/20 px-6 text-center text-sm text-muted-foreground">
            Aucun point geographique lie au jour selectionne. Ajoute un transport, une activite ou un hebergement.
          </div>
        ) : (
          <MapContainer center={mapCenter} zoom={7} className="h-[620px] w-full" preferCanvas>
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
                <div key={transport.id}>
                  {geojson ? (
                    <GeoJSON data={geojson} style={{ color, weight: 5 }} />
                  ) : (
                    <Polyline positions={points} pathOptions={{ color, weight: 5 }} />
                  )}
                  <Marker position={points[0]} icon={transportDepartIcon}>
                    <Popup>
                      <strong>{transport.depart}</strong>
                      <br />
                      Depart (Transport)
                    </Popup>
                  </Marker>
                  <Marker position={points[1]} icon={transportArriveeIcon}>
                    <Popup>
                      <strong>{transport.arrivee}</strong>
                      <br />
                      Arrivee (Transport)
                    </Popup>
                  </Marker>
                </div>
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
                  {marker.type === "ACTIVITE" ? "Activite" : "Hebergement"}
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

      <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
        <div className="mb-4">
          <h3 className="text-base font-semibold">Planning par jour</h3>
          <p className="text-sm text-muted-foreground">{planification.nomPlanification}</p>
        </div>
        <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
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
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  isActive
                    ? "border-emerald-300 bg-emerald-50/70"
                    : "border-border/60 bg-background hover:border-emerald-200 hover:bg-emerald-50/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">Jour {day.numeroJour ?? "-"}</Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatDayDate(day.dateJour)}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-7"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditDay(day);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="size-7"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteDay(day.id);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-sm font-medium">{day.titre || `Jour ${day.numeroJour ?? ""}`}</p>
                <div className="mt-2 flex justify-center">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-8 rounded-full"
                    onClick={(event) => {
                      event.stopPropagation();
                      onAddElement(day, 0);
                    }}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                <div className="mt-3 space-y-2">
                  {sortedElements.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucun bloc pour ce jour.</p>
                  ) : (
                    sortedElements.map((element, index) => (
                      <div key={element.id} className="space-y-2">
                        <div className="rounded-lg border border-border/50 bg-card/70 px-2.5 py-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-medium">{element.titre || element.nomTypeElementJour || "Bloc"}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {element.nomTypeElementJour || "Element"}
                                {element.nomTransport ? ` • ${element.nomTransport}` : ""}
                                {element.nomActivite ? ` • ${element.nomActivite}` : ""}
                                {element.nomHebergement ? ` • ${element.nomHebergement}` : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="size-6"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onEditElement(day.id, element);
                                }}
                              >
                                <Pencil className="size-3" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="size-6"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onDeleteElement(element.id);
                                }}
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="size-7 rounded-full"
                            onClick={(event) => {
                              event.stopPropagation();
                              onAddElement(day, index + 1);
                            }}
                          >
                            <Plus className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
