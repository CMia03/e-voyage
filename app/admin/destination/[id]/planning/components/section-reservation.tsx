"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
const pageSize = 3;

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
  const visiblePages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
    const start = Math.min(Math.max(safeCurrentPage - 2, 1), Math.max(totalPages - 4, 1));
    return start + index;
  });

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

              <p className="text-xs text-muted-foreground">
                {totalReservations === 0
                  ? "Aucun resultat"
                  : `${paginationStart}-${paginationEnd} sur ${totalReservations} resultat(s)`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Chargement des reservations...
            </div>
          ) : error ? (
            <div className="px-4 py-6">
              <Alert variant="destructive">
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : planificationReservations.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Aucune reservation liee a cette planification pour le moment.
            </div>
          ) : totalReservations === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Aucune reservation ne correspond aux filtres.
            </div>
          ) : (
            <div className="bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <tr className="border-b border-slate-200">
                      <th className="w-12 px-5 py-4 text-left">
                        <Checkbox aria-label="Selectionner toutes les reservations" />
                      </th>
                      <th className="px-5 py-4 text-left">Reference</th>
                      <th className="px-5 py-4 text-left">Client</th>
                      <th className="px-5 py-4 text-left">Destination</th>
                      <th className="px-5 py-4 text-left">Statut</th>
                      <th className="px-5 py-4 text-left">Periode</th>
                      <th className="px-5 py-4 text-right">Montant</th>
                      <th className="px-5 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.map((reservation) => {
                      const details = getPlanificationDetails(reservation, planification.id);
                      const mainDetail = details[0];
                      const voyageurs = details.reduce((sum, detail) => sum + detail.nombrePersonnes, 0);
                      const categorie = mainDetail?.nomCategorieClient || "Categorie";

                      return (
                        <tr key={reservation.id} className="border-b border-slate-100 transition hover:bg-emerald-50/30">
                          <td className="px-5 py-5 align-middle">
                            <Checkbox aria-label={`Selectionner ${reservation.reference}`} />
                          </td>
                          <td className="px-5 py-5 align-middle">
                            <p className="font-bold text-slate-950">{reservation.reference}</p>
                            <p className="mt-1 text-xs text-slate-500">{formatDate(reservation.dateReservation)}</p>
                          </td>
                          <td className="px-5 py-5 align-middle">
                            <div className="flex items-start gap-2">
                              <Users className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-950">{getClientName(reservation)}</p>
                                <p className="truncate text-xs text-slate-500">{reservation.emailUtilisateur || "Email non renseigne"}</p>
                                <Badge variant="secondary" className="mt-2 rounded-md bg-slate-100 text-xs text-slate-600">
                                  {voyageurs} voyageur(s)
                                </Badge>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-5 align-middle">
                            <div className="flex items-start gap-2">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                              <div>
                                <p className="font-semibold text-slate-950">{mainDetail?.nomDestination || planification.destinationNom || "Destination"}</p>
                                <p className="mt-1 text-xs text-slate-500">{categorie}</p>
                                <Badge variant="secondary" className={`mt-2 rounded-md text-xs ${sourceClasses[reservation.source]}`}>
                                  {sourceLabels[reservation.source]}
                                </Badge>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-5 align-middle">
                            <Badge variant="outline" className={`rounded-md ${statusClasses[reservation.status]}`}>
                              {statusLabels[reservation.status]}
                            </Badge>
                          </td>
                          <td className="px-5 py-5 align-middle">
                            <div className="flex items-start gap-2">
                              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                              <div className="space-y-1">
                                <p className="text-slate-800">{formatDateOnly(reservation.dateReservation)}</p>
                                <p className="text-slate-400">-</p>
                                <p className="text-slate-800">{formatDateOnly(reservation.dateModification)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-5 text-right align-middle">
                            <p className="font-bold text-slate-950">{Number(reservation.montantTotal || 0).toLocaleString("fr-FR")}</p>
                            <p className="text-xs text-slate-500">{reservation.devise || "MGA"}</p>
                          </td>
                          <td className="px-5 py-5 align-middle">
                            <div className="flex justify-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => setSelectedViewReservation(reservation)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button type="button" variant="outline" size="icon" className="h-10 w-10">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  {reservation.status !== "VALIDEE" ? (
                                    <DropdownMenuItem onClick={() => openEditReservation(reservation, "VALIDEE")}>
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      Valider
                                    </DropdownMenuItem>
                                  ) : null}
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm text-muted-foreground">
                  Afficher <span className="font-semibold text-slate-700">{pageSize}</span> par page
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {visiblePages.map((page) => (
                    <Button
                      key={page}
                      type="button"
                      variant={page === safeCurrentPage ? "default" : "outline"}
                      size="icon"
                      className={`h-9 w-9 ${
                        page === safeCurrentPage
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : ""
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground lg:text-right">
                  {paginationStart} - {paginationEnd} sur {totalReservations}
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
