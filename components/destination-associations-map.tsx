"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import type { DestinationAssociationItem } from "@/lib/type/destination";

type MapItem = DestinationAssociationItem & {
  type: "hebergement" | "activite";
  latitude: number;
  longitude: number;
};

type DestinationAssociationsMapProps = {
  items: (DestinationAssociationItem & { type: "hebergement" | "activite" })[];
  pendingKey?: string | null;
  focusedItemId?: string | null;
  onToggle: (item: MapItem, checked: boolean) => void;
  onFocusChange: (item: MapItem) => void;
};

function getMarkerIcon(item: MapItem) {
  const accent = item.type === "hebergement" ? "#b45309" : "#0f766e";
  const imageHtml = item.image
    ? `<img src="${item.image}" alt="${item.nom}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#e2e8f0;color:#475569;font-size:10px;font-weight:700;">${item.nom.slice(0, 1).toUpperCase()}</div>`;

  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:42px;height:42px;">
        <div style="overflow:hidden;width:42px;height:42px;border-radius:9999px;border:3px solid white;box-shadow:0 10px 24px rgba(15,23,42,.22);background:white;">
          ${imageHtml}
        </div>
        <div style="position:absolute;right:-2px;bottom:-2px;width:14px;height:14px;border-radius:9999px;background:${accent};border:2px solid white;"></div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

function FocusOnItem({ item }: { item: MapItem | null }) {
  const map = useMap();

  useEffect(() => {
    if (!item) {
      return;
    }

    map.flyTo([item.latitude, item.longitude], Math.max(map.getZoom(), 10), {
      animate: true,
      duration: 0.9,
    });
  }, [item, map]);

  return null;
}

export function DestinationAssociationsMap({
  items,
  pendingKey,
  focusedItemId,
  onToggle,
  onFocusChange,
}: DestinationAssociationsMapProps) {
  function toNumber(value: number | string | null | undefined) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  const validItems = useMemo(
    () =>
      items
        .map((item) => {
          const latitude = toNumber(item.latitude);
          const longitude = toNumber(item.longitude);

          if (latitude === null || longitude === null) {
            return null;
          }

          return {
            ...item,
            latitude,
            longitude,
          };
        })
        .filter((item): item is MapItem => item !== null),
    [items]
  );

  const focusedItem = useMemo(
    () => validItems.find((item) => item.id === focusedItemId) ?? validItems[0] ?? null,
    [focusedItemId, validItems]
  );

  const center = useMemo<[number, number]>(() => {
    if (!focusedItem) {
      return [-18.8792, 47.5079];
    }

    return [focusedItem.latitude, focusedItem.longitude];
  }, [focusedItem]);

  if (validItems.length === 0) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-2xl border border-dashed border-border/50 bg-muted/20 px-6 text-center text-sm text-muted-foreground">
        Aucune position disponible pour afficher les activites et hebergements sur la carte.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50">
      <MapContainer
        key={`${validItems.length}-${center[0]}-${center[1]}`}
        center={center}
        zoom={8}
        scrollWheelZoom
        className="h-[520px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FocusOnItem item={focusedItem} />

        {validItems.map((item) => (
          <Marker
            key={`${item.type}-${item.id}`}
            icon={getMarkerIcon(item)}
            position={[item.latitude, item.longitude]}
            eventHandlers={{
              click: () => onFocusChange(item),
            }}
          />
        ))}
      </MapContainer>

      {focusedItem ? (
        <div className="pointer-events-none absolute left-4 top-4 z-[500] w-[260px]">
          <div className="pointer-events-auto overflow-hidden rounded-2xl border border-border/60 bg-background/95 shadow-xl backdrop-blur">
            {focusedItem.image ? (
              <img
                src={focusedItem.image}
                alt={focusedItem.nom}
                className="h-36 w-full object-cover"
              />
            ) : (
              <div className="flex h-36 w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">
                Aucune image
              </div>
            )}
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {focusedItem.type === "hebergement" ? "Hebergement" : "Activite"}
                  </p>
                  <h3 className="text-base font-semibold leading-5">{focusedItem.nom}</h3>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    focusedItem.estSelectionne
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {focusedItem.estSelectionne ? "Actif" : "Non associe"}
                </span>
              </div>

              {focusedItem.place ? (
                <p className="text-sm text-foreground/80">{focusedItem.place}</p>
              ) : null}
              {focusedItem.region ? (
                <p className="text-sm text-muted-foreground">{focusedItem.region}</p>
              ) : null}

              <button
                type="button"
                disabled={pendingKey === `${focusedItem.type}-${focusedItem.id}`}
                onClick={() => onToggle(focusedItem, !focusedItem.estSelectionne)}
                className={`w-full rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  focusedItem.estSelectionne
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {pendingKey === `${focusedItem.type}-${focusedItem.id}`
                  ? "Mise a jour..."
                  : focusedItem.estSelectionne
                    ? "Retirer de la destination"
                    : "Activer pour la destination"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
