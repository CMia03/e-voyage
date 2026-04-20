"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, Edit, Trash2, ArrowLeft } from "lucide-react";
import { mockReservations } from "@/lib/data/mock-reservations";
import { Reservation, UpdateReservationPayload } from "@/lib/type/reservation";
import { ReservationViewModal } from "@/components/reservation-view-modal";
import { ReservationEditModal } from "@/components/reservation-edit-modal";
import { useBreadcrumbs } from "@/app/admin/contexts/breadcrumbs-context";

export default function ListeReservationsPage() {
  const router = useRouter();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [searchTerm, setSearchTerm] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Réservations", href: "/admin?section=reservations" },
      { label: "Liste des réservations", isActive: true }
    ]);
  }, [setBreadcrumbs]);

  const filteredReservations = reservations.filter(reservation =>
    reservation.nomPrenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleView = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsViewModalOpen(true);
  };

  const handleEdit = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsEditModalOpen(true);
  };

  const handleSave = async (id: string, data: UpdateReservationPayload) => {
    try {
      // Simulation de mise à jour
      setReservations(prev => prev.map(r => 
        r.id === id 
          ? { 
              ...r, 
              ...data
            }
          : r
      ));
      console.log("Réservation mise à jour:", { id, data });
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      throw error;
    }
  };

  const handleDelete = async (reservation: Reservation) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la réservation de ${reservation.nomPrenom} ?`)) {
      try {
        // Simulation de suppression
        setReservations(prev => prev.filter(r => r.id !== reservation.id));
        console.log("Réservation supprimée:", reservation);
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
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
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Liste des réservations</h1>
            <p className="text-muted-foreground">
              Gérer toutes les réservations des clients
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => router.push('/admin/reservations/ajout')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter une réservation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Réservations ({filteredReservations.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom et Prénom</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Nombre de personnes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Aucune réservation trouvée" : "Aucune réservation disponible"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">
                        {reservation.nomPrenom}
                      </TableCell>
                      <TableCell>{reservation.destination}</TableCell>
                      <TableCell>{formatBudget(reservation.budget)}</TableCell>
                      <TableCell>{reservation.nombrePersonnes}</TableCell>
                      <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                      <TableCell>{formatDate(reservation.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(reservation)}
                            className="p-2"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(reservation)}
                            className="p-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(reservation)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modales */}
      <ReservationViewModal
        reservation={selectedReservation}
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />

      <ReservationEditModal
        reservation={selectedReservation}
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
