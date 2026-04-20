"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, MapPin, Users, DollarSign, Calendar } from "lucide-react";
import { Reservation } from "@/lib/type/reservation";

interface ReservationViewModalProps {
  reservation: Reservation | null;
  open: boolean;
  onClose: () => void;
}

export function ReservationViewModal({ reservation, open, onClose }: ReservationViewModalProps) {
  if (!reservation) return null;

  const getStatusBadge = (status: Reservation['status']) => {
    const variants = {
      'en cours': "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      'validé': "bg-green-100 text-green-800 hover:bg-green-100",
      'rejeté': "bg-red-100 text-red-800 hover:bg-red-100"
    };

    return (
      <Badge className={variants[status]}>
        {status}
      </Badge>
    );
  };

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('fr-MG', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0
    }).format(budget);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-MG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Détails de la réservation</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* En-tête avec statut */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{reservation.nomPrenom}</h3>
              <p className="text-sm text-muted-foreground">ID: {reservation.id}</p>
            </div>
            {getStatusBadge(reservation.status)}
          </div>

          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Destination</p>
                  <p className="font-medium">{reservation.destination}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-medium">{formatBudget(reservation.budget)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nombre de personnes</p>
                  <p className="font-medium">{reservation.nombrePersonnes}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date de création</p>
                <p className="font-medium">{formatDate(reservation.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
