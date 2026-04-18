"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Pencil, Plus, Trash2, X } from "lucide-react";

import { AdminFooter } from "@/app/admin/components/footer";
import { AdminHeader } from "@/app/admin/components/header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { PlanificationsList } from "./components/planifications-list";
import { SectionBudget } from "./components/section-budget";
import { SectionCarte } from "./components/section-carte";
import { SectionPlanning } from "./components/section-planning";
import { SectionReservation } from "./components/section-reservation";
import { SectionResume } from "./components/section-resume";
import { VoyageSectionsNav } from "./components/voyage-sections-nav";
import { getSectionDescription, PlanningSection } from "./planning-sections.config";
import { BudgetFormModal } from "./components/budget-form-modal";
import { listCategorieClientActivites } from "@/lib/api/activites";
import { BudgetisationPlanificationVoyage, SaveBudgetisationPlanificationVoyagePayload } from "@/lib/type/budgetisation-planification";
import { createBudgetisationPlanification, deleteBudgetisationPlanification , updateBudgetisationPlanification  , listBudgetisationsByPlanification } from "@/lib/api/budgetisation-planification";



const HebergementMap = dynamic(
  () => import("@/components/hebergement-map").then((mod) => mod.HebergementMap),
  { ssr: false }
);
const TransportEndpointsMap = dynamic(
  () => import("@/components/transport-endpoints-map").then((mod) => mod.TransportEndpointsMap),
  { ssr: false }
);

type Props = { destinationId: string };

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
  budgetPrevu: string;
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
  estObligatoire: boolean;
  idTypeElementJour: string;
  idTransport: string;
  idActivite: string;
  idHebergement: string;
};

type PlanningDetailTarget =
  | { kind: "jour"; jour: JourPlanificationVoyage }
  | { kind: "element"; jour: JourPlanificationVoyage; element: ElementJourPlanification };

type BudgetSuggestion = {
  id: string;
  label: string;
  montant: number;
  devise: string;
};

type BudgetFormData = {
  planificationId: string;
  idCategorieClient: string;
  gamme: string;
  prixNormal: number;
  reduction: number;
  nombrePersonnes: number;
};

type LinkedDetailTarget =
  | {
      kind: "activite";
      title: string;
      image: string | null;
      description: string | null;
      place: string | null;
      region: string | null;
      prices: Array<{ id: string; label: string; montant: number; devise: string }>;
    }
  | {
      kind: "hebergement";
      title: string;
      image: string | null;
      description: string | null;
      place: string | null;
      region: string | null;
      prices: Array<{ id: string; label: string; montant: number; devise: string }>;
    }
  | {
      kind: "transport";
      title: string;
      image: null;
      description: string | null;
      depart: string;
      arrivee: string;
      duree: string | null;
      distanceKm: number | null;
      budgetPrevu: number | null;
      typeTransport: string | null;
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
  budgetPrevu: "",
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
  estObligatoire: false,
  idTypeElementJour: "",
  idTransport: "",
  idActivite: "",
  idHebergement: "",
};



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

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  const direct = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) return direct;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return { year, month, day };
}

function formatDateInput(year: number, month: number, day: number) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDaysToDateInput(baseDate: string, daysToAdd: number) {
  const parsed = parseDateInput(baseDate);
  if (!parsed) return "";
  const utcDate = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  utcDate.setUTCDate(utcDate.getUTCDate() + daysToAdd);
  return formatDateInput(utcDate.getUTCFullYear(), utcDate.getUTCMonth() + 1, utcDate.getUTCDate());
}

function diffDaysBetweenDateInputs(startDate: string, endDate: string) {
  const start = parseDateInput(startDate);
  const end = parseDateInput(endDate);
  if (!start || !end) return null;
  const startUtc = Date.UTC(start.year, start.month - 1, start.day);
  const endUtc = Date.UTC(end.year, end.month - 1, end.day);
  return Math.floor((endUtc - startUtc) / 86400000);
}

