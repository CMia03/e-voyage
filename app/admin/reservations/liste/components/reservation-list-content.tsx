"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Eye,
  Layers,
  MapPin,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBreadcrumbs } from "@/app/admin/contexts/breadcrumbs-context";
import { loadAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/api/client";
import { getReservationById, listAdminReservationsPage, updateReservationStatus } from "@/lib/api/reservations";
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

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getClientName(reservation: Reservation) {
  const name = `${reservation.prenomUtilisateur ?? ""} ${reservation.nomUtilisateur ?? ""}`.trim();
  return name || "Client non renseigne";
}

function getMainDetail(reservation: Reservation) {
  return reservation.details?.[0] ?? null;
}

function getTotalPeople(reservation: Reservation) {
  return (reservation.details ?? []).reduce((sum, detail) => sum + (detail.nombrePersonnes || 0), 0);
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

const pageSizeOptions = [5, 10, 15] as const;

export function ReservationListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setBreadcrumbs } = useBreadcrumbs();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [totalReservations, setTotalReservations] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(5);
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    annulees: 0,
    validees: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

      const response = await listAdminReservationsPage(
        {
          search: searchTerm.trim(),
          status: statusFilter,
          source: sourceFilter,
          amountMin: amountMinFilter,
          amountMax: amountMaxFilter,
          page: currentPage - 1,
          size: pageSize,
        },
        auth.accessToken
      );
      const data = response.data;

      setReservations(data?.content ?? []);
      setTotalReservations(data?.totalElements ?? 0);
      setTotalPages(Math.max(data?.totalPages ?? 1, 1));
      setStats({
        total: data?.totalCount ?? data?.totalElements ?? 0,
        enAttente: data?.enAttenteCount ?? 0,
        annulees: data?.annuleeCount ?? 0,
        validees: data?.valideeCount ?? 0,
      });
    } catch (err) {
      setError(getErrorMessage(err, "Erreur lors du chargement des reservations"));
    } finally {
      setIsLoading(false);
    }
  }, [
    amountMaxFilter,
    amountMinFilter,
    currentPage,
    pageSize,
    router,
    searchTerm,
    sourceFilter,
    statusFilter,
  ]);

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
    if (!reservationId || selectedReservation) return;

    const reservationFromPage = reservations.find((item) => item.id === reservationId);
    if (reservationFromPage) {
      setSelectedReservation(reservationFromPage);
      setIsViewModalOpen(true);
      return;
    }

    const auth = loadAuth();
    if (!auth) return;

    let active = true;
    const loadReservation = async () => {
      try {
        const response = await getReservationById(reservationId, auth.accessToken);
        if (active && response.data) {
          setSelectedReservation(response.data);
          setIsViewModalOpen(true);
        }
      } catch (err) {
        setError(getErrorMessage(err, "Reservation introuvable."));
      }
    };

    void loadReservation();

    return () => {
      active = false;
    };
  }, [reservations, searchParams, selectedReservation]);

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginationStart = totalReservations === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const paginationEnd = Math.min(safeCurrentPage * pageSize, totalReservations);
  const visiblePages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
    const start = Math.min(Math.max(safeCurrentPage - 2, 1), Math.max(totalPages - 4, 1));
    return start + index;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [amountMaxFilter, amountMinFilter, pageSize, searchTerm, sourceFilter, statusFilter]);

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setSourceFilter("ALL");
    setAmountMinFilter("");
    setAmountMaxFilter("");
    setCurrentPage(1);
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
        setSuccessMessage(`Reservation ${statusLabels[data.status].toLowerCase()} avec succes.`);
        await loadReservations();
      } catch (err) {
        setError(getErrorMessage(err, "Erreur lors de la mise a jour de la reservation"));
      } finally {
        setUpdatingStatus(null);
      }
    },
    [loadReservations, router]
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
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {successMessage ? (
        <Alert variant="success">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Recherche et tri</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                {totalReservations === 0
                  ? "0 resultat sur 0"
                  : `${paginationStart}-${paginationEnd} sur ${totalReservations} resultat(s)`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-500">
                Trie par : <span className="font-semibold text-slate-700">Plus recent</span>
              </span>
              <Button variant="outline" onClick={resetFilters}>
                Reinitialiser
              </Button>
            </div>
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

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-white px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {totalReservations} reservation{totalReservations > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-slate-500">
              Trie par : <span className="font-semibold text-slate-700">Plus recent</span>
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="w-10 px-4 py-3 text-left">
                    <Checkbox aria-label="Selectionner toutes les reservations" />
                  </th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Client</th>
                  <th className="px-4 py-3 text-left">Destination</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Periode</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      {stats.total === 0
                        ? "Aucune reservation pour le moment."
                        : "Aucune reservation ne correspond aux filtres."}
                    </td>
                  </tr>
                ) : (
                  reservations.map((reservation) => {
                    const detail = getMainDetail(reservation);
                    const totalPeople = getTotalPeople(reservation);

                    return (
                      <tr
                        key={reservation.id}
                        className="border-b border-slate-100 transition hover:bg-emerald-50/30"
                      >
                        <td className="px-4 py-4 align-middle">
                          <Checkbox aria-label={`Selectionner ${reservation.reference}`} />
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <p className="font-bold text-slate-950">{reservation.reference}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatDate(reservation.dateReservation)}</p>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-start gap-2">
                            <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-950">{getClientName(reservation)}</p>
                              <p className="truncate text-xs text-slate-500">{reservation.emailUtilisateur || "Email non renseigne"}</p>
                              <Badge variant="secondary" className="mt-2 rounded-md bg-slate-100 text-xs text-slate-600">
                                {totalPeople} voyageur(s)
                              </Badge>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            <div>
                              <p className="font-semibold text-slate-950">{detail?.nomDestination || "Destination"}</p>
                              <p className="mt-1 text-xs text-slate-500">{detail?.nomCategorieClient || "Categorie"}</p>
                              <Badge variant="secondary" className="mt-2 rounded-md bg-sky-50 text-xs text-sky-700">
                                {sourceLabels[reservation.source]}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <Badge variant="outline" className={`gap-1 rounded-md ${statusStyles[reservation.status]}`}>
                            {statusLabels[reservation.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-start gap-2 text-slate-700">
                            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                            <div className="space-y-1 text-sm">
                              <p>{formatDateOnly(reservation.dateReservation)}</p>
                              <p className="text-xs text-slate-400">-</p>
                              <p>{formatDateOnly(reservation.dateModification)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right align-middle">
                          <p className="font-bold text-slate-950">
                            {Math.round(reservation.montantTotal || 0).toLocaleString("fr-MG")}
                          </p>
                          <p className="text-xs text-slate-500">{reservation.devise || "MGA"}</p>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9"
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
                              className="h-9 w-9"
                              title="Modifier le suivi"
                              disabled={updatingStatus === reservation.id}
                              onClick={() => {
                                setSelectedReservation(reservation);
                                setIsEditModalOpen(true);
                              }}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalReservations > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Afficher</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => setPageSize(Number(value) as (typeof pageSizeOptions)[number])}
            >
              <SelectTrigger className="h-9 w-[76px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>par page</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={safeCurrentPage <= 1 || isLoading}
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {visiblePages.map((page) => (
              <Button
                key={page}
                variant={page === safeCurrentPage ? "default" : "outline"}
                size="icon"
                className={`h-9 w-9 ${
                  page === safeCurrentPage
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : ""
                }`}
                onClick={() => setCurrentPage(page)}
                disabled={isLoading}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={safeCurrentPage >= totalPages || isLoading}
              onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-slate-500 lg:text-right">
            {paginationStart} - {paginationEnd} sur {totalReservations}
          </div>
        </div>
      ) : null}

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
