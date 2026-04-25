"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Save } from "lucide-react";
import {
  Reservation,
  ReservationStatus,
  ReservationStatusUpdatePayload,
} from "@/lib/type/reservation";

interface ReservationEditModalProps {
  reservation: Reservation | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, data: ReservationStatusUpdatePayload) => Promise<void>;
}

const statuses: ReservationStatus[] = [
  "EN_ATTENTE",
  "A_REVOIR",
  "EN_ATTENTE_DISPONIBILITE",
  "VALIDEE",
  "ANNULEE",
];

function formatStatus(status: ReservationStatus) {
  return status.replaceAll("_", " ");
}

export function ReservationEditModal({ reservation, open, onClose, onSave }: ReservationEditModalProps) {
  const [formData, setFormData] = useState<ReservationStatusUpdatePayload>({
    status: "EN_ATTENTE",
    commentaireAdmin: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (reservation) {
      setFormData({
        status: reservation.status,
        commentaireAdmin: reservation.commentaireAdmin ?? "",
      });
    }
  }, [reservation]);

  if (!reservation) return null;

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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle>Mettre a jour la reservation</DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">{reservation.reference}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border p-4 text-sm text-muted-foreground">
            {reservation.prenomUtilisateur} {reservation.nomUtilisateur} - {reservation.montantTotal.toLocaleString("fr-MG")} {reservation.devise}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((current) => ({
                  ...current,
                  status: value as ReservationStatus,
                }))
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Selectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatStatus(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commentaireAdmin">Commentaire admin</Label>
            <Textarea
              id="commentaireAdmin"
              value={formData.commentaireAdmin ?? ""}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  commentaireAdmin: event.target.value,
                }))
              }
              placeholder="Ajoutez une note interne si necessaire"
              rows={5}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Save className="h-4 w-4" />
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
