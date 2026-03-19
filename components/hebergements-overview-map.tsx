"use client";

import "leaflet/dist/leaflet.css";

import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

type MapHebergement = {
  id: string;
  nom: string;
  latitude: number;
  longitude: number;
  adresse?: string;
};

type HebergementsOverviewMapProps = {
  items: MapHebergement[];
};

const markerIcon = L.divIcon({
  className: "",
  html: `
    <div style="width:16px;height:16px;background:#0f766e;border:3px solid white;border-radius:9999px;box-shadow:0 0 0 4px rgba(15,118,110,.22);"></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export function HebergementsOverviewMap({
  items,
}: HebergementsOverviewMapProps) {
  const validItems = useMemo(
    () =>
      items.filter(
        (item) =>
          Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
      ),
    [items]
  );

  const center = useMemo<[number, number]>(() => {
    if (validItems.length === 0) {
      return [-18.8792, 47.5079];
    }

    const latitude =
      validItems.reduce((sum, item) => sum + item.latitude, 0) / validItems.length;
    const longitude =
      validItems.reduce((sum, item) => sum + item.longitude, 0) / validItems.length;

    return [latitude, longitude];
  }, [validItems]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50">
      <MapContainer
        key={`${validItems.length}-${center[0]}-${center[1]}`}
        center={center}
        zoom={validItems.length > 0 ? 6 : 5}
        scrollWheelZoom
        className="h-[380px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validItems.map((item) => (
          <Marker
            key={item.id}
            icon={markerIcon}
            position={[item.latitude, item.longitude]}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{item.nom}</p>
                {item.adresse ? <p className="text-sm">{item.adresse}</p> : null}
                <p className="text-xs text-slate-500">
                  {item.latitude}, {item.longitude}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
