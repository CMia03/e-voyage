"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
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
        jourNumero: typeof item?.jourNumero === "number" ? item.jourNumero : undefined,
        jourTitre: typeof item?.jourTitre === "string" ? item.jourTitre : undefined,
      }))
      .filter((item) => item.id);
  } catch {
    return [];
  }
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

function buildPayload(form: ReservationFormState): ReservationCreatePayload {
  const validProfiles = form.voyageurProfiles.filter(
    (profile) => !!profile.categorieClientId && !!profile.gamme && profile.nombrePersonnes > 0
  );
  const firstProfile = validProfiles[0];
  return {
    source: form.source,
    destinationId: form.destinationId,
    planificationVoyageId: form.planificationVoyageId,
    categorieClientId: firstProfile?.categorieClientId ?? form.categorieClientId,
    gamme: firstProfile?.gamme ?? form.gamme,
    nombrePersonnes: totalVoyageurs(validProfiles) || form.nombrePersonnes,
    profilsVoyageurs: validProfiles,
    commentaireClient: form.commentaireClient || undefined,
    elementsSelectionnes:
      form.source === "SIMULATION"
        ? form.elementsSelectionnes
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined,
    resumeSimulation:
      form.source === "SIMULATION" && form.resumeSimulation.trim()
        ? form.resumeSimulation.trim()
        : undefined,
  };
}

function getSelectLabel(value: string, selectedLabel: string | null | undefined, placeholder: string) {
  return value ? (selectedLabel || value) : placeholder;
}

