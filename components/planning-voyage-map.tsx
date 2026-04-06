"use client";

import "leaflet/dist/leaflet.css";

import { useMemo } from "react";
import { GeoJSON, MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { GeoJsonObject } from "geojson";

import { Transport } from "@/lib/type/destination";

type PlanningVoyageMapProps = {
  transports: Transport[];
};

const markerIcon = L.divIcon({
  className: "custom-planning-marker",
  html: '<div style="width:14px;height:14px;border-radius:9999px;background:#14532d;border:2px solid white;box-shadow:0 0 0 2px rgba(20,83,45,.2)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function transportColor(typeName: string) {
  const value = typeName.toLowerCase();
  if (value.includes("avion")) return "#2563eb";
  if (value.includes("bateau")) return "#0891b2";
  if (value.includes("train")) return "#7c3aed";
  if (value.includes("marche")) return "#16a34a";
  return "#dc2626";
}

export function PlanningVoyageMap({ transports }: PlanningVoyageMapProps) {
  const validSegments = useMemo(
    () =>
      transports.filter(
        (transport) =>
          transport.latitudeDepart !== null &&
          transport.longitudeDepart !== null &&
          transport.latitudeArrivee !== null &&
          transport.longitudeArrivee !== null
      ),
    [transports]
  );

  const geojsonSegments = useMemo(
    () =>
      validSegments.map((transport) => {
        if (!transport.geojsonTrajet) {
          return { transport, geojson: null as GeoJsonObject | null };
        }

        try {
          return {
            transport,
            geojson: JSON.parse(transport.geojsonTrajet) as GeoJsonObject,
          };
        } catch {
          return { transport, geojson: null as GeoJsonObject | null };
        }
      }),
    [validSegments]
  );

  const center = useMemo<[number, number]>(() => {
    const first = validSegments[0];
    if (!first || first.latitudeDepart === null || first.longitudeDepart === null) {
      return [-18.8792, 47.5079];
    }

    return [first.latitudeDepart, first.longitudeDepart];
  }, [validSegments]);

  if (validSegments.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 text-center text-sm text-muted-foreground">
        Ajoute des segments avec des positions sur la carte pour afficher le trajet ici.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50">
      <MapContainer center={center} zoom={6} preferCanvas className="h-[420px] w-full">
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
                <GeoJSON
                  data={geojson}
                  style={{
                    color,
                    weight: 5,
                  }}
                />
              ) : (
                <Polyline positions={points} pathOptions={{ color, weight: 5 }} />
              )}
              <Marker position={points[0]} icon={markerIcon}>
                <Popup>
                  <strong>{transport.depart}</strong>
                  <br />
                  Depart en {transport.nomTypeTransport}
                </Popup>
              </Marker>
              <Marker position={points[1]} icon={markerIcon}>
                <Popup>
                  <strong>{transport.arrivee}</strong>
                  <br />
                  Arrivee en {transport.nomTypeTransport}
                  {geojson ? (
                    <>
                      <br />
                      Trajet reel calcule
                    </>
                  ) : null}
                </Popup>
              </Marker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
