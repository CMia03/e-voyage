"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Activites
          </h1>
          <p className="text-sm text-muted-foreground">
            Liste des activites avec visualisation sur la carte.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
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

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Liste</CardTitle>
            <CardDescription>{activites.length} activite(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : null}

            {!isLoading && activites.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune activite disponible.
              </p>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-2">
              {activites.map((activite) => (
                <div
                  key={activite.id}
                  className="overflow-hidden rounded-2xl border border-border/50 bg-card/50 shadow-sm"
                >
                  <div className="relative">
                    {activite.imagePrincipale ? (
                      <div className="w-full h-48 bg-muted/20 p-2">
                        <img
                          src={activite.imagePrincipale}
                          alt={activite.nom}
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
                        activite.estActif
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {activite.estActif ? "Actif" : "Inactif"}
                    </span>
                  </div>

                  <div className="p-4">
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
                    <span className="rounded-full bg-muted px-2.5 py-1">
                      {activite.slug}
                    </span>
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
                    <Button size="sm" asChild>
                      <Link href={`/admin/activites/${activite.id}`}>Voir details</Link>
                    </Button>
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Carte</CardTitle>
            <CardDescription>Visualiser les activites sur OpenStreetMap</CardDescription>
          </CardHeader>
          <CardContent>
            <HebergementsOverviewMap items={activites} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
