"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { 
  CheckCircle2, 
  Pencil, 
  Plus, 
  RefreshCcw, 
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

  useEffect(() => {
    if (!successMessage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowErrorAlert(false);
      return;
    }

    setShowErrorAlert(true);
    const timeout = window.setTimeout(() => {
      setShowErrorAlert(false);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [error]);

  const renderHebergementCard = (hebergement: Hebergement) => (
    <div
      key={hebergement.id}
      className="rounded-2xl border border-border/50 bg-card/50 p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{hebergement.nom}</h3>
          <p className="text-sm text-muted-foreground">
            {hebergement.nomTypeHebergement || "Type non renseigne"}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            hebergement.estActif
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-700"
          }`}
        >
          {hebergement.estActif ? "Actif" : "Inactif"}
        </span>
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

    switch (viewMode) {
      case "cards":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {hebergements.map(renderHebergementCard)}
          </div>
        );
      case "list":
        return (
          <div className="divide-y divide-border/50">
            {hebergements.map(renderHebergementListItem)}
          </div>
        );
      case "map":
        return <HebergementsOverviewMap items={hebergements} />;
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Hébergements
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez et visualisez vos hébergements
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value) => value && setViewMode(value as ViewMode)}
            className="border border-border/50 rounded-lg p-1"
          >
            <ToggleGroupItem value="cards" aria-label="Vue en cartes">
              <LayoutGrid className="size-4" />
              <span className="sr-only md:not-sr-only md:ml-2">Cartes</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Vue en liste">
              <List className="size-4" />
              <span className="sr-only md:not-sr-only md:ml-2">Liste</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="map" aria-label="Vue carte géographique">
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

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>
            {viewMode === "cards" && "Vue en cartes"}
            {viewMode === "list" && "Vue en liste"}
            {viewMode === "map" && "Vue carte"}
          </CardTitle>
          <CardDescription>{getCardDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
