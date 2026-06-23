"use client";

import "leaflet/dist/leaflet.css";

import { Search } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { API_BASE_URL } from "@/lib/api";

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

type GeoJsonItineraryItem = {
  id?: string;
  dayNumber?: number | null;
  title?: string | null;
  type?: string | null;
  order?: number | null;
  startTime?: string | null;
  endTime?: string | null;
};

type GeoJsonPayload = {
  type: "FeatureCollection";
  features?: GeoJsonFeature[];
  itinerary?: GeoJsonItineraryItem[];
};

type MapPoint = {
  id: string;
  title: string;
  type: Exclude<PointType, "ALL">;
  images: string[];
  description: string;
  position: [number, number];
  dayLabel: string;
  stepNumber?: number | null;
};

type ItineraryStep = {
  id: string;
  dayLabel: string;
  dayNumber: number | null;
  title: string;
  type: Exclude<PointType, "ALL">;
  order: number | null;
  startTime: string | null;
  endTime: string | null;
  stepNumber: number;
  pointId: string | null;
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
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

function stripDayPrefix(value: string) {
  return value.replace(/^Jour\s+\d+\s+-\s+/i, "").trim();
}

function stripTransportEndpoint(value: string) {
  return value.replace(/\s+-\s+(départ|arrivée|dÃ©part|arrivÃ©e)$/i, "").trim();
}

function normalizeStepTitle(value: string) {
  return stripTransportEndpoint(stripDayPrefix(fixLegacyEncoding(value))).toLowerCase();
}

function stepKey(dayLabel: string, type: MapPoint["type"], title: string) {
  return `${dayLabel}-${type}-${normalizeStepTitle(title)}`;
}

function parseMapData(rawData: string | null): { points: MapPoint[]; itinerary: ItineraryStep[] } {
  if (!rawData) return { points: [], itinerary: [] };

  try {
    const parsed = JSON.parse(rawData) as GeoJsonPayload;
    const rawPoints = (parsed.features ?? [])
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

    const pointsByStepKey = new Map<string, MapPoint[]>();
    rawPoints.forEach((point) => {
      if (point.type === "DESTINATION") return;
      const key = stepKey(point.dayLabel, point.type, point.title);
      const current = pointsByStepKey.get(key) ?? [];
      current.push(point);
      pointsByStepKey.set(key, current);
    });

    const itinerary = (parsed.itinerary ?? [])
      .map((item, index): ItineraryStep | null => {
        const dayNumber = typeof item.dayNumber === "number" ? item.dayNumber : null;
        const title = fixLegacyEncoding(item.title ?? "").trim();
        if (!title) return null;

        const type = normalizePointType(item.type ?? undefined);
        const dayLabel = dayNumber && dayNumber > 0 ? `Jour ${dayNumber}` : "Destination";
        const matchingPoints = pointsByStepKey.get(stepKey(dayLabel, type, title)) ?? [];

        return {
          id: item.id || `${dayLabel}-${type}-${index}`,
          dayLabel,
          dayNumber,
          title,
          type,
          order: typeof item.order === "number" ? item.order : null,
          startTime: item.startTime ?? null,
          endTime: item.endTime ?? null,
          stepNumber: index + 1,
          pointId: matchingPoints[0]?.id ?? null,
        };
      })
      .filter((item): item is ItineraryStep => Boolean(item));

    const stepNumberByPointId = new Map<string, number>();
    itinerary.forEach((item) => {
      const matchingPoints = pointsByStepKey.get(stepKey(item.dayLabel, item.type, item.title)) ?? [];
      matchingPoints.forEach((point) => stepNumberByPointId.set(point.id, item.stepNumber));
    });

    const points = rawPoints.map((point) => ({
      ...point,
      stepNumber: stepNumberByPointId.get(point.id) ?? null,
    }));

    return { points, itinerary };
  } catch {
    return { points: [], itinerary: [] };
  }
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

function parseStepDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMapDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

export default function ReservationMapPage() {
  const searchParams = useSearchParams();
  const rawMapData = searchParams.get("data");
  const reservationId = searchParams.get("reservationId");
  const [remoteMapData, setRemoteMapData] = useState<string | null>(null);
  const mapData = useMemo(() => parseMapData(rawMapData ?? remoteMapData), [rawMapData, remoteMapData]);
  const points = mapData.points;
  const itinerary = mapData.itinerary;
  const [selectedId, setSelectedId] = useState("");
  const [typeFilter, setTypeFilter] = useState<PointType>("ALL");
  const [query, setQuery] = useState("");
  const [distanceKmValue, setDistanceKmValue] = useState("");
  const [locationId, setLocationId] = useState("");
  const [cursorReference, setCursorReference] = useState<[number, number] | null>(null);
  const [showRouteLine, setShowRouteLine] = useState(true);
  const [showRouteArrows, setShowRouteArrows] = useState(true);

  useEffect(() => {
    if (!reservationId || rawMapData) {
      return;
    }

    let cancelled = false;

    fetch(`${API_BASE_URL}/api/public/reservations/${encodeURIComponent(reservationId)}/map`)
      .then(async (response) => {
        const payload = (await response.json()) as ApiEnvelope<string>;
        if (!response.ok || payload.success === false || !payload.data) {
          throw new Error(payload.message || "Carte indisponible");
        }
        if (!cancelled) {
          setRemoteMapData(payload.data);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setRemoteMapData(null);
          console.error(error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [rawMapData, reservationId]);

  const selectedPoint =
    points.find((point) => point.id === selectedId) ??
    points.find((point) => point.type === "DESTINATION") ??
    null;
  const effectiveSelectedId = selectedPoint?.id ?? "";
  const defaultLocation = points.find((point) => point.type === "DESTINATION") ?? points[0] ?? null;
  const effectiveLocationId = locationId || defaultLocation?.id || "";
  const locationPoint = points.find((point) => point.id === effectiveLocationId) ?? null;
  const referencePosition = cursorReference ?? locationPoint?.position ?? null;
  const distanceNumber = Number(distanceKmValue);
  const hasDistanceFilter = distanceKmValue.trim() !== "" && Number.isFinite(distanceNumber) && distanceNumber >= 0 && Boolean(referencePosition);

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

  const hasActiveFilter = query.trim() !== "" || typeFilter !== "ALL" || hasDistanceFilter;
  const center = selectedPoint?.position ?? referencePosition ?? points[0]?.position ?? ([-18.8792, 47.5079] as [number, number]);
  const mapPoints = hasActiveFilter ? filteredPoints : points;
  const groupedItinerary = useMemo(() => {
    const groups = new Map<string, ItineraryStep[]>();
    itinerary.forEach((step) => {
      const current = groups.get(step.dayLabel) ?? [];
      current.push(step);
      groups.set(step.dayLabel, current);
    });
    return Array.from(groups.entries());
  }, [itinerary]);
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

  const destinationPoint = points.find((point) => point.type === "DESTINATION") ?? null;
  const destinationName = destinationPoint ? displayPointTitle(destinationPoint) : "-";
  const itineraryDates = useMemo(
    () =>
      itinerary
        .flatMap((step) => [parseStepDate(step.startTime), parseStepDate(step.endTime)])
        .filter((date): date is Date => Boolean(date))
        .sort((first, second) => first.getTime() - second.getTime()),
    [itinerary]
  );
  const dateDebutLabel = formatMapDate(itineraryDates[0] ?? null);
  const dateFinLabel = formatMapDate(itineraryDates[itineraryDates.length - 1] ?? null);

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
            step="0.1"
            inputMode="decimal"
            value={distanceKmValue}
            onChange={(event) => setDistanceKmValue(event.target.value)}
            placeholder="Distance (km)"
            className="h-11 w-[135px] shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-emerald-400"
          />
          <select
            value={effectiveLocationId}
            onChange={(event) => {
              setLocationId(event.target.value);
              setCursorReference(null);
            }}
            className="h-11 w-[220px] shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-emerald-400"
          >
            <option value="">Localisation</option>
            {points.map((point) => (
              <option key={point.id} value={point.id}>
                {displayPointTitle(point)}
              </option>
            ))}
          </select>{/* <div className="h-11 w-[140px] shrink-0 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
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

        <section className="relative order-1 min-h-[420px] lg:order-2">
          <ReservationMapLeaflet
            mapPoints={mapPoints}
            selectedId={effectiveSelectedId}
            center={center}
            hasDistanceFilter={hasDistanceFilter}
            referencePosition={referencePosition}
            distanceNumber={distanceNumber}
            showRouteLine={showRouteLine}
            showRouteArrows={showRouteArrows}
            onSelectPoint={setSelectedId}
            onReferencePick={(position) => {
              setCursorReference(position);
              setLocationId("");
            }}
          />
          <div className="absolute right-5 top-5 z-[500] rounded-xl border border-slate-200 bg-white/95 p-3 text-sm shadow-lg backdrop-blur">
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-2 font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={showRouteLine}
                  onChange={(event) => setShowRouteLine(event.target.checked)}
                  className="size-4 rounded border-slate-300 accent-emerald-600"
                />
                Ligne
              </label>
              <label className="flex cursor-pointer items-center gap-2 font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={showRouteArrows}
                  onChange={(event) => setShowRouteArrows(event.target.checked)}
                  className="size-4 rounded border-slate-300 accent-emerald-600"
                />
                Flèches
              </label>
            </div>
            <p className="mt-2 max-w-[180px] border-t border-slate-100 pt-2 text-[11px] leading-snug text-slate-500">
              Cliquez sur la carte pour definir le centre de recherche.
            </p>
          </div>
          <div className="pointer-events-none absolute bottom-5 right-5 z-[500] w-[290px] rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Séjour</p>
            <p className="mt-1 text-sm font-bold text-slate-950">{destinationName}</p>
            <p className="mt-1 text-xs font-medium text-slate-600">
              Du {dateDebutLabel} au {dateFinLabel}
            </p>
          </div>
        </section>
        <aside className="order-3 h-full overflow-y-auto border-l border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">Étapes journalières</h2>
          <p className="mt-1 text-sm text-slate-500">Cliquez sur une étape pour afficher ses informations.</p>
          <div className="mt-5 space-y-5">
            {(groupedItinerary.length > 0 ? groupedItinerary : groupedPoints).map(([day, items]) => (
              <section key={day} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-950">{day}</h3>
                <div className="mt-3 space-y-2">
                  {items.map((item) => {
                    const isItineraryStep = "pointId" in item;
                    const itemType = item.type;
                    const itemTitle = isItineraryStep ? item.title : displayPointTitle(item);
                    const pointId = isItineraryStep ? item.pointId : item.id;
                    const isSelected = pointId === selectedPoint?.id;
                    const itemNumber = isItineraryStep ? item.stepNumber : item.stepNumber ?? null;
                    const content = (
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isSelected ? "bg-white text-emerald-700" : "bg-emerald-600 text-white"
                          }`}
                        >
                          {itemNumber ?? "-"}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[11px] font-semibold uppercase tracking-wide opacity-75">
                            {typeLabel(itemType)}
                          </span>
                          <span className="mt-1 block">{itemTitle}</span>
                        </span>
                      </div>
                    );

                    return pointId ? (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedId(pointId)}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                          isSelected
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-slate-700 shadow-sm hover:bg-emerald-50 hover:text-emerald-800"
                        }`}
                      >
                        {content}
                      </button>
                    ) : (
                      <div key={item.id} className="w-full rounded-xl bg-white px-3 py-2 text-left text-sm text-slate-700 shadow-sm">
                        {content}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
