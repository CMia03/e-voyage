"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Mail,
  MapPin,
  MoreVertical,
  RotateCcw,
  Search,
  Users,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReservationEditModal } from "@/components/reservation-edit-modal";
import { ReservationViewModal } from "@/components/reservation-view-modal";
import { getErrorMessage } from "@/lib/api/client";
import { listAdminReservationsPage, updateReservationStatus } from "@/lib/api/reservations";
import { loadAuth } from "@/lib/auth";
import { PlanificationVoyage } from "@/lib/type/destination";
import {
  Reservation,
  ReservationSource,
  ReservationStatus,
  ReservationStatusUpdatePayload,
} from "@/lib/type/reservation";

type Props = {
  planification: PlanificationVoyage;
};

const statusLabels: Record<ReservationStatus, string> = {
  EN_ATTENTE: "En attente",
  VALIDEE: "Validee",
  ANNULEE: "Annulee",
};

const statusClasses: Record<ReservationStatus, string> = {
  EN_ATTENTE: "border-amber-200 bg-amber-50 text-amber-700",
  VALIDEE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ANNULEE: "border-rose-200 bg-rose-50 text-rose-700",
};

const statusCardClasses: Record<ReservationStatus, string> = {
  EN_ATTENTE: "border-l-amber-400 bg-amber-50/20",
  VALIDEE: "border-l-emerald-500 bg-emerald-50/20",
  ANNULEE: "border-l-rose-500 bg-rose-50/20",
};

const sourceClasses: Record<ReservationSource, string> = {
  PRIX_DIRECT: "border-sky-200 bg-sky-50 text-sky-700",
  SIMULATION: "border-violet-200 bg-violet-50 text-violet-700",
};

const sourceLabels: Record<ReservationSource, string> = {
  PRIX_DIRECT: "Prix direct",
  SIMULATION: "Simulation",
};

type StatusFilter = ReservationStatus | "ALL";
type SourceFilter = ReservationSource | "ALL";
const pageSizeOptions = [5, 10, 20] as const;

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number, devise: string) {
  return `${Number(value || 0).toLocaleString("fr-FR")} ${devise || "MGA"}`;
}

function getClientName(reservation: Reservation) {
  const name = `${reservation.prenomUtilisateur ?? ""} ${reservation.nomUtilisateur ?? ""}`.trim();
  if (name) return name;
  return `${reservation.clientPrenom ?? ""} ${reservation.clientNom ?? ""}`.trim() || "Client";
}

function getPlanificationDetails(reservation: Reservation, planificationId: string) {
  return (reservation.details ?? []).filter((detail) => detail.planificationVoyageId === planificationId);
}

