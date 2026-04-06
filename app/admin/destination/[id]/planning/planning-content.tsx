"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, List, Map, Pencil, Plus, Trash2, X } from "lucide-react";

import { AdminFooter } from "@/app/admin/components/footer";
import { AdminHeader } from "@/app/admin/components/header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlanningVoyageCalendar } from "@/components/planning-voyage-calendar";
import {
  calculateTransportRoute,
  createPlanificationVoyage,
  createTransport,
  createTypeTransport,
  deletePlanificationVoyage,
  deleteTransport,
  getAdminDestination,
  listPlanificationsByDestination,
  listTypeTransports,
  updatePlanificationVoyage,
  updateTransport,
} from "@/lib/api/destinations";
import { getErrorMessage } from "@/lib/api/client";
import { loadAuth } from "@/lib/auth";
import {
  AdminDestination,
  PlanificationVoyage,
  SavePlanificationVoyagePayload,
  SaveTransportPayload,
  Transport,
  TypeTransport,
} from "@/lib/type/destination";

const PlanningVoyageMap = dynamic(
  () => import("@/components/planning-voyage-map").then((mod) => mod.PlanningVoyageMap),
  { ssr: false }
);
const HebergementMap = dynamic(
  () => import("@/components/hebergement-map").then((mod) => mod.HebergementMap),
  { ssr: false }
);

type Props = { destinationId: string };
type PlanningDisplayMode = "list" | "map" | "calendar";

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
  geojsonTrajet: string;
  idTypeTransport: string;
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
  geojsonTrajet: "",
  idTypeTransport: "",
};

