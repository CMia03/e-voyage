"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CreditCard,
  Download,
  FileText,
  ListChecks,
  MessageSquare,
  Monitor,
  PieChart,
  TrendingUp,
  Trash2,
  UserRound,
  UserRoundCog,
  Users,
} from "lucide-react";
import { loadAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/api/client";
import { deleteMyReservation, downloadReservationPdf, getReservationById } from "@/lib/api/reservations";
import { simulerPlanification } from "@/lib/api/simulationService";
import { Reservation, ReservationStatus, VoyageurProfile, ElementSelection } from "@/lib/type/reservation";
import { JourSimulation } from "@/lib/type/simulation.types";

const PlanningJournalier = dynamic(
  () => import("@/app/[username]/simulation/components/PlanningJournalier").then((mod) => mod.PlanningJournalier),
  { ssr: false }
);

const statusStyles: Record<ReservationStatus, string> = {
  EN_ATTENTE: "bg-amber-100 text-amber-800 hover:bg-amber-100",
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

function formatReservationText(value?: string | number | null) {
  return String(value ?? "")
    .replace(/‚/g, "é")
    .replace(/…/g, "à")
    .replace(/–/g, "û")
    .replace(/“/g, "ô")
    .replace(/Š/g, "è")
    .replace(/Œ/g, "î")
    .replace(/×/g, "Î")
    .replace(/Ã©/g, "é")
    .replace(/Ã¨/g, "è")
    .replace(/Ãª/g, "ê")
    .replace(/Ã«/g, "ë")
    .replace(/Ã‰/g, "É")
    .replace(/Ã /g, "à")
    .replace(/Ã¢/g, "â")
    .replace(/Ã®/g, "î")
    .replace(/Ã´/g, "ô")
    .replace(/Ã»/g, "û")
    .replace(/Ã¹/g, "ù")
    .replace(/Ã§/g, "ç");
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
        label: formatReservationText(item.slice(0, separatorIndex).trim()),
        value: formatReservationText(item.slice(separatorIndex + 1).trim()),
      };
    });
}

function getSummaryValue(
  items: Array<{ label: string; value: string }>,
  label: string,
  fallback = "-"
) {
  const normalizedLabel = label.toLowerCase();
  return (
    items.find((item) => item.label.toLowerCase() === normalizedLabel)?.value ??
    fallback
  );
}

function DetailInfoTile({
  icon: Icon,
  label,
  value,
  description,
  accent = false,
}: {
  icon: typeof Monitor;
  label: string;
  value: string;
  description?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Icon className={accent ? "h-5 w-5 text-emerald-700" : "h-5 w-5 text-slate-700"} />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      </div>
      <p className={accent ? "mt-3 font-semibold text-emerald-700" : "mt-3 font-semibold text-slate-950"}>
        {value}
      </p>
      {description ? <p className="mt-1 truncate text-sm text-slate-600">{description}</p> : null}
    </div>
  );
}

