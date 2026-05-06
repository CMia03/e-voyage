"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { loadAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/api/client";
import { deleteMyReservation, getReservationById } from "@/lib/api/reservations";
import { simulerPlanification } from "@/lib/api/simulationService";
import { Reservation, ReservationStatus, VoyageurProfile, ElementSelection } from "@/lib/type/reservation";
import { JourSimulation } from "@/lib/type/simulation.types";
import { PlanningJournalier } from "@/app/[username]/simulation/components/PlanningJournalier";

const statusStyles: Record<ReservationStatus, string> = {
  EN_ATTENTE: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  A_REVOIR: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  EN_ATTENTE_DISPONIBILITE: "bg-sky-100 text-sky-800 hover:bg-sky-100",
  VALIDEE: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  ANNULEE: "bg-rose-100 text-rose-800 hover:bg-rose-100",
};

function formatCurrency(amount: number | undefined, devise = "MGA") {
  return `${Math.round(amount ?? 0).toLocaleString("fr-MG")} ${devise}`;
}

function formatStatus(status: ReservationStatus) {
  return status.replaceAll("_", " ");
}

function formatSource(source: string) {
  return source === "SIMULATION" ? "Simulation" : "Prix direct";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR");
}

function extractBudgetClientFromSummary(summary: string | null | undefined): number {
  if (!summary) return 0;

  const line = summary
    .split("\n")
    .map((item) => item.trim())
    .find((item) => item.toLowerCase().startsWith("budget client:"));

  if (!line) return 0;

  const numericPart = line.replace(/[^0-9]/g, "");
  const parsed = Number(numericPart);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function buildVoyageurProfiles(reservation: Reservation): VoyageurProfile[] {
  return reservation.details.map((detail) => ({
    categorieClientId: detail.categorieClientId,
    gamme: detail.gamme,
    nombrePersonnes: detail.nombrePersonnes,
  }));
}

function totalVoyageurs(reservation: Reservation): number {
  return reservation.details.reduce((sum, detail) => sum + (detail.nombrePersonnes ?? 0), 0);
}

function getUniqueSelectedElements(reservation: Reservation) {
  const elements = reservation.elementsSelectionnes ?? [];
  if (elements.length > 0) {
    return elements;
  }

  const detailElements = reservation.details.flatMap((detail) => detail.elementsSelectionnes ?? []);
  const uniqueElements = new Map<string, ElementSelection>();

  detailElements.forEach((element) => {
    if (!element.elementId || element.quantite <= 0) return;
    const existing = uniqueElements.get(element.elementId);
    if (!existing) {
      uniqueElements.set(element.elementId, element);
      return;
    }

    uniqueElements.set(element.elementId, {
      ...existing,
      quantite: Math.max(existing.quantite, element.quantite),
    });
  });

  return Array.from(uniqueElements.values());
}

function groupElementsByDay(elements: ElementSelection[], planningPreview: JourSimulation[]) {
  const dayMap = new Map<number, ElementSelection[]>();
  
  // Initialiser les jours vides
  planningPreview.forEach((jour) => {
    dayMap.set(jour.numeroJour, []);
  });
  
  // Grouper les éléments par jour
  elements.forEach((element) => {
    // Trouver le jour de l'élément dans le planning
    for (const jour of planningPreview) {
      if (jour.elements.some((el) => el.id === element.elementId)) {
        const dayElements = dayMap.get(jour.numeroJour) || [];
        dayElements.push(element);
        dayMap.set(jour.numeroJour, dayElements);
        break;
      }
    }
  });
  
  return dayMap;
}

function mergeReservationDetails(reservation: Reservation) {
  const groups = new Map<
    string,
    {
      id: string;
      nomDestination: string;
      nomPlanification: string;
      nomCategorieClient: string;
      gamme: string;
      nombrePersonnes: number;
      prixUnitaireCumule: number;
      prixTotal: number;
      dateCreation: string;
    }
  >();

  reservation.details.forEach((detail) => {
    const key = [
      detail.destinationId,
      detail.planificationVoyageId,
      detail.categorieClientId,
      detail.gamme,
    ].join("::");

    const existing = groups.get(key);
    if (existing) {
      existing.nombrePersonnes += detail.nombrePersonnes ?? 0;
      existing.prixUnitaireCumule += (detail.prixUnitaire ?? 0) * (detail.nombrePersonnes ?? 0);
      existing.prixTotal += detail.prixTotal ?? 0;
      return;
    }

    groups.set(key, {
      id: detail.id,
      nomDestination: detail.nomDestination,
      nomPlanification: detail.nomPlanification,
      nomCategorieClient: detail.nomCategorieClient,
      gamme: detail.gamme,
      nombrePersonnes: detail.nombrePersonnes ?? 0,
      prixUnitaireCumule: (detail.prixUnitaire ?? 0) * (detail.nombrePersonnes ?? 0),
      prixTotal: detail.prixTotal ?? 0,
      dateCreation: detail.dateCreation,
    });
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    prixUnitaire:
      group.nombrePersonnes > 0 ? group.prixUnitaireCumule / group.nombrePersonnes : 0,
  }));
}

