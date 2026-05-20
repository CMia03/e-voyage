"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Calculator,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  SlidersHorizontal,
  MapPin,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { loadAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/api/client";
import { listDestinations, listPlanificationsByDestination } from "@/lib/api/destinations";
import { listCategorieClientActivites } from "@/lib/api/activites";
import {
  calculateReservationQuote,
  createReservationFromPrice,
  createReservationFromSimulation,
  deleteMyReservation,
  listMyReservations,
  updateMyReservation,
} from "@/lib/api/reservations";
import {
  Reservation,
  ReservationCreatePayload,
  ReservationQuote,
  ReservationSource,
  ReservationStatus,
  ElementSelection,
  VoyageurProfile,
} from "@/lib/type/reservation";
import type { DestinationDetails, PlanificationVoyage } from "@/lib/type/destination";

type CategorieClient = {
  id: string;
  nom: string;
};

type SimulationElementCard = {
  id: string;
  titre: string;
  prix?: number;
  type?: string;
  quantite?: number;
  jourNumero?: number;
  jourTitre?: string;
};

type ReservationFormState = {
  source: ReservationSource;
  destinationId: string;
  planificationVoyageId: string;
  categorieClientId: string;
  gamme: string;
  nombrePersonnes: number;
  voyageurProfiles: VoyageurProfile[];
  commentaireClient: string;
  elementsSelectionnes: string;
  resumeSimulation: string;
};

const initialForm: ReservationFormState = {
  source: "PRIX_DIRECT",
  destinationId: "",
  planificationVoyageId: "",
  categorieClientId: "",
  gamme: "MOYENNE",
  nombrePersonnes: 1,
  voyageurProfiles: [],
  commentaireClient: "",
  elementsSelectionnes: "",
  resumeSimulation: "",
};

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

function formatSource(source: ReservationSource) {
  return source === "SIMULATION" ? "Simulation" : "Prix direct";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR");
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeGamme(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toUpperCase();
  return normalized === "LUXE" ? "LUXE" : "MOYENNE";
}

function getSelectLabel(value: string | null | undefined, selectedLabel: string | null | undefined, placeholder: string) {
  if (value && value.trim() !== "") {
    return selectedLabel || placeholder;
  }
  return placeholder;
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

function parseSimulationElementCards(value: string | null): SimulationElementCard[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        id: typeof item?.id === "string" ? item.id : "",
        titre: typeof item?.titre === "string" ? item.titre : "",
        prix: typeof item?.prix === "number" ? item.prix : undefined,
        type: typeof item?.type === "string" ? item.type : undefined,
        quantite: typeof item?.quantite === "number" ? item.quantite : undefined,
        jourNumero: typeof item?.jourNumero === "number" ? item.jourNumero : undefined,
        jourTitre: typeof item?.jourTitre === "string" ? item.jourTitre : undefined,
      }))
      .filter((item) => item.id);
  } catch {
    return [];
  }
}

function parseElementSelections(value: string | null | undefined): ElementSelection[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        elementId: typeof item?.elementId === "string" ? item.elementId : "",
        quantite: typeof item?.quantite === "number" ? item.quantite : 0,
      }))
      .filter((item) => !!item.elementId && item.quantite > 0);
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((elementId) => ({ elementId, quantite: 1 }));
  }
}

function parseSummaryLines(summary: string) {
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

function parseVoyageurProfiles(
  value: string | null,
  fallbackCategorieId: string | null,
  fallbackGamme: string,
  fallbackNombrePersonnes: number
): VoyageurProfile[] {
  if (value) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const profiles = parsed
          .map((item) => ({
            categorieClientId:
              typeof item?.categorieClientId === "string" ? item.categorieClientId : "",
            gamme:
              typeof item?.gamme === "string" && item.gamme.trim()
                ? item.gamme.trim().toUpperCase()
                : fallbackGamme,
            nombrePersonnes:
              typeof item?.nombrePersonnes === "number" && item.nombrePersonnes > 0
                ? item.nombrePersonnes
                : 1,
          }))
          .filter((item) => !!item.categorieClientId);

        if (profiles.length > 0) {
          return profiles;
        }
      }
    } catch {
      return [];
    }
  }

  return fallbackCategorieId
    ? [{ categorieClientId: fallbackCategorieId, gamme: fallbackGamme, nombrePersonnes: fallbackNombrePersonnes }]
    : [];
}

function ensureValidProfiles(
  profiles: VoyageurProfile[],
  categories: CategorieClient[],
  fallbackCategorieId?: string
): VoyageurProfile[] {
  const defaultCategoryId = fallbackCategorieId || categories[0]?.id || "";
  const normalized = profiles
    .map((profile) => ({
      categorieClientId: profile.categorieClientId || defaultCategoryId,
      gamme: normalizeGamme(profile.gamme),
      nombrePersonnes: Math.max(Number(profile.nombrePersonnes) || 1, 1),
    }))
    .filter((profile) => !!profile.categorieClientId);

  if (normalized.length > 0) {
    return normalized;
  }

  return defaultCategoryId
    ? [{ categorieClientId: defaultCategoryId, gamme: "MOYENNE", nombrePersonnes: 1 }]
    : [];
}

function totalVoyageurs(profiles: VoyageurProfile[]): number {
  return profiles.reduce((sum, profile) => sum + Math.max(profile.nombrePersonnes || 0, 0), 0);
}

function totalVoyageursFromDetails(reservation: Reservation): number {
  return reservation.details.reduce((sum, detail) => sum + Math.max(detail.nombrePersonnes || 0, 0), 0);
}

function getReservationProfilesSummary(reservation: Reservation) {
  if (reservation.details.length === 0) {
    return "Aucun profil";
  }

  if (reservation.details.length === 1) {
    const detail = reservation.details[0];
    return `${detail.nomCategorieClient ?? "-"} - ${detail.gamme ?? "-"} - ${detail.nombrePersonnes ?? 0} voyageur(s)`;
  }

  return `${reservation.details.length} profil(s) - ${totalVoyageursFromDetails(reservation)} voyageur(s)`;
}

function countUniqueSelectedElements(reservation: Reservation) {
  return new Set(
    reservation.elementsSelectionnes
      .map((element) => element.elementId)
  ).size;
}