function SummaryLine({
  label,
  value,
  highlight = false,
  muted = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[1fr_1fr] gap-4 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0 ${
        highlight ? "bg-emerald-50 text-emerald-800" : muted ? "bg-slate-50" : "bg-white"
      }`}
    >
      <span className="font-medium text-slate-700">{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </div>
  );
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
  const [exportError, setExportError] = useState<string | null>(null);
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
  const visibleElementsByDay = useMemo(() => {
    const grouped = Array.from(elementsByDay.entries())
      .sort(([dayA], [dayB]) => dayA - dayB)
      .filter(([, elements]) => elements.length > 0);

    if (grouped.length > 0) return grouped;
    return reservationElements.length > 0 ? ([[1, reservationElements]] as Array<[number, ElementSelection[]]>) : [];
  }, [elementsByDay, reservationElements]);
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
    params.set("destinationTitle", formatReservationText(detail.nomDestination));
    params.set("planificationId", detail.planificationVoyageId);
    params.set("planificationTitle", formatReservationText(detail.nomPlanification));
    params.set("categorieId", detail.categorieClientId);
    params.set("categorieTitle", formatReservationText(detail.nomCategorieClient));
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

  const handleExportPdf = async () => {
    if (!reservation || !token) return;

    try {
      setExportError(null);
      const { blob, filename } = await downloadReservationPdf(reservation.id, token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setExportError(getErrorMessage(requestError, "Impossible de telecharger le PDF de la reservation."));
    }
  };

  const simulationEditHref = useMemo(() => {
    if (!reservation || !detail || reservation.source !== "SIMULATION") return null;
    const voyageurProfiles = buildVoyageurProfiles(reservation);

    const params = new URLSearchParams();
    params.set("editReservationId", reservation.id);
    params.set("destinationId", detail.destinationId);
    params.set("destinationTitle", formatReservationText(detail.nomDestination));
    params.set("planificationId", detail.planificationVoyageId);
    params.set("planificationTitle", formatReservationText(detail.nomPlanification));
    params.set("categorieId", detail.categorieClientId);
    params.set("categorieTitle", formatReservationText(detail.nomCategorieClient));
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
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Button
            asChild
            variant="outline"
            aria-label="Retour à mes réservations"
            className="mt-2 h-10 w-10 shrink-0 rounded-full border-slate-200 p-0 text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Link href={`/${username}/reservations`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 shadow-sm">
            <FileText className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Détail de réservation
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Consultez le statut de votre demande et tous les détails du voyage réservé.
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:shrink-0 lg:items-end">
          <div className="flex w-full flex-wrap items-center gap-2 sm:flex-nowrap lg:w-auto lg:justify-end">
            {reservation ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-center gap-2 rounded-lg border-slate-200 px-5 font-semibold shadow-sm sm:w-[160px]"
                onClick={() => void handleExportPdf()}
              >
                <Download className="h-4 w-4" />
                Exporter PDF
              </Button>
            ) : null}
            {reservation?.status === "EN_ATTENTE" && reservation.source === "SIMULATION" && simulationEditHref ? (
              <Button
                asChild
                variant="outline"
                className="h-11 w-full justify-center rounded-lg border-slate-200 px-5 font-semibold shadow-sm sm:w-[205px]"
              >
                <Link href={simulationEditHref}>Modifié via simulation</Link>
              </Button>
            ) : null}
            {reservation?.status === "EN_ATTENTE" && reservation.source === "PRIX_DIRECT" && editHref ? (
              <Button asChild className="h-11 w-full justify-center rounded-lg px-5 font-semibold shadow-sm sm:w-[205px]">
                <Link href={editHref}>Modifié la réservation</Link>
              </Button>
            ) : null}
            {reservation?.status === "EN_ATTENTE" ? (
              <Button
                type="button"
                variant="destructive"
                aria-label="Supprimer la réservation"
                className="h-11 w-11 shrink-0 justify-center rounded-lg p-0 shadow-sm"
                onClick={() => void handleDeleteReservation()}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
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
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!loading && exportError ? (
        <Alert variant="destructive">
          <AlertTitle>Export PDF</AlertTitle>
          <AlertDescription>{exportError}</AlertDescription>
        </Alert>
      ) : null}

      {!loading && reservation ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-sm">
                      <FileText className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                        {reservation.reference}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Reservation créée le {formatDate(reservation.dateReservation)}
                      </p>
                    </div>
                  </div>
                  {/* <Badge className={`${statusStyles[reservation.status]} w-fit gap-2 rounded-lg px-4 py-2 text-sm font-semibold uppercase`}>
                    <BadgeCheck className="h-4 w-4" />
                    {formatStatus(reservation.status)}
                  </Badge> */}
                </div>

                <div className="mt-7 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  <DetailInfoTile
                    icon={Monitor}
                    label="Source"
                    value={formatSource(reservation.source)}
                  />
                  <DetailInfoTile
                    icon={CreditCard}
                    label="Montant total"
                    value={formatCurrency(reservation.montantTotal, reservation.devise)}
                    accent
                  />
                  {/* <DetailInfoTile
                    icon={Clock}
                    label="Derniere mise a jour"
                    value={formatDate(reservation.dateModification)}
                  /> */}
                  <DetailInfoTile
                    icon={UserRound}
                    label="Client"
                    value={`${reservation.prenomUtilisateur} ${reservation.nomUtilisateur}`}
                    description={reservation.emailUtilisateur}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-white pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-xl text-slate-950">
                      <Users className="h-5 w-5 text-emerald-700" />
                      Profils voyageurs réservés
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {formatReservationText(detail?.nomDestination ?? "-")} - {formatReservationText(detail?.nomPlanification ?? "-")}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit border-emerald-200 bg-emerald-50 text-emerald-700">
                    {totalVoyageurs(reservation)} voyageur{totalVoyageurs(reservation) > 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Cat&eacute;gorie</th>
                          <th className="px-4 py-3">Gamme</th>
                          <th className="px-4 py-3 text-center">Personnes</th>
                          <th className="px-4 py-3 text-right">Total profil</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {mergedDetails.map((detail) => (
                          <tr key={detail.id} className="text-slate-700">
                            <td className="px-4 py-4 font-medium text-slate-900">
                              {formatReservationText(detail.nomCategorieClient)}
                            </td>
                            <td className="px-4 py-4 font-medium text-slate-900">
                              {detail.gamme}
                            </td>
                            <td className="px-4 py-4 text-center font-medium text-slate-900">
                              {detail.nombrePersonnes} voyageur{detail.nombrePersonnes > 1 ? "s" : ""}
                            </td>
                            <td className="px-4 py-4 text-right font-bold text-emerald-800">
                              {formatCurrency(detail.prixTotal, reservation.devise)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t border-emerald-200 bg-emerald-50/80">
                        <tr>
                          <td colSpan={3} className="px-4 py-4 text-right text-sm font-semibold text-emerald-900">
                            Total
                          </td>
                          <td className="px-4 py-4 text-right text-base font-bold text-emerald-900">
                            {formatCurrency(reservation.montantTotal, reservation.devise)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                <div className="hidden">
                  {mergedDetails.map((detail, index) => (
                    <div key={detail.id || index} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/40 p-4 shadow-sm">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Catégorie</p>
                          <div className="mt-2 truncate text-sm font-semibold text-slate-950">
                            {formatReservationText(detail.nomCategorieClient)}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Gamme</p>
                          <div className="mt-2 text-sm font-semibold text-slate-950">
                            {detail.gamme}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Personnes</p>
                          <div className="mt-2 text-sm font-semibold text-slate-950">
                            {detail.nombrePersonnes} voyageur{detail.nombrePersonnes > 1 ? "s" : ""}
                          </div>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Total profil</p>
                          <div className="mt-2 text-sm font-bold text-emerald-900">
                            {formatCurrency(detail.prixUnitaire, reservation.devise)}
                            {detail.nombrePersonnes > 1 ? (
                              <span className="mt-1 block text-xs font-medium text-emerald-700">
                                Total : {formatCurrency(detail.prixTotal, reservation.devise)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4">
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
              <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-white">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-slate-950">
                        <ListChecks className="h-5 w-5 text-emerald-600" />
                        Elements selectionnes
                      </CardTitle>
                      <CardDescription>
                        Les prestations retenues dans votre demande de reservation.
                      </CardDescription>
                    </div>
                    {reservation.source === "SIMULATION" ? (
                      <Button 
                        type="button" 
                        variant="outline"
                        className="h-10 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                        onClick={() => setIsPlanningOpen(true)}
                      >
                        <CalendarDays className="h-4 w-4" />
                        Voir le planning journalier
                      </Button>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {visibleElementsByDay.map(([dayNumber, elements]) => (
                        <div key={dayNumber} className="px-5 py-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-semibold text-slate-950">Jour {dayNumber}</h3>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {elements.length} prestation{elements.length > 1 ? "s" : ""}
                              </p>
                            </div>
                            {/* <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                              {elements.length}
                            </span> */}
                          </div>
                          
                          <div className="grid gap-2 md:grid-cols-2">
                            {elements.map((element) => (
                              <div
                                key={`${element.elementId}-${element.quantite}`}
                                className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3"
                              >
                                {/* Header avec icône */}
                                <div>
                                 

                                  <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                     
                                      
                                      <h4 className="line-clamp-2 text-sm font-medium leading-tight text-slate-900">
                                        {formatReservationText(element.nomElement || elementNameMap.get(element.elementId) || element.elementId)}
                                      </h4>
                                      
                                      <div className="mt-2 flex items-center gap-2">
                                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                          <Users className="h-3.5 w-3.5" />
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

          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl text-slate-950">
                  <TrendingUp className="h-5 w-5 text-emerald-700" />
                  Suivi de demande
                </CardTitle>
                <CardDescription>
                  Votre reservation est suivie par l&apos;administration Cool Voyage.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-5">
                  <p className="text-sm font-semibold text-emerald-900">Statut actuel</p>
                  <Badge className={`${statusStyles[reservation.status]} mt-4 gap-2 rounded-lg px-4 py-2 text-sm font-semibold uppercase`}>
                    <BadgeCheck className="h-4 w-4" />
                    {formatStatus(reservation.status)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl text-slate-950">
                  <MessageSquare className="h-5 w-5 text-indigo-700" />
                  Commentaires
                </CardTitle>
                <CardDescription>Informations associees a votre demande.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <p className="min-w-0 text-sm text-slate-700">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Commentaire client
                    </span>
                    {formatReservationText(reservation.commentaireClient?.trim() || "Aucun commentaire client.")}
                  </p>
                </div>
                <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <UserRoundCog className="h-5 w-5" />
                  </div>
                  <p className="min-w-0 text-sm text-slate-700">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Commentaire admin
                    </span>
                    {formatReservationText(reservation.commentaireAdmin?.trim() || "Aucun commentaire admin pour le moment.")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {reservationSummary ? (
              <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl text-slate-950">
                    <PieChart className="h-5 w-5 text-indigo-700" />
                    Résumé de la simulation
                  </CardTitle>
                  <CardDescription>
                    Résumé global conservé pour cette réservation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <SummaryLine label="Destination" value={getSummaryValue(reservationSummaryItems, "Destination", formatReservationText(detail?.nomDestination ?? "-"))} />
                    <SummaryLine label="Planification" value={getSummaryValue(reservationSummaryItems, "Planification", formatReservationText(detail?.nomPlanification ?? "-"))} />
                    <SummaryLine label="Nombre de personnes" value={getSummaryValue(reservationSummaryItems, "Nombre de personnes", String(totalVoyageurs(reservation)))} />
                    <SummaryLine label="Budget client" value={getSummaryValue(reservationSummaryItems, "Budget client", formatCurrency(reservation.montantTotal, reservation.devise))} />
                    <SummaryLine label="Total selectionne" value={getSummaryValue(reservationSummaryItems, "Total selectionne", formatCurrency(reservation.montantTotal, reservation.devise))} highlight />
                    <SummaryLine label="Reste budgetaire" value={getSummaryValue(reservationSummaryItems, "Reste budgetaire", "-")} muted />
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      ) : null}

      <Dialog open={isPlanningOpen} onOpenChange={setIsPlanningOpen}>
        <DialogContent className="!max-h-[88vh] !w-[94vw] !max-w-[1400px] overflow-hidden rounded-[24px] border border-slate-200 bg-white p-0 sm:!max-w-[1400px]">
          <DialogHeader className="border-b border-slate-200 bg-slate-50/90 px-6 py-4">
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Planning journalier de la reservation
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Retrouvez le detail jour par jour des blocs retenus dans cette simulation.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(88vh-86px)] overflow-auto px-6 py-4">
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
