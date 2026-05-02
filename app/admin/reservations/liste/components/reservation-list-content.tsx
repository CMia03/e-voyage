import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, Edit, ArrowLeft } from "lucide-react";
import { useBreadcrumbs } from "@/app/admin/contexts/breadcrumbs-context";
import { loadAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/api/client";
import { listAdminReservations, updateReservationStatus } from "@/lib/api/reservations";
import { Reservation, ReservationStatus, ReservationStatusUpdatePayload } from "@/lib/type/reservation";
import { ReservationViewModal } from "@/components/reservation-view-modal";
import { ReservationEditModal } from "@/components/reservation-edit-modal";

const statusStyles: Record<ReservationStatus, string> = {
  EN_ATTENTE: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  A_REVOIR: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  EN_ATTENTE_DISPONIBILITE: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  VALIDEE: "bg-green-100 text-green-800 hover:bg-green-100",
  ANNULEE: "bg-red-100 text-red-800 hover:bg-red-100"
};

const statusLabels: Record<ReservationStatus, string> = {
  EN_ATTENTE: "En attente",
  A_REVOIR: "À revoir",
  EN_ATTENTE_DISPONIBILITE: "En attente disponibilité",
  VALIDEE: "Validée",
  ANNULEE: "Annulée"
};

export function ReservationListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setBreadcrumbs } = useBreadcrumbs();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "ALL">("ALL");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Charger les réservations
  const loadReservations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const auth = loadAuth();
      if (!auth) {
        router.push("/login");
        return;
      }

      const data = await listAdminReservations(auth.accessToken);
      setReservations(data.data ?? []);
      setFilteredReservations(data.data ?? []);
    } catch (err) {
      const errorMessage = getErrorMessage(err, "Erreur lors du chargement des réservations");
      setError(errorMessage);
      console.error("Erreur lors du chargement des réservations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Filtrer les réservations
  const filterReservations = useCallback(() => {
    let filtered = reservations;

    // Filtre par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(reservation =>
        reservation.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.nomUtilisateur.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.prenomUtilisateur.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.emailUtilisateur.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(reservation => reservation.status === statusFilter);
    }

    setFilteredReservations(filtered);
  }, [reservations, searchTerm, statusFilter]);

  // Mettre à jour le statut d'une réservation
  const handleStatusUpdate = useCallback(async (reservationId: string, newStatus: ReservationStatus) => {
    try {
      setUpdatingStatus(reservationId);

      const auth = loadAuth();
      if (!auth) {
        router.push("/login");
        return;
      }

      const payload: ReservationStatusUpdatePayload = {
        status: newStatus
      };

      await updateReservationStatus(reservationId, payload, auth.accessToken);

      // Mettre à jour localement
      setReservations(prev =>
        prev.map(reservation =>
          reservation.id === reservationId
            ? { ...reservation, status: newStatus, dateModification: new Date().toISOString() }
            : reservation
        )
      );

      // Fermer le modal d'édition si ouvert
      setIsEditModalOpen(false);
      setSelectedReservation(null);
    } catch (err) {
      const errorMessage = getErrorMessage(err, "Erreur lors de la mise à jour du statut");
      setError(errorMessage);
      console.error("Erreur lors de la mise à jour du statut:", err);
    } finally {
      setUpdatingStatus(null);
    }
  }, [router]);

  // Wrapper pour correspondre à la signature attendue par ReservationEditModal
  const handleSaveReservation = useCallback(async (id: string, data: ReservationStatusUpdatePayload) => {
    await handleStatusUpdate(id, data.status);
  }, [handleStatusUpdate]);

  // Ouvrir le modal d'édition
  const handleEditReservation = useCallback((reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsEditModalOpen(true);
  }, []);

  // Ouvrir le modal de visualisation
  const handleViewReservation = useCallback((reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsViewModalOpen(true);
  }, []);

  // Formater le montant
  const formatMontant = useCallback((montant: number, devise: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: devise,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant);
  }, []);

  // Formater la date
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Initialisation
  useEffect(() => {
    setBreadcrumbs([
      { label: "Administration", href: "/admin" },
      { label: "Réservations", href: "/admin/reservations" },
      { label: "Liste", href: "/admin/reservations/liste" }
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  useEffect(() => {
    filterReservations();
  }, [filterReservations]);

  // Statistiques
  const stats = useMemo(() => {
    const total = reservations.length;
    const enAttente = reservations.filter(r => r.status === 'EN_ATTENTE').length;
    const validees = reservations.filter(r => r.status === 'VALIDEE').length;
    const annulees = reservations.filter(r => r.status === 'ANNULEE').length;

    return { total, enAttente, validees, annulees };
  }, [reservations]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Chargement des réservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Liste des réservations</h1>
          <p className="text-muted-foreground">
            Gérez toutes les réservations de votre plateforme
          </p>
        </div>
        <Button onClick={() => router.push("/admin/reservations")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.enAttente}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.validees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annulées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.annulees}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher par référence, nom, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ReservationStatus | "ALL")}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                <SelectItem value="A_REVOIR">À revoir</SelectItem>
                <SelectItem value="EN_ATTENTE_DISPONIBILITE">En attente disponibilité</SelectItem>
                <SelectItem value="VALIDEE">Validée</SelectItem>
                <SelectItem value="ANNULEE">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Liste des réservations */}
      <Card>
        <CardHeader>
          <CardTitle>
            Réservations ({filteredReservations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReservations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {reservations.length === 0
                  ? "Aucune réservation trouvée"
                  : "Aucune réservation ne correspond aux filtres"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold truncate">
                        {reservation.reference}
                      </h3>
                      <Badge className={statusStyles[reservation.status]}>
                        {statusLabels[reservation.status]}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium">Client:</span> {reservation.prenomUtilisateur} {reservation.nomUtilisateur}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span> {reservation.emailUtilisateur}
                      </p>
                      <p>
                        <span className="font-medium">Montant:</span> {formatMontant(reservation.montantTotal, reservation.devise)}
                      </p>
                      <p>
                        <span className="font-medium">Créée le:</span> {formatDate(reservation.dateReservation)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReservation(reservation)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditReservation(reservation)}
                      disabled={updatingStatus === reservation.id}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedReservation && (
        <>
          <ReservationViewModal
            reservation={selectedReservation}
            open={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedReservation(null);
            }}
          />
          <ReservationEditModal
            reservation={selectedReservation}
            open={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedReservation(null);
            }}
            onSave={handleSaveReservation}
          />
        </>
      )}
    </div>
  );
}