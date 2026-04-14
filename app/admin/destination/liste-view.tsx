"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  LayoutGrid,
  List,
  Map,
  MapPin,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
  X,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AdminDestination } from "@/lib/type/destination";

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

type AdminDestinationListeProps = {
  destinations: AdminDestination[];
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

export function AdminDestinationListe({
  destinations,
  isLoading,
  isDeletingId,
  error,
  successMessage,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
}: AdminDestinationListeProps) {
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  useEffect(() => {
    if (!successMessage) {
      setShowSuccessAlert(false);
      return;
    }

    setShowSuccessAlert(true);
    const timeout = window.setTimeout(() => {
      setShowSuccessAlert(false);
    }, 4500);

    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    if (!error) {
      setShowErrorAlert(false);
      return;
    }

    setShowErrorAlert(true);
    const timeout = window.setTimeout(() => {
      setShowErrorAlert(false);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [error]);

  const renderCard = (destination: AdminDestination) => (
    <div
      key={destination.id}
      className="overflow-hidden rounded-2xl border border-border/50 bg-card/50 shadow-sm"
    >
      <div className="relative">
        {destination.urlImagePrincipale ? (
          <div className="w-full h-48 bg-muted/20 p-2">
            <img
              src={destination.urlImagePrincipale}
              alt={destination.nom}
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
            destination.estActif
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-700"
          }`}
        >
          {destination.estActif ? "Actif" : "Inactif"}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{destination.nom}</h3>
            <p className="text-sm text-muted-foreground">
              {destination.adresse || "Adresse non renseignee"}
            </p>
          </div>
        </div>

        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
          {destination.description || "Aucune description"}
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2.5 py-1">{destination.slug}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
            <MapPin className="size-3.5" />
            {destination.adresse || "Sans adresse"}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link href={`/admin/destination/${destination.id}`}>Voir details</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/destination/${destination.id}/associations`}>
              Ajout hebergement/Activite
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(destination.id)}>
            <Pencil className="size-4" />
            Modifier
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(destination.id)}
            disabled={isDeletingId === destination.id}
          >
            <Trash2 className="size-4" />
            {isDeletingId === destination.id ? "Suppression..." : "Supprimer"}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderListItem = (destination: AdminDestination) => (
    <div
      key={destination.id}
      className="flex items-center justify-between border-b border-border/50 p-4 last:border-0 hover:bg-muted/20"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <h3 className="truncate font-semibold">{destination.nom}</h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              destination.estActif
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {destination.estActif ? "Actif" : "Inactif"}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span>{destination.adresse || "Adresse non renseignee"}</span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {destination.latitude}, {destination.longitude}
          </span>
          <span className="max-w-[200px] truncate">{destination.slug}</span>
        </div>
      </div>

      <div className="ml-4 flex shrink-0 gap-2">
        <Button asChild size="sm" variant="secondary">
          <Link href={`/admin/destination/${destination.id}`}>Details</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/destination/${destination.id}/associations`}>
            Ajout hebergement/Activite
          </Link>
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(destination.id)}>
          <Pencil className="size-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(destination.id)}
          disabled={isDeletingId === destination.id}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );

  function renderContent() {
    if (isLoading) {
      return <p className="text-sm text-muted-foreground">Chargement...</p>;
    }

    if (destinations.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          Aucune destination disponible.
        </p>
      );
    }

    if (viewMode === "cards") {
      return <div className="grid gap-4 md:grid-cols-2">{destinations.map(renderCard)}</div>;
    }

    if (viewMode === "list") {
      return <div className="divide-y divide-border/50">{destinations.map(renderListItem)}</div>;
    }

    return <HebergementsOverviewMap items={destinations} />;
  }

  function getCardDescription() {
    if (viewMode === "cards") {
      return `${destinations.length} destination(s) en mode cartes`;
    }

    if (viewMode === "list") {
      return `${destinations.length} destination(s) en mode liste`;
    }

    return `Visualisation des ${destinations.length} destinations sur la carte`;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Destinations
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as ViewMode)}
            className="rounded-lg border border-border/50 p-1"
          >
            <ToggleGroupItem value="cards" aria-label="Vue en cartes">
              <LayoutGrid className="size-4" />
              <span className="sr-only md:not-sr-only md:ml-2">Cartes</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Vue en liste">
              <List className="size-4" />
              <span className="sr-only md:not-sr-only md:ml-2">Liste</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="map" aria-label="Vue carte">
              <Map className="size-4" />
              <span className="sr-only md:not-sr-only md:ml-2">Carte</span>
            </ToggleGroupItem>
          </ToggleGroup>

          <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
            <RefreshCcw className="size-4" />
            Actualiser
          </Button>
          <Button onClick={onCreate}>
            <Plus className="size-4" />
            Creer
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
              <AlertTitle>Succes</AlertTitle>
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

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>
            {viewMode === "cards" ? "Vue en cartes" : null}
            {viewMode === "list" ? "Vue en liste" : null}
            {viewMode === "map" ? "Vue carte" : null}
          </CardTitle>
          <CardDescription>{getCardDescription()}</CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
