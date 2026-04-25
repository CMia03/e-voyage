"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  EN_ATTENTE_DISPONIBILITE: "bg-sky-100 text-sky-800 hover:bg-sky-100",
  VALIDEE: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  ANNULEE: "bg-rose-100 text-rose-800 hover:bg-rose-100",
};

function formatStatus(status: ReservationStatus) {
  return status.replaceAll("_", " ");
}

function formatCurrency(amount: number, devise = "MGA") {
  return `${Math.round(amount || 0).toLocaleString("fr-MG")} ${devise}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const ALL_STATUSES = "ALL_STATUSES" as const;

const statusOptions: Array<ReservationStatus | typeof ALL_STATUSES> = [
  ALL_STATUSES,
  "EN_ATTENTE",
  "A_REVOIR",
  "EN_ATTENTE_DISPONIBILITE",
  "VALIDEE",
  "ANNULEE",
];

export default function ListeReservationsPage() {
  const router = useRouter();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "">("");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const session = useMemo(() => loadAuth(), []);
  const token = session?.accessToken;

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Reservations", href: "/admin?section=reservations-liste" },
      { label: "Liste des reservations", isActive: true },
    ]);
  }, [setBreadcrumbs]);

  const loadReservations = useCallback(async () => {
    if (!token) {
      setError("Connexion requise pour gerer les reservations.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await listAdminReservations(token, statusFilter);
      setReservations(response.data ?? []);
      setError(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Impossible de charger les reservations."));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, token]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  const filteredReservations = reservations.filter((reservation) => {
    const detail = reservation.details[0];
    const haystack = [
      reservation.reference,
      reservation.nomUtilisateur,
      reservation.prenomUtilisateur,
      reservation.emailUtilisateur,
      detail?.nomDestination,
      detail?.nomPlanification,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(searchTerm.toLowerCase());
  });

  const handleSave = async (id: string, data: ReservationStatusUpdatePayload) => {
    if (!token) return;
    await updateReservationStatus(id, data, token);
    await loadReservations();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Liste des reservations</h1>
            <p className="text-muted-foreground">Suivez, filtrez et traitez les demandes clients.</p>
          </div>
        </div>

        <Button onClick={() => router.push("/admin/reservations/ajout")} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter une reservation
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher par client, destination, planification ou reference"
              className="pl-10"
            />
          </div>
          <Select value={statusFilter || ALL_STATUSES} onValueChange={(value) => setStatusFilter(value === ALL_STATUSES ? "" : value as ReservationStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === ALL_STATUSES ? "Tous les statuts" : formatStatus(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reservations ({filteredReservations.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement des reservations...</p>
          ) : filteredReservations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune reservation ne correspond a votre recherche.</p>
          ) : (
            filteredReservations.map((reservation) => {
              const detail = reservation.details[0];
              return (
                <div key={reservation.id} className="rounded-xl border border-border/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{reservation.reference}</p>
                        <Badge className={statusStyles[reservation.status]}>
                          {formatStatus(reservation.status)}
                        </Badge>
                        <Badge variant="outline">
                          {reservation.source === "SIMULATION" ? "Simulation" : "Prix direct"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {reservation.prenomUtilisateur} {reservation.nomUtilisateur} - {reservation.emailUtilisateur}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {detail?.nomDestination ?? "-"} - {detail?.nomPlanification ?? "-"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(reservation.montantTotal, reservation.devise)}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(reservation.dateReservation)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReservation(reservation);
                        setIsViewModalOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReservation(reservation);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

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