function buildPayload(form: ReservationFormState): ReservationCreatePayload {
  const validProfiles = form.voyageurProfiles.filter(
    (profile) => !!profile.categorieClientId && !!profile.gamme && profile.nombrePersonnes > 0
  );
  const firstProfile = validProfiles[0];
  const elementsSelectionnes =
    form.source === "SIMULATION" ? parseElementSelections(form.elementsSelectionnes) : [];

  return {
    source: form.source,
    destinationId: form.destinationId,
    planificationVoyageId: form.planificationVoyageId,
    categorieClientId: firstProfile?.categorieClientId ?? form.categorieClientId,
    gamme: firstProfile?.gamme ?? form.gamme,
    nombrePersonnes: totalVoyageurs(validProfiles) || form.nombrePersonnes,
    profilsVoyageurs: validProfiles,
    commentaireClient: form.commentaireClient || undefined,
    elementsSelectionnes: elementsSelectionnes.length > 0 ? elementsSelectionnes : undefined,
    resumeSimulation:
      form.source === "SIMULATION" && form.resumeSimulation.trim()
        ? form.resumeSimulation.trim()
        : undefined,
  };
}

export default function ReservationsPage() {
  const { username } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
    
  type ReservationSubSection = "create" | "list";
  const [activeReservationSection, setActiveReservationSection] = useState<ReservationSubSection>("list");

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [destinations, setDestinations] = useState<DestinationDetails[]>([]);
  const [planifications, setPlanifications] = useState<PlanificationVoyage[]>([]);
  const [categories, setCategories] = useState<CategorieClient[]>([]);
  const [form, setForm] = useState<ReservationFormState>(initialForm);
  const [quote, setQuote] = useState<ReservationQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "ALL">("ALL");
  const [reservationSearch, setReservationSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<ReservationSource | "ALL">("ALL");
  const [amountMinFilter, setAmountMinFilter] = useState("");
  const [amountMaxFilter, setAmountMaxFilter] = useState("");
  const [showReservationFilters, setShowReservationFilters] = useState(false);
  const [reservationPage, setReservationPage] = useState(1);
  const [reservationPageSize, setReservationPageSize] = useState(5);
  const selectedElementsScrollRef = useRef<HTMLDivElement | null>(null);

  const session = useMemo(() => loadAuth(), []);
  const token = session?.accessToken;

  const prefill = useMemo(() => ({
    editReservationId: searchParams?.get("editReservationId") || null,
    source: searchParams?.get("source") === "SIMULATION"
      ? "SIMULATION" as ReservationSource
      : searchParams?.get("source") === "PRIX_DIRECT"
        ? "PRIX_DIRECT" as ReservationSource
        : null,
    budgetClient: Math.max(
      parsePositiveInteger(searchParams?.get("budgetClient") ?? null, 0),
      extractBudgetClientFromSummary(searchParams?.get("resumeSimulation"))
    ),
    destinationId: searchParams?.get("destinationId") || null,
    destinationTitle: searchParams?.get("destinationTitle") || null,
    planificationVoyageId: searchParams?.get("planificationId") || null,
    planificationTitle: searchParams?.get("planificationTitle") || null,
    categorieClientId: searchParams?.get("categorieId") || null,
    categorieTitle: searchParams?.get("categorieTitle") || null,
    gamme: normalizeGamme(searchParams?.get("gamme")),
    nombrePersonnes: parsePositiveInteger(searchParams?.get("nombrePersonnes") ?? null, initialForm.nombrePersonnes),
    voyageurProfiles: parseVoyageurProfiles(
      searchParams?.get("voyageurProfiles"),
      searchParams?.get("categorieId"),
      normalizeGamme(searchParams?.get("gamme")),
      parsePositiveInteger(searchParams?.get("nombrePersonnes") ?? null, initialForm.nombrePersonnes)
    ),
    elementsSelectionnes: searchParams?.get("elementsSelectionnes") || null,
    elementsDetails: parseSimulationElementCards(searchParams?.get("elementsDetails")),
    resumeSimulation: searchParams?.get("resumeSimulation") || null,
    commentaireClient: searchParams?.get("commentaireClient") || null,
  }), [searchParams]);
  const hasNavigationPrefill = !!(
    prefill.destinationId ||
    prefill.planificationVoyageId ||
    prefill.categorieClientId ||
    prefill.voyageurProfiles.length > 0
  );

  useEffect(() => {
    const deletedMessage = searchParams?.get("deleted");
    if (deletedMessage) {
      setSuccess(deletedMessage);
    }
  }, [searchParams]);

  useEffect(() => {
    if (hasNavigationPrefill) {
      setActiveReservationSection("create");
    }
  }, [hasNavigationPrefill]);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!token) {
        setError("Vous devez etre connecte pour gerer vos reservations.");
        setLoadingReservations(false);
        return;
      }

      try {
        const [reservationResponse, destinationData, categorieResponse] = await Promise.all([
          listMyReservations(token),
          listDestinations(),
          listCategorieClientActivites(token),
        ]);

        const loadedReservations = reservationResponse.data ?? [];
        const loadedDestinations = destinationData ?? [];
        const loadedCategories = categorieResponse.data ?? [];

        setReservations(loadedReservations);
        setDestinations(loadedDestinations);
        setCategories(loadedCategories);
        setForm((current) => {
          const normalizedProfiles = ensureValidProfiles(
            hasNavigationPrefill ? prefill.voyageurProfiles : current.voyageurProfiles,
            loadedCategories,
            prefill.categorieClientId ?? undefined
          );
          return {
            ...current,
            destinationId:
              hasNavigationPrefill && prefill.destinationId
                ? prefill.destinationId
                : loadedDestinations.some((item) => item.id === prefill.destinationId)
                  ? prefill.destinationId || ""
                  : ((current.destinationId && loadedDestinations.some((item) => item.id === current.destinationId))
                    ? current.destinationId
                    : ""),
            categorieClientId:
              normalizedProfiles[0]?.categorieClientId ||
              (current.categorieClientId && loadedCategories.some((item) => item.id === current.categorieClientId)
                ? current.categorieClientId
                : ""),
            gamme:
              hasNavigationPrefill
                ? normalizeGamme(prefill.gamme ?? current.gamme ?? initialForm.gamme)
                : current.gamme,
            nombrePersonnes:
              hasNavigationPrefill
                ? totalVoyageurs(normalizedProfiles) || current.nombrePersonnes || initialForm.nombrePersonnes
                : current.nombrePersonnes,
            voyageurProfiles: normalizedProfiles,
          };
        });
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Impossible de charger les donnees de reservation."));
      } finally {
        setLoadingReservations(false);
      }
    };

    void loadInitialData();
  }, [hasNavigationPrefill, prefill.categorieClientId, prefill.destinationId, prefill.gamme, prefill.nombrePersonnes, token]);

  useEffect(() => {
    if (!searchParams) return;

    setForm((current) => ({
      ...current,
      source: prefill.source ?? current.source,
      destinationId: prefill.destinationId ?? current.destinationId,
      planificationVoyageId: prefill.planificationVoyageId ?? current.planificationVoyageId,
      categorieClientId:
        prefill.voyageurProfiles[0]?.categorieClientId ??
        prefill.categorieClientId ??
        current.categorieClientId,
      gamme:
        hasNavigationPrefill
          ? normalizeGamme(prefill.gamme ?? current.gamme)
          : current.gamme,
      nombrePersonnes:
        hasNavigationPrefill
          ? totalVoyageurs(prefill.voyageurProfiles) || prefill.nombrePersonnes || current.nombrePersonnes
          : current.nombrePersonnes,
      voyageurProfiles:
        hasNavigationPrefill
          ? prefill.voyageurProfiles.length > 0
            ? prefill.voyageurProfiles
            : current.voyageurProfiles
          : current.voyageurProfiles,
      elementsSelectionnes: prefill.elementsSelectionnes ?? current.elementsSelectionnes,
      resumeSimulation: prefill.resumeSimulation ?? current.resumeSimulation,
      commentaireClient: prefill.commentaireClient ?? current.commentaireClient,
    }));
  }, [hasNavigationPrefill, prefill, searchParams]);

  useEffect(() => {
    const loadPlanifications = async () => {
      if (!form.destinationId || !token) {
        setPlanifications([]);
        setForm((current) => ({ ...current, planificationVoyageId: "" }));
        return;
      }

      try {
        const response = await listPlanificationsByDestination(form.destinationId, token);
        const loadedPlanifications = response.data ?? [];
        setPlanifications(loadedPlanifications);
        setForm((current) => ({
          ...current,
          planificationVoyageId:
            hasNavigationPrefill && prefill.planificationVoyageId
              ? prefill.planificationVoyageId
              : loadedPlanifications.some((item) => item.id === current.planificationVoyageId)
              ? current.planificationVoyageId
              : loadedPlanifications.some((item) => item.id === prefill.planificationVoyageId)
                ? prefill.planificationVoyageId || ""
                : "",
        }));
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Impossible de charger les planifications."));
        setPlanifications([]);
      }
    };

    void loadPlanifications();
  }, [form.destinationId, hasNavigationPrefill, prefill.planificationVoyageId, token]);

  useEffect(() => {
    const normalizedProfiles = ensureValidProfiles(
      form.voyageurProfiles,
      categories,
      form.categorieClientId || prefill.categorieClientId || undefined
    );
    const nextCategorieId = normalizedProfiles[0]?.categorieClientId || "";
    const nextNombrePersonnes = totalVoyageurs(normalizedProfiles) || 1;

    if (
      JSON.stringify(normalizedProfiles) !== JSON.stringify(form.voyageurProfiles) ||
      form.categorieClientId !== nextCategorieId ||
      form.nombrePersonnes !== nextNombrePersonnes
    ) {
      setForm((current) => ({
        ...current,
        categorieClientId: nextCategorieId,
        nombrePersonnes: nextNombrePersonnes,
        voyageurProfiles: normalizedProfiles,
      }));
    }
  }, [categories, form.categorieClientId, form.nombrePersonnes, form.voyageurProfiles, prefill.categorieClientId]);

  useEffect(() => {
    const canQuote =
      !!token &&
      !!form.destinationId &&
      !!form.planificationVoyageId &&
      !!form.categorieClientId &&
      !!form.gamme &&
      form.nombrePersonnes > 0;

    if (!canQuote) {
      setQuote(null);
      setQuoteError(null);
      setLoadingQuote(false);
      return;
    }

    let active = true;
    const loadQuote = async () => {
      setLoadingQuote(true);
      try {
        const response = await calculateReservationQuote(buildPayload(form), token);
        if (active) {
          setQuote(response.data ?? null);
          setQuoteError(null);
        }
      } catch (requestError) {
        if (active) {
          setQuote(null);
          setQuoteError(getErrorMessage(requestError, "Impossible de calculer le devis."));
        }
      } finally {
        if (active) {
          setLoadingQuote(false);
        }
      }
    };

    void loadQuote();

    return () => {
      active = false;
    };
  }, [
    form.destinationId,
    form.planificationVoyageId,
    form.categorieClientId,
    form.gamme,
    form.nombrePersonnes,
    form.voyageurProfiles,
    token,
  ]);

  const selectedDestination = destinations.find((item) => item.id === form.destinationId) ?? null;
  const selectedPlanification = planifications.find((item) => item.id === form.planificationVoyageId) ?? null;
  const selectedCategorie = categories.find((item) => item.id === form.categorieClientId) ?? null;
  const simulationSummaryItems = useMemo(
    () => parseSummaryLines(form.resumeSimulation),
    [form.resumeSimulation]
  );
  const displayedSimulationSummaryItems = useMemo(
    () =>
      simulationSummaryItems.filter((item) => {
        const label = item.label
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

        return label !== "destination" && label !== "planification";
      }),
    [simulationSummaryItems]
  );
  const destinationLabel = getSelectLabel(
    form.destinationId,
    selectedDestination?.title ?? prefill.destinationTitle,
    "Selectionner une destination"
  );
  const planificationLabel = getSelectLabel(
    form.planificationVoyageId,
    selectedPlanification?.nomPlanification ?? prefill.planificationTitle,
    "Selectionner une planification"
  );
  const categorieLabel = getSelectLabel(
    form.categorieClientId,
    selectedCategorie?.nom ?? prefill.categorieTitle,
    "Selectionner une categorie"
  );
  const gammeLabel = getSelectLabel(
    form.gamme,
    normalizeGamme(form.gamme),
    "Selectionner une gamme"
  );
  const isSimulationPrefill = form.source === "SIMULATION";
  const isDirectForfaitPrefill = form.source === "PRIX_DIRECT" && !!prefill.destinationId && !!prefill.planificationVoyageId;
  const isLockedPrefill = isSimulationPrefill || isDirectForfaitPrefill;
  const canEditVoyageurProfiles = form.source === "PRIX_DIRECT";
  const isEditMode = !!prefill.editReservationId;
  const simulationElementCards = useMemo<SimulationElementCard[]>(() => {
    const quantitiesByElement = new Map(
      parseElementSelections(form.elementsSelectionnes).map((item) => [item.elementId, item.quantite])
    );

    if (prefill.elementsDetails.length > 0) {
      return prefill.elementsDetails.map((item) => ({
        ...item,
        quantite: quantitiesByElement.get(item.id) ?? item.quantite,
      }));
    }

    if (!form.elementsSelectionnes.trim()) {
      return [];
    }

    return parseElementSelections(form.elementsSelectionnes).map((item) => ({
      id: item.elementId,
      titre: item.elementId,
      quantite: item.quantite,
    }));
  }, [form.elementsSelectionnes, prefill.elementsDetails]);
  const simulationElementGroups = useMemo(() => {
    const groups = new Map<
      string,
      { key: string; label: string; elements: SimulationElementCard[] }
    >();

    simulationElementCards.forEach((element) => {
      const key = element.jourNumero
        ? `jour-${element.jourNumero}`
        : element.jourTitre
          ? `jour-${element.jourTitre}`
          : "jour-autre";
      const label = element.jourNumero
        ? `Jour ${element.jourNumero}${element.jourTitre ? ` - ${element.jourTitre}` : ""}`
        : element.jourTitre || "Autres elements";

      const existing = groups.get(key);
      if (existing) {
        existing.elements.push(element);
      } else {
        groups.set(key, { key, label, elements: [element] });
      }
    });

    return Array.from(groups.values());
  }, [simulationElementCards]);
  const destinationOptions = useMemo(() => {
    if (
      form.destinationId &&
      prefill.destinationTitle &&
      !destinations.some((item) => item.id === form.destinationId)
    ) {
      return [{ id: form.destinationId, title: prefill.destinationTitle }, ...destinations];
    }

    return destinations;
  }, [destinations, form.destinationId, prefill.destinationTitle]);
  const categoryOptions = useMemo(() => {
    if (
      form.categorieClientId &&
      prefill.categorieTitle &&
      !categories.some((item) => item.id === form.categorieClientId)
    ) {
      return [{ id: form.categorieClientId, nom: prefill.categorieTitle }, ...categories];
    }

    return categories;
  }, [categories, form.categorieClientId, prefill.categorieTitle]);
  const planificationOptions = useMemo(() => {
    if (
      form.planificationVoyageId &&
      prefill.planificationTitle &&
      !planifications.some((item) => item.id === form.planificationVoyageId)
    ) {
      return [
        {
          id: form.planificationVoyageId,
          nomPlanification: prefill.planificationTitle,
        } as PlanificationVoyage,
        ...planifications,
      ];
    }

    return planifications;
  }, [form.planificationVoyageId, planifications, prefill.planificationTitle]);
  const canSubmitReservation =
    !!token &&
    !!form.destinationId &&
    !!form.planificationVoyageId &&
    !!form.gamme &&
    totalVoyageurs(form.voyageurProfiles) > 0 &&
    !isSubmitting;
  const reservationStats = useMemo(() => {
    const total = reservations.length;
    const enCours = reservations.filter(
      (reservation) => reservation.status === "EN_ATTENTE"
    ).length;
    const confirmees = reservations.filter((reservation) => reservation.status === "VALIDEE").length;

    return { total, enCours, confirmees };
  }, [reservations]);
  const filteredReservations = useMemo(() => {
    const query = reservationSearch.trim().toLowerCase();
    const amountMin = amountMinFilter.trim() ? Number(amountMinFilter) : null;
    const amountMax = amountMaxFilter.trim() ? Number(amountMaxFilter) : null;

    return reservations.filter((reservation) => {
      const detail = reservation.details[0];
      const matchesStatus = statusFilter === "ALL" || reservation.status === statusFilter;
      const matchesSource = sourceFilter === "ALL" || reservation.source === sourceFilter;
      const matchesMin = amountMin === null || Number.isNaN(amountMin) || reservation.montantTotal >= amountMin;
      const matchesMax = amountMax === null || Number.isNaN(amountMax) || reservation.montantTotal <= amountMax;
      const totalElements = countUniqueSelectedElements(reservation);
      const searchableText = [
        reservation.reference,
        reservation.commentaireClient,
        reservation.commentaireAdmin,
        reservation.montantTotal,
        formatCurrency(reservation.montantTotal, reservation.devise),
        formatDate(reservation.dateReservation),
        formatDate(reservation.dateModification ?? reservation.dateReservation),
        getReservationProfilesSummary(reservation),
        totalElements,
        detail?.nomDestination,
        detail?.nomPlanification,
        detail?.nomCategorieClient,
        detail?.gamme,
        formatStatus(reservation.status),
        formatSource(reservation.source),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !query || searchableText.includes(query);

      return matchesStatus && matchesSource && matchesMin && matchesMax && matchesQuery;
    });
  }, [amountMaxFilter, amountMinFilter, reservations, reservationSearch, sourceFilter, statusFilter]);
  const totalReservationPages = Math.max(1, Math.ceil(filteredReservations.length / reservationPageSize));
  const paginatedReservations = useMemo(() => {
    const start = (reservationPage - 1) * reservationPageSize;
    return filteredReservations.slice(start, start + reservationPageSize);
  }, [filteredReservations, reservationPage, reservationPageSize]);
  const reservationStartIndex =
    filteredReservations.length === 0 ? 0 : (reservationPage - 1) * reservationPageSize + 1;
  const reservationEndIndex = Math.min(reservationPage * reservationPageSize, filteredReservations.length);

  useEffect(() => {
    setReservationPage(1);
  }, [amountMaxFilter, amountMinFilter, reservationPageSize, reservationSearch, sourceFilter, statusFilter]);

  useEffect(() => {
    setReservationPage((current) => Math.min(current, totalReservationPages));
  }, [totalReservationPages]);

  const handleCreateReservation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    const validProfiles = ensureValidProfiles(form.voyageurProfiles, categories, form.categorieClientId || undefined);
    if (
      !form.destinationId ||
      !form.planificationVoyageId ||
      !form.gamme ||
      validProfiles.length === 0 ||
      totalVoyageurs(validProfiles) <= 0
    ) {
      setError("Veuillez completer les informations obligatoires avant de reserver.");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const payload = buildPayload(form);
      const response = isEditMode && prefill.editReservationId
        ? await updateMyReservation(prefill.editReservationId, payload, token)
        : form.source === "SIMULATION"
          ? await createReservationFromSimulation(payload, token)
          : await createReservationFromPrice(payload, token);

      const created = response.data;
      if (created) {
        setReservations((current) =>
          isEditMode
            ? current.map((reservation) => (reservation.id === created.id ? created : reservation))
            : [created, ...current]
        );
      }
      setSuccess(
        response.message ??
          (isEditMode ? "Reservation modifiee avec succes." : "Reservation creee avec succes.")
      );
      setForm((current) => ({
        ...current,
        commentaireClient: "",
        voyageurProfiles: validProfiles,
      }));
      setQuote(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Impossible de creer la reservation."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToSimulation = () => {
    if (form.source !== "SIMULATION") {
      router.push(`/${username}/simulation`);
      return;
    }

    const params = new URLSearchParams();
    if (prefill.editReservationId) {
      params.set("editReservationId", prefill.editReservationId);
    }
    if (prefill.budgetClient > 0) {
      params.set("budgetClient", String(prefill.budgetClient));
    }
    if (form.destinationId) {
      params.set("destinationId", form.destinationId);
    }
    if (selectedDestination?.title) {
      params.set("destinationTitle", selectedDestination.title);
    }
    if (form.planificationVoyageId) {
      params.set("planificationId", form.planificationVoyageId);
    }
    if (selectedPlanification?.nomPlanification) {
      params.set("planificationTitle", selectedPlanification.nomPlanification);
    }
    if (form.categorieClientId) {
      params.set("categorieId", form.categorieClientId);
    }
    if (form.voyageurProfiles.length > 0) {
      params.set("voyageurProfiles", JSON.stringify(form.voyageurProfiles));
    }
    if (selectedCategorie?.nom) {
      params.set("categorieTitle", selectedCategorie.nom);
    }
    if (form.gamme) {
      params.set("gamme", form.gamme);
    }
    if (form.nombrePersonnes > 0) {
      params.set("nombrePersonnes", String(form.nombrePersonnes));
    }
    if (form.elementsSelectionnes.trim()) {
      params.set("elementsSelectionnes", form.elementsSelectionnes.trim());
    }
    if (prefill.elementsDetails.length > 0) {
      params.set("elementsDetails", JSON.stringify(prefill.elementsDetails));
    }
    if (form.resumeSimulation.trim()) {
      params.set("resumeSimulation", form.resumeSimulation.trim());
    }
    if (form.commentaireClient.trim()) {
      params.set("commentaireClient", form.commentaireClient.trim());
    }

    const queryString = params.toString();
    router.push(`/${username}/simulation${queryString ? `?${queryString}` : ""}`);
  };

  const handleDeleteReservation = async (reservationId: string) => {
    if (!token) return;

    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cette reservation ? Cette action est definitive."
    );

    if (!confirmed) return;

    setError(null);
    setSuccess(null);

    try {
      const response = await deleteMyReservation(reservationId, token);
      setReservations((current) =>
        current.filter((reservation) => reservation.id !== reservationId)
      );
      setSuccess(response.message ?? "Reservation supprimee avec succes.");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Impossible de supprimer la reservation."));
    }
  };

  const scrollSelectedElements = (direction: "left" | "right") => {
    const container = selectedElementsScrollRef.current;
    if (!container) return;

    container.scrollBy({
      left: direction === "right" ? 260 : -260,
      behavior: "smooth",
    });
  };

  return (
    <div className="space-y-6">
      <section className="p-6">
        <div>
          <h1 className="text-2xl font-semibold">Mes reservations</h1>
          <p className="text-sm text-muted-foreground">
            Suivez vos demandes et creez une reservation depuis un prix direct ou votre simulation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant={activeReservationSection === "create" ? "default" : "outline"}
          onClick={() => setActiveReservationSection("create")}
        >
          Creation d&apos;une reservation
        </Button>
        <Button
          type="button"
          variant={activeReservationSection === "list" ? "default" : "outline"}
          onClick={() => setActiveReservationSection("list")}
        >
          Liste reservation
        </Button>
      </div>
      </section>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert variant="success">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      {activeReservationSection === "create" ? (
        <div className="py-8 max-w-4xl mx-auto">
          <Card className="border-border/50">
          <CardHeader>
            <CardTitle>{isEditMode ? "Modifier ma reservation" : "Nouvelle reservation"}</CardTitle>
            <CardDescription>
              {isEditMode
                ? "Mettez a jour votre reservation tant qu'elle est encore en attente."
                : "Choisissez votre mode de reservation puis confirmez votre demande."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateReservation} className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className={`rounded-2xl border p-4 text-left transition ${
                    form.source === "PRIX_DIRECT"
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-border/70 hover:border-emerald-200"
                  }`}
                  onClick={() => setForm((current) => ({ ...current, source: "PRIX_DIRECT" }))}
                >
                  <p className="font-medium">Depuis un prix</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Reservation directe a partir d&apos;une planification et d&apos;un tarif.
                  </p>
                </button>
                <button
                  type="button"
                  className={`rounded-2xl border p-4 text-left transition ${
                    form.source === "SIMULATION"
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-border/70 hover:border-emerald-200"
                  }`}
                  onClick={handleGoToSimulation}
                >
                  <p className="font-medium">Depuis une simulation</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isEditMode && form.source === "SIMULATION"
                      ? "Reprenez votre simulation pour ajuster le voyage avant de mettre a jour la reservation."
                      : "Conservez les choix d'une simulation pour lancer votre demande."}
                  </p>
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {isLockedPrefill ? (
                  <>
                    <div className="space-y-2">
                      <Label>Destination</Label>
                      <Input value={destinationLabel} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Planification</Label>
                      <Input value={planificationLabel} readOnly />
                    </div>
              </>
            ) : (
              <>
                    <div className="space-y-2">
                      <Label>Destination</Label>
                      <Select
                        value={form.destinationId}
                        onValueChange={(value) => setForm((current) => ({ ...current, destinationId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selectionner une destination">
                            {destinationLabel}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {destinationOptions.map((destination) => (
                            <SelectItem key={destination.id} value={destination.id}>
                              {destination.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Planification</Label>
                      <Select
                        value={form.planificationVoyageId}
                        onValueChange={(value) =>
                          setForm((current) => ({ ...current, planificationVoyageId: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selectionner une planification">
                            {planificationLabel}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {planificationOptions.map((planification) => (
                            <SelectItem key={planification.id} value={planification.id}>
                              {planification.nomPlanification}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

              </>
            )}
              </div>

              <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Label className="text-base">Profils des voyageurs</Label>
                    {/* <p className="mt-1 text-sm text-muted-foreground">
                      Melangez plusieurs categories et plusieurs gammes dans une seule reservation.
                    </p> */}
                  </div>
                  {canEditVoyageurProfiles ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          voyageurProfiles: [
                              ...current.voyageurProfiles,
                              {
                                categorieClientId: categories[0]?.id ?? "",
                                gamme: "MOYENNE",
                                nombrePersonnes: 1,
                              },
                          ],
                        }))
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter un profil
                    </Button>
                  ) : null}
                </div>

                <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
                 
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-border/40">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Catégorie</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Gamme</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Personnes</th>
                          {form.source === "PRIX_DIRECT" && (
                            <>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Prix unitaire</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Prix total</th>
                            </>
                          )}
                          <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 w-20">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {ensureValidProfiles(form.voyageurProfiles, categories, form.categorieClientId || undefined).map((profile, index) => {
                          const profileCategory = categories.find((categorie) => categorie.id === profile.categorieClientId);
                          const quoteLine = form.source === "PRIX_DIRECT" ? quote?.lignes?.[index] : null;
                          return (
                            <tr key={`${profile.categorieClientId || "profil"}-${index}`} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                {!canEditVoyageurProfiles ? (
                                  <div className="rounded-lg border border-border/30 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                                    {profileCategory?.nom ?? `Catégorie ${index + 1}`}
                                  </div>
                                ) : (
                                  <Select
                                    value={profile.categorieClientId}
                                    onValueChange={(value) =>
                                      setForm((current) => ({
                                        ...current,
                                        voyageurProfiles: current.voyageurProfiles.map((item, currentIndex) =>
                                          currentIndex === index ? { ...item, categorieClientId: value } : item
                                        ),
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="w-full border-border/60 bg-white">
                                      <SelectValue placeholder="Sélectionner">
                                        {profileCategory?.nom ?? "Sélectionner"}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {categoryOptions.map((categorie) => (
                                        <SelectItem key={categorie.id} value={categorie.id}>
                                          {categorie.nom}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </td>

                              <td className="px-6 py-4">
                                {!canEditVoyageurProfiles ? (
                                  <div className="rounded-lg border border-border/30 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                                    {normalizeGamme(profile.gamme)}
                                  </div>
                                ) : (
                                  <Select
                                    value={normalizeGamme(profile.gamme)}
                                    onValueChange={(value) =>
                                      setForm((current) => ({
                                        ...current,
                                        voyageurProfiles: current.voyageurProfiles.map((item, currentIndex) =>
                                          currentIndex === index
                                            ? { ...item, gamme: normalizeGamme(value) }
                                            : item
                                        ),
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="w-full border-border/60 bg-white">
                                      <SelectValue placeholder="Sélectionner">
                                        {normalizeGamme(profile.gamme)}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="MOYENNE">MOYENNE</SelectItem>
                                      <SelectItem value="LUXE">LUXE</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              </td>

                              <td className="px-6 py-4">
                                <Input
                                  type="number"
                                  min={1}
                                  readOnly={!canEditVoyageurProfiles}
                                  value={profile.nombrePersonnes}
                                  onChange={(event) =>
                                    setForm((current) => ({
                                      ...current,
                                      voyageurProfiles: current.voyageurProfiles.map((item, currentIndex) =>
                                        currentIndex === index
                                          ? { ...item, nombrePersonnes: Number(event.target.value) || 1 }
                                          : item
                                      ),
                                    }))
                                  }
                                  className="w-24 border-border/60 bg-white"
                                />
                              </td>

                              {form.source === "PRIX_DIRECT" && (
                                <>
                                  <td className="px-6 py-4">
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm font-semibold text-emerald-800">
                                      {quoteLine ? formatCurrency(quoteLine.prixUnitaire, quote?.devise ?? "MGA") : "-"}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm font-semibold text-emerald-800">
                                      {quoteLine ? formatCurrency(quoteLine.prixTotal, quote?.devise ?? "MGA") : "-"}
                                    </div>
                                  </td>
                                </>
                              )}

                              <td className="px-6 py-4 text-center">
                                {canEditVoyageurProfiles ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={form.voyageurProfiles.length <= 1}
                                    onClick={() =>
                                      setForm((current) => ({
                                        ...current,
                                        voyageurProfiles:
                                          current.voyageurProfiles.length <= 1
                                            ? current.voyageurProfiles
                                            : current.voyageurProfiles.filter((_, currentIndex) => currentIndex !== index),
                                      }))
                                    }
                                    className="hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <div className="w-8 h-8 flex items-center justify-center">
                                    <span className="text-slate-400">—</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={`grid gap-4 ${form.source === "PRIX_DIRECT" && quote ? "lg:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
                  <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
                    <div className="mb-3 flex items-center gap-3 text-emerald-700">
                      <ClipboardList className="h-5 w-5" />
                      <p className="font-semibold">Résumé rapide</p>
                    </div>
                    <div className="space-y-2">
                      {ensureValidProfiles(form.voyageurProfiles, categories, form.categorieClientId || undefined).map((profile, index) => {
                        const profileCategory = categories.find((categorie) => categorie.id === profile.categorieClientId);
                        const gamme = normalizeGamme(profile.gamme);
                        const gammeLabel = gamme === "MOYENNE" ? "Moyenne" : gamme;

                        return (
                          <p key={`${profile.categorieClientId || "summary"}-${index}`} className="flex items-center gap-3 text-sm text-slate-700">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                            <span>
                              <span className="font-semibold text-slate-950">{profile.nombrePersonnes} {profileCategory?.nom ?? `Voyageur ${index + 1}`}</span>
                              <span className="text-slate-500"> — Gamme {gammeLabel}</span>
                            </span>
                          </p>
                        );
                      })}
                    </div>
                  </div>

                  {form.source === "PRIX_DIRECT" && quote ? (
                    <div className="rounded-xl border border-amber-100 bg-amber-50/35 px-6 py-4">
                      <div className="flex items-start gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
                          <Calculator className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">Sous-total de la réservation</p>
                          <p className="mt-3 text-2xl font-semibold text-slate-950">
                            {formatCurrency(quote.prixTotal, quote.devise)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {form.source === "SIMULATION" ? (
                <div className="grid gap-4">
                  <div className="min-w-0 space-y-2">
                    <Label>Elements selectionnes</Label>
                    {simulationElementCards.length > 0 ? (
                      <div className="w-full min-w-0 space-y-2">
                        <div className="w-full min-w-0 overflow-hidden">
                          <div
                            ref={selectedElementsScrollRef}
                            className="w-full min-w-0 overflow-x-auto pb-2"
                          >
                            <div className="inline-flex min-w-full snap-x snap-mandatory gap-4 pr-2">
                            {simulationElementGroups.map((group) => (
                              <div
                                key={group.key}
                                className="w-[min(720px,100%)] min-w-[320px] shrink-0 snap-start rounded-2xl border border-emerald-200 bg-white p-4"
                              >
                                <div className="mb-3 flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">{group.label}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {group.elements.length} element(s) selectionne(s)
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="outline"
                                      className="h-8 w-8 shrink-0"
                                      onClick={() => scrollSelectedElements("left")}
                                    >
                                      <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="outline"
                                      className="h-8 w-8 shrink-0"
                                      onClick={() => scrollSelectedElements("right")}
                                    >
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                  {group.elements.map((element) => (
                                    <div
                                      key={element.id}
                                      className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4"
                                    >
                                      <p className="font-medium text-slate-900">{element.titre || element.id}</p>
                                      <div className="mt-2 space-y-1 text-sm text-slate-600">
                                        <p>{element.type ?? "Element de voyage"}</p>
                                        {typeof element.quantite === "number" ? (
                                          <p>{element.quantite} personne(s)</p>
                                        ) : null}
                                        <p className="text-xs text-slate-500">{element.id}</p>
                                        {typeof element.prix === "number" ? (
                                          <p className="font-semibold text-emerald-800">
                                            {formatCurrency(element.prix, "Ar")}
                                          </p>
                                        ) : null}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs text-muted-foreground">
                            Faites glisser horizontalement ou utilisez les fleches.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/70 px-4 py-3 text-sm text-muted-foreground">
                        Aucun element de simulation n&apos;a ete transmis pour le moment.
                      </div>
                    )}
                    </div>
                    <div className="space-y-2">
                      <Label>Resume simulation</Label>
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
                        {displayedSimulationSummaryItems.length > 0 ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {displayedSimulationSummaryItems.map((item, index) => (
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
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Aucun resume de simulation n&apos;a ete transmis pour le moment.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

              <div className="space-y-2">
                <Label>Commentaire</Label>
                <Textarea
                  value={form.commentaireClient}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, commentaireClient: event.target.value }))
                  }
                  placeholder="Precisions utiles pour votre reservation"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                {loadingQuote ? (
                  <p className="text-sm text-muted-foreground">
                    Calcul du devis en cours. Vous pouvez tout de meme confirmer la reservation.
                  </p>
                ) : null}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={!canSubmitReservation}
                  >
                    {isSubmitting
                      ? (isEditMode ? "Modification en cours..." : "Reservation en cours...")
                      : (isEditMode ? "Enregistrer les modifications" : "Confirmer la reservation")}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      ) : null}

      {activeReservationSection === "list" ? (
      <>

      <div className="grid gap-4 md:grid-cols-3">
        <ClientReservationStatCard label="Total reservations" value={reservationStats.total} />
        <ClientReservationStatCard label="En cours" value={reservationStats.enCours} />
        <ClientReservationStatCard label="Confirmees" value={reservationStats.confirmees} />
      </div>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Liste de mes reservations</CardTitle>
            <CardDescription>
              Retrouvez toutes les reservations deja creees dans votre espace client.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowReservationFilters((current) => !current)}
            title="Afficher les filtres"
            aria-label="Afficher les filtres"
            aria-expanded={showReservationFilters}
            className="shrink-0"
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-500">
            {filteredReservations.length} resultat(s) sur {reservations.length}
          </p>

          {showReservationFilters ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reservation-search">Recherche</Label>
                <Input
                  id="reservation-search"
                  value={reservationSearch}
                  onChange={(event) => setReservationSearch(event.target.value)}
                  placeholder="Reference, destination, forfait, commentaire..."
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(170px,1fr)_minmax(170px,1fr)_minmax(120px,0.7fr)_minmax(120px,0.7fr)_auto] xl:items-end">
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Statut</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as ReservationStatus | "ALL")}
                  >
                    <SelectTrigger id="status-filter" className="w-full">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="ALL">Tous les statuts</SelectItem>
                      <SelectItem value="EN_ATTENTE">EN ATTENTE</SelectItem>
                      <SelectItem value="VALIDEE">VALIDEE</SelectItem>
                      <SelectItem value="ANNULEE">ANNULEE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source-filter">Source</Label>
                  <Select
                    value={sourceFilter}
                    onValueChange={(value) => setSourceFilter(value as ReservationSource | "ALL")}
                  >
                    <SelectTrigger id="source-filter" className="w-full">
                      <SelectValue placeholder="Toutes les sources" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="ALL">Toutes les sources</SelectItem>
                      <SelectItem value="SIMULATION">Simulation</SelectItem>
                      <SelectItem value="PRIX_DIRECT">Prix direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount-min-filter">Min</Label>
                  <Input
                    id="amount-min-filter"
                    type="number"
                    min="0"
                    value={amountMinFilter}
                    onChange={(event) => setAmountMinFilter(event.target.value)}
                    placeholder="Min"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount-max-filter">Max</Label>
                  <Input
                    id="amount-max-filter"
                    type="number"
                    min="0"
                    value={amountMaxFilter}
                    onChange={(event) => setAmountMaxFilter(event.target.value)}
                    placeholder="Max"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full xl:w-auto"
                  onClick={() => {
                    setReservationSearch("");
                    setStatusFilter("ALL");
                    setSourceFilter("ALL");
                    setAmountMinFilter("");
                    setAmountMaxFilter("");
                  }}
                >
                  Reinitialiser
                </Button>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {filteredReservations.length} resultat(s) sur {reservations.length}. Les montants min/max filtrent seulement si une valeur est saisie.
            </p>
          </div>
          ) : null}

          {loadingReservations ? (
            <p className="text-sm text-muted-foreground">Chargement des reservations...</p>
          ) : filteredReservations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
              Aucune reservation n&apos;a encore ete enregistree.
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="hidden grid-cols-[1.25fr_1.3fr_0.75fr_0.9fr_0.8fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 lg:grid">
                  <span>Reference</span>
                  <span>Destination</span>
                  <span>Statut</span>
                  <span>Periode</span>
                  <span className="text-right">Montant</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="divide-y divide-slate-100">
            {paginatedReservations.map((reservation) => {
              const detail = reservation.details[0];
              const totalElements = countUniqueSelectedElements(reservation);
              const showElementsCount = reservation.source === "SIMULATION";

              if (reservation.id) {
                return (
                  <ReservationListCard
                    key={reservation.id}
                    reservation={reservation}
                    username={username}
                    detail={detail}
                    totalElements={totalElements}
                    showElementsCount={showElementsCount}
                    onDelete={handleDeleteReservation}
                  />
                );
              }

              return (
                <article
                  key={reservation.id}
                  className="group relative overflow-hidden rounded-3xl border-2 bg-gradient-to-br from-white via-slate-50/20 to-slate-50/40 shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1"
                >
                  {/* Header avec statut visuel */}
                  <div className="relative p-6 pb-4">
                    <div className="absolute top-4 right-4">
                      <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold tracking-wide shadow-lg ${
                        reservation.status === "VALIDEE" 
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-2 border-emerald-400"
                          : reservation.status === "ANNULEE"
                          ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white border-2 border-rose-400"
                          : "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-2 border-amber-400"
                      }`}>
                        {reservation.status === "VALIDEE" ? "✓" : "⏱"}
                        <span>{formatStatus(reservation.status)}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-lg border-2 border-slate-400">
                            {formatSource(reservation.source)}
                          </span>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">
                          {reservation.reference}
                        </h3>
                        
                        <div className="mt-3 space-y-2">
                          <p className="text-lg font-semibold text-slate-800">
                            {detail?.nomDestination ?? "-"} - {detail?.nomPlanification ?? "-"}
                          </p>
                          <p className="text-sm text-slate-600 font-medium">
                            {getReservationProfilesSummary(reservation)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Cartes d'informations avec design moderne */}
                    <div className={`grid gap-4 sm:grid-cols-2 ${showElementsCount ? "xl:grid-cols-4" : "xl:grid-cols-3"} mt-6`}>
                      <div className="rounded-2xl border-2 bg-gradient-to-br from-emerald-50 via-emerald-100/30 to-emerald-100/60 border-emerald-200 p-4 shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
                            💰
                          </div>
                          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Montant</p>
                        </div>
                        <p className="text-xl font-black text-slate-900">
                          {formatCurrency(reservation.montantTotal, reservation.devise)}
                        </p>
                      </div>

                      <div className="rounded-2xl border-2 bg-gradient-to-br from-blue-50 via-blue-100/30 to-blue-100/60 border-blue-200 p-4 shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                            📅
                          </div>
                          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Créée le</p>
                        </div>
                        <p className="text-lg font-bold text-slate-900">{formatDate(reservation.dateReservation)}</p>
                      </div>

                      {showElementsCount ? (
                        <div className="rounded-2xl border-2 bg-gradient-to-br from-violet-50 via-violet-100/30 to-violet-100/60 border-violet-200 p-4 shadow-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white">
                              📋
                            </div>
                            <p className="text-xs font-bold text-violet-700 uppercase tracking-wider">Éléments</p>
                          </div>
                          <p className="text-xl font-black text-slate-900">{totalElements}</p>
                        </div>
                      ) : null}

                      <div className="rounded-2xl border-2 bg-gradient-to-br from-amber-50 via-amber-100/30 to-amber-100/60 border-amber-200 p-4 shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white">
                            💬
                          </div>
                          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Commentaire</p>
                        </div>
                        <p className="text-sm font-medium text-slate-900 line-clamp-2">
                          {reservation.commentaireClient?.trim() || "Aucun commentaire"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section simulation si présente */}
                  {reservation.resumeSimulation ? (
                    <div className="px-6 pb-4">
                      <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-emerald-100/30 to-emerald-100/60 p-4 shadow-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
                            📊
                          </div>
                          <p className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Résumé de simulation</p>
                        </div>
                        <p className="text-sm text-emerald-900 font-medium line-clamp-3 whitespace-pre-wrap">
                          {reservation.resumeSimulation}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {/* Footer avec actions */}
                  <div className="px-6 pb-6 bg-gradient-to-b from-slate-50/20 to-transparent">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button asChild className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-2 border-emerald-400 shadow-lg transition-all duration-300 hover:scale-105">
                          <Link href={`/${username}/reservations/${reservation.id}`} className="flex items-center gap-2">
                            <span>👁️</span>
                            Voir détail
                          </Link>
                        </Button>
                        
                        {reservation.status === "EN_ATTENTE" ? (
                          <Button
                            type="button"
                            variant="destructive"
                            className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white border-2 border-rose-400 shadow-lg transition-all duration-300 hover:scale-105"
                            onClick={() => void handleDeleteReservation(reservation.id)}
                          >
                            <span>🗑️</span>
                            Supprimer
                          </Button>
                        ) : null}
                      </div>

                      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Dernière mise à jour</p>
                        <p className="font-medium text-slate-800">
                          {formatDate(reservation.dateModification ?? reservation.dateReservation)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
                </div>
              </div>
            <ReservationPagination
              page={reservationPage}
              pageSize={reservationPageSize}
              totalItems={filteredReservations.length}
              totalPages={totalReservationPages}
              startIndex={reservationStartIndex}
              endIndex={reservationEndIndex}
              onPageChange={setReservationPage}
              onPageSizeChange={setReservationPageSize}
            />
            </>
          )}
        </CardContent>
      </Card>
      </>
      ) : null}
    </div>
  );
}

function ReservationListCard({
  reservation,
  username,
  detail,
  onDelete,
}: {
  reservation: Reservation;
  username: string;
  detail: Reservation["details"][number] | undefined;
  totalElements: number;
  showElementsCount: boolean;
  onDelete: (reservationId: string) => Promise<void>;
}) {
  const createdAt = formatDate(reservation.dateReservation);
  const updatedAt = reservation.dateModification ? formatDate(reservation.dateModification) : "-";
  const statusBorder =
    reservation.status === "VALIDEE"
      ? "border-l-emerald-500"
      : reservation.status === "ANNULEE"
        ? "border-l-rose-500"
        : "border-l-amber-400";

  return (
    <article
      className={`grid gap-4 border-l-4 ${statusBorder} bg-white px-4 py-4 transition hover:bg-slate-50/70 lg:grid-cols-[1.25fr_1.3fr_0.75fr_0.9fr_0.8fr_auto] lg:items-center`}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-cyan-50 text-cyan-700 hover:bg-cyan-50">
            {formatSource(reservation.source)}
          </Badge>
        </div>
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-950">
            {reservation.reference}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{createdAt}</p>
        </div>
        <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
          {getReservationProfilesSummary(reservation)}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              {detail?.nomDestination ?? "-"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {detail?.nomPlanification ?? "-"}
            </p>
          </div>
        </div>
        
      </div>

      <div>
        <Badge className={statusStyles[reservation.status]}>{formatStatus(reservation.status)}</Badge>
      </div>

      <div className="flex items-start gap-2 text-sm text-slate-700">
        <CalendarDays className="mt-0.5 size-4 shrink-0 text-slate-500" />
        <div>
          <p>{createdAt}</p>
          <p className="text-slate-400">-</p>
          <p>{updatedAt}</p>
        </div>
      </div>

      <div className="text-left lg:text-right">
        <p className="text-base font-semibold text-slate-950">
          {formatCurrency(reservation.montantTotal, reservation.devise)}
        </p>
      </div>

      <div className="flex items-center gap-2 lg:justify-end">
        <Button asChild variant="outline" size="icon" title="Voir detail">
          <Link href={`/${username}/reservations/${reservation.id}`} aria-label="Voir detail">
            <Eye className="size-4" />
          </Link>
        </Button>
        {reservation.status === "EN_ATTENTE" ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => void onDelete(reservation.id)}
            title="Supprimer"
            aria-label="Supprimer"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="size-4" />
          </Button>
        ) : (
          <Button type="button" variant="outline" size="icon" aria-label="Actions" disabled>
            <MoreHorizontal className="size-4" />
          </Button>
        )}
      </div>
    </article>
  );
}

function ClientReservationStatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-2xl border-emerald-100 bg-white shadow-sm">
      <CardContent className="px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {label}
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-700">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function ReservationPagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>Afficher</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-9 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 15].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>par page</span>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        {pages.map((item) => (
          <Button
            key={item}
            type="button"
            variant={item === page ? "default" : "outline"}
            className={item === page ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : ""}
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <p className="text-sm text-slate-600 md:text-right">
        {startIndex} - {endIndex} sur {totalItems}
      </p>
    </div>
  );
}

