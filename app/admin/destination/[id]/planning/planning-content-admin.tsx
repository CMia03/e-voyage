"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, List, Map, Pencil, Plus, Trash2, X } from "lucide-react";

import { AdminFooter } from "@/app/admin/components/footer";
import { AdminHeader } from "@/app/admin/components/header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  calculateTransportRoute,
  createTypeElementJour,
  createElementJourPlanification,
  createJourPlanificationVoyage,
  createPlanificationVoyage,
  createTransport,
  createTypeTransport,
  deleteElementJourPlanification,
  deleteJourPlanificationVoyage,
  deletePlanificationVoyage,
  deleteTransport,
  getAdminDestination,
  getDestinationAssociations,
  listPlanificationsByDestination,
  listTypeElementJours,
  listTypeTransports,
  updateElementJourPlanification,
  updateJourPlanificationVoyage,
  updatePlanificationVoyage,
  updateTransport,
} from "@/lib/api/destinations";
import { listTarifsActivites } from "@/lib/api/activites";
import { listTarifsHebergements } from "@/lib/api/hebergements";
import { getErrorMessage } from "@/lib/api/client";
import { loadAuth } from "@/lib/auth";
import {
  AdminDestination,
  DestinationAssociations,
  ElementJourPlanification,
  JourPlanificationVoyage,
  PlanificationVoyage,
  SaveElementJourPlanificationPayload,
  SaveJourPlanificationVoyagePayload,
  SavePlanificationVoyagePayload,
  SaveTransportPayload,
  Transport,
  TypeElementJour,
  TypeTransport,
} from "@/lib/type/destination";
import { TarifActivite } from "@/lib/type/activite";
import { TarifHebergement } from "@/lib/type/hebergement";

const HebergementMap = dynamic(
  () => import("@/components/hebergement-map").then((mod) => mod.HebergementMap),
  { ssr: false }
);
const PlanningVoyageDayMap = dynamic(
  () => import("@/components/planning-voyage-day-map").then((mod) => mod.PlanningVoyageDayMap),
  { ssr: false }
);

type Props = { destinationId: string };
type PlanningSection = "planning" | "resume" | "carte" | "budget" | "photo" | "reservation";

type PlanificationFormState = {
  nomPlanification: string;
  budgetTotal: string;
  deviseBudget: string;
  dateHeureDebut: string;
  depart: string;
  dateHeureFin: string;
  arriver: string;
};

type TransportFormState = {
  ordreEtape: string;
  depart: string;
  arrivee: string;
  longitudeDepart: string;
  latitudeDepart: string;
  longitudeArrivee: string;
  latitudeArrivee: string;
  duree: string;
  distanceKm: string;
  idTypeTransport: string;
};

type JourFormState = {
  numeroJour: string;
  dateJour: string;
  titre: string;
  description: string;
};

type ElementFormState = {
  titre: string;
  description: string;
  heureDebut: string;
  heureFin: string;
  budgetPrevu: string;
  devise: string;
  estActif: boolean;
  idTypeElementJour: string;
  idTransport: string;
  idActivite: string;
  idHebergement: string;
};

type BudgetSuggestion = {
  id: string;
  label: string;
  montant: number;
  devise: string;
};

const initialPlanificationForm: PlanificationFormState = {
  nomPlanification: "",
  budgetTotal: "",
  deviseBudget: "MGA",
  dateHeureDebut: "",
  depart: "",
  dateHeureFin: "",
  arriver: "",
};

const initialTransportForm: TransportFormState = {
  ordreEtape: "",
  depart: "",
  arrivee: "",
  longitudeDepart: "",
  latitudeDepart: "",
  longitudeArrivee: "",
  latitudeArrivee: "",
  duree: "",
  distanceKm: "",
  idTypeTransport: "",
};

const initialJourForm: JourFormState = {
  numeroJour: "",
  dateJour: "",
  titre: "",
  description: "",
};

const initialElementForm: ElementFormState = {
  titre: "",
  description: "",
  heureDebut: "",
  heureFin: "",
  budgetPrevu: "",
  devise: "MGA",
  estActif: true,
  idTypeElementJour: "",
  idTransport: "",
  idActivite: "",
  idHebergement: "",
};

const sectionOptions: Array<{ id: PlanningSection; label: string; icon: typeof CalendarDays }> = [
  { id: "planning", label: "Planning", icon: CalendarDays },
  { id: "resume", label: "Resume", icon: List },
  { id: "carte", label: "Carte", icon: Map },
  { id: "budget", label: "Budget", icon: CheckCircle2 },
  { id: "photo", label: "Photo", icon: Plus },
  { id: "reservation", label: "Reservation", icon: CheckCircle2 },
];

function formatDate(value?: string | null) {
  if (!value) return "Date non renseignee";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("fr-FR");
}

function getSectionDescription(section: PlanningSection) {
  if (section === "planning") return "Organisation jour par jour du voyage avec trajets, activites, hebergements et notes.";
  return "Cette section sera branchee ensuite. Nous nous concentrons pour le moment sur le planning.";
}

function mapPlanificationToForm(planification: PlanificationVoyage): PlanificationFormState {
  return {
    nomPlanification: planification.nomPlanification ?? "",
    budgetTotal: planification.budgetTotal !== null && planification.budgetTotal !== undefined ? String(planification.budgetTotal) : "",
    deviseBudget: planification.deviseBudget ?? "MGA",
    dateHeureDebut: planification.dateHeureDebut ? planification.dateHeureDebut.slice(0, 16) : "",
    depart: planification.depart ?? "",
    dateHeureFin: planification.dateHeureFin ? planification.dateHeureFin.slice(0, 16) : "",
    arriver: planification.arriver ?? "",
  };
}

function mapTransportToForm(transport: Transport): TransportFormState {
  return {
    ordreEtape: transport.ordreEtape !== null && transport.ordreEtape !== undefined ? String(transport.ordreEtape) : "",
    depart: transport.depart ?? "",
    arrivee: transport.arrivee ?? "",
    longitudeDepart: transport.longitudeDepart !== null && transport.longitudeDepart !== undefined ? String(transport.longitudeDepart) : "",
    latitudeDepart: transport.latitudeDepart !== null && transport.latitudeDepart !== undefined ? String(transport.latitudeDepart) : "",
    longitudeArrivee: transport.longitudeArrivee !== null && transport.longitudeArrivee !== undefined ? String(transport.longitudeArrivee) : "",
    latitudeArrivee: transport.latitudeArrivee !== null && transport.latitudeArrivee !== undefined ? String(transport.latitudeArrivee) : "",
    duree: transport.duree ?? "",
    distanceKm: transport.distanceKm !== null && transport.distanceKm !== undefined ? String(transport.distanceKm) : "",
    idTypeTransport: transport.idTypeTransport ?? "",
  };
}

function mapJourToForm(jour: JourPlanificationVoyage): JourFormState {
  return {
    numeroJour: jour.numeroJour ? String(jour.numeroJour) : "",
    dateJour: jour.dateJour ?? "",
    titre: jour.titre ?? "",
    description: jour.description ?? "",
  };
}

