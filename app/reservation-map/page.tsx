"use client";

import "leaflet/dist/leaflet.css";

import { Search } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type PointType = "ALL" | "DESTINATION" | "TRANSPORT" | "HEBERGEMENT" | "ACTIVITE" | "AUTRE";

type GeoJsonFeature = {
  type: "Feature";
  geometry?: {
    type?: string;
    coordinates?: [number, number];
  };
  properties?: {
    title?: string;
    name?: string;
    type?: string;
    imageUrl?: string;
    images?: string[];
    description?: string;
  };
};

type GeoJsonPayload = {
  type: "FeatureCollection";
  features?: GeoJsonFeature[];
};

type MapPoint = {
  id: string;
  title: string;
  type: Exclude<PointType, "ALL">;
  images: string[];
  description: string;
  position: [number, number];
  dayLabel: string;
};

const LOGO_URL = "https://res.cloudinary.com/de2qmidtl/image/upload/v1780475983/logo_cool_voyage_kkzeoo.png";

const ReservationMapLeaflet = dynamic(() => import("./reservation-map-leaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[420px] items-center justify-center px-8 text-center text-slate-500">
      Chargement de la carte...
    </div>
  ),
});

function fixLegacyEncoding(value: string) {
  return value
    .replace(/â€š/g, "é")
    .replace(/‚/g, "é")
    .replace(/â€¦/g, "à")
    .replace(/…/g, "à")
    .replace(/â€“/g, "û")
    .replace(/–/g, "û")
    .replace(/â€œ/g, "ô")
    .replace(/“/g, "ô")
    .replace(/Å /g, "è")
    .replace(/Š/g, "è")
    .replace(/Å’/g, "î")
    .replace(/Œ/g, "î")
    .replace(/Ã—/g, "Î")
    .replace(/×/g, "Î")
    .replace(/Ã©/g, "é")
    .replace(/Ã¨/g, "è")
    .replace(/Ãª/g, "ê")
    .replace(/Ã /g, "à")
    .replace(/Ã´/g, "ô")
    .replace(/Ã»/g, "û")
    .replace(/Ã®/g, "î")
    .replace(/ÃŽ/g, "Î");
}

function normalizePointType(value?: string): MapPoint["type"] {
  const normalized = fixLegacyEncoding(value ?? "").toUpperCase();
  if (normalized.includes("TRANSPORT")) return "TRANSPORT";
  if (normalized.includes("HEBERG")) return "HEBERGEMENT";
  if (normalized.includes("ACTIV")) return "ACTIVITE";
  if (normalized.includes("DESTINATION")) return "DESTINATION";
  return "AUTRE";
}

function inferPointType(title: string, explicitType?: string): MapPoint["type"] {
  const fromType = normalizePointType(explicitType);
  if (fromType !== "AUTRE") return fromType;

  const value = title.toLowerCase();
  if (value.includes("transport") || value.includes("départ") || value.includes("arrivée")) return "TRANSPORT";
  if (value.includes("hébergement")) return "HEBERGEMENT";
  if (value.includes("sainte marie") && !value.includes("jour")) return "DESTINATION";
  return "ACTIVITE";
}

function parseMapData(rawData: string | null): MapPoint[] {
  if (!rawData) return [];

  try {
    const parsed = JSON.parse(rawData) as GeoJsonPayload;
    return (parsed.features ?? [])
      .map((feature, index) => {
        const coordinates = feature.geometry?.coordinates;
        if (!coordinates || coordinates.length < 2) return null;

        const title = fixLegacyEncoding(
          feature.properties?.title || feature.properties?.name || `Point ${index + 1}`
        );
        const dayMatch = title.match(/Jour\s+\d+/i);

        return {
          id: `${coordinates[0]}-${coordinates[1]}-${index}`,
          title,
          type: inferPointType(title, feature.properties?.type),
          images:
            feature.properties?.images?.filter((image): image is string => Boolean(image)) ??
            (feature.properties?.imageUrl ? [feature.properties.imageUrl] : []),
          description: fixLegacyEncoding(feature.properties?.description || ""),
          position: [coordinates[1], coordinates[0]] as [number, number],
          dayLabel: dayMatch?.[0] ?? "Destination",
        };
      })
      .filter((point): point is MapPoint => Boolean(point));
  } catch {
    return [];
  }
}