export function AdminDestinationPlanningContent({ destinationId }: Props) {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [role, setRole] = useState("");
  const [destination, setDestination] = useState<AdminDestination | null>(null);
  const [planifications, setPlanifications] = useState<PlanificationVoyage[]>([]);
  const [typeTransports, setTypeTransports] = useState<TypeTransport[]>([]);
  const [selectedPlanificationId, setSelectedPlanificationId] = useState<string>("");
  const [selectedTransportId, setSelectedTransportId] = useState<string | null>(null);
  const [editingPlanificationId, setEditingPlanificationId] = useState<string | null>(null);
  const [editingTransportId, setEditingTransportId] = useState<string | null>(null);
  const [newTypeTransportName, setNewTypeTransportName] = useState("");
  const [planificationForm, setPlanificationForm] = useState<PlanificationFormState>(initialPlanificationForm);
  const [transportForm, setTransportForm] = useState<TransportFormState>(initialTransportForm);
  const [isPlanificationDialogOpen, setIsPlanificationDialogOpen] = useState(false);
  const [isTransportDialogOpen, setIsTransportDialogOpen] = useState(false);
  const [isCoordinatePickerOpen, setIsCoordinatePickerOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<PlanningDisplayMode>("list");
  const [isLoading, setIsLoading] = useState(true);
  const [isPlanificationsLoading, setIsPlanificationsLoading] = useState(true);
  const [isSavingPlanification, setIsSavingPlanification] = useState(false);
  const [isSavingTransport, setIsSavingTransport] = useState(false);
  const [isDeletingPlanificationId, setIsDeletingPlanificationId] = useState<string | null>(null);
  const [isDeletingTransportId, setIsDeletingTransportId] = useState<string | null>(null);
  const [isCalculatingTransportId, setIsCalculatingTransportId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [coordinateTarget, setCoordinateTarget] = useState<"depart" | "arrivee">("depart");
  const [showTypeTransportCreator, setShowTypeTransportCreator] = useState(false);

  const selectedPlanification = useMemo(
    () => planifications.find((item) => item.id === selectedPlanificationId) ?? null,
    [planifications, selectedPlanificationId]
  );

  useEffect(() => {
    const session = loadAuth();
    if (!session?.accessToken) return void router.push("/login");
    if (session.role !== "ADMIN") return void router.push("/admin");
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
    setIsPlanificationsLoading(true);
    setError("");
    try {
      const [destinationResponse, typesResponse] = await Promise.all([
        getAdminDestination(destinationId, accessToken),
        listTypeTransports(accessToken),
      ]);
      setDestination(destinationResponse.data ?? null);
      setTypeTransports(typesResponse.data ?? []);
      await refreshPlanifications();
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Impossible de charger les planifications"));
    } finally {
      setIsLoading(false);
      setIsPlanificationsLoading(false);
    }
  }

  async function refreshPlanifications() {
    setIsPlanificationsLoading(true);
    try {
      const planificationsResponse = await listPlanificationsByDestination(destinationId, accessToken);
      const loadedPlanifications = planificationsResponse.data ?? [];
      setPlanifications(loadedPlanifications);
      setSelectedPlanificationId((current) => {
        if (loadedPlanifications.some((item) => item.id === current)) {
          return current;
        }
        return loadedPlanifications[0]?.id || "";
      });
      setSelectedTransportId((current) => {
        if (!current) return loadedPlanifications[0]?.transports[0]?.id ?? null;
        const exists = loadedPlanifications.some((planification) =>
          planification.transports.some((transport) => transport.id === current)
        );
        return exists ? current : loadedPlanifications[0]?.transports[0]?.id ?? null;
      });
    } finally {
      setIsPlanificationsLoading(false);
    }
  }

  function upsertPlanificationInState(planification: PlanificationVoyage) {
    setPlanifications((current) => {
      const next = current.some((item) => item.id === planification.id)
        ? current.map((item) => (item.id === planification.id ? planification : item))
        : [planification, ...current];
      return next;
    });
    setSelectedPlanificationId(planification.id);
    setSelectedTransportId(planification.transports[0]?.id ?? null);
  }

  function removePlanificationFromState(id: string) {
    setPlanifications((current) => {
      const next = current.filter((item) => item.id !== id);
      setSelectedPlanificationId((selected) => (selected === id ? next[0]?.id || "" : selected));
      return next;
    });
  }

  function upsertTransportInState(transport: Transport) {
    setPlanifications((current) =>
      current.map((planification) => {
        if (planification.id !== transport.idPlanificationVoyage) {
          return planification;
        }

        const nextTransports = planification.transports.some((item) => item.id === transport.id)
          ? planification.transports.map((item) => (item.id === transport.id ? transport : item))
          : [...planification.transports, transport];

        nextTransports.sort((a, b) => {
          const ordreA = a.ordreEtape ?? Number.MAX_SAFE_INTEGER;
          const ordreB = b.ordreEtape ?? Number.MAX_SAFE_INTEGER;
          return ordreA - ordreB;
        });

        return { ...planification, transports: nextTransports };
      })
    );
    setSelectedTransportId(transport.id);
  }

  function removeTransportFromState(id: string) {
    setPlanifications((current) =>
      current.map((planification) => ({
        ...planification,
        transports: planification.transports.filter((item) => item.id !== id),
      }))
    );
    setSelectedTransportId((current) => (current === id ? null : current));
  }

  function updatePlanificationForm<K extends keyof PlanificationFormState>(key: K, value: PlanificationFormState[K]) {
    setPlanificationForm((current) => ({ ...current, [key]: value }));
  }

  function updateTransportForm<K extends keyof TransportFormState>(key: K, value: TransportFormState[K]) {
    setTransportForm((current) => ({ ...current, [key]: value }));
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
      geojsonTrajet: transport.geojsonTrajet ?? "",
      idTypeTransport: transport.idTypeTransport ?? "",
    };
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
    setEditingTransportId(null);
    setTransportForm(initialTransportForm);
    setShowTypeTransportCreator(false);
    setNewTypeTransportName("");
    setIsTransportDialogOpen(true);
  }

  function openEditTransportDialog(transport: Transport) {
    setSelectedTransportId(transport.id);
    setEditingTransportId(transport.id);
    setTransportForm(mapTransportToForm(transport));
    setShowTypeTransportCreator(false);
    setNewTypeTransportName("");
    setIsTransportDialogOpen(true);
  }

  function openCoordinatePicker(target: "depart" | "arrivee") {
    setCoordinateTarget(target);
    setIsCoordinatePickerOpen(true);
  }

  function handleCoordinatePicked(coords: { latitude: number; longitude: number }) {
    if (coordinateTarget === "depart") {
      setTransportForm((current) => ({
        ...current,
        latitudeDepart: String(coords.latitude),
        longitudeDepart: String(coords.longitude),
      }));
      return;
    }

    setTransportForm((current) => ({
      ...current,
      latitudeArrivee: String(coords.latitude),
      longitudeArrivee: String(coords.longitude),
    }));
  }

  function buildPlanificationPayload(): SavePlanificationVoyagePayload {
    return {
      nomPlanification: planificationForm.nomPlanification.trim(),
      budgetTotal: planificationForm.budgetTotal ? Number(planificationForm.budgetTotal) : null,
      deviseBudget: planificationForm.deviseBudget.trim() || "MGA",
      dateHeureDebut: planificationForm.dateHeureDebut ? new Date(planificationForm.dateHeureDebut).toISOString().slice(0, 19) : "",
      depart: planificationForm.depart.trim(),
      dateHeureFin: planificationForm.dateHeureFin ? new Date(planificationForm.dateHeureFin).toISOString().slice(0, 19) : "",
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

  async function handleSubmitPlanification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingPlanification(true);
    setError("");
    setSuccessMessage("");
    try {
      const payload = buildPlanificationPayload();
      if (editingPlanificationId) {
        const response = await updatePlanificationVoyage(editingPlanificationId, payload, accessToken);
        if (response.data) {
          upsertPlanificationInState(response.data);
        } else {
          await refreshPlanifications();
        }
        setSuccessMessage("Planification modifiee avec succes.");
      } else {
        const response = await createPlanificationVoyage(payload, accessToken);
        if (response.data) {
          upsertPlanificationInState(response.data);
        } else {
          await refreshPlanifications();
        }
        setSuccessMessage("Planification ajoutee avec succes.");
      }
      setIsPlanificationDialogOpen(false);
      setPlanificationForm(initialPlanificationForm);
      setEditingPlanificationId(null);
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible d'enregistrer la planification"));
    } finally {
      setIsSavingPlanification(false);
    }
  }

  async function handleSubmitTransport(event: React.FormEvent<HTMLFormElement>) {
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
      if (editingTransportId) {
        const response = await updateTransport(editingTransportId, payload, accessToken);
        if (response.data) {
          upsertTransportInState(response.data);
        } else {
          await refreshPlanifications();
        }
        setSuccessMessage("Transport modifie avec succes.");
      } else {
        const response = await createTransport(payload, accessToken);
        if (response.data) {
          upsertTransportInState(response.data);
        } else {
          await refreshPlanifications();
        }
        setSuccessMessage("Transport ajoute avec succes.");
      }
      setIsTransportDialogOpen(false);
      setTransportForm(initialTransportForm);
      setEditingTransportId(null);
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible d'enregistrer le transport"));
    } finally {
      setIsSavingTransport(false);
    }
  }

  async function handleDeletePlanification(id: string) {
    if (!window.confirm("Supprimer cette planification ?")) return;
    setIsDeletingPlanificationId(id);
    setError("");
    setSuccessMessage("");
    try {
      await deletePlanificationVoyage(id, accessToken);
      removePlanificationFromState(id);
      setSuccessMessage("Planification supprimee avec succes.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Impossible de supprimer la planification"));
    } finally {
      setIsDeletingPlanificationId(null);
    }
  }

  async function handleDeleteTransport(id: string) {
    if (!window.confirm("Supprimer ce transport ?")) return;
    setIsDeletingTransportId(id);
    setError("");
    setSuccessMessage("");
    try {
      await deleteTransport(id, accessToken);
      removeTransportFromState(id);
      setSuccessMessage("Transport supprime avec succes.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Impossible de supprimer le transport"));
    } finally {
      setIsDeletingTransportId(null);
    }
  }

  async function handleCalculateTransportRoute(transport: Transport) {
    setSelectedTransportId(transport.id);
    setIsCalculatingTransportId(transport.id);
    setError("");
    setSuccessMessage("");
    try {
      const response = await calculateTransportRoute(transport.id, accessToken);
      if (response.data) {
        upsertTransportInState(response.data);
      } else {
        await refreshPlanifications();
      }
      setSuccessMessage("Trajet reel calcule avec succes.");
    } catch (calculationError) {
      setError(getErrorMessage(calculationError, "Impossible de calculer le trajet"));
    } finally {
      setIsCalculatingTransportId(null);
    }
  }

  async function handleCreateTypeTransport() {
    if (!newTypeTransportName.trim()) return;
    try {
      const response = await createTypeTransport({ nom: newTypeTransportName.trim() }, accessToken);
      if (response.data) {
        setTypeTransports((current) => [...current, response.data!]);
        setTransportForm((current) => ({ ...current, idTypeTransport: response.data?.id ?? current.idTypeTransport }));
      }
      setNewTypeTransportName("");
      setSuccessMessage("Type de transport ajoute avec succes.");
    } catch (createError) {
      setError(getErrorMessage(createError, "Impossible d'ajouter le type de transport"));
    }
  }

  if (!accessToken || role !== "ADMIN") return null;

  const successAlert = successMessage && showSuccessAlert ? (
    <Alert variant="success" className="fixed right-6 top-24 z-[70] w-[min(420px,calc(100vw-2rem))] border-emerald-300 shadow-xl">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <AlertTitle>Succes</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </div>
        <button type="button" onClick={() => setShowSuccessAlert(false)} className="rounded-md p-1 text-emerald-700/70 hover:bg-emerald-100" aria-label="Fermer l'alerte">
          <X className="size-4" />
        </button>
      </div>
    </Alert>
  ) : null;

  const errorAlert = error && showErrorAlert ? (
    <Alert variant="destructive" className="fixed right-6 top-24 z-[70] w-[min(420px,calc(100vw-2rem))] shadow-xl">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </div>
        <button type="button" onClick={() => setShowErrorAlert(false)} className="rounded-md p-1 text-red-700/70 hover:bg-red-100" aria-label="Fermer l'alerte">
          <X className="size-4" />
        </button>
      </div>
    </Alert>
  ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background text-foreground">
      <AdminHeader />
      {errorAlert}
      {successAlert}
      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/destination/${destinationId}`}>Retour au detail destination</Link>
              </Button>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Planning voyage</h1>
                <p className="text-sm text-muted-foreground">
                  {destination?.nom ? `Planifie les trajets autour de ${destination.nom}.` : "Organise le voyage, les etapes et les transports."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={openCreatePlanificationDialog}>
                <Plus className="size-4" />
                Ajouter planification
              </Button>

              {/* <Button variant="outline" onClick={openCreateTransportDialog} disabled={!selectedPlanificationId}>
                <Plus className="size-4" />
                Ajouter transport
              </Button> */}
              
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Planifications</CardTitle>
                <CardDescription>{planifications.length} planification(s) pour cette destination.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                ) : isPlanificationsLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement des planifications...</p>
                ) : planifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune planification disponible.</p>
                ) : (
                  <div className="space-y-4">
                    {planifications.map((planification) => (
                      <div
                        key={planification.id}
                        className={`rounded-2xl border p-4 transition-colors ${selectedPlanificationId === planification.id ? "border-emerald-400 bg-emerald-50/40" : "border-border/50 bg-card/50"}`}
                      >
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={() => {
                            setSelectedPlanificationId(planification.id)
                            setSelectedTransportId(planification.transports[0]?.id ?? null)
                          }}
                        >
                          <h3 className="text-base font-semibold">{planification.nomPlanification}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {planification.depart || "-"} {"->"} {planification.arriver || "-"}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Budget: {planification.budgetTotal ? `${Number(planification.budgetTotal).toLocaleString("fr-FR")} ${planification.deviseBudget}` : "Non renseigne"}
                          </p>
                        </button>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEditPlanificationDialog(planification)}>
                            <Pencil className="size-4" />
                            Modifier
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeletePlanification(planification.id)} disabled={isDeletingPlanificationId === planification.id}>
                            <Trash2 className="size-4" />
                            {isDeletingPlanificationId === planification.id ? "Suppression..." : "Supprimer"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle>Affichage du planning</CardTitle>
                      <CardDescription>
                        Choisis la vue la plus utile pour travailler : liste, carte ou calendrier.
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={displayMode === "list" ? "default" : "outline"}
                        onClick={() => setDisplayMode("list")}
                      >
                        <List className="size-4" />
                        Liste
                      </Button>
                      <Button
                        size="sm"
                        variant={displayMode === "map" ? "default" : "outline"}
                        onClick={() => setDisplayMode("map")}
                      >
                        <Map className="size-4" />
                        Carte
                      </Button>
                      <Button
                        size="sm"
                        variant={displayMode === "calendar" ? "default" : "outline"}
                        onClick={() => setDisplayMode("calendar")}
                      >
                        <CalendarDays className="size-4" />
                        Calendrier
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {displayMode === "list" ? (
                <Card className="border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle>Segments de transport</CardTitle>
                        <CardDescription>
                          {selectedPlanification ? `${selectedPlanification.transports.length} etape(s)` : "Aucune planification selectionnee"}
                        </CardDescription>
                      </div>
                      {selectedPlanification ? (
                        <Button size="sm" onClick={openCreateTransportDialog}>
                          <Plus className="size-4" />
                          Ajouter segment
                        </Button>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!selectedPlanification ? (
                      <p className="text-sm text-muted-foreground">Selectionne une planification pour gerer ses transports.</p>
                    ) : selectedPlanification.transports.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucun transport ajoute pour cette planification.</p>
                    ) : (
                      <div className="space-y-4">
                        {selectedPlanification.transports.map((transport) => (
                          <div
                            key={transport.id}
                            className={`rounded-2xl border p-4 ${
                              selectedTransportId === transport.id
                                ? "border-emerald-400 bg-emerald-50/40"
                                : "border-border/50 bg-card/50"
                            }`}
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="space-y-2">
                                <button
                                  type="button"
                                  className="text-left"
                                  onClick={() => setSelectedTransportId(transport.id)}
                                >
                                  <h3 className="text-base font-semibold">{transport.depart} {"->"} {transport.arrivee}</h3>
                                </button>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  <span className="rounded-full bg-muted px-2.5 py-1">Etape {transport.ordreEtape ?? "-"}</span>
                                  <span className="rounded-full bg-muted px-2.5 py-1">{transport.nomTypeTransport}</span>
                                  <span className="rounded-full bg-muted px-2.5 py-1">Duree: {transport.duree || "-"}</span>
                                  <span className="rounded-full bg-muted px-2.5 py-1">Distance: {transport.distanceKm ?? "-"} km</span>
                                  <span className="rounded-full bg-muted px-2.5 py-1">
                                    {transport.geojsonTrajet ? "Trajet reel disponible" : "Trajet simplifie"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCalculateTransportRoute(transport)}
                                  disabled={isCalculatingTransportId === transport.id}
                                >
                                  {isCalculatingTransportId === transport.id ? "Calcul..." : "Calculer trajet"}
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => openEditTransportDialog(transport)}>
                                  <Pencil className="size-4" />
                                  Modifier
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteTransport(transport.id)} disabled={isDeletingTransportId === transport.id}>
                                  <Trash2 className="size-4" />
                                  {isDeletingTransportId === transport.id ? "Suppression..." : "Supprimer"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              {displayMode === "map" ? (
                <Card className="border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle>Carte du trajet</CardTitle>
                        <CardDescription>
                          {selectedPlanification
                            ? `Visualisation des segments de ${selectedPlanification.nomPlanification}.`
                            : "Choisis une planification pour voir les trajets."}
                        </CardDescription>
                      </div>
                      {selectedPlanification ? (
                        <Button size="sm" onClick={openCreateTransportDialog}>
                          <Plus className="size-4" />
                          Ajouter segment
                        </Button>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!selectedPlanification ? (
                      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 text-center text-sm text-muted-foreground">
                        Selectionne une planification pour afficher la carte.
                      </div>
                    ) : (
                      <PlanningVoyageMap transports={selectedPlanification.transports} />
                    )}
                    {selectedPlanification ? (
                      <div className="rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-sm">
                        <p className="font-medium">{selectedPlanification.nomPlanification}</p>
                        <p className="mt-1 text-muted-foreground">
                          {selectedPlanification.transports.length} segment(s) affiche(s) sur la carte.
                        </p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

              {displayMode === "calendar" ? (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Calendrier du voyage</CardTitle>
                    <CardDescription>
                      {selectedPlanification
                        ? `Vue calendrier de ${selectedPlanification.nomPlanification}`
                        : "Visualise les dates de tes planifications avec une vraie vue calendrier."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <PlanningVoyageCalendar
                      planifications={planifications}
                      selectedPlanificationId={selectedPlanificationId}
                      selectedTransportId={selectedTransportId ?? undefined}
                      onSelectPlanification={(planificationId) => {
                        setSelectedPlanificationId(planificationId)
                        const planification = planifications.find((item) => item.id === planificationId)
                        setSelectedTransportId(planification?.transports[0]?.id ?? null)
                      }}
                      onSelectTransport={(transportId, planificationId) => {
                        setSelectedPlanificationId(planificationId)
                        setSelectedTransportId(transportId)
                      }}
                      initialDate={
                        selectedPlanification?.dateHeureDebut
                          ? new Date(selectedPlanification.dateHeureDebut)
                          : undefined
                      }
                    />
                    {selectedPlanification ? (
                      <div className="rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-sm">
                        <p className="font-medium">{selectedPlanification.nomPlanification}</p>
                        <p className="mt-1 text-muted-foreground">
                          {selectedPlanification.dateHeureDebut
                            ? new Date(selectedPlanification.dateHeureDebut).toLocaleString("fr-FR")
                            : "Debut non renseigne"}
                          {" -> "}
                          {selectedPlanification.dateHeureFin
                            ? new Date(selectedPlanification.dateHeureFin).toLocaleString("fr-FR")
                            : "Fin non renseignee"}
                        </p>
                        {selectedTransportId ? (
                          <p className="mt-2 text-muted-foreground">
                            Segment selectionne :{" "}
                            {selectedPlanification.transports.find((transport) => transport.id === selectedTransportId)?.depart || "-"}
                            {" -> "}
                            {selectedPlanification.transports.find((transport) => transport.id === selectedTransportId)?.arrivee || "-"}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Selectionne une planification pour voir sa periode directement dans le calendrier.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isPlanificationDialogOpen} onOpenChange={setIsPlanificationDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlanificationId ? "Modifier une planification" : "Ajouter une planification"}</DialogTitle>
            <DialogDescription>Definis le cadre general du voyage avant de construire les segments.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmitPlanification}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Nom de la planification</label>
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
                <label className="text-sm font-medium">Lieu de depart</label>
                <Input value={planificationForm.depart} onChange={(event) => updatePlanificationForm("depart", event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date/heure fin</label>
                <Input type="datetime-local" value={planificationForm.dateHeureFin} onChange={(event) => updatePlanificationForm("dateHeureFin", event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Lieu d'arrivee</label>
                <Input value={planificationForm.arriver} onChange={(event) => updatePlanificationForm("arriver", event.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSavingPlanification}>
                {isSavingPlanification ? "Enregistrement..." : editingPlanificationId ? "Enregistrer les modifications" : "Ajouter la planification"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTransportDialogOpen} onOpenChange={setIsTransportDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTransportId ? "Modifier un transport" : "Ajouter un transport"}</DialogTitle>
            <DialogDescription>Chaque segment represente une etape du voyage visible sur la carte.</DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={handleSubmitTransport}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ordre etape</label>
                <Input type="number" min="1" value={transportForm.ordreEtape} onChange={(event) => updateTransportForm("ordreEtape", event.target.value)} />
              </div>
              <div className="space-y-2 xl:col-span-2">
                <label className="text-sm font-medium">Type de transport</label>
                <div className="flex gap-2">
                  <Select value={transportForm.idTypeTransport} onValueChange={(value) => updateTransportForm("idTypeTransport", value)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Choisir un type de transport" /></SelectTrigger>
                    <SelectContent>
                      {typeTransports.map((typeTransport) => (
                        <SelectItem key={typeTransport.id} value={typeTransport.id}>{typeTransport.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowTypeTransportCreator((current) => !current)}
                    aria-label="Ajouter un type de transport"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
              {showTypeTransportCreator ? (
                <div className="space-y-2 xl:col-span-3">
                  <label className="text-sm font-medium">Nouveau type de transport</label>
                  <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input value={newTypeTransportName} onChange={(event) => setNewTypeTransportName(event.target.value)} placeholder="Voiture, avion, bateau..." />
                      <Button type="button" onClick={handleCreateTypeTransport}>Ajouter</Button>
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="space-y-2">
                <label className="text-sm font-medium">Depart</label>
                <Input value={transportForm.depart} onChange={(event) => updateTransportForm("depart", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Arrivee</label>
                <Input value={transportForm.arrivee} onChange={(event) => updateTransportForm("arrivee", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duree</label>
                <Input value={transportForm.duree} onChange={(event) => updateTransportForm("duree", event.target.value)} placeholder="2h30, 1 jour..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Longitude depart</label>
                <Input value={transportForm.longitudeDepart} readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Latitude depart</label>
                <Input value={transportForm.latitudeDepart} readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Selection carte depart</label>
                <Button type="button" variant="outline" className="w-full" onClick={() => openCoordinatePicker("depart")}>
                  Choisir sur la carte
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Longitude arrivee</label>
                <Input value={transportForm.longitudeArrivee} readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Latitude arrivee</label>
                <Input value={transportForm.latitudeArrivee} readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Selection carte arrivee</label>
                <Button type="button" variant="outline" className="w-full" onClick={() => openCoordinatePicker("arrivee")}>
                  Choisir sur la carte
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Distance km</label>
                <Input type="number" min="0" step="0.01" value={transportForm.distanceKm} onChange={(event) => updateTransportForm("distanceKm", event.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSavingTransport}>
                {isSavingTransport ? "Enregistrement..." : editingTransportId ? "Enregistrer les modifications" : "Ajouter le transport"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCoordinatePickerOpen} onOpenChange={setIsCoordinatePickerOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {coordinateTarget === "depart" ? "Choisir le depart sur la carte" : "Choisir l'arrivee sur la carte"}
            </DialogTitle>
            <DialogDescription>
              Clique sur la carte pour recuperer automatiquement la latitude et la longitude.
            </DialogDescription>
          </DialogHeader>
          <HebergementMap
            latitude={Number(
              coordinateTarget === "depart"
                ? transportForm.latitudeDepart || destination?.latitude || -18.8792
                : transportForm.latitudeArrivee || destination?.latitude || -18.8792
            )}
            longitude={Number(
              coordinateTarget === "depart"
                ? transportForm.longitudeDepart || destination?.longitude || 47.5079
                : transportForm.longitudeArrivee || destination?.longitude || 47.5079
            )}
            onChange={handleCoordinatePicked}
          />
          <div className="flex justify-end">
            <Button type="button" onClick={() => setIsCoordinatePickerOpen(false)}>
              Valider la position
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AdminFooter />
    </div>
  );
}
