"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Save, X, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Reservation,
  ReservationSource,
  ReservationStatus,
  ReservationStatusUpdatePayload,
} from "@/lib/type/reservation";

interface ReservationEditModalProps {
  reservation: Reservation | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, data: ReservationStatusUpdatePayload) => Promise<void>;
  initialStatus?: ReservationStatus;
}

const statuses: ReservationStatus[] = ["EN_ATTENTE", "VALIDEE", "ANNULEE"];

const statusLabels: Record<ReservationStatus, string> = {
  EN_ATTENTE: "En attente",
  VALIDEE: "Validée",
  ANNULEE: "Annulée",
};

const statusStyles: Record<ReservationStatus, string> = {
  EN_ATTENTE: "border-amber-200 bg-amber-50 text-amber-700",
  VALIDEE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ANNULEE: "border-rose-200 bg-rose-50 text-rose-700",
};

const sourceLabels: Record<ReservationSource, string> = {
  PRIX_DIRECT: "Prix direct",
  SIMULATION: "Simulation",
};

function formatCurrency(value: number | null | undefined, devise = "MGA") {
  return `${Math.round(value ?? 0).toLocaleString("fr-MG")} ${devise}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR");
}

function getClientName(reservation: Reservation) {
  return `${reservation.prenomUtilisateur ?? ""} ${reservation.nomUtilisateur ?? ""}`.trim() || "Client non renseigné";
}

function getTotalPeople(reservation: Reservation) {
  return (reservation.details ?? []).reduce((sum, detail) => sum + (detail.nombrePersonnes || 0), 0);
}

function getDefaultComment(status: ReservationStatus) {
  if (status === "VALIDEE") {
    return "";

    // "Bonjour,\n\nVotre réservation a été validée avec succès.\n\nMerci de votre confiance.";

  }
  if (status === "ANNULEE") {
    return "";

     //"Bonjour,\n\nVotre réservation a été annulée.\n\nNotre équipe reste disponible pour vous accompagner.";
     
  }
  return "";
}

export function ReservationEditModal({ reservation, open, onClose, onSave, initialStatus }: ReservationEditModalProps) {
  const [formData, setFormData] = useState<ReservationStatusUpdatePayload>({
    status: "EN_ATTENTE",
    commentaireAdmin: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!reservation) return;

    const nextStatus = initialStatus ?? reservation.status;
    setFormData({
      status: nextStatus,
      commentaireAdmin: reservation.commentaireAdmin?.trim() || getDefaultComment(nextStatus),
    });
  }, [initialStatus, reservation]);

  const totalPeople = useMemo(() => (reservation ? getTotalPeople(reservation) : 0), [reservation]);
  const mainDetail = reservation?.details?.[0] ?? null;
  const commentLength = formData.commentaireAdmin?.length ?? 0;
  const actionIsValidation = formData.status === "VALIDEE";
  const actionIsCancellation = formData.status === "ANNULEE";

  if (!reservation) return null;

  const handleStatusChange = (value: ReservationStatus) => {
    setFormData((current) => ({
      ...current,
      status: value,
      commentaireAdmin: getDefaultComment(value) || current.commentaireAdmin,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(reservation.id, formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="!w-[1000px] !max-w-[1000px] rounded-2xl p-0">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-950">Mettre à jour la réservation</DialogTitle>
              <p className="mt-1 text-sm font-medium text-slate-500">{reservation.reference}</p>
              <Badge variant="outline" className={`mt-3 ${statusStyles[reservation.status]}`}>
                Statut actuel : {statusLabels[reservation.status]}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <section className="rounded-xl border border-slate-200">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-bold text-slate-950">Informations générales</p>
            </div>
            <div className="grid gap-x-6 gap-y-3 px-4 py-3 text-sm sm:grid-cols-2">
              <InfoLine label="Client" value={getClientName(reservation)} />
              <InfoLine label="Type de réservation" value={sourceLabels[reservation.source]} />
              <InfoLine label="Destination" value={mainDetail?.nomDestination || "-"} />
              <InfoLine label="Nombre de voyageurs" value={`${totalPeople} personne(s)`} />
              <InfoLine label="Date de réservation" value={formatDate(reservation.dateReservation)} />
              <InfoLine label="Montant total" value={formatCurrency(reservation.montantTotal, reservation.devise)} />
            </div>
          </section>

          <section>
            <p className="mb-3 text-sm font-bold text-slate-950">Profils voyageurs</p>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-emerald-50 text-xs font-bold uppercase text-emerald-800">
                  <tr>
                    <th className="px-3 py-3 text-left">Catégorie client</th>
                    <th className="px-3 py-3 text-left">Gamme</th>
                    <th className="px-3 py-3 text-center">Nombre de personnes</th>
                    <th className="px-3 py-3 text-right">Prix / pers.</th>
                    <th className="px-3 py-3 text-right">Sous-total</th>
                  </tr>
                </thead>
                <tbody>
                  {(reservation.details ?? []).map((detail, index) => (
                    <tr key={detail.id ?? index} className="border-t border-slate-100">
                      <td className="px-3 py-3 font-medium text-slate-950">{detail.nomCategorieClient || "-"}</td>
                      <td className="px-3 py-3 text-slate-700">{detail.gamme || "-"}</td>
                      <td className="px-3 py-3 text-center font-medium text-slate-900">{detail.nombrePersonnes}</td>
                      <td className="px-3 py-3 text-right text-slate-700">
                        {formatCurrency(detail.prixUnitaire, reservation.devise)}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-950">
                        {formatCurrency(detail.prixTotal, reservation.devise)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-emerald-100 bg-emerald-50/60 font-bold text-emerald-800">
                    <td className="px-3 py-3" colSpan={2}>Total général</td>
                    <td className="px-3 py-3 text-center">{totalPeople}</td>
                    <td className="px-3 py-3" />
                    <td className="px-3 py-3 text-right">
                      {formatCurrency(reservation.montantTotal, reservation.devise)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <div className="space-y-2">
            <Label htmlFor="status">Nouveau statut *</Label>
            <Select value={formData.status} onValueChange={(value) => handleStatusChange(value as ReservationStatus)}>
              <SelectTrigger id="status" className="h-11 border-emerald-500 focus:ring-emerald-500">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {actionIsValidation ? (
              <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Un email de confirmation sera envoyé au client.
              </p>
            ) : null}
            {actionIsCancellation ? (
              <p className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <XCircle className="h-4 w-4" />
                Un email d&apos;annulation sera envoyé au client.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="commentaireAdmin">Commentaire envoyé au client *</Label>
            <Textarea
              id="commentaireAdmin"
              value={formData.commentaireAdmin ?? ""}
              maxLength={1000}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  commentaireAdmin: event.target.value,
                }))
              }
              placeholder="Message envoyé au client avec la mise à jour de sa réservation"
              rows={5}
            />
            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
              <p>Ce commentaire sera envoyé au client par email avec la mise à jour de sa réservation.</p>
              <span>{commentLength}/1000</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Fermer
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`gap-2 ${
                actionIsCancellation
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <Save className="h-4 w-4" />
              {isSubmitting
                ? "Enregistrement..."
                : actionIsCancellation
                  ? "Annuler la réservation"
                  : "Valider la réservation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      <span className="min-w-0 font-semibold text-slate-950">: {value}</span>
    </div>
  );
}