function distanceKm(from: [number, number], to: [number, number]) {
  const radius = 6371;
  const dLat = ((to[0] - from[0]) * Math.PI) / 180;
  const dLng = ((to[1] - from[1]) * Math.PI) / 180;
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function typeLabel(type: MapPoint["type"]) {
  if (type === "HEBERGEMENT") return "Hébergement";
  if (type === "ACTIVITE") return "Activité";
  if (type === "TRANSPORT") return "Transport";
  if (type === "DESTINATION") return "Destination";
  return "Autre";
}

function displayPointTitle(point: MapPoint) {
  if (point.type !== "TRANSPORT") return point.title;
  return point.title.replace(/\s+-\s+(départ|arrivée)$/i, "");
}

export default function ReservationMapPage() {
  const searchParams = useSearchParams();
  const points = useMemo(() => parseMapData(searchParams.get("data")), [searchParams]);
  const [selectedId, setSelectedId] = useState("");
  const [typeFilter, setTypeFilter] = useState<PointType>("ALL");
  const [query, setQuery] = useState("");
  const [distanceKmValue, setDistanceKmValue] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [cursorReference, setCursorReference] = useState<[number, number] | null>(null);

  const selectedPoint = points.find((point) => point.id === selectedId) ?? null;
  const referencePoint = points.find((point) => point.id === referenceId) ?? null;
  const referencePosition = cursorReference ?? referencePoint?.position ?? null;
  const distanceNumber = Number(distanceKmValue);
  const hasDistanceFilter = distanceKmValue.trim() !== "" && Number.isFinite(distanceNumber) && distanceNumber >= 0;

  const filteredPoints = useMemo(() => {
    const normalizedQuery = fixLegacyEncoding(query).trim().toLowerCase();

    return points.filter((point) => {
      const matchesType = typeFilter === "ALL" || point.type === typeFilter;
      const matchesQuery = !normalizedQuery || point.title.toLowerCase().includes(normalizedQuery);
      const matchesDistance =
        !hasDistanceFilter ||
        !referencePosition ||
        distanceKm(referencePosition, point.position) <= distanceNumber;
      return matchesType && matchesQuery && matchesDistance;
    });
  }, [distanceNumber, hasDistanceFilter, points, query, referencePosition, typeFilter]);

  const center = referencePosition ?? selectedPoint?.position ?? points[0]?.position ?? ([-18.8792, 47.5079] as [number, number]);
  const mapPoints = filteredPoints.length > 0 ? filteredPoints : points;
  const groupedPoints = useMemo(() => {
    const groups = new Map<string, MapPoint[]>();
    filteredPoints.forEach((point) => {
      const current = groups.get(point.dayLabel) ?? [];
      const displayTitle = displayPointTitle(point);
      const alreadyAdded = current.some(
        (item) => item.type === point.type && displayPointTitle(item) === displayTitle
      );
      if (!alreadyAdded) current.push(point);
      groups.set(point.dayLabel, current);
    });
    return Array.from(groups.entries());
  }, [filteredPoints]);

  return (
    <main className="h-screen overflow-hidden bg-slate-50">
      <header className="flex h-[88px] items-center gap-4 border-b border-slate-200 bg-white px-5">
        <div
          className="h-14 w-20 shrink-0 bg-contain bg-left bg-no-repeat"
          style={{ backgroundImage: `url(${LOGO_URL})` }}
          aria-label="Cool Voyage"
        />
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto">
          <div className="relative min-w-[280px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher une étape, un lieu..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as PointType)}
            className="h-11 w-[150px] shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-emerald-400"
          >
            <option value="ALL">Tous</option>
            <option value="HEBERGEMENT">Hébergement</option>
            <option value="ACTIVITE">Activité</option>
            <option value="TRANSPORT">Transport</option>
            <option value="DESTINATION">Destination</option>
            <option value="AUTRE">Autre</option>
          </select>
          <input
            type="number"
            min="0"
            step="1"
            value={distanceKmValue}
            onChange={(event) => setDistanceKmValue(event.target.value)}
            placeholder="Distance (km)"
            className="h-11 w-[135px] shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-emerald-400"
          />
          <select
            value={referenceId}
            onChange={(event) => {
              setReferenceId(event.target.value);
              setCursorReference(null);
            }}
            className="h-11 w-[220px] shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-emerald-400"
          >
            <option value="">Point de référence</option>
            {points.map((point) => (
              <option key={point.id} value={point.id}>
                {displayPointTitle(point)}
              </option>
            ))}
          </select>

          {/* <div className="h-11 w-[140px] shrink-0 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
            {filteredPoints.length} / {points.length}
          </div> */}
          
        </div>
      </header>

      <div className="grid h-[calc(100vh-88px)] grid-cols-1 lg:grid-cols-[330px_minmax(0,1fr)_380px]">
        <aside className="order-2 h-full overflow-y-auto border-r border-slate-200 bg-white p-5 lg:order-1">
          {selectedPoint ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold leading-tight text-slate-950">{displayPointTitle(selectedPoint)}</h1>
                {selectedPoint.description ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {selectedPoint.description}
                  </p>
                ) : null}
              </div>
              {selectedPoint.images.length > 0 ? (
                <div className="space-y-3">
                  {selectedPoint.images.map((image, index) => (
                    <img
                      key={`${image}-${index}`}
                      src={image}
                      alt={displayPointTitle(selectedPoint)}
                      className="w-full rounded-2xl border border-slate-200 object-cover"
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex h-full min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center text-sm text-slate-500">
              Cliquez sur un point de la carte ou une étape dans la liste pour afficher ses informations.
            </div>
          )}
        </aside>

        <section className="order-1 min-h-[420px] lg:order-2">
          <ReservationMapLeaflet
            points={points}
            mapPoints={mapPoints}
            filteredPoints={filteredPoints}
            selectedId={selectedId}
            center={center}
            hasDistanceFilter={hasDistanceFilter}
            referencePosition={referencePosition}
            distanceNumber={distanceNumber}
            onSelectPoint={setSelectedId}
            onReferencePick={(position) => {
              setCursorReference(position);
              setReferenceId("");
            }}
          />
        </section>
        <aside className="order-3 h-full overflow-y-auto border-l border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">Étapes journalières</h2>
          <p className="mt-1 text-sm text-slate-500">Cliquez sur une étape pour afficher ses informations.</p>
          <div className="mt-5 space-y-5">
            {groupedPoints.map(([day, items]) => (
              <section key={day} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-950">{day}</h3>
                <div className="mt-3 space-y-2">
                  {items.map((point) => (
                    <button
                      key={point.id}
                      type="button"
                      onClick={() => setSelectedId(point.id)}
                      className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                        point.id === selectedPoint?.id
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-slate-700 shadow-sm hover:bg-emerald-50 hover:text-emerald-800"
                      }`}
                    >
                      <span className="block text-[11px] font-semibold uppercase tracking-wide opacity-75">
                        {typeLabel(point.type)}
                      </span>
                      <span className="mt-1 block">{displayPointTitle(point)}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
