"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

type TransportEndpointsMapProps = {
  latitudeDepart: number | null;
  longitudeDepart: number | null;
  latitudeArrivee: number | null;
  longitudeArrivee: number | null;
};

function createPointIcon(label: string, color: string) {
  return L.divIcon({
    className: "custom-transport-endpoint-pin",
    html: `<div style="width:24px;height:24px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 4px rgba(15,23,42,.15);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;">${label}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

const departIcon = createPointIcon("D", "#dc2626");
const arriveeIcon = createPointIcon("A", "#16a34a");

function FitRouteBounds({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length >= 2) {
      map.fitBounds(points, { padding: [30, 30], maxZoom: 13 });
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }

    map.setView([-18.8792, 47.5079], 6);
  }, [map, points]);

  return null;
}

export function TransportEndpointsMap({
  latitudeDepart,
  longitudeDepart,
  latitudeArrivee,
  longitudeArrivee,
}: TransportEndpointsMapProps) {
  const hasDepart = Number.isFinite(latitudeDepart) && Number.isFinite(longitudeDepart);
  const hasArrivee = Number.isFinite(latitudeArrivee) && Number.isFinite(longitudeArrivee);

  const points = useMemo<[number, number][]>(() => {
    const next: [number, number][] = [];
    if (hasDepart) next.push([latitudeDepart as number, longitudeDepart as number]);
    if (hasArrivee) next.push([latitudeArrivee as number, longitudeArrivee as number]);
    return next;
  }, [hasDepart, hasArrivee, latitudeDepart, longitudeDepart, latitudeArrivee, longitudeArrivee]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50">
      <MapContainer center={[-18.8792, 47.5079]} zoom={6} className="h-[280px] w-full" preferCanvas>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FitRouteBounds points={points} />

        {hasDepart ? <Marker position={[latitudeDepart as number, longitudeDepart as number]} icon={departIcon} /> : null}
        {hasArrivee ? <Marker position={[latitudeArrivee as number, longitudeArrivee as number]} icon={arriveeIcon} /> : null}
        {hasDepart && hasArrivee ? (
          <Polyline
            positions={[
              [latitudeDepart as number, longitudeDepart as number],
              [latitudeArrivee as number, longitudeArrivee as number],
            ]}
            pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.85 }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
