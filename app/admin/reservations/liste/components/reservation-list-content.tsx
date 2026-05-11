"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Edit,
  Eye,
  Layers,
  Mail,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBreadcrumbs } from "@/app/admin/contexts/breadcrumbs-context";
import { loadAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/api/client";
import { listAdminReservations, updateReservationStatus } from "@/lib/api/reservations";
import {
  Reservation,
  ReservationSource,
  ReservationStatus,
  ReservationStatusUpdatePayload,
} from "@/lib/type/reservation";
import { ReservationEditModal } from "@/components/reservation-edit-modal";
import { ReservationViewModal } from "@/components/reservation-view-modal";

const statusStyles: Record<ReservationStatus, string> = {
  EN_ATTENTE: "border-amber-200 bg-amber-50 text-amber-700",
  VALIDEE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ANNULEE: "border-rose-200 bg-rose-50 text-rose-700",
};

const statusLabels: Record<ReservationStatus, string> = {
  EN_ATTENTE: "En attente",
  VALIDEE: "Validee",
  ANNULEE: "Annulee",
};

const sourceLabels: Record<ReservationSource, string> = {
  PRIX_DIRECT: "Prix direct",
  SIMULATION: "Simulation",
};

function formatCurrency(amount: number, devise = "MGA") {
  return `${Math.round(amount || 0).toLocaleString("fr-MG")} ${devise}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getClientName(reservation: Reservation) {
  const name = `${reservation.prenomUtilisateur ?? ""} ${reservation.nomUtilisateur ?? ""}`.trim();
  return name || "Client non renseigne";
}

function getMainDetail(reservation: Reservation) {
  return reservation.details?.[0] ?? null;
}

function getPeopleSummary(reservation: Reservation) {
  const details = reservation.details ?? [];
  const totalPeople = details.reduce((sum, detail) => sum + (detail.nombrePersonnes || 0), 0);

  if (details.length > 1) {
    return `${details.length} profil(s) - ${totalPeople} voyageur(s)`;
  }

  const detail = details[0];
  if (!detail) return "Aucun profil voyageur";

  return `${detail.nomCategorieClient || "Categorie"} - ${detail.gamme || "Gamme"} - ${detail.nombrePersonnes} voyageur(s)`;
}

function getElementCount(reservation: Reservation) {
  const detailCount = (reservation.details ?? []).reduce(
    (sum, detail) => sum + (detail.elementsSelectionnes?.length ?? 0),
    0
  );
  return detailCount || reservation.elementsSelectionnes?.length || 0;
}

function reservationMatchesQuery(reservation: Reservation, query: string) {
  if (!query.trim()) return true;
  const detail = getMainDetail(reservation);
  const normalized = query.trim().toLowerCase();
  const searchable = [
    reservation.reference,
    getClientName(reservation),
    reservation.emailUtilisateur,
    reservation.commentaireClient,
    reservation.commentaireAdmin,
    sourceLabels[reservation.source],
    statusLabels[reservation.status],
    detail?.nomDestination,
    detail?.nomPlanification,
    detail?.nomCategorieClient,
    detail?.gamme,
    formatCurrency(reservation.montantTotal, reservation.devise),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(normalized);
}

function StatCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: string;
  icon: typeof Layers;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ReservationListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setBreadcrumbs } = useBreadcrumbs();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "ALL">("ALL");
  const [sourceFilter, setSourceFilter] = useState<ReservationSource | "ALL">("ALL");
  const [amountMinFilter, setAmountMinFilter] = useState("");
  const [amountMaxFilter, setAmountMaxFilter] = useState("");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const loadReservations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const auth = loadAuth();
      if (!auth) {
        router.push("/login");
        return;
      }

      const response = await listAdminReservations(auth.accessToken);
      setReservations(response.data ?? []);
    } catch (err) {
      setError(getErrorMessage(err, "Erreur lors du chargement des reservations"));
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Administration", href: "/admin" },
      { label: "Reservations", href: "/admin?section=reservations-liste" },
      { label: "Liste", isActive: true },
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  useEffect(() => {
    const reservationId = searchParams.get("reservationId");
    if (!reservationId || reservations.length === 0 || selectedReservation) return;

    const reservation = reservations.find((item) => item.id === reservationId);
    if (reservation) {
      setSelectedReservation(reservation);
      setIsViewModalOpen(true);
    }
  }, [reservations, searchParams, selectedReservation]);

  const filteredReservations = useMemo(() => {
    const minAmount = amountMinFilter ? Number(amountMinFilter) : null;
    const maxAmount = amountMaxFilter ? Number(amountMaxFilter) : null;

    return reservations.filter((reservation) => {
      if (!reservationMatchesQuery(reservation, searchTerm)) return false;
      if (statusFilter !== "ALL" && reservation.status !== statusFilter) return false;
      if (sourceFilter !== "ALL" && reservation.source !== sourceFilter) return false;
      if (minAmount !== null && !Number.isNaN(minAmount) && reservation.montantTotal < minAmount) return false;
      if (maxAmount !== null && !Number.isNaN(maxAmount) && reservation.montantTotal > maxAmount) return false;
      return true;
    });
  }, [amountMaxFilter, amountMinFilter, reservations, searchTerm, sourceFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: reservations.length,
      enAttente: reservations.filter((reservation) => reservation.status === "EN_ATTENTE").length,
      annulees: reservations.filter((reservation) => reservation.status === "ANNULEE").length,
      validees: reservations.filter((reservation) => reservation.status === "VALIDEE").length,
    };
  }, [reservations]);

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setSourceFilter("ALL");
    setAmountMinFilter("");
    setAmountMaxFilter("");
  };

  const closeReservationModals = useCallback(() => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedReservation(null);

    if (searchParams.has("reservationId")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("reservationId");
      const query = params.toString();
      router.replace(query ? `/admin/reservations/liste?${query}` : "/admin/reservations/liste", {
        scroll: false,
      });
    }
  }, [router, searchParams]);

  const handleSaveReservation = useCallback(
    async (id: string, data: ReservationStatusUpdatePayload) => {
      try {
        setUpdatingStatus(id);
        setError(null);

        const auth = loadAuth();
        if (!auth) {
          router.push("/login");
          return;
        }

        const response = await updateReservationStatus(id, data, auth.accessToken);
        const updatedReservation = response.data;

        setReservations((current) =>
          current.map((reservation) =>
            reservation.id === id
              ? {
                  ...reservation,
                  ...(updatedReservation ?? {}),
                  status: data.status,
                  commentaireAdmin: data.commentaireAdmin ?? reservation.commentaireAdmin,
                  dateModification: new Date().toISOString(),
                }
              : reservation
          )
        );

        setIsEditModalOpen(false);
        setSelectedReservation(null);
      } catch (err) {
        setError(getErrorMessage(err, "Erreur lors de la mise a jour de la reservation"));
      } finally {
        setUpdatingStatus(null);
      }
    },
    [router]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-b-2 border-emerald-600" />
          <p className="mt-3 text-sm text-slate-500">Chargement des reservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Liste des reservations</h1>
          <p className="mt-1 text-slate-500">
            Suivez les demandes clients, les simulations et les reservations directes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push("/admin")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <Button onClick={() => router.push("/admin?section=reservations-ajout")} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" />
            Nouvelle reservation
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total" value={stats.total} tone="bg-slate-100 text-slate-700" icon={Layers} />
        <StatCard label="En attente" value={stats.enAttente} tone="bg-amber-100 text-amber-700" icon={CalendarDays} />
        <StatCard label="Annulees" value={stats.annulees} tone="bg-rose-100 text-rose-700" icon={RefreshCw} />
        <StatCard label="Validees" value={stats.validees} tone="bg-emerald-100 text-emerald-700" icon={CircleDollarSign} />
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Recherche et tri</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                {filteredReservations.length} resultat(s) sur {reservations.length}
              </p>
            </div>
            <Button variant="outline" onClick={resetFilters}>
              Reinitialiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 xl:grid-cols-[minmax(260px,1.4fr)_minmax(170px,0.8fr)_minmax(170px,0.8fr)_minmax(130px,0.55fr)_minmax(130px,0.55fr)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Reference, client, destination, commentaire..."
                className="h-11 pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ReservationStatus | "ALL")}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as ReservationSource | "ALL")}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="ALL">Toutes les sources</SelectItem>
                <SelectItem value="PRIX_DIRECT">Prix direct</SelectItem>
                <SelectItem value="SIMULATION">Simulation</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={0}
              value={amountMinFilter}
              onChange={(event) => setAmountMinFilter(event.target.value)}
              placeholder="Montant min"
              className="h-11"
            />
            <Input
              type="number"
              min={0}
              value={amountMaxFilter}
              onChange={(event) => setAmountMaxFilter(event.target.value)}
              placeholder="Montant max"
              className="h-11"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filteredReservations.length === 0 ? (
          <Card className="border-dashed border-slate-300">
            <CardContent className="py-12 text-center text-slate-500">
              {reservations.length === 0
                ? "Aucune reservation pour le moment."
                : "Aucune reservation ne correspond aux filtres."}
            </CardContent>
          </Card>
        ) : (
          filteredReservations.map((reservation) => {
            const detail = getMainDetail(reservation);
            const elementCount = getElementCount(reservation);

            return (
              <Card key={reservation.id} className="border-slate-200 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
                <CardContent className="p-0">
                  <div className="grid gap-0 lg:grid-cols-[1fr_auto]">
                    <div className="space-y-5 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{sourceLabels[reservation.source]}</Badge>
                            <Badge variant="outline" className={statusStyles[reservation.status]}>
                              {statusLabels[reservation.status]}
                            </Badge>
                            {elementCount > 0 ? <Badge variant="secondary">{elementCount} element(s)</Badge> : null}
                          </div>
                          <h2 className="mt-3 text-xl font-bold text-slate-950">{reservation.reference}</h2>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {detail ? `${detail.nomDestination} - ${detail.nomPlanification}` : "Destination non renseignee"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">{getPeopleSummary(reservation)}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left sm:text-right">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Montant</p>
                          <p className="mt-1 text-xl font-bold text-slate-950">
                            {formatCurrency(reservation.montantTotal, reservation.devise)}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            <UserRound className="h-4 w-4 text-emerald-600" />
                            Client
                          </div>
                          <p className="mt-2 font-semibold text-slate-950">{getClientName(reservation)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            <Mail className="h-4 w-4 text-emerald-600" />
                            Contact
                          </div>
                          <p className="mt-2 truncate font-medium text-slate-800">
                            {reservation.emailUtilisateur || "Email non renseigne"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            <CalendarDays className="h-4 w-4 text-emerald-600" />
                            Creee le
                          </div>
                          <p className="mt-2 font-medium text-slate-800">{formatDate(reservation.dateReservation)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            <MapPin className="h-4 w-4 text-emerald-600" />
                            Mise a jour
                          </div>
                          <p className="mt-2 font-medium text-slate-800">{formatDate(reservation.dateModification)}</p>
                        </div>
                      </div>

                      {reservation.commentaireClient || reservation.commentaireAdmin ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          {reservation.commentaireClient ? (
                            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                              <span className="font-semibold text-slate-900">Commentaire client: </span>
                              {reservation.commentaireClient}
                            </div>
                          ) : null}
                          {reservation.commentaireAdmin ? (
                            <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                              <span className="font-semibold">Note admin: </span>
                              {reservation.commentaireAdmin}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 border-t border-slate-100 p-4 lg:flex-col lg:justify-center lg:border-l lg:border-t-0">
                      <Button
                        variant="outline"
                        size="icon"
                        title="Voir le detail"
                        onClick={() => {
                          setSelectedReservation(reservation);
                          setIsViewModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Modifier le suivi"
                        disabled={updatingStatus === reservation.id}
                        onClick={() => {
                          setSelectedReservation(reservation);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {selectedReservation ? (
        <>
          <ReservationViewModal
            reservation={selectedReservation}
            open={isViewModalOpen}
            onClose={closeReservationModals}
          />
          <ReservationEditModal
            reservation={selectedReservation}
            open={isEditModalOpen}
            onClose={closeReservationModals}
            onSave={handleSaveReservation}
          />
        </>
      ) : null}
    </div>
  );
}