function clampDateInput(dateValue: string, minDate?: string, maxDate?: string) {
  if (!dateValue) return "";
  if (minDate && dateValue < minDate) return minDate;
  if (maxDate && dateValue > maxDate) return maxDate;
  return dateValue;
}

function parseNullableNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
    budgetPrevu: transport.budgetPrevu !== null && transport.budgetPrevu !== undefined ? String(transport.budgetPrevu) : "",
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
    estObligatoire: element.estObligatoire,
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
  // Dans les states (vers ligne 200-250)
  const [budgetsPlanification, setBudgetsPlanification] = useState<BudgetisationPlanificationVoyage[]>([]);
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
  const [openActionMenuKey, setOpenActionMenuKey] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<PlanningDetailTarget | null>(null);
  const [isLinkedDetailDialogOpen, setIsLinkedDetailDialogOpen] = useState(false);
  const [linkedDetailTarget, setLinkedDetailTarget] = useState<LinkedDetailTarget | null>(null);
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
  const [categoriesClient, setCategoriesClient] = useState<Array<{ id: string; nom: string }>>([]);

  
const [showBudgetModal, setShowBudgetModal] = useState(false);
const [editingBudget, setEditingBudget] = useState<any>(null);

  const selectedPlanification = useMemo(() => planifications.find((item) => item.id === selectedPlanificationId) ?? null, [planifications, selectedPlanificationId]);
  const availableJourDateRange = useMemo(() => {
    const minDate = toDateInputValue(selectedPlanification?.dateHeureDebut ?? null);
    const maxDate = toDateInputValue(selectedPlanification?.dateHeureFin ?? null);

    if (minDate && maxDate && minDate > maxDate) {
      return { minDate: maxDate, maxDate: minDate };
    }

    return { minDate, maxDate };
  }, [selectedPlanification?.dateHeureDebut, selectedPlanification?.dateHeureFin]);
  const planificationStartDate = availableJourDateRange.minDate || "";
  const maxJourNumber = useMemo(() => {
    if (!availableJourDateRange.minDate || !availableJourDateRange.maxDate) return null;
    const diff = diffDaysBetweenDateInputs(availableJourDateRange.minDate, availableJourDateRange.maxDate);
    if (diff === null) return null;
    return Math.max(1, diff + 1);
  }, [availableJourDateRange.minDate, availableJourDateRange.maxDate]);
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



  // // Fonction pour sauvegarder un budget
  // const handleSaveBudget = async (budgetData: any) => {
  //   try {
  //     if (editingBudget) {
  //       // Appel API pour modifier
  //       // await updateBudget(editingBudget.id, budgetData, accessToken);
  //       setSuccessMessage("Budget modifié avec succès.");
  //     } else {
  //       // Appel API pour créer
  //       // await createBudget(budgetData, accessToken);
  //       setSuccessMessage("Budget ajouté avec succès.");
  //     }
  //     setShowBudgetModal(false);
  //     setEditingBudget(null);
  //     await refreshPlanifications(); // Rafraîchir les données
  //   } catch (err) {
  //     setError(getErrorMessage(err, "Impossible d'enregistrer le budget"));
  //   }
  // };

  async function handleSaveBudget(budgetData: BudgetFormData) {
    try {
      const payload: SaveBudgetisationPlanificationVoyagePayload = {
        idPlanificationVoyage: budgetData.planificationId,
        idCategorieClient: budgetData.idCategorieClient,
        gamme: budgetData.gamme,
        prixNormal: budgetData.prixNormal,
        reduction: budgetData.reduction || 0,
        nombrePersonnes: budgetData.nombrePersonnes,
      };

      if (editingBudget) {
        // ✅ Modification - utilise l'ID du budget existant
        await updateBudgetisationPlanification(editingBudget.id, payload, accessToken);
        setSuccessMessage("Budget modifié avec succès.");
      } else {
        // ✅ Création
        await createBudgetisationPlanification(payload, accessToken);
        setSuccessMessage("Budget ajouté avec succès.");
      }
      setShowBudgetModal(false);
      setEditingBudget(null);
      await refreshPlanifications();
      // Rafraîchir les budgets
      await loadBudgetsForPlanification(selectedPlanificationId);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible d'enregistrer le budget"));
    }
  }

  async function handleDeleteBudget(budgetId: string) {
    if (!window.confirm("Voulez-vous vraiment supprimer ce budget ?")) return;
    try {
      await deleteBudgetisationPlanification(budgetId, accessToken);
      setSuccessMessage("Budget supprimé avec succès.");
      await refreshPlanifications();
      // Rafraîchir les budgets après suppression
      await loadBudgetsForPlanification(selectedPlanificationId);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de supprimer le budget"));
    }
  }

  // Utilise des noms différents pour éviter les conflits
  function handleOpenAddBudgetModal() {
    setEditingBudget(null);
    setShowBudgetModal(true);
  }

  function handleOpenEditBudgetModal(budget: BudgetisationPlanificationVoyage) {
    setEditingBudget(budget);
    setShowBudgetModal(true);
  }




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
            label: `${tarif.nomCategorieClient || "Tarif"} (${unite})`,
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

  useEffect(() => {
  console.log("Planification changed:", selectedPlanificationId); // ← AJOUTE CE LOG
  if (selectedPlanificationId && accessToken) {
    loadBudgetsForPlanification(selectedPlanificationId);
  }
}, [selectedPlanificationId, accessToken]);

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
      const categoriesResponse = await listCategorieClientActivites(accessToken);
      const nextPlanifications = response.data ?? [];
      setPlanifications(nextPlanifications);
      setCategoriesClient(categoriesResponse.data ?? []);
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

  function updateJourForm(key: keyof JourFormState, value: string) {
    setJourForm((current) => {
      if (key === "numeroJour") {
        const digits = value.replace(/[^\d]/g, "");
        if (!digits) {
          return { ...current, numeroJour: "", dateJour: "" };
        }

        let numero = Math.max(1, Number(digits));
        if (maxJourNumber) {
          numero = Math.min(numero, maxJourNumber);
        }

        let nextDate = current.dateJour;
        if (planificationStartDate) {
          nextDate = addDaysToDateInput(planificationStartDate, numero - 1);
          nextDate = clampDateInput(nextDate, availableJourDateRange.minDate, availableJourDateRange.maxDate);
        } else if (nextDate) {
          nextDate = clampDateInput(nextDate, availableJourDateRange.minDate, availableJourDateRange.maxDate);
        }

        return { ...current, numeroJour: String(numero), dateJour: nextDate };
      }

      if (key === "dateJour") {
        const clampedDate = clampDateInput(value, availableJourDateRange.minDate, availableJourDateRange.maxDate);
        let nextNumero = current.numeroJour;

        if (clampedDate && planificationStartDate) {
          const diff = diffDaysBetweenDateInputs(planificationStartDate, clampedDate);
          if (diff !== null) {
            let numero = Math.max(1, diff + 1);
            if (maxJourNumber) {
              numero = Math.min(numero, maxJourNumber);
            }
            nextNumero = String(numero);
          }
        }

        return { ...current, dateJour: clampedDate, numeroJour: nextNumero };
      }

      return { ...current, [key]: value };
    });
  }

  function updateElementForm<K extends keyof ElementFormState>(key: K, value: ElementFormState[K]) {
    setElementForm((current) => ({ ...current, [key]: value }));
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
    setElementForm((current) => ({
      ...current,
      budgetPrevu: String(first.prixParPersonne ?? first.prixParHeur ?? 0),
      devise: first.devise || current.devise || "MGA",
    }));
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
    setElementForm((current) => ({
      ...current,
      budgetPrevu: String(first.prixParNuit ?? first.prixReservation ?? 0),
      devise: first.devise || current.devise || "MGA",
    }));
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
    const nextNumeroRaw = (selectedPlanification.jours?.length ?? 0) + 1;
    const nextNumero = maxJourNumber ? Math.min(nextNumeroRaw, maxJourNumber) : nextNumeroRaw;
    const nextDate = planificationStartDate ? addDaysToDateInput(planificationStartDate, nextNumero - 1) : "";
    setJourForm({ ...initialJourForm, numeroJour: String(nextNumero), dateJour: clampDateInput(nextDate, availableJourDateRange.minDate, availableJourDateRange.maxDate) });
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

  function openJourDetailsDialog(jour: JourPlanificationVoyage) {
    setDetailTarget({ kind: "jour", jour });
    setIsDetailDialogOpen(true);
  }

  function openElementDetailsDialog(jour: JourPlanificationVoyage, element: ElementJourPlanification) {
    setDetailTarget({ kind: "element", jour, element });
    setIsDetailDialogOpen(true);
  }

  function openLinkedDetailsDialog(element: ElementJourPlanification) {
    if (element.idActivite) {
      const activite = linkedActivites.find((item) => item.id === element.idActivite);
      const prices = tarifsActivites
        .filter((tarif) => tarif.idActivite === element.idActivite && tarif.estActif)
        .map((tarif) => {
          const montant = tarif.prixParPersonne ?? tarif.prixParHeur;
          if (montant === null || montant === undefined) return null;
          const unite = tarif.prixParPersonne !== null && tarif.prixParPersonne !== undefined ? "par personne" : "par heure";
          return {
            id: tarif.id,
            label: `${tarif.nomCategorieClient || "Tarif"} (${unite})`,
            montant,
            devise: tarif.devise || "MGA",
          };
        })
        .filter((item): item is { id: string; label: string; montant: number; devise: string } => item !== null);

      setLinkedDetailTarget({
        kind: "activite",
        title: activite?.nom || element.nomActivite || "Activite",
        image: activite?.image ?? null,
        description: element.description || null,
        place: activite?.place ?? null,
        region: activite?.region ?? null,
        prices,
      });
      setIsLinkedDetailDialogOpen(true);
      return;
    }

    if (element.idHebergement) {
      const hebergement = linkedHebergements.find((item) => item.id === element.idHebergement);
      const prices = tarifsHebergements
        .filter((tarif) => tarif.idHebergement === element.idHebergement && tarif.estActif)
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
        .filter((item): item is { id: string; label: string; montant: number; devise: string } => item !== null);

      setLinkedDetailTarget({
        kind: "hebergement",
        title: hebergement?.nom || element.nomHebergement || "Hebergement",
        image: hebergement?.image ?? null,
        description: element.description || null,
        place: hebergement?.place ?? null,
        region: hebergement?.region ?? null,
        prices,
      });
      setIsLinkedDetailDialogOpen(true);
      return;
    }

    if (element.idTransport) {
      const transport = selectedPlanification?.transports.find((item) => item.id === element.idTransport);
      if (!transport) return;
      setLinkedDetailTarget({
        kind: "transport",
        title: element.nomTransport || `${transport.depart} -> ${transport.arrivee}`,
        image: null,
        description: element.description || null,
        depart: transport.depart,
        arrivee: transport.arrivee,
        duree: transport.duree || null,
        distanceKm: transport.distanceKm ?? null,
        budgetPrevu: transport.budgetPrevu ?? null,
        typeTransport: transport.nomTypeTransport || null,
      });
      setIsLinkedDetailDialogOpen(true);
    }
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
      budgetPrevu: transportForm.budgetPrevu ? Number(transportForm.budgetPrevu) : null,
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
      estObligatoire: elementForm.estObligatoire,
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
      estObligatoire: element.estObligatoire,
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

      if (payload.dateJour) {
        if (availableJourDateRange.minDate && payload.dateJour < availableJourDateRange.minDate) {
          setError(`La date du jour doit etre comprise entre ${availableJourDateRange.minDate} et ${availableJourDateRange.maxDate || "la fin de planification"}.`);
          return;
        }
        if (availableJourDateRange.maxDate && payload.dateJour > availableJourDateRange.maxDate) {
          setError(`La date du jour doit etre comprise entre ${availableJourDateRange.minDate || "le debut de planification"} et ${availableJourDateRange.maxDate}.`);
          return;
        }
      }

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

  async function handleToggleElementObligatoire(element: ElementJourPlanification) {
    setIsSavingElement(true);
    setError("");
    setSuccessMessage("");
    try {
      await updateElementJourPlanification(
        element.id,
        {
          ...buildExistingElementPayload(element, element.ordreAffichage ?? 0),
          estObligatoire: !element.estObligatoire,
        },
        accessToken
      );
      setSuccessMessage("Statut obligatoire du bloc mis a jour avec succes.");
      await refreshPlanifications();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible de modifier le statut obligatoire du bloc"));
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

  async function loadBudgetsForPlanification(planificationId: string) {
    if (!planificationId) return;
    try {
      const response = await listBudgetisationsByPlanification(planificationId, accessToken);
      console.log("Budgets chargés:", response.data); // ← AJOUTE CE LOG
      setBudgetsPlanification(response.data ?? []);
    } catch (err) {
      console.error("Erreur chargement budgets:", err);
      setBudgetsPlanification([]);
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

          <PlanificationsList
            isLoading={isLoading}
            isRefreshingPlanifications={isRefreshingPlanifications}
            planifications={planifications}
            selectedPlanificationId={selectedPlanificationId}
            isDeletingId={isDeletingId}
            onSelect={(planification) => {
              setSelectedPlanificationId(planification.id);
              setSelectedTransportId(planification.transports[0]?.id ?? null);
            }}
            onEdit={openEditPlanificationDialog}
            onDelete={(planificationId) => void handleDeletePlanification(planificationId)}
          />

          <Card className="border-border/50">
            <VoyageSectionsNav
              selectedSection={selectedSection}
              description={getSectionDescription(selectedSection)}
              onSelectSection={setSelectedSection}
            />
            <CardContent className="space-y-6">
              {!selectedPlanification ? (
                <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-14 text-center text-sm text-muted-foreground">
                  Selectionne une planification en haut pour commencer a construire le planning.
                </div>
              ) : selectedSection === "planning" ? (
                <SectionPlanning
                  selectedPlanification={selectedPlanification}
                  sortedDays={sortedDays}
                  openActionMenuKey={openActionMenuKey}
                  setOpenActionMenuKey={setOpenActionMenuKey}
                  isDeletingId={isDeletingId}
                  onAddJour={openCreateJourDialog}
                  onEditJour={openEditJourDialog}
                  onDeleteJour={(jourId) => void handleDeleteJour(jourId)}
                  onJourDetails={openJourDetailsDialog}
                  onAddElement={(jour, index) => openCreateElementDialog(jour, index)}
                  onEditElement={openEditElementDialog}
                  onDeleteElement={(elementId) => void handleDeleteElement(elementId)}
                  onElementDetails={openElementDetailsDialog}
                  onOpenLinkedDetails={openLinkedDetailsDialog}
                  onToggleElementObligatoire={(element) => void handleToggleElementObligatoire(element)}
                  formatDate={formatDate}
                  formatDateTime={formatDateTime}
                  getElementDisplayTitle={getElementDisplayTitle}
                  getLinkedLabel={getLinkedLabel}
                />
              ) : selectedSection === "resume" ? (
                <SectionResume planification={selectedPlanification} />
              ) : selectedSection === "carte" ? (
                <SectionCarte
                  planification={selectedPlanification}
                  activites={linkedActivites}
                  hebergements={linkedHebergements}
                  onEditDay={openEditJourDialog}
                  onDeleteDay={(dayId) => void handleDeleteJour(dayId)}
                  onAddElement={(day, insertIndex) => openCreateElementDialog(day, insertIndex)}
                  onEditElement={openEditElementDialog}
                  onDeleteElement={(elementId) => void handleDeleteElement(elementId)}
                />
              ) : selectedSection === "budget" ? (

                  // <SectionBudget
                  //   planification={selectedPlanification}
                  //   sortedDays={sortedDays}
                  //   tarifsActivites={tarifsActivites}
                  //   tarifsHebergements={tarifsHebergements}
                  //   budgetsPlanification={budgetsPlanification}
                  //   isAdmin={true}
                  //   onAddBudget={handleAddBudget}
                  //   onEditBudget={handleEditBudget}
                  //   onDeleteBudget={handleDeleteBudget}
                  // />

                  <SectionBudget
                    planification={selectedPlanification}
                    sortedDays={sortedDays}
                    tarifsActivites={tarifsActivites}
                    tarifsHebergements={tarifsHebergements}
                    budgetsPlanification={budgetsPlanification}
                    isAdmin={true}
                    onAddBudget={handleOpenAddBudgetModal}      // ← Nom modifié
                    onEditBudget={handleOpenEditBudgetModal}    // ← Nom modifié
                    onDeleteBudget={handleDeleteBudget}
                  />

              ) : (
                <SectionReservation planification={selectedPlanification} />
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
              <div className="space-y-2 xl:col-span-1">
                <label className="text-sm font-medium">Type de transport</label>
                <div className="inline-flex w-fit items-center gap-1">
                  <div className="w-56">
                    <Select
                      value={transportForm.idTypeTransport}
                      onValueChange={(value) => updateTransportForm("idTypeTransport", value)}
                      >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choisir un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {typeTransports.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="ml-0 shrink-0"
                    aria-label="Ajouter un type de transport"
                    onClick={() => setShowTypeTransportCreator((current) => !current)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
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

            

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
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
                  <label className="text-sm font-medium">Coordonnees depart</label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">Longitude</p>
                        <Input
                          type="number"
                          step="any"
                          className="h-9 text-sm"
                          value={transportForm.longitudeDepart}
                          onChange={(event) => updateTransportForm("longitudeDepart", event.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">Latitude</p>
                        <Input
                          type="number"
                          step="any"
                          className="h-9 text-sm"
                          value={transportForm.latitudeDepart}
                          onChange={(event) => updateTransportForm("latitudeDepart", event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-end">
                        <Button type="button" size="sm" variant="outline" onClick={() => openCoordinatePicker("depart")}>Carte</Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Coordonnees arrivee</label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">Longitude</p>
                        <Input
                          type="number"
                          step="any"
                          className="h-9 text-sm"
                          value={transportForm.longitudeArrivee}
                          onChange={(event) => updateTransportForm("longitudeArrivee", event.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">Latitude</p>
                        <Input
                          type="number"
                          step="any"
                          className="h-9 text-sm"
                          value={transportForm.latitudeArrivee}
                          onChange={(event) => updateTransportForm("latitudeArrivee", event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-end">
                        <Button type="button" size="sm" variant="outline" onClick={() => openCoordinatePicker("arrivee")}>Carte</Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Duree</label>
                  <Input value={transportForm.duree} onChange={(event) => updateTransportForm("duree", event.target.value)} placeholder="Ex: 5h 30" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Distance (km)</label>
                  <Input type="number" min="0" step="0.01" value={transportForm.distanceKm} onChange={(event) => updateTransportForm("distanceKm", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget transport</label>
                  <Input type="number" min="0" step="0.01" value={transportForm.budgetPrevu} onChange={(event) => updateTransportForm("budgetPrevu", event.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Carte du trajet (apercu)</p>
                <p className="text-xs text-muted-foreground">La carte zoome automatiquement entre depart et arrivee.</p>
                <TransportEndpointsMap
                  latitudeDepart={parseNullableNumber(transportForm.latitudeDepart)}
                  longitudeDepart={parseNullableNumber(transportForm.longitudeDepart)}
                  latitudeArrivee={parseNullableNumber(transportForm.latitudeArrivee)}
                  longitudeArrivee={parseNullableNumber(transportForm.longitudeArrivee)}
                />
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
                <Input
                  type="number"
                  min="1"
                  max={maxJourNumber ?? undefined}
                  step="1"
                  value={jourForm.numeroJour}
                  onChange={(event) => updateJourForm("numeroJour", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={jourForm.dateJour}
                  min={availableJourDateRange.minDate || undefined}
                  max={availableJourDateRange.maxDate || undefined}
                  inputMode="none"
                  onClick={(event) => {
                    const input = event.currentTarget as HTMLInputElement & { showPicker?: () => void };
                    input.showPicker?.();
                  }}
                  onKeyDown={(event) => {
                    event.preventDefault();
                  }}
                  onPaste={(event) => {
                    event.preventDefault();
                  }}
                  onChange={(event) => updateJourForm("dateJour", event.target.value)}
                />
                {availableJourDateRange.minDate || availableJourDateRange.maxDate ? (
                  <p className="text-xs text-muted-foreground">
                    Dates disponibles: {availableJourDateRange.minDate || "..."} au {availableJourDateRange.maxDate || "..."}
                  </p>
                ) : null}
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
                  <Select
                    value={elementForm.idTypeElementJour}
                    onValueChange={(value) => updateElementForm("idTypeElementJour", value)}
                  >
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
              {(selectedTypeElementJour?.code === "ACTIVITE" || selectedTypeElementJour?.code === "HEBERGEMENT") ? (
                <div className="space-y-2 sm:col-span-2">
                  <div className="space-y-2 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 p-3">
                    <p className="text-xs font-medium text-emerald-900">Tarifs disponibles</p>
                    {budgetSuggestions.length > 0 ? (
                      <div className="space-y-1.5">
                        {budgetSuggestions.map((suggestion) => (
                          <p key={suggestion.id} className="text-xs text-emerald-900">
                            {suggestion.label}: <span className="font-medium">{suggestion.montant} {suggestion.devise}</span>
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Aucun tarif actif disponible pour cet element lie.</p>
                    )}
                  </div>
                </div>
              ) : null}
              {selectedTypeElementJour?.code !== "ACTIVITE" && selectedTypeElementJour?.code !== "HEBERGEMENT" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cout previsionnel</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={elementForm.budgetPrevu}
                    onChange={(event) => updateElementForm("budgetPrevu", event.target.value)}
                    placeholder="Budget manuel"
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <label className="text-sm font-medium">Devise</label>
                <Input value={elementForm.devise} onChange={(event) => updateElementForm("devise", event.target.value.toUpperCase())} placeholder="MGA" />
              </div>
              <div className="flex items-center gap-3 pt-7">
                <input id="element-actif" type="checkbox" checked={elementForm.estActif} onChange={(event) => updateElementForm("estActif", event.target.checked)} className="size-4 rounded border-input" />
                <label htmlFor="element-actif" className="text-sm font-medium">Bloc actif</label>
              </div>
              <div className="flex items-center gap-3 pt-7">
                <input id="element-obligatoire" type="checkbox" checked={elementForm.estObligatoire} onChange={(event) => updateElementForm("estObligatoire", event.target.checked)} className="size-4 rounded border-input" />
                <label htmlFor="element-obligatoire" className="text-sm font-medium">Bloc obligatoire</label>
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
                        {transport.depart} {"->"} {transport.arrivee} ({transport.nomTypeTransport}) - Budget: {transport.budgetPrevu ?? "-"} MGA
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
                            <p className="mt-1 text-xs text-muted-foreground">
                              {transport.nomTypeTransport}  -  Distance: {transport.distanceKm ?? "-"} km  -  Budget: {transport.budgetPrevu ?? "-"} MGA
                            </p>
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

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Détaille du bloc</DialogTitle>
            <DialogDescription>Informations de lecture du planning.</DialogDescription>
          </DialogHeader>
          {detailTarget?.kind === "jour" ? (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">Jour:</span> {detailTarget.jour.numeroJour ?? "-"}</p>
              <p><span className="font-medium">Date:</span> {formatDate(detailTarget.jour.dateJour)}</p>
              <p><span className="font-medium">Titre:</span> {detailTarget.jour.titre || "-"}</p>
              <p><span className="font-medium">Description:</span> {detailTarget.jour.description || "-"}</p>
              <p><span className="font-medium">Nombre de blocs:</span> {(detailTarget.jour.elements ?? []).length}</p>
            </div>
          ) : detailTarget?.kind === "element" ? (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">Jour:</span> {detailTarget.jour.numeroJour ?? "-"}</p>
              <p><span className="font-medium">Type:</span> {detailTarget.element.nomTypeElementJour || "-"}</p>
              <p><span className="font-medium">Titre:</span> {getElementDisplayTitle(detailTarget.element)}</p>
              <p><span className="font-medium">Description:</span> {detailTarget.element.description || "-"}</p>
              <p><span className="font-medium">Heure début:</span> {formatDateTime(detailTarget.element.heureDebut)}</p>
              <p><span className="font-medium">Heure fin:</span> {formatDateTime(detailTarget.element.heureFin)}</p>
              <p><span className="font-medium">Budget:</span> {detailTarget.element.budgetPrevu ?? "-"} {detailTarget.element.devise || "MGA"}</p>
              <p><span className="font-medium">Statut:</span> {detailTarget.element.estActif ? "Actif" : "Inactif"}</p>
              <p><span className="font-medium">Obligatoire:</span> {detailTarget.element.estObligatoire ? "Oui" : "Non"}</p>
              <p><span className="font-medium">Lien:</span> {getLinkedLabel(detailTarget.element) || "-"}</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isLinkedDetailDialogOpen} onOpenChange={setIsLinkedDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detaille de l&apos;element lie</DialogTitle>
            <DialogDescription>Informations utiles: image, description et prix.</DialogDescription>
          </DialogHeader>
          {linkedDetailTarget ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                  {linkedDetailTarget.image ? (
                    <img
                      src={linkedDetailTarget.image}
                      alt={linkedDetailTarget.title}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                      Aucune image
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-base font-semibold">{linkedDetailTarget.title}</p>
                  {"place" in linkedDetailTarget ? (
                    <p>
                      <span className="font-medium">Place/Adresse:</span> {linkedDetailTarget.place || "-"}
                    </p>
                  ) : null}
                  {"region" in linkedDetailTarget ? (
                    <p>
                      <span className="font-medium">Region:</span> {linkedDetailTarget.region || "-"}
                    </p>
                  ) : null}
                  {"typeTransport" in linkedDetailTarget ? (
                    <>
                      <p><span className="font-medium">Type:</span> {linkedDetailTarget.typeTransport || "-"}</p>
                      <p><span className="font-medium">Depart:</span> {linkedDetailTarget.depart}</p>
                      <p><span className="font-medium">Arrivee:</span> {linkedDetailTarget.arrivee}</p>
                      <p><span className="font-medium">Duree:</span> {linkedDetailTarget.duree || "-"}</p>
                      <p><span className="font-medium">Distance:</span> {linkedDetailTarget.distanceKm ?? "-"} km</p>
                      <p><span className="font-medium">Budget transport:</span> {linkedDetailTarget.budgetPrevu ?? "-"} MGA</p>
                    </>
                  ) : null}
                  <p>
                    <span className="font-medium">Description:</span>{" "}
                    {linkedDetailTarget.description || "Aucune description disponible."}
                  </p>
                </div>
              </div>

              {"prices" in linkedDetailTarget ? (
                <div className="rounded-xl border border-border/60 p-3">
                  <p className="mb-2 text-sm font-medium">Prix disponibles</p>
                  {linkedDetailTarget.prices.length > 0 ? (
                    <div className="space-y-1.5">
                      {linkedDetailTarget.prices.map((price) => (
                        <p key={price.id} className="text-sm text-muted-foreground">
                          {price.label}: <span className="font-medium text-foreground">{price.montant} {price.devise}</span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun prix actif disponible.</p>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
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

      {/* <BudgetFormModal
        open={showBudgetModal}
        onClose={() => {
          setShowBudgetModal(false);
          setEditingBudget(null);
        }}
        onSave={handleSaveBudget}
        planificationId={selectedPlanificationId}
        initialBudget={editingBudget}
      /> */}

      <BudgetFormModal
        open={showBudgetModal}
        onClose={() => {
          setShowBudgetModal(false);
          setEditingBudget(null);
        }}
        onSave={handleSaveBudget}
        planificationId={selectedPlanificationId}
        initialBudget={editingBudget}
        categoriesClient={categoriesClient}
      />

      <AdminFooter />
    </div>
  );
}
