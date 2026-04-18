"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Save } from "lucide-react";
import { Reservation, UpdateReservationPayload } from "@/lib/type/reservation";
import { mockDestinations } from "@/lib/data/mock-reservations";

interface ReservationEditModalProps {
  reservation: Reservation | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, data: UpdateReservationPayload) => void;
}

export function ReservationEditModal({ reservation, open, onClose, onSave }: ReservationEditModalProps) {
  const [formData, setFormData] = useState<UpdateReservationPayload>({
    nomPrenom: "",
    destination: "",
    budget: 0,
    nombrePersonnes: 1,
    status: "en cours"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (reservation) {
      setFormData({
        nomPrenom: reservation.nomPrenom,
        destination: reservation.destination,
        budget: reservation.budget,
        nombrePersonnes: reservation.nombrePersonnes,
        status: reservation.status
      });
    }
  }, [reservation]);

  const handleInputChange = (field: keyof UpdateReservationPayload, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservation) return;

    setIsSubmitting(true);
    try {
      await onSave(reservation.id, formData);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.nomPrenom?.trim() !== "" && 
                     formData.destination !== "" && 
                     (formData.budget ?? 0) > 0 && 
                     (formData.nombrePersonnes ?? 1) > 0;

  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Modifier la réservation</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nomPrenom">Nom et Prénom *</Label>
              <Input
                id="nomPrenom"
                value={formData.nomPrenom}
                onChange={(e) => handleInputChange("nomPrenom", e.target.value)}
                placeholder="Ex: Jean Dupont"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination *</Label>
              <Select
                value={formData.destination}
                onValueChange={(value) => handleInputChange("destination", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une destination" />
                </SelectTrigger>
                <SelectContent>
                  {mockDestinations.map((destination) => (
                    <SelectItem key={destination} value={destination}>
                      {destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget (Ar) *</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget || 0}
                onChange={(e) => handleInputChange("budget", parseInt(e.target.value) || 0)}
                placeholder="Ex: 1500000"
                min="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombrePersonnes">Nombre de personnes *</Label>
              <Input
                id="nombrePersonnes"
                type="number"
                value={formData.nombrePersonnes || 1}
                onChange={(e) => handleInputChange("nombrePersonnes", parseInt(e.target.value) || 1)}
                placeholder="Ex: 4"
                min="1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange("status", value as Reservation['status'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en cours">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">En cours</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="validé">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Validé</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="rejeté">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejeté</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>


          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
