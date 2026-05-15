"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { 
  CheckCircle2, 
  Eye,
  Pencil, 
  Plus, 
  RefreshCcw, 
  Search,
  SlidersHorizontal,
  Star, 
  Trash2, 
  X,
  LayoutGrid,
  List,
  Map
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Hebergement } from "@/lib/type/hebergement";

const HebergementsOverviewMap = dynamic(
  () =>
    import("@/components/hebergements-overview-map").then(
      (mod) => mod.HebergementsOverviewMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[380px] items-center justify-center rounded-2xl border border-dashed border-border/50 bg-muted/20 text-sm text-muted-foreground">
        Chargement de la carte...
      </div>
    ),
  }
);

type AdminHebergementsListeProps = {
  hebergements: Hebergement[];
  isLoading: boolean;
  isDeletingId: string | null;
  error: string;
  successMessage: string;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

type ViewMode = "cards" | "list" | "map";
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
const pageSizeOptions = [4, 8, 12] as const;

const viewModeButtonClass =
  "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 data-[state=on]:bg-gradient-to-r data-[state=on]:from-emerald-600 data-[state=on]:to-teal-600 data-[state=on]:text-white data-[state=on]:shadow-md data-[state=on]:shadow-emerald-500/20";
const greenOutlineButtonClass =
  "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800";
const greenPrimaryButtonClass =
  "border-transparent bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700";

function normalizeSearch(value: string | number | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function getDistanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const startLat = toRadians(from.latitude);
  const endLat = toRadians(to.latitude);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(startLat) *
      Math.cos(endLat) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function AdminHebergementsListe({
  hebergements,
  isLoading,
  isDeletingId,
  error,
  successMessage,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
}: AdminHebergementsListeProps) {
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [priceMinFilter, setPriceMinFilter] = useState("");
  const [priceMaxFilter, setPriceMaxFilter] = useState("");
  const [distanceRadiusFilter, setDistanceRadiusFilter] = useState("");
  const [mapReferencePoint, setMapReferencePoint] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(4);

  useEffect(() => {
    if (!successMessage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSuccessAlert(false);
      return;
    }

    setShowSuccessAlert(true);
    const timeout = window.setTimeout(() => {
      setShowSuccessAlert(false);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    if (!error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowErrorAlert(false);
      return;
    }

    setShowErrorAlert(true);
    const timeout = window.setTimeout(() => {
      setShowErrorAlert(false);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [error]);

  const types = useMemo(() => {
    return Array.from(
      new Set(hebergements.map((hebergement) => hebergement.nomTypeHebergement).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [hebergements]);

  const filteredHebergements = useMemo(() => {
    const normalizedSearch = normalizeSearch(searchTerm);
    const minPrice = priceMinFilter ? Number(priceMinFilter) : null;
    const maxPrice = priceMaxFilter ? Number(priceMaxFilter) : null;
    const distanceRadius = distanceRadiusFilter ? Number(distanceRadiusFilter) : null;

    return hebergements.filter((hebergement) => {
      const prices = (hebergement.tarifs ?? []).flatMap((tarif) => [
        tarif.prixParNuit,
        tarif.prixReservation,
      ]).filter((price): price is number => typeof price === "number");
      const minHebergementPrice = prices.length > 0 ? Math.min(...prices) : null;
      const searchable = [
        hebergement.nom,
        hebergement.slug,
        hebergement.description,
        hebergement.adresse,
        hebergement.nomTypeHebergement,
        hebergement.telephone,
        hebergement.email,
        hebergement.siteWeb,
        hebergement.latitude,
        hebergement.longitude,
        hebergement.nombreEtoiles,
        hebergement.estActif ? "actif active visible" : "inactif inactive masque",
        ...(hebergement.equipements ?? []),
        ...(hebergement.tarifs ?? []).flatMap((tarif) => [
          tarif.nomTypeChambre,
          tarif.devise,
          tarif.gamme,
          tarif.prixParNuit,
          tarif.prixReservation,
          tarif.capacite,
          tarif.petitDejeunerInclus ? "petit dejeuner inclus" : "petit dejeuner non inclus",
          tarif.estActif ? "tarif actif" : "tarif inactif",
        ]),
      ]
        .map(normalizeSearch)
        .join(" ");

      if (normalizedSearch && !searchable.includes(normalizedSearch)) return false;
      if (typeFilter !== "ALL" && hebergement.nomTypeHebergement !== typeFilter) return false;
      if (statusFilter === "ACTIVE" && !hebergement.estActif) return false;
      if (statusFilter === "INACTIVE" && hebergement.estActif) return false;
      if (minPrice !== null && !Number.isNaN(minPrice) && (minHebergementPrice === null || minHebergementPrice < minPrice)) return false;
      if (maxPrice !== null && !Number.isNaN(maxPrice) && (minHebergementPrice === null || minHebergementPrice > maxPrice)) return false;
      if (
        mapReferencePoint &&
        distanceRadius !== null &&
        !Number.isNaN(distanceRadius) &&
        getDistanceKm(mapReferencePoint, {
          latitude: Number(hebergement.latitude),
          longitude: Number(hebergement.longitude),
        }) > distanceRadius
      ) {
        return false;
      }
      return true;
    });
  }, [
    distanceRadiusFilter,
    hebergements,
    mapReferencePoint,
    priceMaxFilter,
    priceMinFilter,
    searchTerm,
    statusFilter,
    typeFilter,
  ]);

  const resetFilters = () => {
    setSearchTerm("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setPriceMinFilter("");
    setPriceMaxFilter("");
    setDistanceRadiusFilter("");
    setMapReferencePoint(null);
    setCurrentPage(1);
  };

  const totalPages = Math.max(Math.ceil(filteredHebergements.length / pageSize), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginationStart = filteredHebergements.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const paginationEnd = Math.min(safeCurrentPage * pageSize, filteredHebergements.length);
  const paginatedHebergements = filteredHebergements.slice(paginationStart - 1, paginationEnd);
  const visiblePages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
    const start = Math.min(Math.max(safeCurrentPage - 2, 1), Math.max(totalPages - 4, 1));
    return start + index;
  });

  const renderHebergementCard = (hebergement: Hebergement) => (
    <div
      key={hebergement.id}
      className="overflow-hidden rounded-2xl border border-border/50 bg-card/50 shadow-sm"
    >
      <div className="relative">
        {hebergement.urlImagePrincipale ? (
          <div className="w-full h-48 bg-muted/20 p-2">
            <img
              src={hebergement.urlImagePrincipale}
              alt={hebergement.nom}
              className="w-full h-full rounded-md object-cover"
            />
          </div>
        ) : (
          <div className="flex h-48 w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">
            Aucune image
          </div>
        )}
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm ${
            hebergement.estActif
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-700"
          }`}
        >
          {hebergement.estActif ? "Actif" : "Inactif"}
        </span>
      </div>

      <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{hebergement.nom}</h3>
          <p className="text-sm text-muted-foreground">
            {hebergement.nomTypeHebergement || "Type non renseigne"}
          </p>
        </div>
      </div>

      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
        {hebergement.description || "Aucune description"}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-muted px-2.5 py-1">
          {hebergement.slug}
        </span>
        <span className="rounded-full bg-muted px-2.5 py-1">
          {hebergement.latitude}, {hebergement.longitude}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
          <Star className="size-3.5 fill-current" />
          {hebergement.nombreEtoiles}
        </span>
      </div>

      {hebergement.equipements.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {hebergement.equipements.map((equipement) => (
            <span
              key={`${hebergement.id}-${equipement}`}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700"
            >
              {equipement}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/hebergements/${hebergement.id}`}>
            <Eye className="size-4" />
            Voir details
          </Link>
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(hebergement.id)}>
          <Pencil className="size-4" />
          Modifier
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(hebergement.id)}
          disabled={isDeletingId === hebergement.id}
        >
          <Trash2 className="size-4" />
          {isDeletingId === hebergement.id ? "Suppression..." : "Supprimer"}
        </Button>
      </div>
      </div>
    </div>
  );

  const renderHebergementListItem = (hebergement: Hebergement) => (
    <div
      key={hebergement.id}
      className="flex items-center justify-between border-b border-border/50 p-4 last:border-0 hover:bg-muted/20"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold truncate">{hebergement.nom}</h3>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${
              hebergement.estActif
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {hebergement.estActif ? "Actif" : "Inactif"}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span>{hebergement.nomTypeHebergement || "Type non renseigne"}</span>
          <span className="flex items-center gap-1">
            <Star className="size-3.5" />
            {hebergement.nombreEtoiles}
          </span>
          <span className="truncate max-w-[200px]">{hebergement.slug}</span>
        </div>
        {hebergement.equipements.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {hebergement.equipements.slice(0, 3).map((equipement) => (
              <span
                key={`${hebergement.id}-${equipement}`}
                className="rounded-full bg-muted px-2 py-0.5 text-xs"
              >
                {equipement}
              </span>
            ))}
            {hebergement.equipements.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{hebergement.equipements.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-2 ml-4 shrink-0">
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/hebergements/${hebergement.id}`}>
            <Eye className="size-4" />
          </Link>
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(hebergement.id)}>
          <Pencil className="size-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(hebergement.id)}
          disabled={isDeletingId === hebergement.id}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-sm text-muted-foreground">Chargement...</p>;
    }

    if (hebergements.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          Aucun hebergement disponible.
        </p>
      );
    }

    if (filteredHebergements.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          Aucun hebergement ne correspond aux criteres de recherche.
        </p>
      );
    }

    switch (viewMode) {
      case "cards":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {paginatedHebergements.map(renderHebergementCard)}
          </div>
        );
      case "list":
        return (
          <div className="divide-y divide-border/50">
            {paginatedHebergements.map(renderHebergementListItem)}
          </div>
        );
      case "map":
        return (
          <HebergementsOverviewMap
            items={paginatedHebergements}
            getDetailHref={(item) => `/admin/hebergements/${item.id}`}
            referencePoint={mapReferencePoint}
            onReferencePointChange={(coords) => {
              setMapReferencePoint(coords);
              setDistanceRadiusFilter((current) => current || "10");
              setCurrentPage(1);
            }}
          />
        );
      default:
        return null;
    }
  };

  const getCardDescription = () => {
    switch (viewMode) {
      case "cards":
        return `${hebergements.length} hébergement(s) en mode cartes`;
      case "list":
        return `${hebergements.length} hébergement(s) en mode liste`;
      case "map":
        return `Visualisation des ${hebergements.length} hébergements sur la carte`;
      default:
        return `${hebergements.length} hébergement(s)`;
    }
  };

  const getFilteredCardDescription = () => {
    if (viewMode === "cards") {
      return `${filteredHebergements.length} hebergement(s) sur ${hebergements.length} en mode cartes`;
    }

    if (viewMode === "list") {
      return `${filteredHebergements.length} hebergement(s) sur ${hebergements.length} en mode liste`;
    }

    return `Visualisation de ${paginatedHebergements.length} hebergement(s) sur ${filteredHebergements.length} resultat(s) sur la carte`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Hébergements
          </h1>
          {/* <p className="text-sm text-muted-foreground">
            Gérez et visualisez vos hébergements
          </p> */}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowFilters((current) => !current)}
            className={greenOutlineButtonClass}
            title="Recherche multi-critere"
          >
            <SlidersHorizontal className="size-4" />
            <span className="sr-only">Afficher la recherche multi-critere</span>
          </Button>

          <ToggleGroup
            type="single" 
            value={viewMode} 
            onValueChange={(value) => {
              if (!value) return;
              setViewMode(value as ViewMode);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-emerald-200 bg-emerald-50/60"
          >
            <ToggleGroupItem value="cards" aria-label="Vue en cartes" className={viewModeButtonClass}>
              <LayoutGrid className="size-4" />
              <span className="sr-only md:not-sr-only md:ml-2">Mosaiques</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Vue en liste" className={viewModeButtonClass}>
              <List className="size-4" />
              <span className="sr-only md:not-sr-only md:ml-2">Liste</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="map" aria-label="Vue carte geographique" className={viewModeButtonClass}>
              <Map className="size-4" />
              <span className="sr-only md:not-sr-only md:ml-2">Carte</span>
            </ToggleGroupItem>
          </ToggleGroup>

          <Button variant="outline" onClick={onRefresh} disabled={isLoading} className={greenOutlineButtonClass}>
            <RefreshCcw className="size-4" />
            Actualiser
          </Button>
          <Button onClick={onCreate} className={greenPrimaryButtonClass}>
            <Plus className="size-4" />
            Créer
          </Button>
        </div>
      </div>

      {error && showErrorAlert ? (
        <Alert
          variant="destructive"
          className="fixed right-6 top-24 z-[70] w-[min(420px,calc(100vw-2rem))] shadow-xl"
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
            <button
              type="button"
              onClick={() => setShowErrorAlert(false)}
              className="rounded-md p-1 text-red-700/70 transition-colors hover:bg-red-100 hover:text-red-900"
              aria-label="Fermer l'alerte"
            >
              <X className="size-4" />
            </button>
          </div>
        </Alert>
      ) : null}

      {successMessage && showSuccessAlert ? (
        <Alert
          variant="success"
          className="fixed right-6 top-24 z-[70] w-[min(420px,calc(100vw-2rem))] border-emerald-300 shadow-xl"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <AlertTitle>Succès</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </div>
            <button
              type="button"
              onClick={() => setShowSuccessAlert(false)}
              className="rounded-md p-1 text-emerald-700/70 transition-colors hover:bg-emerald-100 hover:text-emerald-900"
              aria-label="Fermer l'alerte"
            >
              <X className="size-4" />
            </button>
          </div>
        </Alert>
      ) : null}

      {showFilters ? (
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Recherche multi-critere</CardTitle>
                <CardDescription>
                  Nom, type, statut, prix, equipements ou tarifs.
                </CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={resetFilters} className={greenOutlineButtonClass}>
                Reinitialiser
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Nom, adresse, type, equipement, tarif, email..."
                className="h-11 pl-9"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_0.8fr_0.8fr]">
              <select
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-emerald-500"
              >
                <option value="ALL">Tous les types</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter);
                  setCurrentPage(1);
                }}
                className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-emerald-500"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIVE">Actif</option>
                <option value="INACTIVE">Inactif</option>
              </select>

              <Input
                type="number"
                min={0}
                value={priceMinFilter}
                onChange={(event) => {
                  setPriceMinFilter(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Prix min"
                className="h-11"
              />

              <Input
                type="number"
                min={0}
                value={priceMaxFilter}
                onChange={(event) => {
                  setPriceMaxFilter(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Prix max"
                className="h-11"
              />
            </div>

            {viewMode === "map" ? (
              <div className="grid gap-3 rounded-xl border border-amber-200 bg-amber-50/45 p-3 md:grid-cols-[1fr_180px_auto] md:items-center">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Recherche par distance
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cliquez sur la carte pour choisir le point de depart.
                    {mapReferencePoint
                      ? ` Point: ${mapReferencePoint.latitude}, ${mapReferencePoint.longitude}`
                      : ""}
                  </p>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={distanceRadiusFilter}
                  onChange={(event) => {
                    setDistanceRadiusFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Rayon en km"
                  className="h-10 bg-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMapReferencePoint(null);
                    setDistanceRadiusFilter("");
                    setCurrentPage(1);
                  }}
                  className="h-10 border-amber-200 bg-white text-amber-800 hover:bg-amber-100"
                  disabled={!mapReferencePoint && !distanceRadiusFilter}
                >
                  Effacer
                </Button>
              </div>
            ) : null}

            <p className="text-sm text-muted-foreground">
              {filteredHebergements.length} resultat(s) sur {hebergements.length} hebergement(s).
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>
            {viewMode === "cards" && "Vue en cartes"}
            {viewMode === "list" && "Vue en liste"}
            {viewMode === "map" && "Vue carte"}
          </CardTitle>
          <CardDescription>{getFilteredCardDescription() || getCardDescription()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderContent()}

          {filteredHebergements.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Afficher</span>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value) as (typeof pageSizeOptions)[number]);
                    setCurrentPage(1);
                  }}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none transition focus:border-emerald-500"
                >
                  {pageSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span>par page</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                >
                  {"<"}
                </Button>
                {visiblePages.map((page) => (
                  <Button
                    key={page}
                    type="button"
                    variant={page === safeCurrentPage ? "default" : "outline"}
                    size="icon"
                    className={`h-9 w-9 ${
                      page === safeCurrentPage
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : ""
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                >
                  {">"}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground sm:text-right">
                {paginationStart} - {paginationEnd} sur {filteredHebergements.length}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

