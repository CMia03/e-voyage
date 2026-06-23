"use client";

import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo } from "react";

type MapPoint = {
  id: string;
  title: string;
  type: "DESTINATION" | "TRANSPORT" | "HEBERGEMENT" | "ACTIVITE" | "AUTRE";
  images: string[];
  description: string;
  position: [number, number];
  dayLabel: string;
  stepNumber?: number | null;
};

type ReservationMapLeafletProps = {
  mapPoints: MapPoint[];
  selectedId: string;
  center: [number, number];
  hasDistanceFilter: boolean;
  referencePosition: [number, number] | null;
  distanceNumber: number;
  showRouteLine: boolean;
  showRouteArrows: boolean;
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

function displayPointTitle(point: MapPoint) {
  if (point.type !== "TRANSPORT") return point.title;
  return point.title.replace(/\s+-\s+(départ|arrivée|dÃ©part|arrivÃ©e)$/i, "");
}

function isTransportArrivalPoint(point: MapPoint) {
  return point.type === "TRANSPORT" && /\s+-\s+(arrivée|arrivÃ©e)$/i.test(point.title);
}

function getBearing(from: [number, number], to: [number, number]) {
  const fromLat = (from[0] * Math.PI) / 180;
  const toLat = (to[0] * Math.PI) / 180;
  const deltaLng = ((to[1] - from[1]) * Math.PI) / 180;
  const y = Math.sin(deltaLng) * Math.cos(toLat);
  const x = Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function interpolatePosition(from: [number, number], to: [number, number], ratio: number): [number, number] {
  return [
    from[0] + (to[0] - from[0]) * ratio,
    from[1] + (to[1] - from[1]) * ratio,
  ];
}

function buildLegacyArrowIcon(angle: number) {
  return L.divIcon({
    className: "reservation-route-arrow",
    html: `<div style="width:24px;height:24px;border-radius:999px;background:#059669;color:white;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 14px rgba(5,150,105,.28);transform:rotate(${angle}deg);font-size:16px;font-weight:800;line-height:1;">↑</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function buildArrowIcon(angle: number) {
  void buildLegacyArrowIcon;
  return L.divIcon({
    className: "reservation-route-arrow",
    html: `<div style="width:22px;height:22px;display:flex;align-items:center;justify-content:center;transform:rotate(${angle}deg);filter:drop-shadow(0 2px 4px rgba(15,23,42,.22));">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3l7.5 8.5h-5V21h-5v-9.5h-5L12 3z" fill="#059669"/>
      </svg>
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function buildPinPointIcon(point: MapPoint, stepNumber: number | null, isSelected: boolean) {
  const width = isSelected ? 36 : 32;
  const height = isSelected ? 46 : 40;
  const number = stepNumber === null ? "" : String(stepNumber);
  const content = number
    ? `<span style="position:absolute;left:50%;top:35%;transform:translate(-50%,-50%);color:#ef4444;font-size:${isSelected ? 12 : 11}px;font-weight:900;line-height:1;">${number}</span>`
    : "";

  return L.divIcon({
    className: "reservation-pin-point",
    html: `<div style="position:relative;width:${width}px;height:${height}px;filter:drop-shadow(0 7px 12px rgba(15,23,42,.25));">
      <svg width="${width}" height="${height}" viewBox="0 0 64 82" fill="none" aria-hidden="true">
        <path d="M32 0C14.5 0 0 14.2 0 31.7C0 56.2 32 82 32 82C32 82 64 56.2 64 31.7C64 14.2 49.5 0 32 0Z" fill="#ef000f"/>
        <circle cx="32" cy="30" r="14" fill="white"/>
      </svg>
      ${content}
    </div>`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height],
    tooltipAnchor: [0, -height],
  });
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
  mapPoints,
  selectedId,
  center,
  hasDistanceFilter,
  referencePosition,
  distanceNumber,
  showRouteLine,
  showRouteArrows,
  onSelectPoint,
  onReferencePick,
}: ReservationMapLeafletProps) {
  const routePoints = useMemo(
    () =>
      mapPoints
        .filter((point) => point.type !== "DESTINATION")
        .filter((point) => typeof point.stepNumber === "number")
        .slice()
        .sort((first, second) => (first.stepNumber ?? Number.MAX_SAFE_INTEGER) - (second.stepNumber ?? Number.MAX_SAFE_INTEGER)),
    [mapPoints]
  );

  const routeArrows = useMemo(() => {
    if (routePoints.length < 2) return [];
    return routePoints.slice(0, -1).flatMap((point, index) => {
      const nextPoint = routePoints[index + 1];
      const angle = getBearing(point.position, nextPoint.position);
      return [
        {
          id: `${point.id}-${nextPoint.id}-${index}-start`,
          position: interpolatePosition(point.position, nextPoint.position, 0.04),
          angle,
        },
        {
          id: `${point.id}-${nextPoint.id}-${index}-end`,
          position: interpolatePosition(point.position, nextPoint.position, 0.96),
          angle,
        },
      ];
    });
  }, [routePoints]);

  return (
    <MapContainer center={center} zoom={8} scrollWheelZoom className="h-full min-h-[420px] w-full">
      <FitMapToPoints points={mapPoints} />
      <CursorReferencePicker onPick={onReferencePick} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
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
          radius={8}
          pathOptions={{ color: "#059669", fillColor: "#ffffff", fillOpacity: 1, weight: 3 }}
        >
          <Tooltip permanent direction="bottom" offset={[0, 10]} opacity={0.95}>
            Centre
          </Tooltip>
        </CircleMarker>
      ) : null}
      {showRouteLine && routePoints.length > 1 ? (
        <Polyline
          positions={routePoints.map((point) => point.position)}
          pathOptions={{ color: "#059669", dashArray: "10 12", lineCap: "round", weight: 3, opacity: 0.65 }}
        />
      ) : null}
      {showRouteArrows
        ? routeArrows.map((arrow) => (
            <Marker key={arrow.id} position={arrow.position} icon={buildArrowIcon(arrow.angle)} interactive={false} />
          ))
        : null}
      {mapPoints.map((point) => {
        const isSelected = point.id === selectedId;
        const stepNumber =
          point.type === "DESTINATION" || isTransportArrivalPoint(point)
            ? null
            : point.stepNumber ?? null;
        return (
          <Marker
            key={point.id}
            position={point.position}
            icon={buildPinPointIcon(point, stepNumber, isSelected)}
            eventHandlers={{ click: () => onSelectPoint(point.id) }}
          >
            {isSelected ? (
              <Tooltip permanent direction="top" offset={[0, -16]} opacity={0.95}>
                {displayPointTitle(point)}
              </Tooltip>
            ) : null}
            <Popup>
              <strong>{displayPointTitle(point)}</strong>
              <br />
              {typeLabel(point.type)}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
