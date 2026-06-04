"use client";

import {
  Circle,
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect } from "react";

type MapPoint = {
  id: string;
  title: string;
  type: "DESTINATION" | "TRANSPORT" | "HEBERGEMENT" | "ACTIVITE" | "AUTRE";
  images: string[];
  description: string;
  position: [number, number];
  dayLabel: string;
};

type ReservationMapLeafletProps = {
  points: MapPoint[];
  mapPoints: MapPoint[];
  filteredPoints: MapPoint[];
  selectedId: string;
  center: [number, number];
  hasDistanceFilter: boolean;
  referencePosition: [number, number] | null;
  distanceNumber: number;
  onSelectPoint: (id: string) => void;
  onReferencePick: (position: [number, number]) => void;
};

function typeLabel(type: MapPoint["type"]) {
  if (type === "HEBERGEMENT") return "Hébergement";
  if (type === "ACTIVITE") return "Activité";
  if (type === "TRANSPORT") return "Transport";
  if (type === "DESTINATION") return "Destination";
  return "Autre";
}

function typeColor(type: MapPoint["type"]) {
  if (type === "TRANSPORT") return "#2563eb";
  if (type === "HEBERGEMENT") return "#10b981";
  if (type === "DESTINATION") return "#0f766e";
  if (type === "ACTIVITE") return "#f59e0b";
  return "#64748b";
}

function displayPointTitle(point: MapPoint) {
  if (point.type !== "TRANSPORT") return point.title;
  return point.title.replace(/\s+-\s+(départ|arrivée|dÃ©part|arrivÃ©e)$/i, "");
}

function FitMapToPoints({ points }: { points: MapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;

      const container = map.getContainer();
      if (!container || !container.isConnected) return;

      map.invalidateSize();
      window.requestAnimationFrame(() => {
        if (cancelled) return;

        try {
          if (points.length === 1) {
            map.setView(points[0].position, 11);
            return;
          }

          map.fitBounds(points.map((point) => point.position), {
            padding: [42, 42],
            maxZoom: 12,
          });
        } catch {
          // Leaflet can briefly expose no map pane while Next refreshes/remounts the map.
        }
      });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [map, points]);

  return null;
}

function CursorReferencePicker({ onPick }: { onPick: (position: [number, number]) => void }) {
  useMapEvents({
    click(event) {
      onPick([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

export default function ReservationMapLeaflet({
  points,
  mapPoints,
  filteredPoints,
  selectedId,
  center,
  hasDistanceFilter,
  referencePosition,
  distanceNumber,
  onSelectPoint,
  onReferencePick,
}: ReservationMapLeafletProps) {
  if (points.length === 0) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center px-8 text-center text-slate-500">
        Aucune localisation ne correspond aux filtres.
      </div>
    );
  }

  return (
    <MapContainer center={center} zoom={8} scrollWheelZoom className="h-full min-h-[420px] w-full">
      <FitMapToPoints points={mapPoints} />
      <CursorReferencePicker onPick={onReferencePick} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mapPoints.length > 1 ? (
        <Polyline
          positions={mapPoints.map((point) => point.position)}
          pathOptions={{ color: "#059669", weight: 3, opacity: 0.5 }}
        />
      ) : null}
      {hasDistanceFilter && referencePosition ? (
        <Circle
          center={referencePosition}
          radius={distanceNumber * 1000}
          pathOptions={{ color: "#059669", fillColor: "#10b981", fillOpacity: 0.08, weight: 2 }}
        />
      ) : null}
      {referencePosition ? (
        <CircleMarker
          center={referencePosition}
          radius={10}
          pathOptions={{ color: "#0f172a", fillColor: "#ffffff", fillOpacity: 1, weight: 3 }}
        >
          <Tooltip permanent direction="bottom" offset={[0, 12]} opacity={0.95}>
            Référence
          </Tooltip>
        </CircleMarker>
      ) : null}
      {mapPoints.map((point) => {
        const isSelected = point.id === selectedId;
        const isFilteredOut = filteredPoints.length === 0 && hasDistanceFilter;
        return (
          <CircleMarker
            key={point.id}
            center={point.position}
            radius={isSelected ? 12 : 8}
            eventHandlers={{ click: () => onSelectPoint(point.id) }}
            pathOptions={{
              color: "#ffffff",
              fillColor: typeColor(point.type),
              fillOpacity: isFilteredOut ? 0.35 : 1,
              weight: isSelected ? 4 : 3,
            }}
          >
            {isSelected ? (
              <Tooltip permanent direction="top" offset={[0, -12]} opacity={0.95}>
                {displayPointTitle(point)}
              </Tooltip>
            ) : null}
            <Popup>
              <strong>{displayPointTitle(point)}</strong>
              <br />
              {typeLabel(point.type)}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
