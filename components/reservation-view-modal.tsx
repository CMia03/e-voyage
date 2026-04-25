"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Tag, User, Users, X } from "lucide-react";
import { Reservation, ReservationStatus } from "@/lib/type/reservation";

interface ReservationViewModalProps {
  reservation: Reservation | null;
  open: boolean;
  onClose: () => void;
}

const statusClasses: Record<ReservationStatus, string> = {
  EN_ATTENTE: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  A_REVOIR: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  EN_ATTENTE_DISPONIBILITE: "bg-sky-100 text-sky-800 hover:bg-sky-100",
  VALIDEE: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  ANNULEE: "bg-rose-100 text-rose-800 hover:bg-rose-100",
};

function formatCurrency(amount: number, devise = "MGA") {
  return `${Math.round(amount || 0).toLocaleString("fr-MG")} ${devise}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR");
}

function formatStatus(status: ReservationStatus) {
  return status.replaceAll("_", " ");
}

function formatSource(source: Reservation["source"]) {
  return source === "SIMULATION" ? "Simulation" : "Prix direct";
}

export function ReservationViewModal({ reservation, open, onClose }: ReservationViewModalProps) {
  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-xl">Reservation {reservation.reference}</DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Creee le {formatDate(reservation.dateReservation)}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={statusClasses[reservation.status]}>{formatStatus(reservation.status)}</Badge>
            <Badge variant="outline">{formatSource(reservation.source)}</Badge>
            <Badge variant="outline">{formatCurrency(reservation.montantTotal, reservation.devise)}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border p-4">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">
                    {reservation.prenomUtilisateur} {reservation.nomUtilisateur}
                  </p>
                  <p className="text-sm text-muted-foreground">{reservation.emailUtilisateur || "-"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Suivi</p>
                  <p className="font-medium">Reservation le {formatDate(reservation.dateReservation)}</p>
                  <p className="text-sm text-muted-foreground">
                    Derniere mise a jour: {formatDate(reservation.dateModification)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {reservation.details.map((detail) => (
            <div key={detail.id} className="rounded-2xl border border-border/60 p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Destination</p>
                    <p className="font-medium">{detail.nomDestination}</p>
                    <p className="text-sm text-muted-foreground">{detail.nomPlanification}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Voyageurs</p>
                    <p className="font-medium">{detail.nombrePersonnes} personne(s)</p>
                    <p className="text-sm text-muted-foreground">Categorie: {detail.nomCategorieClient}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Gamme</p>
                  <p className="mt-1 font-medium">{detail.gamme}</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Prix unitaire</p>
                  <p className="mt-1 font-medium">{formatCurrency(detail.prixUnitaire, reservation.devise)}</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Prix total</p>
                  <p className="mt-1 font-medium">{formatCurrency(detail.prixTotal, reservation.devise)}</p>
                </div>
              </div>

              {detail.elementsSelectionnes.length > 0 ? (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Elements selectionnes</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {detail.elementsSelectionnes.map((element) => (
                      <Badge key={element} variant="secondary">{element}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {detail.resumeSimulation ? (
                <div className="rounded-xl border border-dashed border-border/70 p-3">
                  <p className="text-sm font-medium">Resume simulation</p>
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                    {detail.resumeSimulation}
                  </p>
                </div>
              ) : null}
            </div>
          ))}

          {reservation.commentaireClient ? (
            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-sm font-medium">Commentaire client</p>
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                {reservation.commentaireClient}
              </p>
            </div>
          ) : null}

          {reservation.commentaireAdmin ? (
            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-sm font-medium">Commentaire admin</p>
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                {reservation.commentaireAdmin}
              </p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