function mapElementToForm(element: ElementJourPlanification): ElementFormState {
  return {
    titre: element.titre ?? "",
    description: element.description ?? "",
    heureDebut: element.heureDebut ? element.heureDebut.slice(0, 16) : "",
    heureFin: element.heureFin ? element.heureFin.slice(0, 16) : "",
    budgetPrevu: element.budgetPrevu !== null && element.budgetPrevu !== undefined ? String(element.budgetPrevu) : "",
    devise: element.devise ?? "MGA",
    estActif: element.estActif,
    idTypeElementJour: element.idTypeElementJour,
    idTransport: element.idTransport ?? "",
    idActivite: element.idActivite ?? "",
    idHebergement: element.idHebergement ?? "",
  };
}

function getElementDisplayTitle(element: ElementJourPlanification) {
  return element.titre || element.nomTransport || element.nomActivite || element.nomHebergement || element.nomTypeElementJour || "Element";
}

function getLinkedLabel(element: ElementJourPlanification) {
  return element.nomTransport || element.nomActivite || element.nomHebergement || null;
}

export function AdminDestinationPlanningContentNext({ destinationId }: Props) {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [role, setRole] = useState("");
  const [destination, setDestination] = useState<AdminDestination | null>(null);
  const [associations, setAssociations] = useState<DestinationAssociations | null>(null);
  const [planifications, setPlanifications] = useState<PlanificationVoyage[]>([]);
  const [typeTransports, setTypeTransports] = useState<TypeTransport[]>([]);
  const [typeElementJours, setTypeElementJours] = useState<TypeElementJour[]>([]);
  const [tarifsActivites, setTarifsActivites] = useState<TarifActivite[]>([]);
  const [tarifsHebergements, setTarifsHebergements] = useState<TarifHebergement[]>([]);
  const [selectedPlanificationId, setSelectedPlanificationId] = useState("");
  const [selectedTransportId, setSelectedTransportId] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<PlanningSection>("planning");
  const [editingPlanificationId, setEditingPlanificationId] = useState<string | null>(null);
  const [editingTransportId, setEditingTransportId] = useState<string | null>(null);
  const [editingJourId, setEditingJourId] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [targetJourIdForElement, setTargetJourIdForElement] = useState("");
  const [insertElementAtIndex, setInsertElementAtIndex] = useState(0);
  const [openElementDialogAfterTransportSave, setOpenElementDialogAfterTransportSave] = useState(false);
  const [coordinateTarget, setCoordinateTarget] = useState<"depart" | "arrivee">("depart");
  const [showTypeTransportCreator, setShowTypeTransportCreator] = useState(false);
  const [newTypeTransportName, setNewTypeTransportName] = useState("");
  const [planificationForm, setPlanificationForm] = useState(initialPlanificationForm);
  const [transportForm, setTransportForm] = useState(initialTransportForm);
  const [jourForm, setJourForm] = useState(initialJourForm);
  const [elementForm, setElementForm] = useState(initialElementForm);
  const [isPlanificationDialogOpen, setIsPlanificationDialogOpen] = useState(false);
  const [isTransportDialogOpen, setIsTransportDialogOpen] = useState(false);
  const [isJourDialogOpen, setIsJourDialogOpen] = useState(false);
  const [isElementDialogOpen, setIsElementDialogOpen] = useState(false);
  const [isCoordinatePickerOpen, setIsCoordinatePickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingPlanifications, setIsRefreshingPlanifications] = useState(true);
  const [isSavingPlanification, setIsSavingPlanification] = useState(false);
  const [isSavingTransport, setIsSavingTransport] = useState(false);
  const [isSavingJour, setIsSavingJour] = useState(false);
  const [isSavingElement, setIsSavingElement] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isCalculatingTransportId, setIsCalculatingTransportId] = useState<string | null>(null);
  const [showExtraElementTypes, setShowExtraElementTypes] = useState(false);
  const [showTypeElementCreator, setShowTypeElementCreator] = useState(false);
  const [newTypeElementName, setNewTypeElementName] = useState("");
  const [isCreatingTypeElement, setIsCreatingTypeElement] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  const selectedPlanification = useMemo(() => planifications.find((item) => item.id === selectedPlanificationId) ?? null, [planifications, selectedPlanificationId]);
  const selectedTypeElementJour = useMemo(() => typeElementJours.find((item) => item.id === elementForm.idTypeElementJour) ?? null, [typeElementJours, elementForm.idTypeElementJour]);
  const visibleTypeElementJours = useMemo(() => {
    const defaultCodes = new Set(["HEBERGEMENT", "ACTIVITE", "TRANSPORT"]);
    const baseTypes = typeElementJours.filter((item) => defaultCodes.has(item.code));
    if (!showExtraElementTypes) {
      // Keep selected value visible even if it is not in default types.
      if (elementForm.idTypeElementJour && !baseTypes.some((item) => item.id === elementForm.idTypeElementJour)) {
        const selected = typeElementJours.find((item) => item.id === elementForm.idTypeElementJour);
        if (selected) return [...baseTypes, selected];
      }
      return baseTypes.length > 0 ? baseTypes : typeElementJours;
    }
    return typeElementJours;
  }, [showExtraElementTypes, typeElementJours, elementForm.idTypeElementJour]);
  const linkedActivites = useMemo(() => (associations?.activites ?? []).filter((item) => item.estSelectionne), [associations]);
  const linkedHebergements = useMemo(() => (associations?.hebergements ?? []).filter((item) => item.estSelectionne), [associations]);
  const sortedDays = useMemo(
    () => [...(selectedPlanification?.jours ?? [])].sort((a, b) => (a.numeroJour ?? 9999) - (b.numeroJour ?? 9999)),
    [selectedPlanification]
  );
  const budgetSuggestions = useMemo<BudgetSuggestion[]>(() => {
    if (selectedTypeElementJour?.code === "ACTIVITE" && elementForm.idActivite) {
      const activiteTarifs = tarifsActivites
        .filter((tarif) => tarif.idActivite === elementForm.idActivite && tarif.estActif)
        .sort((a, b) => (a.prixParPersonne ?? a.prixParHeur ?? Number.MAX_SAFE_INTEGER) - (b.prixParPersonne ?? b.prixParHeur ?? Number.MAX_SAFE_INTEGER));

      return activiteTarifs
        .map((tarif) => {
          const montant = tarif.prixParPersonne ?? tarif.prixParHeur;
          if (montant === null || montant === undefined) return null;
          const unite = tarif.prixParPersonne !== null && tarif.prixParPersonne !== undefined ? "par personne" : "par heure";
          return {
            id: tarif.id,
            label: `${tarif.categorieAge || "Tarif"} (${unite})`,
            montant,
            devise: tarif.devise || "MGA",
          };
        })
        .filter((item): item is BudgetSuggestion => item !== null);
    }

    if (selectedTypeElementJour?.code === "HEBERGEMENT" && elementForm.idHebergement) {
      const hebergementTarifs = tarifsHebergements
        .filter((tarif) => tarif.idHebergement === elementForm.idHebergement && tarif.estActif)
        .sort((a, b) => (a.prixParNuit ?? a.prixReservation ?? Number.MAX_SAFE_INTEGER) - (b.prixParNuit ?? b.prixReservation ?? Number.MAX_SAFE_INTEGER));

      return hebergementTarifs
        .map((tarif) => {
          const montant = tarif.prixParNuit ?? tarif.prixReservation;
          if (montant === null || montant === undefined) return null;
          const unite = tarif.prixParNuit !== null && tarif.prixParNuit !== undefined ? "par nuit" : "reservation";
          return {
            id: tarif.id,
            label: `${tarif.nomTypeChambre || "Tarif"} (${unite})`,
            montant,
            devise: tarif.devise || "MGA",
          };
        })
        .filter((item): item is BudgetSuggestion => item !== null);
    }

    return [];
  }, [selectedTypeElementJour?.code, elementForm.idActivite, elementForm.idHebergement, tarifsActivites, tarifsHebergements]);

  useEffect(() => {
    const session = loadAuth();
    if (!session?.accessToken) {
      router.push("/login");
      return;
    }
    if (session.role !== "ADMIN") {
      router.push("/admin");
      return;
    }
    setAccessToken(session.accessToken);
    setRole(session.role);
  }, [router]);

  useEffect(() => {
    if (!accessToken || role !== "ADMIN") return;
    void loadPage();
  }, [accessToken, role, destinationId]);

  useEffect(() => {
    if (!successMessage) {
      setShowSuccessAlert(false);
      return;
    }
    setShowSuccessAlert(true);
    const timeout = window.setTimeout(() => setShowSuccessAlert(false), 4500);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    if (!error) {
      setShowErrorAlert(false);
      return;
    }
    setShowErrorAlert(true);
    const timeout = window.setTimeout(() => setShowErrorAlert(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [error]);

  async function loadPage() {
    setIsLoading(true);
    setIsRefreshingPlanifications(true);
    setError("");
    try {
      const [destinationResponse, associationsResponse, typesResponse, typeElementsResponse, tarifsActivitesResponse, tarifsHebergementsResponse] = await Promise.all([
        getAdminDestination(destinationId, accessToken),
        getDestinationAssociations(destinationId, accessToken),
        listTypeTransports(accessToken),
        listTypeElementJours(accessToken),
        listTarifsActivites(accessToken),
        listTarifsHebergements(accessToken),
      ]);
      setDestination(destinationResponse.data ?? null);
      setAssociations(associationsResponse.data ?? null);
      setTypeTransports(typesResponse.data ?? []);
      setTypeElementJours(typeElementsResponse.data ?? []);
      setTarifsActivites(tarifsActivitesResponse.data ?? []);
      setTarifsHebergements(tarifsHebergementsResponse.data ?? []);
      await refreshPlanifications();
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Impossible de charger le planning de voyage"));
    } finally {
      setIsLoading(false);
      setIsRefreshingPlanifications(false);
    }
  }

  async function refreshPlanifications() {
    setIsRefreshingPlanifications(true);
    try {
      const response = await listPlanificationsByDestination(destinationId, accessToken);
      const nextPlanifications = response.data ?? [];
      setPlanifications(nextPlanifications);
      setSelectedPlanificationId((current) => {
        if (nextPlanifications.some((item) => item.id === current)) return current;
        return nextPlanifications[0]?.id ?? "";
      });
      setSelectedTransportId((current) => {
        if (!current) return nextPlanifications[0]?.transports[0]?.id ?? null;
        const exists = nextPlanifications.some((planification) => planification.transports.some((transport) => transport.id === current));
        return exists ? current : nextPlanifications[0]?.transports[0]?.id ?? null;
      });
    } finally {
      setIsRefreshingPlanifications(false);
    }
  }

  function updatePlanificationForm<K extends keyof PlanificationFormState>(key: K, value: PlanificationFormState[K]) {
    setPlanificationForm((current) => ({ ...current, [key]: value }));
  }

  function updateTransportForm<K extends keyof TransportFormState>(key: K, value: TransportFormState[K]) {
    setTransportForm((current) => ({ ...current, [key]: value }));
  }

  function updateJourForm<K extends keyof JourFormState>(key: K, value: JourFormState[K]) {
    setJourForm((current) => ({ ...current, [key]: value }));
  }

  function updateElementForm<K extends keyof ElementFormState>(key: K, value: ElementFormState[K]) {
    setElementForm((current) => ({ ...current, [key]: value }));
  }

  function applySuggestedBudget(suggestion: BudgetSuggestion | null) {
    if (!suggestion) return;
    setElementForm((current) => ({
      ...current,
      budgetPrevu: String(suggestion.montant),
      devise: suggestion.devise || current.devise || "MGA",
    }));
  }

  function handleActiviteSelection(value: string) {
    const nextId = value === "none" ? "" : value;
    setElementForm((current) => ({ ...current, idActivite: nextId }));
    if (!nextId) return;
    const activiteTarifs = tarifsActivites
      .filter((tarif) => tarif.idActivite === nextId && tarif.estActif)
      .sort((a, b) => (a.prixParPersonne ?? a.prixParHeur ?? Number.MAX_SAFE_INTEGER) - (b.prixParPersonne ?? b.prixParHeur ?? Number.MAX_SAFE_INTEGER));
    const first = activiteTarifs.find((tarif) => (tarif.prixParPersonne ?? tarif.prixParHeur) !== null && (tarif.prixParPersonne ?? tarif.prixParHeur) !== undefined);
    if (!first) return;
    applySuggestedBudget({
      id: first.id,
      label: first.categorieAge || "Tarif",
      montant: first.prixParPersonne ?? first.prixParHeur ?? 0,
      devise: first.devise || "MGA",
    });
  }

  function handleHebergementSelection(value: string) {
    const nextId = value === "none" ? "" : value;
    setElementForm((current) => ({ ...current, idHebergement: nextId }));
    if (!nextId) return;
    const hebergementTarifs = tarifsHebergements
      .filter((tarif) => tarif.idHebergement === nextId && tarif.estActif)
      .sort((a, b) => (a.prixParNuit ?? a.prixReservation ?? Number.MAX_SAFE_INTEGER) - (b.prixParNuit ?? b.prixReservation ?? Number.MAX_SAFE_INTEGER));
    const first = hebergementTarifs.find((tarif) => (tarif.prixParNuit ?? tarif.prixReservation) !== null && (tarif.prixParNuit ?? tarif.prixReservation) !== undefined);
    if (!first) return;
    applySuggestedBudget({
      id: first.id,
      label: first.nomTypeChambre || "Tarif",
      montant: first.prixParNuit ?? first.prixReservation ?? 0,
      devise: first.devise || "MGA",
    });
  }

  function openCreatePlanificationDialog() {
    setEditingPlanificationId(null);
    setPlanificationForm(initialPlanificationForm);
    setIsPlanificationDialogOpen(true);
  }

  function openEditPlanificationDialog(planification: PlanificationVoyage) {
    setEditingPlanificationId(planification.id);
    setPlanificationForm(mapPlanificationToForm(planification));
    setIsPlanificationDialogOpen(true);
  }

  function openCreateTransportDialog() {
    if (!selectedPlanification) {
      setError("Choisis d'abord une planification.");
      return;
    }
    setOpenElementDialogAfterTransportSave(false);
    setEditingTransportId(null);
    setTransportForm(initialTransportForm);
    setShowTypeTransportCreator(false);
    setNewTypeTransportName("");
    setIsTransportDialogOpen(true);
  }

  function openEditTransportDialog(transport: Transport) {
    setOpenElementDialogAfterTransportSave(false);
    setSelectedTransportId(transport.id);
    setEditingTransportId(transport.id);
    setTransportForm(mapTransportToForm(transport));
    setShowTypeTransportCreator(false);
    setNewTypeTransportName("");
    setIsTransportDialogOpen(true);
  }

  function openCreateTransportFromElementDialog() {
    setOpenElementDialogAfterTransportSave(true);
    setIsElementDialogOpen(false);
    setEditingTransportId(null);
    setTransportForm(initialTransportForm);
    setShowTypeTransportCreator(false);
    setNewTypeTransportName("");
    setIsTransportDialogOpen(true);
  }

  function openEditTransportFromElementDialog(transport: Transport) {
    setOpenElementDialogAfterTransportSave(true);
    setIsElementDialogOpen(false);
    openEditTransportDialog(transport);
  }

  function openCreateJourDialog() {
    if (!selectedPlanification) {
      setError("Choisis d'abord une planification.");
      return;
    }
    setEditingJourId(null);
    setJourForm({ ...initialJourForm, numeroJour: String((selectedPlanification.jours?.length ?? 0) + 1) });
    setIsJourDialogOpen(true);
  }

  function openEditJourDialog(jour: JourPlanificationVoyage) {
    setEditingJourId(jour.id);
    setJourForm(mapJourToForm(jour));
    setIsJourDialogOpen(true);
  }

  function openCreateElementDialog(jour: JourPlanificationVoyage, insertIndex = jour.elements?.length ?? 0) {
    setEditingElementId(null);
    setTargetJourIdForElement(jour.id);
    setInsertElementAtIndex(insertIndex);
    setElementForm(initialElementForm);
    setShowExtraElementTypes(false);
    setShowTypeElementCreator(false);
    setNewTypeElementName("");
    setIsElementDialogOpen(true);
  }

  function openEditElementDialog(jourId: string, element: ElementJourPlanification) {
    setEditingElementId(element.id);
    setTargetJourIdForElement(jourId);
    setInsertElementAtIndex(0);
    setElementForm(mapElementToForm(element));
    setShowExtraElementTypes(false);
    setShowTypeElementCreator(false);
    setNewTypeElementName("");
    setIsElementDialogOpen(true);
  }

  async function handleCreateTypeElementJour() {
    const trimmed = newTypeElementName.trim();
    if (!trimmed) {
      setError("Renseigne le nom du type de bloc.");
      return;
    }

    const code = trimmed
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toUpperCase();

    if (!code) {
      setError("Impossible de generer un code valide pour ce type.");
      return;
    }

    setIsCreatingTypeElement(true);
    setError("");
    try {
      const response = await createTypeElementJour({ nom: trimmed, code }, accessToken);
      const created = response.data;
      if (created) {
        setTypeElementJours((current) => [...current, created]);
        setElementForm((current) => ({ ...current, idTypeElementJour: created.id }));
        setShowExtraElementTypes(true);
        setShowTypeElementCreator(false);
        setNewTypeElementName("");
        setSuccessMessage("Type de bloc ajoute avec succes.");
      }
    } catch (creationError) {
      setError(getErrorMessage(creationError, "Impossible d'ajouter le type de bloc"));
    } finally {
      setIsCreatingTypeElement(false);
    }
  }

  function openCoordinatePicker(target: "depart" | "arrivee") {
    setCoordinateTarget(target);
    setIsCoordinatePickerOpen(true);
  }

  function handleCoordinatePicked(coords: { latitude: number; longitude: number }) {
    if (coordinateTarget === "depart") {
      setTransportForm((current) => ({ ...current, latitudeDepart: String(coords.latitude), longitudeDepart: String(coords.longitude) }));
      return;
    }
    setTransportForm((current) => ({ ...current, latitudeArrivee: String(coords.latitude), longitudeArrivee: String(coords.longitude) }));
  }

  function buildPlanificationPayload(): SavePlanificationVoyagePayload {
    return {
      nomPlanification: planificationForm.nomPlanification.trim(),
      budgetTotal: planificationForm.budgetTotal ? Number(planificationForm.budgetTotal) : null,
      deviseBudget: planificationForm.deviseBudget.trim() || "MGA",
      dateHeureDebut: planificationForm.dateHeureDebut || undefined,
      depart: planificationForm.depart.trim(),
      dateHeureFin: planificationForm.dateHeureFin || undefined,
      arriver: planificationForm.arriver.trim(),
      idDestination: destinationId,
    };
  }

  function buildTransportPayload(): SaveTransportPayload {
    return {
      ordreEtape: transportForm.ordreEtape ? Number(transportForm.ordreEtape) : null,
      depart: transportForm.depart.trim(),
      arrivee: transportForm.arrivee.trim(),
      longitudeDepart: transportForm.longitudeDepart ? Number(transportForm.longitudeDepart) : null,
      latitudeDepart: transportForm.latitudeDepart ? Number(transportForm.latitudeDepart) : null,
      longitudeArrivee: transportForm.longitudeArrivee ? Number(transportForm.longitudeArrivee) : null,
      latitudeArrivee: transportForm.latitudeArrivee ? Number(transportForm.latitudeArrivee) : null,
      duree: transportForm.duree.trim(),
      distanceKm: transportForm.distanceKm ? Number(transportForm.distanceKm) : null,
      geojsonTrajet: "",
      idTypeTransport: transportForm.idTypeTransport,
      idPlanificationVoyage: selectedPlanificationId,
    };
  }

  function buildJourPayload(): SaveJourPlanificationVoyagePayload {
    return {
      numeroJour: jourForm.numeroJour ? Number(jourForm.numeroJour) : null,
      dateJour: jourForm.dateJour || null,
      titre: jourForm.titre.trim(),
      description: jourForm.description.trim(),
      idPlanificationVoyage: selectedPlanificationId,
    };
  }

  function buildElementPayload(): SaveElementJourPlanificationPayload {
    const currentElement =
      editingElementId && selectedPlanification
        ? selectedPlanification.jours
            .flatMap((jour) => jour.elements ?? [])
            .find((element) => element.id === editingElementId) ?? null
        : null;

    return {
      titre: elementForm.titre.trim(),
      description: elementForm.description.trim(),
      heureDebut: elementForm.heureDebut || null,
      heureFin: elementForm.heureFin || null,
      ordreAffichage: currentElement?.ordreAffichage ?? insertElementAtIndex + 1,
      budgetPrevu: elementForm.budgetPrevu ? Number(elementForm.budgetPrevu) : null,
      devise: elementForm.devise.trim() || "MGA",
      estActif: elementForm.estActif,
      idJourPlanificationVoyage: targetJourIdForElement,
      idTypeElementJour: elementForm.idTypeElementJour,
      idTransport: elementForm.idTransport || null,
      idActivite: elementForm.idActivite || null,
      idHebergement: elementForm.idHebergement || null,
    };
  }

  function buildExistingElementPayload(
    element: ElementJourPlanification,
    ordreAffichage: number
  ): SaveElementJourPlanificationPayload {
    return {
      titre: element.titre ?? "",
      description: element.description ?? "",
      heureDebut: element.heureDebut ?? null,
      heureFin: element.heureFin ?? null,
      ordreAffichage,
      budgetPrevu: element.budgetPrevu ?? null,
      devise: element.devise ?? "MGA",
      estActif: element.estActif,
      idJourPlanificationVoyage: element.idJourPlanificationVoyage,
      idTypeElementJour: element.idTypeElementJour,
      idTransport: element.idTransport ?? null,
      idActivite: element.idActivite ?? null,
      idHebergement: element.idHebergement ?? null,
    };
  }

  async function handleCreateTypeTransport() {
    if (!newTypeTransportName.trim()) {
      setError("Renseigne le nom du type de transport.");
      return;
    }
    try {
      const response = await createTypeTransport({ nom: newTypeTransportName.trim() }, accessToken);
      const created = response.data;
      if (created) {
        setTypeTransports((current) => [...current, created].sort((a, b) => a.nom.localeCompare(b.nom)));
        setTransportForm((current) => ({ ...current, idTypeTransport: created.id }));
      }
      setNewTypeTransportName("");
      setShowTypeTransportCreator(false);
      setSuccessMessage("Type de transport ajoute avec succes.");
    } catch (createError) {
      setError(getErrorMessage(createError, "Impossible d'ajouter le type de transport"));
    }
  }

  async function handleSubmitPlanification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingPlanification(true);
    setError("");
    setSuccessMessage("");
    try {
      const payload = buildPlanificationPayload();
      if (editingPlanificationId) {
        await updatePlanificationVoyage(editingPlanificationId, payload, accessToken);
        setSuccessMessage("Planification modifiee avec succes.");
      } else {
        await createPlanificationVoyage(payload, accessToken);
        setSuccessMessage("Planification ajoutee avec succes.");
      }
      setIsPlanificationDialogOpen(false);
      setPlanificationForm(initialPlanificationForm);
      setEditingPlanificationId(null);
      await refreshPlanifications();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible d'enregistrer la planification"));
    } finally {
      setIsSavingPlanification(false);
    }
  }

  async function handleSubmitTransport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlanificationId) {
      setError("Choisis d'abord une planification.");
      return;
    }
    setIsSavingTransport(true);
    setError("");
    setSuccessMessage("");
    try {
      const payload = buildTransportPayload();
      let savedTransport: Transport | null = null;
      if (editingTransportId) {
        const response = await updateTransport(editingTransportId, payload, accessToken);
        savedTransport = response.data ?? null;
        setSuccessMessage("Transport modifie avec succes.");
      } else {
        const response = await createTransport(payload, accessToken);
        savedTransport = response.data ?? null;
        setSuccessMessage("Transport ajoute avec succes.");
      }
      if (savedTransport && openElementDialogAfterTransportSave) {
        setElementForm((current) => ({ ...current, idTransport: savedTransport?.id ?? "" }));
      }
      setIsTransportDialogOpen(false);
      if (openElementDialogAfterTransportSave) {
        setIsElementDialogOpen(true);
        setOpenElementDialogAfterTransportSave(false);
      }
      setTransportForm(initialTransportForm);
      setEditingTransportId(null);
      await refreshPlanifications();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible d'enregistrer le transport"));
    } finally {
      setIsSavingTransport(false);
    }
  }

  async function handleSubmitJour(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlanificationId) {
      setError("Choisis d'abord une planification.");
      return;
    }
    setIsSavingJour(true);
    setError("");
    setSuccessMessage("");
    try {
      const payload = buildJourPayload();
      if (editingJourId) {
        await updateJourPlanificationVoyage(editingJourId, payload, accessToken);
        setSuccessMessage("Jour de planning modifie avec succes.");
      } else {
        await createJourPlanificationVoyage(selectedPlanificationId, payload, accessToken);
        setSuccessMessage("Jour de planning ajoute avec succes.");
      }
      setIsJourDialogOpen(false);
      setJourForm(initialJourForm);
      setEditingJourId(null);
      await refreshPlanifications();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible d'enregistrer le jour"));
    } finally {
      setIsSavingJour(false);
    }
  }

  async function handleSubmitElement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingElement(true);
    setError("");
    setSuccessMessage("");
    try {
      const targetJour =
        selectedPlanification?.jours.find((jour) => jour.id === targetJourIdForElement) ?? null;

      const payload = buildElementPayload();
      if (editingElementId) {
        await updateElementJourPlanification(editingElementId, payload, accessToken);
        setSuccessMessage("Element du jour modifie avec succes.");
      } else {
        if (targetJour) {
          const sortedElements = [...(targetJour.elements ?? [])].sort(
            (a, b) => (a.ordreAffichage ?? 9999) - (b.ordreAffichage ?? 9999)
          );
          const elementsToShift = sortedElements.slice(insertElementAtIndex);

          for (const element of elementsToShift) {
            await updateElementJourPlanification(
              element.id,
              buildExistingElementPayload(element, (element.ordreAffichage ?? 0) + 1),
              accessToken
            );
          }
        }
        await createElementJourPlanification(payload, accessToken);
        setSuccessMessage("Element du jour ajoute avec succes.");
      }
      setIsElementDialogOpen(false);
      setEditingElementId(null);
      setTargetJourIdForElement("");
      setInsertElementAtIndex(0);
      setElementForm(initialElementForm);
      await refreshPlanifications();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible d'enregistrer l'element du jour"));
    } finally {
      setIsSavingElement(false);
    }
  }

  async function handleDeletePlanification(id: string) {
    if (!window.confirm("Supprimer cette planification ?")) return;
    setIsDeletingId(id);
    setError("");
    setSuccessMessage("");
    try {
      await deletePlanificationVoyage(id, accessToken);
      setSuccessMessage("Planification supprimee avec succes.");
      await refreshPlanifications();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Impossible de supprimer la planification"));
    } finally {
      setIsDeletingId(null);
    }
  }

  async function handleDeleteTransport(id: string) {
    if (!window.confirm("Supprimer ce transport ?")) return;
    setIsDeletingId(id);
    setError("");
    setSuccessMessage("");
    try {
      await deleteTransport(id, accessToken);
      setSuccessMessage("Transport supprime avec succes.");
      await refreshPlanifications();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Impossible de supprimer le transport"));
    } finally {
      setIsDeletingId(null);
    }
  }

  async function handleDeleteJour(id: string) {
    if (!window.confirm("Supprimer ce jour de planning ?")) return;
    setIsDeletingId(id);
    setError("");
    setSuccessMessage("");
    try {
      await deleteJourPlanificationVoyage(id, accessToken);
      setSuccessMessage("Jour supprime avec succes.");
      await refreshPlanifications();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Impossible de supprimer le jour"));
    } finally {
      setIsDeletingId(null);
    }
  }

  async function handleDeleteElement(id: string) {
    if (!window.confirm("Supprimer cet element du jour ?")) return;
    setIsDeletingId(id);
    setError("");
    setSuccessMessage("");
    try {
      await deleteElementJourPlanification(id, accessToken);
      setSuccessMessage("Element du jour supprime avec succes.");
      await refreshPlanifications();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Impossible de supprimer l'element du jour"));
    } finally {
      setIsDeletingId(null);
    }
  }

  async function handleCalculateTransportRoute(transport: Transport) {
    setSelectedTransportId(transport.id);
    setIsCalculatingTransportId(transport.id);
    setError("");
    setSuccessMessage("");
    try {
      await calculateTransportRoute(transport.id, accessToken);
      setSuccessMessage("Trajet reel calcule avec succes.");
      await refreshPlanifications();
    } catch (calculationError) {
      setError(getErrorMessage(calculationError, "Impossible de calculer le trajet"));
    } finally {
      setIsCalculatingTransportId(null);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href={`/admin/destination/${destinationId}`} className="hover:text-foreground">Retour au detail de la destination</Link>
                <span>/</span><span>Planning voyage</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Planning voyage{destination ? ` - ${destination.nom}` : ""}</h1>
              <p className="text-sm text-muted-foreground">En haut, la liste des planifications. En bas, les sections du voyage, avec un focus sur le planning.</p>
            </div>
            <Button onClick={openCreatePlanificationDialog}><Plus className="size-4" />Ajouter planification</Button>
          </div>

          {showSuccessAlert && successMessage ? (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900"><CheckCircle2 className="size-4" /><AlertTitle>Succes</AlertTitle><AlertDescription>{successMessage}</AlertDescription></Alert>
          ) : null}
          {showErrorAlert && error ? (
            <Alert variant="destructive"><X className="size-4" /><AlertTitle>Erreur</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
          ) : null}

          <Card className="border-border/50">
            <CardHeader><CardTitle>Liste des planifications</CardTitle><CardDescription>Choisis la planification sur laquelle travailler, puis organise les jours et les elements du voyage.</CardDescription></CardHeader>
            <CardContent>
              {isLoading || isRefreshingPlanifications ? (
                <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">Chargement des planifications...</div>
              ) : planifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">Aucune planification pour cette destination.</div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {planifications.map((planification) => {
                    const isSelected = selectedPlanificationId === planification.id;
                    return (
                      <div
                        key={planification.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedPlanificationId(planification.id);
                          setSelectedTransportId(planification.transports[0]?.id ?? null);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedPlanificationId(planification.id);
                            setSelectedTransportId(planification.transports[0]?.id ?? null);
                          }
                        }}
                        className={`rounded-2xl border p-4 text-left transition cursor-pointer ${isSelected ? "border-emerald-300 bg-emerald-50/60 shadow-sm" : "border-border/50 bg-card/50 hover:border-emerald-200 hover:bg-emerald-50/30"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-semibold">{planification.nomPlanification}</h3>{isSelected ? <Badge variant="secondary">Selectionnee</Badge> : null}</div>
                            <p className="text-sm text-muted-foreground">{planification.depart || "Depart non renseigne"} {"->"} {planification.arriver || "Arrivee non renseignee"}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span className="rounded-full bg-muted px-2.5 py-1">{planification.jours.length} jour(s)</span>
                              <span className="rounded-full bg-muted px-2.5 py-1">{planification.transports.length} transport(s)</span>
                              <span className="rounded-full bg-muted px-2.5 py-1">Budget: {planification.budgetTotal ?? "-"} {planification.deviseBudget || "MGA"}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button type="button" size="icon" variant="outline" onClick={(event) => { event.stopPropagation(); openEditPlanificationDialog(planification); }}><Pencil className="size-4" /></Button>
                            <Button type="button" size="icon" variant="destructive" onClick={(event) => { event.stopPropagation(); void handleDeletePlanification(planification.id); }} disabled={isDeletingId === planification.id}><Trash2 className="size-4" /></Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader><CardTitle>Sections du voyage</CardTitle><CardDescription>{getSectionDescription(selectedSection)}</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                {sectionOptions.map((section) => {
                  const Icon = section.icon;
                  return (
                    <Button key={section.id} type="button" variant={selectedSection === section.id ? "default" : "outline"} className="justify-start" onClick={() => setSelectedSection(section.id)}>
                      <Icon className="size-4" />{section.label}
                    </Button>
                  );
                })}
              </div>

              {!selectedPlanification ? (
                <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-14 text-center text-sm text-muted-foreground">Selectionne une planification en haut pour commencer a construire le planning.</div>
              ) : selectedSection === "carte" ? (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Carte du voyage</CardTitle>
                    <CardDescription>Visualisation des trajets et du planning par jour dans une vue combinee.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PlanningVoyageDayMap
                      planification={selectedPlanification}
                      activites={linkedActivites}
                      hebergements={linkedHebergements}
                      onEditDay={openEditJourDialog}
                      onDeleteDay={(dayId) => void handleDeleteJour(dayId)}
                      onAddElement={(day, insertIndex) => openCreateElementDialog(day, insertIndex)}
                      onEditElement={openEditElementDialog}
                      onDeleteElement={(elementId) => void handleDeleteElement(elementId)}
                    />
                  </CardContent>
                </Card>
              ) : selectedSection !== "planning" ? (
                <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-14 text-center text-sm text-muted-foreground">La section <span className="font-medium text-foreground">{selectedSection}</span> sera branchee ensuite. Nous construisons d'abord le planning jour par jour.</div>
              ) : (
                <div>
                  <Card className="border-border/50">
                    <CardHeader><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle>Planning</CardTitle><CardDescription>{selectedPlanification.nomPlanification} avec {selectedPlanification.jours.length} jour(s) et {selectedPlanification.transports.length} transport(s).</CardDescription></div><Button size="sm" onClick={openCreateJourDialog}><Plus className="size-4" />Ajouter jour</Button></div></CardHeader>
                    <CardContent>
                      {sortedDays.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
                          Aucun jour de planning pour cette planification.
                        </div>
                      ) : (
                        <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                          {sortedDays.map((jour) => {
                            const sortedElements = [...(jour.elements ?? [])].sort(
                              (a, b) => (a.ordreAffichage ?? 9999) - (b.ordreAffichage ?? 9999)
                            );

                            return (
                              <div key={jour.id} className="rounded-3xl border border-border/60 bg-card/40 p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary">Jour {jour.numeroJour ?? "-"}</Badge>
                                      {jour.dateJour ? (
                                        <span className="text-xs text-muted-foreground">{formatDate(jour.dateJour)}</span>
                                      ) : null}
                                    </div>
                                    <h3 className="text-base font-semibold">{jour.titre || `Jour ${jour.numeroJour ?? ""}`}</h3>
                                    {jour.description ? <p className="text-sm text-muted-foreground">{jour.description}</p> : null}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button type="button" size="icon" variant="outline" onClick={() => openEditJourDialog(jour)}>
                                      <Pencil className="size-4" />
                                    </Button>
                                    <Button type="button" size="icon" variant="destructive" onClick={() => void handleDeleteJour(jour.id)} disabled={isDeletingId === jour.id}>
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </div>
                                </div>

                                {sortedElements.length === 0 ? (
                                  <div className="mt-4 flex justify-center">
                                    <Button type="button" size="sm" variant="outline" onClick={() => openCreateElementDialog(jour, 0)}>
                                      <Plus className="size-4" />Ajouter un bloc
                                    </Button>
                                  </div>
                                ) : null}

                                <div className="mt-4 space-y-3">
                                  {sortedElements.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                                      Aucun bloc pour ce jour.
                                    </div>
                                  ) : (
                                    sortedElements.map((element, index) => (
                                      <div key={element.id} className="space-y-3">
                                        <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-2">
                                              <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="outline">{element.nomTypeElementJour || "Element"}</Badge>
                                                {element.estActif ? <Badge variant="secondary">Actif</Badge> : <Badge variant="outline">Inactif</Badge>}
                                              </div>
                                              <h4 className="font-medium">{getElementDisplayTitle(element)}</h4>
                                              {element.description ? <p className="text-sm text-muted-foreground">{element.description}</p> : null}
                                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                <span className="rounded-full bg-muted px-2.5 py-1">Debut: {formatDateTime(element.heureDebut)}</span>
                                                <span className="rounded-full bg-muted px-2.5 py-1">Fin: {formatDateTime(element.heureFin)}</span>
                                                <span className="rounded-full bg-muted px-2.5 py-1">Budget: {element.budgetPrevu ?? "-"} {element.devise || "MGA"}</span>
                                              </div>
                                              {getLinkedLabel(element) ? <p className="text-xs text-emerald-700">Lie a: {getLinkedLabel(element)}</p> : null}
                                            </div>
                                            <div className="flex gap-2">
                                              <Button type="button" size="icon" variant="outline" onClick={() => openEditElementDialog(jour.id, element)}>
                                                <Pencil className="size-4" />
                                              </Button>
                                              <Button type="button" size="icon" variant="destructive" onClick={() => void handleDeleteElement(element.id)} disabled={isDeletingId === element.id}>
                                                <Trash2 className="size-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex justify-center">
                                          <Button type="button" size="icon" variant="outline" className="rounded-full" onClick={() => openCreateElementDialog(jour, index + 1)}>
                                            <Plus className="size-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}


            </CardContent>
          </Card>
        </div>
      </main>
      <Dialog open={isPlanificationDialogOpen} onOpenChange={setIsPlanificationDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlanificationId ? "Modifier la planification" : "Ajouter une planification"}</DialogTitle>
            <DialogDescription>Renseigne les informations globales du voyage.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmitPlanification}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Nom</label>
                <Input value={planificationForm.nomPlanification} onChange={(event) => updatePlanificationForm("nomPlanification", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Budget total</label>
                <Input type="number" min="0" step="0.01" value={planificationForm.budgetTotal} onChange={(event) => updatePlanificationForm("budgetTotal", event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Devise</label>
                <Input value={planificationForm.deviseBudget} onChange={(event) => updatePlanificationForm("deviseBudget", event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date/heure debut</label>
                <Input type="datetime-local" value={planificationForm.dateHeureDebut} onChange={(event) => updatePlanificationForm("dateHeureDebut", event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Depart</label>
                <Input value={planificationForm.depart} onChange={(event) => updatePlanificationForm("depart", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date/heure fin</label>
                <Input type="datetime-local" value={planificationForm.dateHeureFin} onChange={(event) => updatePlanificationForm("dateHeureFin", event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Arrivee</label>
                <Input value={planificationForm.arriver} onChange={(event) => updatePlanificationForm("arriver", event.target.value)} required />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsPlanificationDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isSavingPlanification}>{isSavingPlanification ? "Enregistrement..." : editingPlanificationId ? "Enregistrer" : "Ajouter"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isTransportDialogOpen}
        onOpenChange={(open) => {
          setIsTransportDialogOpen(open);
          if (!open && openElementDialogAfterTransportSave) {
            setIsElementDialogOpen(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingTransportId ? "Modifier le transport" : "Ajouter un transport"}</DialogTitle>
            <DialogDescription>Ce segment pourra ensuite etre reutilise dans les jours du planning.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmitTransport}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ordre etape</label>
                <Input type="number" min="1" value={transportForm.ordreEtape} onChange={(event) => updateTransportForm("ordreEtape", event.target.value)} />
              </div>
              <div className="space-y-2 xl:col-span-3">
                <label className="text-sm font-medium">Type de transport</label>
                <Select value={transportForm.idTypeTransport} onValueChange={(value) => {
                  if (value === "__add_new__") {
                    setShowTypeTransportCreator(true);
                    return;
                  }
                  updateTransportForm("idTypeTransport", value);
                }}>
                  <SelectTrigger><SelectValue placeholder="Choisir un type" /></SelectTrigger>
                  <SelectContent>
                    {typeTransports.map((type) => <SelectItem key={type.id} value={type.id}>{type.nom}</SelectItem>)}
                    <SelectItem value="__add_new__">Ajouter un nouveau type</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showTypeTransportCreator ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom du nouveau type</label>
                    <Input value={newTypeTransportName} onChange={(event) => setNewTypeTransportName(event.target.value)} placeholder="Ex: Pirogue" />
                  </div>
                  <Button type="button" variant="outline" onClick={() => { setShowTypeTransportCreator(false); setNewTypeTransportName(""); }}>Annuler</Button>
                  <Button type="button" onClick={() => void handleCreateTypeTransport()}>Ajouter type</Button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Depart</label>
                <Input value={transportForm.depart} onChange={(event) => updateTransportForm("depart", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Arrivee</label>
                <Input value={transportForm.arrivee} onChange={(event) => updateTransportForm("arrivee", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Longitude depart</label>
                <div className="flex gap-2">
                  <Input type="number" step="any" value={transportForm.longitudeDepart} onChange={(event) => updateTransportForm("longitudeDepart", event.target.value)} />
                  <Button type="button" variant="outline" onClick={() => openCoordinatePicker("depart")}>Carte</Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Latitude depart</label>
                <Input type="number" step="any" value={transportForm.latitudeDepart} onChange={(event) => updateTransportForm("latitudeDepart", event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Longitude arrivee</label>
                <div className="flex gap-2">
                  <Input type="number" step="any" value={transportForm.longitudeArrivee} onChange={(event) => updateTransportForm("longitudeArrivee", event.target.value)} />
                  <Button type="button" variant="outline" onClick={() => openCoordinatePicker("arrivee")}>Carte</Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Latitude arrivee</label>
                <Input type="number" step="any" value={transportForm.latitudeArrivee} onChange={(event) => updateTransportForm("latitudeArrivee", event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duree</label>
                <Input value={transportForm.duree} onChange={(event) => updateTransportForm("duree", event.target.value)} placeholder="Ex: 5h 30" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Distance (km)</label>
                <Input type="number" min="0" step="0.01" value={transportForm.distanceKm} onChange={(event) => updateTransportForm("distanceKm", event.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsTransportDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isSavingTransport}>{isSavingTransport ? "Enregistrement..." : editingTransportId ? "Enregistrer" : "Ajouter"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isJourDialogOpen} onOpenChange={setIsJourDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingJourId ? "Modifier le jour" : "Ajouter un jour"}</DialogTitle>
            <DialogDescription>Ce jour servira de colonne dans le planning admin.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmitJour}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Numero du jour</label>
                <Input type="number" min="1" value={jourForm.numeroJour} onChange={(event) => updateJourForm("numeroJour", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={jourForm.dateJour} onChange={(event) => updateJourForm("dateJour", event.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Titre</label>
                <Input value={jourForm.titre} onChange={(event) => updateJourForm("titre", event.target.value)} placeholder="Ex: Arrivee et installation" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <textarea value={jourForm.description} onChange={(event) => updateJourForm("description", event.target.value)} className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" placeholder="Ce qui est prevu pour cette journee" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsJourDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isSavingJour}>{isSavingJour ? "Enregistrement..." : editingJourId ? "Enregistrer" : "Ajouter"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isElementDialogOpen} onOpenChange={setIsElementDialogOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingElementId ? "Modifier le bloc du jour" : "Ajouter un bloc au jour"}</DialogTitle>
            <DialogDescription>Trajet, activite, hebergement, repas ou note libre pour structurer la journee.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmitElement}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Type de bloc</label>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <Select value={elementForm.idTypeElementJour} onValueChange={(value) => updateElementForm("idTypeElementJour", value)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Choisir un type de bloc" /></SelectTrigger>
                    <SelectContent>{visibleTypeElementJours.map((type) => <SelectItem key={type.id} value={type.id}>{type.nom}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="justify-center sm:justify-start"
                    onClick={() => {
                      setShowExtraElementTypes(true);
                      setShowTypeElementCreator((current) => !current);
                    }}
                  >
                    <Plus className="size-4" />
                    Autre type
                  </Button>
                </div>
                {showTypeElementCreator ? (
                  <div className="mt-3 grid gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-emerald-900">Nouveau type</label>
                      <Input
                        value={newTypeElementName}
                        onChange={(event) => setNewTypeElementName(event.target.value)}
                        placeholder="Ex: Visite guidee"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowTypeElementCreator(false);
                          setNewTypeElementName("");
                        }}
                      >
                        Annuler
                      </Button>
                      <Button type="button" onClick={() => void handleCreateTypeElementJour()} disabled={isCreatingTypeElement}>
                        {isCreatingTypeElement ? "Ajout..." : "Ajouter"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Titre</label>
                <Input value={elementForm.titre} onChange={(event) => updateElementForm("titre", event.target.value)} placeholder="Ex: Visite du village" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <textarea value={elementForm.description} onChange={(event) => updateElementForm("description", event.target.value)} className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" placeholder="Details de ce bloc" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Heure debut</label>
                <Input type="datetime-local" value={elementForm.heureDebut} onChange={(event) => updateElementForm("heureDebut", event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Heure fin</label>
                <Input type="datetime-local" value={elementForm.heureFin} onChange={(event) => updateElementForm("heureFin", event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Budget prevu</label>
                <Input type="number" min="0" step="0.01" value={elementForm.budgetPrevu} onChange={(event) => updateElementForm("budgetPrevu", event.target.value)} />
                {(selectedTypeElementJour?.code === "ACTIVITE" || selectedTypeElementJour?.code === "HEBERGEMENT") ? (
                  <div className="space-y-2 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 p-3">
                    <p className="text-xs font-medium text-emerald-900">Tarifs disponibles</p>
                    {budgetSuggestions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {budgetSuggestions.map((suggestion) => (
                          <Button
                            key={suggestion.id}
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100"
                            onClick={() => applySuggestedBudget(suggestion)}
                          >
                            {suggestion.label}: {suggestion.montant} {suggestion.devise}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Aucun tarif actif disponible pour cet element lie.</p>
                    )}
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Devise</label>
                <Input value={elementForm.devise} onChange={(event) => updateElementForm("devise", event.target.value)} />
              </div>
              <div className="flex items-center gap-3 pt-7">
                <input id="element-actif" type="checkbox" checked={elementForm.estActif} onChange={(event) => updateElementForm("estActif", event.target.checked)} className="size-4 rounded border-input" />
                <label htmlFor="element-actif" className="text-sm font-medium">Bloc actif</label>
              </div>
            </div>

            {selectedTypeElementJour?.code === "TRANSPORT" || selectedTypeElementJour?.code === "TRANSPORT_PRE_REMPLI" ? (
              <div className="space-y-3">
                <label className="text-sm font-medium">Transport lie</label>
                <Select value={elementForm.idTransport || "none"} onValueChange={(value) => updateElementForm("idTransport", value === "none" ? "" : value)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Choisir un transport" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun transport</SelectItem>
                    {selectedPlanification?.transports.map((transport) => (
                      <SelectItem key={transport.id} value={transport.id}>
                        {transport.depart} {"->"} {transport.arrivee} ({transport.nomTypeTransport})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end">
                  <Button type="button" size="sm" onClick={openCreateTransportFromElementDialog}>
                    <Plus className="size-4" />
                    Ajouter segment transport
                  </Button>
                </div>
                <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-border/50 p-3">
                  {selectedPlanification?.transports.length ? (
                    selectedPlanification.transports.map((transport) => {
                      const selected = elementForm.idTransport === transport.id;
                      return (
                        <div key={transport.id} className={`rounded-lg border p-3 ${selected ? "border-emerald-300 bg-emerald-50/60" : "border-border/50"}`}>
                          <button type="button" className="w-full text-left" onClick={() => updateElementForm("idTransport", transport.id)}>
                            <p className="text-sm font-medium">{transport.depart} {"->"} {transport.arrivee}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{transport.nomTypeTransport} • Distance: {transport.distanceKm ?? "-"} km</p>
                          </button>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => void handleCalculateTransportRoute(transport)} disabled={isCalculatingTransportId === transport.id}>
                              {isCalculatingTransportId === transport.id ? "Calcul..." : "Calculer trajet"}
                            </Button>
                            <Button type="button" size="sm" variant="secondary" onClick={() => openEditTransportFromElementDialog(transport)}>
                              <Pencil className="size-4" />
                              Modifier
                            </Button>
                            <Button type="button" size="sm" variant="destructive" onClick={() => void handleDeleteTransport(transport.id)} disabled={isDeletingId === transport.id}>
                              <Trash2 className="size-4" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground">Aucun segment transport pour cette planification.</p>
                  )}
                </div>
              </div>
            ) : null}

            {selectedTypeElementJour?.code === "ACTIVITE" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Activite liee</label>
                <Select value={elementForm.idActivite || "none"} onValueChange={handleActiviteSelection}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Choisir une activite" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune activite</SelectItem>
                    {linkedActivites.map((activite) => <SelectItem key={activite.id} value={activite.id}>{activite.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {selectedTypeElementJour?.code === "HEBERGEMENT" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Hebergement lie</label>
                <Select value={elementForm.idHebergement || "none"} onValueChange={handleHebergementSelection}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Choisir un hebergement" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun hebergement</SelectItem>
                    {linkedHebergements.map((hebergement) => <SelectItem key={hebergement.id} value={hebergement.id}>{hebergement.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsElementDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isSavingElement}>{isSavingElement ? "Enregistrement..." : editingElementId ? "Enregistrer" : "Ajouter"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCoordinatePickerOpen} onOpenChange={setIsCoordinatePickerOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Choisir des coordonnees sur la carte</DialogTitle>
            <DialogDescription>Clique sur la carte pour definir les coordonnees {coordinateTarget === "depart" ? "de depart" : "d'arrivee"}.</DialogDescription>
          </DialogHeader>
          <HebergementMap
            latitude={
              coordinateTarget === "depart"
                ? Number(transportForm.latitudeDepart || -18.8792)
                : Number(transportForm.latitudeArrivee || -18.8792)
            }
            longitude={
              coordinateTarget === "depart"
                ? Number(transportForm.longitudeDepart || 47.5079)
                : Number(transportForm.longitudeArrivee || 47.5079)
            }
            onChange={(coords: { latitude: number; longitude: number }) => {
              handleCoordinatePicked(coords);
              setIsCoordinatePickerOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <AdminFooter />
    </div>
  );
}
