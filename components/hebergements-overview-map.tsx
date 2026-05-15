"use client";

import "leaflet/dist/leaflet.css";

import Link from "next/link";
import { useMemo } from "react";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";

type MapHebergement = {
  id: string;
  nom: string;
  latitude: number;
  longitude: number;
  adresse?: string;
  description?: string;
  urlImagePrincipale?: string;
  imagePrincipale?: string;
};

type HebergementsOverviewMapProps = {
  items: MapHebergement[];
  referencePoint?: { latitude: number; longitude: number } | null;
  onReferencePointChange?: (coords: { latitude: number; longitude: number }) => void;
  getDetailHref?: (item: MapHebergement) => string;
};

const markerIcon = L.divIcon({
  className: "",
  html: `
    <div style="width:16px;height:16px;background:#0f766e;border:3px solid white;border-radius:9999px;box-shadow:0 0 0 4px rgba(15,118,110,.22);"></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const referenceIcon = L.divIcon({
  className: "",
  html: `
    <div style="width:18px;height:18px;background:#f59e0b;border:3px solid white;border-radius:9999px;box-shadow:0 0 0 5px rgba(245,158,11,.25);"></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function MapClickHandler({
  onReferencePointChange,
}: {
  onReferencePointChange?: (coords: { latitude: number; longitude: number }) => void;
}) {
  useMapEvents({
    click(event) {
      onReferencePointChange?.({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  return null;
}

export function HebergementsOverviewMap({
  items,
  referencePoint,
  onReferencePointChange,
  getDetailHref,
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
        <MapClickHandler onReferencePointChange={onReferencePointChange} />
        {referencePoint ? (
          <>
            <CircleMarker
              center={[referencePoint.latitude, referencePoint.longitude]}
              radius={18}
              pathOptions={{
                color: "#f59e0b",
                fillColor: "#f59e0b",
                fillOpacity: 0.12,
                weight: 2,
              }}
            />
            <Marker
              icon={referenceIcon}
              position={[referencePoint.latitude, referencePoint.longitude]}
            >
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">Point de recherche</p>
                  <p className="text-xs text-slate-500">
                    {referencePoint.latitude}, {referencePoint.longitude}
                  </p>
                </div>
              </Popup>
            </Marker>
          </>
        ) : null}
        {validItems.map((item) => (
          <Marker
            key={item.id}
            icon={markerIcon}
            position={[item.latitude, item.longitude]}
          >
            <Popup>
              <Link
                href={getDetailHref?.(item) ?? "#"}
                className={`block w-[180px] space-y-2 rounded-md text-slate-900 outline-none transition hover:text-emerald-700 sm:w-[200px] ${
                  getDetailHref ? "cursor-pointer" : "pointer-events-none"
                }`}
              >
                {item.urlImagePrincipale || item.imagePrincipale ? (
                  <div className="flex aspect-[4/3] w-full items-center justify-center rounded-md bg-slate-100 p-1">
                    <img
                      src={item.urlImagePrincipale ?? item.imagePrincipale}
                      alt={item.nom}
                      className="h-full w-full rounded object-contain"
                    />
                  </div>
                ) : null}
                <p className="font-semibold">{item.nom}</p>
                {item.adresse ? <p className="text-sm">{item.adresse}</p> : null}
                {item.description ? (
                  <p className="line-clamp-3 text-sm text-slate-600">{item.description}</p>
                ) : null}
                <p className="text-xs text-slate-500">
                  {item.latitude}, {item.longitude}
                </p>
                {getDetailHref ? (
                  <p className="text-xs font-semibold text-emerald-700">
                    Voir le detail
                  </p>
                ) : null}
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
