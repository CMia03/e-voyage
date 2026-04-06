"use client";

import "leaflet/dist/leaflet.css";

import { useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";

type HebergementMapProps = {
  latitude: number;
  longitude: number;
  onChange: (coords: { latitude: number; longitude: number }) => void;
};

const markerIcon = L.divIcon({
  className: "",
  html: `
    <div style="width:18px;height:18px;background:#059669;border:3px solid white;border-radius:9999px;box-shadow:0 0 0 4px rgba(5,150,105,.25);"></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function ClickMarker({
  latitude,
  longitude,
  onChange,
}: HebergementMapProps) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  return <Marker icon={markerIcon} position={[latitude, longitude]} />;
}

export function HebergementMap({
  latitude,
  longitude,
  onChange,
}: HebergementMapProps) {
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const center = useMemo<[number, number]>(
    () => [latitude || -18.8792, longitude || 47.5079],
    [latitude, longitude]
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50">
      <MapContainer
        key={`${center[0]}-${center[1]}`}
        center={center}
        zoom={hasCoordinates ? 13 : 6}
        scrollWheelZoom
        className="h-[320px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickMarker
          latitude={center[0]}
          longitude={center[1]}
          onChange={onChange}
        />
      </MapContainer>
    </div>
  );
}