export function SectionReservation({ planification }: Props) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [totalReservations, setTotalReservations] = useState(0);
  const [totalPagesFromServer, setTotalPagesFromServer] = useState(1);
  const [reservationStats, setReservationStats] = useState({
    total: 0,
    enAttente: 0,
    validees: 0,
    annulees: 0,
  });
  const [selectedViewReservation, setSelectedViewReservation] = useState<Reservation | null>(null);
  const [selectedEditReservation, setSelectedEditReservation] = useState<Reservation | null>(null);
  const [editInitialStatus, setEditInitialStatus] = useState<ReservationStatus | undefined>();
  const [updatingReservationId, setUpdatingReservationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [minAmountFilter, setMinAmountFilter] = useState("");
  const [maxAmountFilter, setMaxAmountFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(5);

  useEffect(() => {
    const session = loadAuth();
    const token = session?.accessToken;

    if (!token) {
      setLoading(false);
      setError("Connexion admin requise pour charger les reservations.");
      return;
    }

    let active = true;

    const loadReservations = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await listAdminReservationsPage(
          {
            planificationId: planification.id,
            search: searchTerm.trim(),
            status: statusFilter,
            source: sourceFilter,
            dateFrom: startDateFilter,
            dateTo: endDateFilter,
            amountMin: minAmountFilter,
            amountMax: maxAmountFilter,
            page: currentPage - 1,
            size: pageSize,
          },
          token
        );
        if (active) {
          const data = response.data;
          setReservations(data?.content ?? []);
          setTotalReservations(data?.totalElements ?? 0);
          setTotalPagesFromServer(Math.max(data?.totalPages ?? 1, 1));
          setReservationStats({
            total: data?.totalCount ?? data?.totalElements ?? 0,
            enAttente: data?.enAttenteCount ?? 0,
            validees: data?.valideeCount ?? 0,
            annulees: data?.annuleeCount ?? 0,
          });
        }
      } catch (requestError) {
        if (active) {
          setError(getErrorMessage(requestError, "Impossible de charger les reservations."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadReservations();

    return () => {
      active = false;
    };
  }, [
    currentPage,
    endDateFilter,
    maxAmountFilter,
    minAmountFilter,
    pageSize,
    planification.id,
    searchTerm,
    sourceFilter,
    startDateFilter,
    statusFilter,
  ]);

  const planificationReservations = useMemo(() => {
    return reservations
      .sort(
        (a, b) =>
          new Date(b.dateReservation).getTime() - new Date(a.dateReservation).getTime()
      );
  }, [reservations]);

  const filteredReservations = planificationReservations;
  const totalPages = totalPagesFromServer;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginationStart = totalReservations === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const paginationEnd = Math.min(safeCurrentPage * pageSize, totalReservations);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    endDateFilter,
    maxAmountFilter,
    minAmountFilter,
    searchTerm,
    sourceFilter,
    startDateFilter,
    statusFilter,
    pageSize,
  ]);

  function resetFilters() {
    setSearchTerm("");
    setStatusFilter("ALL");
    setSourceFilter("ALL");
    setStartDateFilter("");
    setEndDateFilter("");
    setMinAmountFilter("");
    setMaxAmountFilter("");
    setCurrentPage(1);
  }

  function openEditReservation(reservation: Reservation, status?: ReservationStatus) {
    setSelectedEditReservation(reservation);
    setEditInitialStatus(status);
  }

  function closeEditReservation() {
    setSelectedEditReservation(null);
    setEditInitialStatus(undefined);
  }

  async function handleSaveReservation(id: string, data: ReservationStatusUpdatePayload) {
    const session = loadAuth();
    const token = session?.accessToken;
    if (!token) {
      setError("Connexion admin requise pour modifier la reservation.");
      return;
    }

    try {
      setUpdatingReservationId(id);
      setError("");
      const response = await updateReservationStatus(id, data, token);
      const updatedReservation = response.data;

      setReservations((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                ...(updatedReservation ?? {}),
                status: updatedReservation?.status ?? data.status,
                commentaireAdmin: data.commentaireAdmin ?? item.commentaireAdmin,
              }
            : item
        )
      );
      setSelectedViewReservation((current) =>
        current?.id === id
          ? {
              ...current,
              ...(updatedReservation ?? {}),
              status: updatedReservation?.status ?? data.status,
              commentaireAdmin: data.commentaireAdmin ?? current.commentaireAdmin,
            }
          : current
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Impossible de modifier le statut de la reservation."));
    } finally {
      setUpdatingReservationId(null);
    }
  }

  return (
    <>
    <Card className="border-border/50">
      <CardHeader>
        <div className="space-y-4">
          <div>
            <CardTitle>Reservation</CardTitle>
            <CardDescription>
              Reservations rattachees a cette planification, avec leur statut et leurs informations client.
            </CardDescription>
          </div>
          <div className="grid gap-3 text-center text-xs sm:grid-cols-4">
            <div className="rounded-xl border bg-card px-4 py-3">
              <p className="text-muted-foreground">Total</p>
              <p className="text-2xl font-semibold">{reservationStats.total}</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-amber-700">
              <p>Attente</p>
              <p className="text-2xl font-semibold">{reservationStats.enAttente}</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-700">
              <p>Validees</p>
              <p className="text-2xl font-semibold">{reservationStats.validees}</p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-rose-700">
              <p>Annulees</p>
              <p className="text-2xl font-semibold">{reservationStats.annulees}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border/60">
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Reservations de la planification</h3>
            <p className="text-xs text-muted-foreground">
              {planification.nomPlanification} - {totalReservations} reservation(s)
            </p>
          </div>

          <div className="border-b bg-white px-4 py-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Reference, client, email, statut, categorie..."
                  className="h-10 pl-9 text-sm"
                />
              </div>

              <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-emerald-500"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="VALIDEE">Validee</option>
                  <option value="ANNULEE">Annulee</option>
                </select>

                <select
                  value={sourceFilter}
                  onChange={(event) => setSourceFilter(event.target.value as SourceFilter)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-emerald-500"
                >
                  <option value="ALL">Toutes les sources</option>
                  <option value="PRIX_DIRECT">Prix direct</option>
                  <option value="SIMULATION">Simulation</option>
                </select>

                <Input
                  type="date"
                  value={startDateFilter}
                  onChange={(event) => setStartDateFilter(event.target.value)}
                  className="h-10 text-sm"
                  aria-label="Date debut"
                />

                <Input
                  type="date"
                  value={endDateFilter}
                  onChange={(event) => setEndDateFilter(event.target.value)}
                  className="h-10 text-sm"
                  aria-label="Date fin"
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={minAmountFilter}
                    onChange={(event) => setMinAmountFilter(event.target.value)}
                    placeholder="Min"
                    className="h-10 text-sm"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={maxAmountFilter}
                    onChange={(event) => setMaxAmountFilter(event.target.value)}
                    placeholder="Max"
                    className="h-10 text-sm"
                  />
                </div>

                <Button type="button" variant="outline" className="h-10 gap-2" onClick={resetFilters}>
                  <RotateCcw className="h-4 w-4" />
                  Reinitialiser
                </Button>
              </div>

              <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>
                  {totalReservations === 0
                    ? "Aucun resultat"
                    : `${paginationStart}-${paginationEnd} sur ${totalReservations} resultat(s)`}
                </p>
                <div className="flex items-center gap-2">
                  <span>Par page</span>
                  <select
                    value={pageSize}
                    onChange={(event) =>
                      setPageSize(Number(event.target.value) as (typeof pageSizeOptions)[number])
                    }
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs outline-none transition focus:border-emerald-500"
                  >
                    {pageSizeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Chargement des reservations...
            </div>
          ) : error ? (
            <div className="px-4 py-8 text-center text-sm text-red-600">{error}</div>
          ) : planificationReservations.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Aucune reservation liee a cette planification pour le moment.
            </div>
          ) : totalReservations === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Aucune reservation ne correspond aux filtres.
            </div>
          ) : (
            <div className="space-y-3 bg-slate-50/60 p-3">
              {filteredReservations.map((reservation) => {
                const details = getPlanificationDetails(reservation, planification.id);
                const voyageurs = details.reduce((sum, detail) => sum + detail.nombrePersonnes, 0);
                const categories = details
                  .map((detail) => `${detail.nomCategorieClient} - ${detail.gamme}`)
                  .filter(Boolean)
                  .join(", ");

                return (
                  <div
                    key={reservation.id}
                    className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md ${statusCardClasses[reservation.status]}`}
                  >
                    <div className="grid gap-4 xl:grid-cols-[minmax(230px,0.9fr)_minmax(390px,1.35fr)_minmax(245px,0.78fr)] xl:items-stretch">
                      <div className="flex min-w-0 flex-col justify-center space-y-3 xl:border-r xl:border-slate-200 xl:pr-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={sourceClasses[reservation.source]}>
                            {sourceLabels[reservation.source]}
                          </Badge>
                          <Badge variant="outline" className={statusClasses[reservation.status]}>
                            {statusLabels[reservation.status]}
                          </Badge>
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-semibold text-slate-950">{reservation.reference}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {categories || "Profil voyageur non renseigne"}
                          </p>
                        </div>
                      </div>

                      <div className="grid min-w-0 gap-x-6 gap-y-4 md:grid-cols-2 xl:border-r xl:border-slate-200 xl:px-5">
                        <div className="min-w-0">
                          <span className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                            <Users className="h-4 w-4 text-sky-600" />
                            Voyageurs
                          </span>
                          <p className="text-sm font-semibold text-slate-950">{voyageurs} personne(s)</p>
                        </div>
                        <div className="min-w-0">
                          <span className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                            <CalendarDays className="h-4 w-4 text-violet-600" />
                            Date
                          </span>
                          <p className="text-sm font-semibold text-slate-950">{formatDate(reservation.dateReservation)}</p>
                        </div>
                        <div className="min-w-0">
                          <span className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                            <MapPin className="h-4 w-4 text-emerald-600" />
                            Client
                          </span>
                          <p className="truncate text-sm font-semibold text-slate-950">{getClientName(reservation)}</p>
                        </div>
                        <div className="min-w-0">
                          <span className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                            <Mail className="h-4 w-4 text-orange-500" />
                            Contact
                          </span>
                          <p className="break-all text-sm font-semibold text-slate-950">
                            {reservation.emailUtilisateur || "Email non renseigne"}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-[1fr_auto] xl:grid-cols-[1fr_34px] xl:pl-2">
                        <div className="flex flex-col justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Montant</p>
                            <p className="mt-1 text-2xl font-semibold text-emerald-700">
                              {formatCurrency(reservation.montantTotal, reservation.devise)}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-600">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                                <CheckCircle2 className="h-4 w-4" />
                              </span>
                              {statusLabels[reservation.status]}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-2 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                            onClick={() => setSelectedViewReservation(reservation)}
                          >
                            <Eye className="h-4 w-4" />
                            Voir
                          </Button>
                          {reservation.status !== "VALIDEE" ? (
                            <Button
                              type="button"
                              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                              disabled={updatingReservationId === reservation.id}
                              onClick={() => openEditReservation(reservation, "VALIDEE")}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Valider
                            </Button>
                          ) : null}
                          
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="self-start text-slate-600">
                              <MoreVertical className="h-5 w-5" />
                              <span className="sr-only">Actions reservation</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => openEditReservation(reservation)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Commenter
                            </DropdownMenuItem>
                            {reservation.status !== "ANNULEE" ? (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-rose-700 focus:text-rose-700"
                                  onClick={() => openEditReservation(reservation, "ANNULEE")}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Annuler
                                </DropdownMenuItem>
                              </>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Page {safeCurrentPage} sur {totalPages} - {totalReservations} resultat(s)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Precedent
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    <ReservationViewModal
      reservation={selectedViewReservation}
      open={Boolean(selectedViewReservation)}
      onClose={() => setSelectedViewReservation(null)}
    />
    <ReservationEditModal
      reservation={selectedEditReservation}
      open={Boolean(selectedEditReservation)}
      onClose={closeEditReservation}
      onSave={handleSaveReservation}
      initialStatus={editInitialStatus}
    />
    </>
  );
}