function parseSummaryLines(summary: string | null | undefined) {
  if (!summary) {
    return [];
  }

  return summary
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const separatorIndex = item.indexOf(":");
      if (separatorIndex === -1) {
        return { label: "", value: item };
      }

      return {
        label: item.slice(0, separatorIndex).trim(),
        value: item.slice(separatorIndex + 1).trim(),
      };
    });
}

export default function ReservationDetailPage() {
  const params = useParams<{ username: string; id: string }>();
  const router = useRouter();
  const username = typeof params?.username === "string" ? params.username : "client";
  const reservationId = typeof params?.id === "string" ? params.id : "";
  const session = useMemo(() => loadAuth(), []);
  const token = session?.accessToken;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planningPreview, setPlanningPreview] = useState<JourSimulation[]>([]);
  const [loadingPlanningPreview, setLoadingPlanningPreview] = useState(false);
  const [planningPreviewError, setPlanningPreviewError] = useState<string | null>(null);
  const [isPlanningOpen, setIsPlanningOpen] = useState(false);
  const detail = reservation?.details[0] ?? null;
  const reservationElements = useMemo(
    () => (reservation ? getUniqueSelectedElements(reservation) : []),
    [reservation]
  );
  const elementsByDay = useMemo(
    () => groupElementsByDay(reservationElements, planningPreview),
    [reservationElements, planningPreview]
  );
  const mergedDetails = useMemo(
    () => (reservation ? mergeReservationDetails(reservation) : []),
    [reservation]
  );
  const reservationSummary = reservation?.resumeSimulation ?? null;
  const reservationSummaryItems = useMemo(
    () => parseSummaryLines(reservationSummary),
    [reservationSummary]
  );
  const elementNameMap = useMemo(() => {
    const names = new Map<string, string>();

    planningPreview.forEach((jour) => {
      jour.elements.forEach((element) => {
        if (!names.has(element.id)) {
          names.set(element.id, element.titre);
        }
      });
    });

    return names;
  }, [planningPreview]);

  useEffect(() => {
    const loadReservation = async () => {
      if (!token) {
        setError("Vous devez etre connecte pour consulter cette reservation.");
        setLoading(false);
        return;
      }

      if (!reservationId) {
        setError("Reservation introuvable.");
        setLoading(false);
        return;
      }

      try {
        const response = await getReservationById(reservationId, token);
        setReservation(response.data ?? null);
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Impossible de charger le detail de la reservation."));
      } finally {
        setLoading(false);
      }
    };

    void loadReservation();
  }, [reservationId, token]);

  useEffect(() => {
    const loadPlanningPreview = async () => {
      if (!token || !reservation || !detail || reservation.source !== "SIMULATION") {
        setPlanningPreview([]);
        setPlanningPreviewError(null);
        return;
      }

      const budgetClient = extractBudgetClientFromSummary(reservation.resumeSimulation) || reservation.montantTotal;

      setLoadingPlanningPreview(true);
      setPlanningPreviewError(null);

      try {
        const response = await simulerPlanification(
          {
            destinationId: detail.destinationId,
            planificationId: detail.planificationVoyageId,
            budgetClient,
            idCategorieClient: detail.categorieClientId,
            gamme: detail.gamme,
            nombrePersonnes: totalVoyageurs(reservation),
            profilsVoyageurs: buildVoyageurProfiles(reservation),
            elementsSelectionnes: reservationElements,
          },
          token
        );

        setPlanningPreview(response.jours ?? []);
      } catch (requestError) {
        setPlanningPreview([]);
        setPlanningPreviewError(
          getErrorMessage(requestError, "Impossible de reconstruire le planning journalier de cette reservation.")
        );
      } finally {
        setLoadingPlanningPreview(false);
      }
    };

    void loadPlanningPreview();
  }, [detail, reservation, reservationElements, token]);

  const editHref = useMemo(() => {
    if (!reservation || !detail) return null;
    const voyageurProfiles = buildVoyageurProfiles(reservation);

    const params = new URLSearchParams();
    params.set("editReservationId", reservation.id);
    params.set("source", reservation.source);
    params.set("destinationId", detail.destinationId);
    params.set("destinationTitle", detail.nomDestination);
    params.set("planificationId", detail.planificationVoyageId);
    params.set("planificationTitle", detail.nomPlanification);
    params.set("categorieId", detail.categorieClientId);
    params.set("categorieTitle", detail.nomCategorieClient);
    params.set("gamme", detail.gamme);
    params.set("nombrePersonnes", String(totalVoyageurs(reservation)));
    params.set("voyageurProfiles", JSON.stringify(voyageurProfiles));
    if (reservation.elementsSelectionnes.length > 0) {
      params.set("elementsSelectionnes", JSON.stringify(reservation.elementsSelectionnes));
    }
    if (reservation.resumeSimulation) {
      params.set("resumeSimulation", reservation.resumeSimulation);
    }
    if (reservation.commentaireClient) {
      params.set("commentaireClient", reservation.commentaireClient);
    }

    return `/${username}/reservations?${params.toString()}`;
  }, [detail, reservation, username]);

  const handleDeleteReservation = async () => {
    if (!token || !reservation) return;

    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cette reservation ? Cette action est definitive."
    );

    if (!confirmed) return;

    setError(null);

    try {
      const response = await deleteMyReservation(reservation.id, token);
      router.push(
        `/${username}/reservations?deleted=${encodeURIComponent(
          response.message ?? "Reservation supprimee avec succes."
        )}`
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Impossible de supprimer la reservation."));
    }
  };

  const simulationEditHref = useMemo(() => {
    if (!reservation || !detail || reservation.source !== "SIMULATION") return null;
    const voyageurProfiles = buildVoyageurProfiles(reservation);

    const params = new URLSearchParams();
    params.set("editReservationId", reservation.id);
    params.set("destinationId", detail.destinationId);
    params.set("destinationTitle", detail.nomDestination);
    params.set("planificationId", detail.planificationVoyageId);
    params.set("planificationTitle", detail.nomPlanification);
    params.set("categorieId", detail.categorieClientId);
    params.set("categorieTitle", detail.nomCategorieClient);
    params.set("gamme", detail.gamme);
    params.set("nombrePersonnes", String(totalVoyageurs(reservation)));
    params.set("voyageurProfiles", JSON.stringify(voyageurProfiles));
    const budgetClient = extractBudgetClientFromSummary(reservation.resumeSimulation);
    if (budgetClient > 0) {
      params.set("budgetClient", String(budgetClient));
    }
    if (reservation.elementsSelectionnes.length > 0) {
      params.set("elementsSelectionnes", JSON.stringify(reservation.elementsSelectionnes));
    }
    if (reservation.resumeSimulation) {
      params.set("resumeSimulation", reservation.resumeSimulation);
    }
    if (reservation.commentaireClient) {
      params.set("commentaireClient", reservation.commentaireClient);
    }

    return `/${username}/simulation?${params.toString()}`;
  }, [detail, reservation, username]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Detail de reservation</h1>
          <p className="text-sm text-muted-foreground">
            Consultez le statut de votre demande et tous les details du voyage reserve.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {reservation?.status === "EN_ATTENTE" ? (
            <Button type="button" variant="destructive" onClick={() => void handleDeleteReservation()}>
              Supprimer la reservation
            </Button>
          ) : null}
          {reservation?.status === "EN_ATTENTE" && simulationEditHref ? (
            <Button asChild variant="outline">
              <Link href={simulationEditHref}>Modifier via simulation</Link>
            </Button>
          ) : null}
          {reservation?.status === "EN_ATTENTE" && editHref ? (
            <Button asChild>
              <Link href={editHref}>Modifier la reservation</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href={`/${username}/reservations`}>Retour a mes reservations</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">
            Chargement de la reservation...
          </CardContent>
        </Card>
      ) : null}

      {!loading && error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {!loading && !error && reservation ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_340px]">
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>{reservation.reference}</CardTitle>
                    <CardDescription>
                      Reservation creee le {formatDate(reservation.dateReservation)}
                    </CardDescription>
                  </div>
                  <Badge className={statusStyles[reservation.status]}>
                    {formatStatus(reservation.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Source</p>
                  <p className="mt-2 font-medium">{formatSource(reservation.source)}</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Montant total</p>
                  <p className="mt-2 font-medium">
                    {formatCurrency(reservation.montantTotal, reservation.devise)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Derniere mise a jour</p>
                  <p className="mt-2 font-medium">{formatDate(reservation.dateModification)}</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Client</p>
                  <p className="mt-2 font-medium">
                    {reservation.prenomUtilisateur} {reservation.nomUtilisateur}
                  </p>
                  <p className="text-sm text-muted-foreground">{reservation.emailUtilisateur}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Profils voyageurs reserves</CardTitle>
                <CardDescription>
                  {detail?.nomDestination ?? "-"} - {detail?.nomPlanification ?? "-"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {mergedDetails.map((detail, index) => (
                    <div key={detail.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-base font-semibold text-slate-900">Profil {index + 1}</p>
                        <p className="text-xs text-slate-500">
                          Cree le {formatDate(detail.dateCreation)}
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[minmax(220px,1fr)_180px_180px_170px_170px] 2xl:items-end">
                        <div className="min-w-0 space-y-2 md:col-span-2 xl:col-span-2 2xl:col-span-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Categorie client</p>
                          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-900">
                            {detail.nomCategorieClient}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Gamme</p>
                          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-900">
                            {detail.gamme}
                          </div>
                        </div>
                        <div className="min-w-0 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Nombre de personnes</p>
                          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-900">
                            {detail.nombrePersonnes}
                          </div>
                        </div>
                        <div className="min-w-0 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Prix unitaire</p>
                          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm font-semibold text-slate-900">
                            {formatCurrency(detail.prixUnitaire, reservation.devise)}
                          </div>
                        </div>
                        <div className="min-w-0 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Prix total</p>
                          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm font-semibold text-slate-900">
                            {formatCurrency(detail.prixTotal, reservation.devise)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-100/70 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                    Grand total
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatCurrency(reservation.montantTotal, reservation.devise)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {reservationElements.length > 0 ? (
              <Card className="border-border/50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/30 border-b border-emerald-200">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-emerald-900 flex items-center gap-2">
                        <span className="text-2xl">📋</span>
                        Elements selectionnes
                      </CardTitle>
                      <CardDescription className="text-emerald-700">
                        Blocs retenus pour l&apos;ensemble de la reservation.
                      </CardDescription>
                    </div>
                    {reservation.source === "SIMULATION" ? (
                      <Button 
                        type="button" 
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-2 border-emerald-400 shadow-lg transition-all duration-300 hover:scale-105"
                        onClick={() => setIsPlanningOpen(true)}
                      >
                        <span className="mr-2">📅</span>
                        Voir le planning journalier
                      </Button>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-gradient-to-b from-emerald-50/20 to-transparent">
                  <div className="space-y-6">
                    {Array.from(elementsByDay.entries())
                      .sort(([dayA], [dayB]) => dayA - dayB)
                      .map(([dayNumber, elements]) => (
                        <div key={dayNumber} className="space-y-3">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg">
                              📅
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-emerald-900">Jour {dayNumber}</h3>
                              <p className="text-sm text-emerald-700">
                                {elements.length} bloc{elements.length > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {elements.map((element) => (
                              <div
                                key={`${element.elementId}-${element.quantite}`}
                                className="group relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-white via-emerald-50/20 to-emerald-50/40 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.03] hover:-translate-y-1 border-emerald-200"
                              >
                                {/* Header avec icône */}
                                <div className="relative p-4 pb-3">
                                 

                                  <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                     
                                      
                                      <h4 className="text-base font-bold text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors line-clamp-2">
                                        {elementNameMap.get(element.elementId) ?? element.elementId}
                                      </h4>
                                      
                                      <div className="mt-2 flex items-center gap-2">
                                        <div className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1 text-xs font-medium shadow-lg">
                                          <span className="text-xs">👥</span>
                                          <span>{element.quantite} pers</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                  
                  
                </CardContent>
              </Card>
            ) : null}

            {reservationSummary ? (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Resume de simulation</CardTitle>
                  <CardDescription>
                    Resume global conserve pour cette reservation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {reservationSummaryItems.map((item, index) => (
                        <div
                          key={`${item.label || "summary"}-${index}`}
                          className="rounded-xl border border-emerald-100 bg-white/90 p-3"
                        >
                          {item.label ? (
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                              {item.label}
                            </p>
                          ) : null}
                          <p className={`text-sm font-medium text-slate-900 ${item.label ? "mt-1.5" : ""}`}>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Suivi de demande</CardTitle>
                <CardDescription>
                  Votre reservation est suivie par l&apos;administration Cool Voyage.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="rounded-xl border border-dashed border-border/70 p-4">
                  <p className="font-medium text-foreground">Statut actuel</p>
                  <p className="mt-2">{formatStatus(reservation.status)}</p>
                </div>
                {/* <div className="rounded-xl border border-dashed border-border/70 p-4">
                  <p className="font-medium text-foreground">Ce que cela signifie</p>
                  <p className="mt-2">
                    {reservation.status === "EN_ATTENTE"
                      ? "Votre demande a bien ete enregistree et attend le traitement de l'admin."
                      : reservation.status === "A_REVOIR"
                        ? "Votre reservation doit encore etre verifiee avant validation."
                        : reservation.status === "EN_ATTENTE_DISPONIBILITE"
                          ? "L'equipe verifie actuellement la disponibilite avant confirmation."
                          : reservation.status === "VALIDEE"
                            ? "Votre reservation est confirmee."
                            : "La reservation a ete annulee."}
                  </p>
                </div> */}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Commentaires</CardTitle>
                <CardDescription>Informations associees a votre demande.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Commentaire client</p>
                  <p className="mt-2 text-sm text-foreground">
                    {reservation.commentaireClient?.trim() || "Aucun commentaire client."}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Commentaire admin</p>
                  <p className="mt-2 text-sm text-foreground">
                    {reservation.commentaireAdmin?.trim() || "Aucun commentaire admin pour le moment."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      <Dialog open={isPlanningOpen} onOpenChange={setIsPlanningOpen}>
        <DialogContent className="!h-[92vh] !w-[94vw] !max-w-[1400px] overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 sm:!max-w-[1400px]">
          <DialogHeader className="border-b border-slate-200 bg-slate-50/90 px-6 py-5">
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Planning journalier de la reservation
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Retrouvez le detail jour par jour des blocs retenus dans cette simulation.
            </DialogDescription>
          </DialogHeader>
          <div className="h-full overflow-auto px-6 py-5">
            {loadingPlanningPreview ? (
              <p className="text-sm text-muted-foreground">Chargement du planning journalier...</p>
            ) : planningPreviewError ? (
              <p className="text-sm text-rose-600">{planningPreviewError}</p>
            ) : planningPreview.length > 0 ? (
              <PlanningJournalier
                jours={planningPreview}
                elementsSelectionnes={reservationElements}
                onChangeElementQuantity={() => undefined}
                totalVoyageurs={reservation ? totalVoyageurs(reservation) : 0}
                readOnly
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun planning journalier detaille n&apos;a pu etre reconstruit pour cette reservation.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
