"use client";

import Link from "next/link";
import { BedDouble, CalendarRange, Hotel, Plus, RefreshCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TarifHebergement } from "@/lib/type/hebergement";

type AdminHebergementsTarifsProps = {
  tarifs: TarifHebergement[];
  isLoading: boolean;
  isDeletingId: string | null;
  onRefresh: () => void;
  onDelete: (id: string) => void;
};

function formatMoney(value: number | null | undefined, devise: string) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toLocaleString("fr-FR")} ${devise}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Non definie";
  return new Date(value).toLocaleDateString("fr-FR");
}

export function AdminHebergementsTarifs({
  tarifs,
  isLoading,
  isDeletingId,
  onRefresh,
  onDelete,
}: AdminHebergementsTarifsProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Tarifs des hebergements
          </h1>
          <p className="text-sm text-muted-foreground">
            Vue globale des chambres, prix et photos liees aux hebergements.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
            <RefreshCcw className="size-4" />
            Actualiser
          </Button>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Liste des tarifs</CardTitle>
          <CardDescription>
            {tarifs.length} tarif{tarifs.length > 1 ? "s" : ""} disponible
            {tarifs.length > 1 ? "s" : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : tarifs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun tarif disponible pour le moment.
            </p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {tarifs.map((tarif) => (
                <div
                  key={tarif.id}
                  className="rounded-2xl border border-border/50 bg-card/50 p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold">{tarif.nomHebergement}</p>
                        <p className="text-sm text-muted-foreground">
                          {tarif.nomTypeChambre}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          tarif.estActif
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {tarif.estActif ? "Actif" : "Inactif"}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-muted/40 p-3 text-sm">
                        <p className="text-muted-foreground">Prix / nuit</p>
                        <p className="font-medium">
                          {formatMoney(tarif.prixParNuit, tarif.devise)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-3 text-sm">
                        <p className="text-muted-foreground">Reservation</p>
                        <p className="font-medium">
                          {formatMoney(tarif.prixReservation, tarif.devise)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <BedDouble className="size-3.5" />
                        Capacite: {tarif.capacite}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <CalendarRange className="size-3.5" />
                        {formatDate(tarif.dateValiditeDebut)} - {formatDate(tarif.dateValiditeFin)}
                      </span>
                      <span className="rounded-full bg-muted px-2.5 py-1">
                        {tarif.petitDejeunerInclus ? "Petit dejeuner inclus" : "Sans petit dejeuner"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <Hotel className="size-3.5" />
                        {tarif.photos.length} photo{tarif.photos.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/hebergements/${tarif.idHebergement}`}>
                          <Plus className="size-4" />
                          Gerer dans le detail
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(tarif.id)}
                        disabled={isDeletingId === tarif.id}
                      >
                        <Trash2 className="size-4" />
                        {isDeletingId === tarif.id ? "Suppression..." : "Supprimer"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