export default function ReservationsPage() {
  const params = useParams<{ username: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const username = typeof params?.username === "string" ? params.username : "client";

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
  const [activeSection, setActiveSection] = useState<"create" | "list">("create");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "ALL">("ALL");
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
  const isLockedPrefill = isSimulationPrefill || hasNavigationPrefill;
  const isEditMode = !!prefill.editReservationId;
  const simulationElementCards = useMemo<SimulationElementCard[]>(() => {
    if (prefill.elementsDetails.length > 0) {
      return prefill.elementsDetails;
    }

    return form.elementsSelectionnes
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((id) => ({
        id,
        titre: id,
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
      (reservation) =>
        reservation.status === "EN_ATTENTE" ||
        reservation.status === "A_REVOIR" ||
        reservation.status === "EN_ATTENTE_DISPONIBILITE"
    ).length;
    const confirmees = reservations.filter((reservation) => reservation.status === "VALIDEE").length;
    const montantTotal = reservations.reduce(
      (sum, reservation) => sum + (reservation.montantTotal ?? 0),
      0
    );

    return { total, enCours, confirmees, montantTotal };
  }, [reservations]);
  const recentReservations = useMemo(() => reservations.slice(0, 3), [reservations]);
  const filteredReservations = useMemo(
    () =>
      statusFilter === "ALL"
        ? reservations
        : reservations.filter((reservation) => reservation.status === statusFilter),
    [reservations, statusFilter]
  );

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
      <div>
        <h1 className="text-2xl font-semibold">Mes reservations</h1>
        <p className="text-sm text-muted-foreground">
          Suivez vos demandes et creez une reservation depuis un prix direct ou votre simulation.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant={activeSection === "create" ? "default" : "outline"}
          onClick={() => setActiveSection("create")}
        >
          Creation d&apos;une reservation
        </Button>
        <Button
          type="button"
          variant={activeSection === "list" ? "default" : "outline"}
          onClick={() => setActiveSection("list")}
        >
          Liste reservation
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/50 bg-white/90">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Total reservations
            </p>
            <p className="mt-3 text-2xl font-semibold">{reservationStats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-white/90">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              En cours
            </p>
            <p className="mt-3 text-2xl font-semibold">{reservationStats.enCours}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-white/90">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Confirmees
            </p>
            <p className="mt-3 text-2xl font-semibold">{reservationStats.confirmees}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-white/90">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Montant cumule
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {formatCurrency(reservationStats.montantTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {activeSection === "create" ? (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <Card className="min-w-0 border-border/50">
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
                    Reservation directe a partir d'une planification et d'un tarif.
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
                          <span className={form.destinationId ? "truncate" : "truncate text-muted-foreground"}>
                            {destinationLabel}
                          </span>
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
                          <span className={form.planificationVoyageId ? "truncate" : "truncate text-muted-foreground"}>
                            {planificationLabel}
                          </span>
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
                    <Label className="text-base">Profils voyageurs</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Melangez plusieurs categories et plusieurs gammes dans une seule reservation.
                    </p>
                  </div>
                  {!isLockedPrefill ? (
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

                <div className="grid gap-3">
                  {ensureValidProfiles(form.voyageurProfiles, categories, form.categorieClientId || undefined).map((profile, index) => {
                    const profileCategory = categories.find((categorie) => categorie.id === profile.categorieClientId);
                    return (
                      <div key={`${profile.categorieClientId || "profil"}-${index}`} className="rounded-2xl border border-border/60 bg-white p-4">
                        <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_180px_180px_auto] md:items-end">
                          <div className="flex-1 space-y-2">
                            <Label>Categorie client</Label>
                            {isLockedPrefill ? (
                              <Input value={profileCategory?.nom ?? `Categorie ${index + 1}`} readOnly />
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
                                <SelectTrigger>
                                  <span className={profile.categorieClientId ? "truncate" : "truncate text-muted-foreground"}>
                                    {profileCategory?.nom ?? `Selectionner une categorie`}
                                  </span>
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
                          </div>

                          <div className="w-full md:w-44 space-y-2">
                            <Label>Gamme</Label>
                            {isLockedPrefill ? (
                              <Input value={normalizeGamme(profile.gamme)} readOnly />
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
                                <SelectTrigger>
                                  <span>{normalizeGamme(profile.gamme)}</span>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MOYENNE">MOYENNE</SelectItem>
                                  <SelectItem value="LUXE">LUXE</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          <div className="w-full md:w-44 space-y-2">
                            <Label>Nombre de personnes</Label>
                            <Input
                              type="number"
                              min={1}
                              readOnly={isLockedPrefill}
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
                            />
                          </div>

                          {!isLockedPrefill ? (
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
                            >
                              <Trash2 className="h-4 w-4 text-rose-600" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  Total voyageurs : <span className="font-medium text-foreground">{totalVoyageurs(form.voyageurProfiles)}</span>
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
                    <Textarea
                      value={form.resumeSimulation}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, resumeSimulation: event.target.value }))
                      }
                      placeholder="Resume rapide du scenario simule"
                      rows={4}
                    />
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

        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Resume rapide</CardTitle>
              <CardDescription>
                Un devis est calcule automatiquement selon vos choix.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Destination</p>
                <p className="mt-1 font-medium">{selectedDestination?.title ?? "A choisir"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Planification</p>
                <p className="mt-1 font-medium">
                  {selectedPlanification?.nomPlanification ?? "A choisir"}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Prix unitaire</p>
                  <p className="mt-1 font-medium">
                    {loadingQuote ? "Calcul..." : quote ? formatCurrency(quote.prixUnitaire) : "-"}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Prix total</p>
                  <p className="mt-1 font-medium">
                    {loadingQuote ? "Calcul..." : quote ? formatCurrency(quote.prixTotal) : "-"}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                {quote
                  ? `Estimation basee sur ${quote.dureeJours} jour(s) et ${totalVoyageurs(form.voyageurProfiles)} voyageur(s).`
                  : quoteError || "Selectionnez une planification, une categorie et une gamme pour obtenir un devis."}
              </div>
            </CardContent>
          </Card>
          

          {/* <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Vos dernieres demandes</CardTitle>
              <CardDescription>Les reservations les plus recentes dans votre espace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingReservations ? (
                <p className="text-sm text-muted-foreground">Chargement des reservations...</p>
              ) : recentReservations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune reservation pour le moment.</p>
              ) : (
                recentReservations.map((reservation) => {
                  const detail = reservation.details[0];
                  return (
                    <div key={reservation.id} className="rounded-xl border border-border/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{reservation.reference}</p>
                          <p className="text-sm text-muted-foreground">
                            {detail?.nomDestination ?? "-"} - {detail?.nomPlanification ?? "-"}
                          </p>
                        </div>
                        <Badge className={statusStyles[reservation.status]}>
                          {formatStatus(reservation.status)}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                        <span>{formatCurrency(reservation.montantTotal, reservation.devise)}</span>
                        <span>{formatDate(reservation.dateReservation)}</span>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/${username}/reservations/${reservation.id}`}>Voir detail</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card> */}


        </div>
      </div>
      ) : null}

      {activeSection === "list" ? (
      <>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Liste de mes reservations</CardTitle>
          <CardDescription>
            Retrouvez toutes les reservations deja creees dans votre espace client.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label htmlFor="status-filter">Trier par statut</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as ReservationStatus | "ALL")}
            >
              <SelectTrigger id="status-filter" className="w-[240px]">
                <span className="truncate">
                  {statusFilter === "ALL" ? "Tous les statuts" : formatStatus(statusFilter)}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="EN_ATTENTE">EN ATTENTE</SelectItem>
                <SelectItem value="A_REVOIR">A REVOIR</SelectItem>
                <SelectItem value="EN_ATTENTE_DISPONIBILITE">EN ATTENTE DISPONIBILITE</SelectItem>
                <SelectItem value="VALIDEE">VALIDEE</SelectItem>
                <SelectItem value="ANNULEE">ANNULEE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadingReservations ? (
            <p className="text-sm text-muted-foreground">Chargement des reservations...</p>
          ) : filteredReservations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
              Aucune reservation n&apos;a encore ete enregistree.
            </div>
          ) : (
            filteredReservations.map((reservation) => {
              const detail = reservation.details[0];
              const totalElements = reservation.details.reduce(
                (sum, item) => sum + item.elementsSelectionnes.length,
                0
              );
              const showElementsCount = reservation.source === "SIMULATION";

              return (
                <div
                  key={reservation.id}
                  className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold">{reservation.reference}</p>
                        <Badge className={statusStyles[reservation.status]}>
                          {formatStatus(reservation.status)}
                        </Badge>
                        <Badge variant="outline">{formatSource(reservation.source)}</Badge>
                      </div>

                      <div>
                        <p className="font-medium text-foreground">
                          {detail?.nomDestination ?? "-"} - {detail?.nomPlanification ?? "-"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {detail?.nomCategorieClient ?? "-"} · {detail?.gamme ?? "-"} ·{" "}
                          {detail?.nombrePersonnes ?? 0} voyageur(s)
                        </p>
                      </div>

                      <div className={`grid gap-3 sm:grid-cols-2 ${showElementsCount ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
                        <div className="rounded-xl bg-muted/40 p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Montant
                          </p>
                          <p className="mt-1 font-medium">
                            {formatCurrency(reservation.montantTotal, reservation.devise)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-muted/40 p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Creee le
                          </p>
                          <p className="mt-1 font-medium">{formatDate(reservation.dateReservation)}</p>
                        </div>
                        {showElementsCount ? (
                          <div className="rounded-xl bg-muted/40 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Elements
                            </p>
                            <p className="mt-1 font-medium">{totalElements}</p>
                          </div>
                        ) : null}
                        <div className="rounded-xl bg-muted/40 p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Commentaire
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-foreground">
                            {reservation.commentaireClient?.trim() || "Aucun commentaire"}
                          </p>
                        </div>
                      </div>

                      {detail?.resumeSimulation ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-900">
                          <p className="font-medium">Resume de simulation conserve</p>
                          <p className="mt-2 line-clamp-3 whitespace-pre-wrap">
                            {detail.resumeSimulation}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 lg:w-44">
                      <Button asChild className="w-full">
                        <Link href={`/${username}/reservations/${reservation.id}`}>Voir detail</Link>
                      </Button>
                      {reservation.status === "EN_ATTENTE" ? (
                        <Button
                          type="button"
                          variant="destructive"
                          className="w-full"
                          onClick={() => void handleDeleteReservation(reservation.id)}
                        >
                          Supprimer
                        </Button>
                      ) : null}
                      <div className="rounded-xl border border-dashed border-border/70 px-4 py-3 text-sm text-muted-foreground">
                        Derniere mise a jour
                        <p className="mt-2 font-medium text-foreground">
                          {formatDate(reservation.dateModification ?? reservation.dateReservation)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
      </>
      ) : null}
    </div>
  );
}
