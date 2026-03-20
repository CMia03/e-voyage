"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  LayoutGrid,
  List,
  Map,
  Pencil,
  Plus,
  RefreshCcw,
  Timer,
  Trash2,
  Users,
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
import { Activite } from "@/lib/type/activite";

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

type AdminActivitesListeProps = {
  activites: Activite[];
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

export function AdminActivitesListe({
  activites,
  isLoading,
  isDeletingId,
  error,
  successMessage,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
}: AdminActivitesListeProps) {
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

  const renderActiviteCard = (activite: Activite) => (
    <div
      key={activite.id}
      className="rounded-2xl border border-border/50 bg-card/50 p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{activite.nom}</h3>
          <p className="text-sm text-muted-foreground">
            {activite.nomCategorie || "Categorie non renseignee"}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            activite.estActif
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-700"
          }`}
        >
          {activite.estActif ? "Actif" : "Inactif"}
        </span>
      </div>

      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
        {activite.description || "Aucune description"}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-muted px-2.5 py-1">{activite.slug}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
          <Timer className="size-3.5" />
          {activite.dureeHeures} h
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
          <Users className="size-3.5" />
          {activite.participantMin} - {activite.participantsMax}
        </span>
      </div>

      {activite.equipementsFournis.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {activite.equipementsFournis.map((equipement) => (
            <span
              key={`${activite.id}-${equipement}`}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700"
            >
              {equipement}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => onEdit(activite.id)}>
          <Pencil className="size-4" />
          Modifier
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(activite.id)}
          disabled={isDeletingId === activite.id}
        >
          <Trash2 className="size-4" />
          {isDeletingId === activite.id ? "Suppression..." : "Supprimer"}
        </Button>
      </div>
    </div>
  );

  const renderActiviteListItem = (activite: Activite) => (
    <div
      key={activite.id}
      className="flex items-center justify-between border-b border-border/50 p-4 last:border-0 hover:bg-muted/20"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <h3 className="truncate font-semibold">{activite.nom}</h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              activite.estActif
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {activite.estActif ? "Actif" : "Inactif"}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span>{activite.nomCategorie || "Categorie non renseignee"}</span>
          <span className="flex items-center gap-1">
            <Timer className="size-3.5" />
            {activite.dureeHeures} h
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {activite.participantMin} - {activite.participantsMax}
          </span>
          <span className="max-w-[200px] truncate">{activite.slug}</span>
        </div>
        {activite.equipementsFournis.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {activite.equipementsFournis.slice(0, 3).map((equipement) => (
              <span
                key={`${activite.id}-${equipement}`}
                className="rounded-full bg-muted px-2 py-0.5 text-xs"
              >
                {equipement}
              </span>
            ))}
            {activite.equipementsFournis.length > 3 ? (
              <span className="text-xs text-muted-foreground">
                +{activite.equipementsFournis.length - 3}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="ml-4 flex shrink-0 gap-2">
        <Button size="sm" variant="outline" onClick={() => onEdit(activite.id)}>
          <Pencil className="size-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(activite.id)}
          disabled={isDeletingId === activite.id}
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

    if (activites.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          Aucune activite disponible.
        </p>
      );
    }

    if (viewMode === "cards") {
      return <div className="grid gap-4 md:grid-cols-2">{activites.map(renderActiviteCard)}</div>;
    }

    if (viewMode === "list") {
      return <div className="divide-y divide-border/50">{activites.map(renderActiviteListItem)}</div>;
    }

    return <HebergementsOverviewMap items={activites} />;
  }

  function getCardDescription() {
    if (viewMode === "cards") {
      return `${activites.length} activite(s) en mode cartes`;
    }

    if (viewMode === "list") {
      return `${activites.length} activite(s) en mode liste`;
    }

    return `Visualisation des ${activites.length} activites sur la carte`;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Activites
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
