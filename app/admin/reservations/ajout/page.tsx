"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Layers, Minus, Plus, Save, Trash2, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useBreadcrumbs } from "@/app/admin/contexts/breadcrumbs-context";
import { loadAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/api/client";
import { getUsers } from "@/lib/api/users";
import { listDestinations, listPlanificationsByDestination } from "@/lib/api/destinations";
import { listCategorieClientActivites } from "@/lib/api/activites";
import {
  calculateReservationQuote,
  createReservationFromPrice,
  createReservationFromSimulation,
} from "@/lib/api/reservations";
import {
  ElementSelection,
  ReservationCreatePayload,
  ReservationQuote,
  ReservationSource,
  VoyageurProfile,
} from "@/lib/type/reservation";
import type { DestinationDetails, ElementJourPlanification, PlanificationVoyage } from "@/lib/type/destination";

type UserSummary = {
  id: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
};

type CategorieClient = {
  id: string;
  nom: string;
};

type FormState = {
  clientMode: "REGISTERED" | "MANUAL";
  utilisateurId: string;
  clientNom: string;
  clientPrenom: string;
  clientContact: string;
  source: ReservationSource;
  destinationId: string;
  planificationVoyageId: string;
  commentaireClient: string;
  elementsSelectionnes: string;
  resumeSimulation: string;
  profilsVoyageurs: VoyageurProfile[];
};

const gammeOptions = ["ECONOMIQUE", "MOYENNE", "LUXE"];

const initialProfile: VoyageurProfile = {
  categorieClientId: "",
  gamme: "MOYENNE",
  nombrePersonnes: 1,
};

const initialForm: FormState = {
  clientMode: "REGISTERED",
  utilisateurId: "",
  clientNom: "",
  clientPrenom: "",
  clientContact: "",
  source: "PRIX_DIRECT",
  destinationId: "",
  planificationVoyageId: "",
  commentaireClient: "",
  elementsSelectionnes: "",
  resumeSimulation: "",
  profilsVoyageurs: [{ ...initialProfile }],
};

function parseElementSelections(value: string): ElementSelection[] {
  if (!value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        elementId: typeof item?.elementId === "string" ? item.elementId : "",
        quantite: Number(item?.quantite) || 0,
        type: typeof item?.type === "string" ? item.type : undefined,
      }))
      .filter((item) => item.elementId && item.quantite > 0);
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((elementId) => ({ elementId, quantite: 1 }));
  }
}

function buildPayload(form: FormState): ReservationCreatePayload {
  const profiles = form.profilsVoyageurs.filter(
    (profile) => profile.categorieClientId && profile.gamme && profile.nombrePersonnes > 0
  );
  const firstProfile = profiles[0] ?? initialProfile;

  return {
    utilisateurId: form.clientMode === "REGISTERED" ? form.utilisateurId || undefined : undefined,
    clientNom: form.clientMode === "MANUAL" ? form.clientNom.trim() || undefined : undefined,
    clientPrenom: form.clientMode === "MANUAL" ? form.clientPrenom.trim() || undefined : undefined,
    clientContact: form.clientMode === "MANUAL" ? form.clientContact.trim() || undefined : undefined,
    source: form.source,
    destinationId: form.destinationId,
    planificationVoyageId: form.planificationVoyageId,
    categorieClientId: firstProfile.categorieClientId,
    gamme: firstProfile.gamme,
    nombrePersonnes: profiles.reduce((sum, profile) => sum + profile.nombrePersonnes, 0) || 1,
    profilsVoyageurs: profiles.length > 1 ? profiles : undefined,
    commentaireClient: form.commentaireClient.trim() || undefined,
    elementsSelectionnes:
      form.source === "SIMULATION" ? parseElementSelections(form.elementsSelectionnes) : undefined,
    resumeSimulation:
      form.source === "SIMULATION" && form.resumeSimulation.trim()
        ? form.resumeSimulation.trim()
        : undefined,
  };
}

function formatCurrency(amount: number | undefined, devise = "MGA") {
  return `${Math.round(amount ?? 0).toLocaleString("fr-MG")} ${devise}`;
}

function formatUser(user: UserSummary) {
  const name = `${user.prenom ?? ""} ${user.nom ?? ""}`.trim();
  const contact = user.email || user.telephone || "Sans email";
  return name ? `${name} - ${contact}` : contact;
}

function getElementTitle(element: ElementJourPlanification) {
  return (
    element.titre ||
    element.nomActivite ||
    element.nomHebergement ||
    element.nomTransport ||
    element.nomTypeElementJour ||
    "Bloc sans titre"
  );
}

function getElementPrice(element: ElementJourPlanification) {
  return element.minimumTarifParPersonne ?? element.budgetPrevu ?? 0;
}

function formatHourRange(element: ElementJourPlanification) {
  if (element.heureDebut && element.heureFin) return `${element.heureDebut} - ${element.heureFin}`;
  if (element.heureDebut) return element.heureDebut;
  if (element.heureFin) return element.heureFin;
  return null;
}

export default function AjoutReservationPage() {
  const router = useRouter();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [destinations, setDestinations] = useState<DestinationDetails[]>([]);
  const [planifications, setPlanifications] = useState<PlanificationVoyage[]>([]);
  const [categories, setCategories] = useState<CategorieClient[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [quote, setQuote] = useState<ReservationQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const summaryPanelRef = useRef<HTMLElement | null>(null);
  const summaryFooterAnchorRef = useRef<HTMLDivElement | null>(null);
  const [isSummaryFooterFixed, setIsSummaryFooterFixed] = useState(false);

  const session = useMemo(() => loadAuth(), []);
  const token = session?.accessToken;

  const selectedDestination = destinations.find((destination) => destination.id === form.destinationId);
  const selectedPlanification = planifications.find((planification) => planification.id === form.planificationVoyageId);
  const selectedUser = form.clientMode === "REGISTERED"
    ? users.find((user) => user.id === form.utilisateurId)
    : undefined;
  const clientSummary = form.clientMode === "REGISTERED"
    ? selectedUser
      ? formatUser(selectedUser)
      : "Aucun client selectionne"
    : `${form.clientPrenom} ${form.clientNom}`.trim() || "Client libre a renseigner";
  const selectedElementSelections = useMemo(
    () => parseElementSelections(form.elementsSelectionnes),
    [form.elementsSelectionnes]
  );
  const selectedQuantityByElement = useMemo(
    () => new Map(selectedElementSelections.map((selection) => [selection.elementId, selection.quantite])),
    [selectedElementSelections]
  );
  const simulationDays = useMemo(
    () => [...(selectedPlanification?.jours ?? [])].sort((a, b) => (a.numeroJour ?? 999) - (b.numeroJour ?? 999)),
    [selectedPlanification]
  );
  const selectedSimulationTotal = useMemo(() => {
    if (!selectedPlanification) return 0;

    return simulationDays.reduce((sum, jour) => {
      return sum + (jour.elements ?? []).reduce((daySum, element) => {
        const quantity = selectedQuantityByElement.get(element.id) ?? 0;
        return daySum + quantity * getElementPrice(element);
      }, 0);
    }, 0);
  }, [selectedPlanification, selectedQuantityByElement, simulationDays]);
  const simulationTotalAvecMarge = form.source === "SIMULATION" ? quote?.prixTotal ?? selectedSimulationTotal : 0;
  const simulationMargeBrute = Math.max(simulationTotalAvecMarge - selectedSimulationTotal, 0);

  const totalPeople = form.profilsVoyageurs.reduce(
    (sum, profile) => sum + (Number(profile.nombrePersonnes) || 0),
    0
  );

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Reservations", href: "/admin?section=reservations-liste" },
      { label: "Ajouter une reservation", isActive: true },
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!token) {
        setError("Connexion requise pour ajouter une reservation.");
        return;
      }

      try {
        const [usersResponse, destinationData, categorieResponse] = await Promise.all([
          getUsers(token),
          listDestinations(),
          listCategorieClientActivites(token),
        ]);

        const loadedUsers = (usersResponse.data ?? []) as UserSummary[];
        const loadedDestinations = destinationData ?? [];
        const loadedCategories = categorieResponse.data ?? [];

        setUsers(loadedUsers);
        setDestinations(loadedDestinations);
        setCategories(loadedCategories);
        setForm((current) => ({
          ...current,
          utilisateurId: current.utilisateurId || loadedUsers[0]?.id || "",
          destinationId: current.destinationId || loadedDestinations[0]?.id || "",
          profilsVoyageurs: current.profilsVoyageurs.map((profile) => ({
            ...profile,
            categorieClientId: profile.categorieClientId || loadedCategories[0]?.id || "",
          })),
        }));
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Impossible de charger les donnees necessaires."));
      }
    };

    void loadInitialData();
  }, [token]);

  useEffect(() => {
    const loadPlanifications = async () => {
      if (!token || !form.destinationId) {
        setPlanifications([]);
        return;
      }

      try {
        const response = await listPlanificationsByDestination(form.destinationId, token);
        const loadedPlanifications = response.data ?? [];
        setPlanifications(loadedPlanifications);
        setForm((current) => ({
          ...current,
          planificationVoyageId:
            loadedPlanifications.some((item) => item.id === current.planificationVoyageId)
              ? current.planificationVoyageId
              : loadedPlanifications[0]?.id || "",
        }));
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Impossible de charger les planifications."));
      }
    };

    void loadPlanifications();
  }, [form.destinationId, token]);

  useEffect(() => {
    const updateSummaryFooterPosition = () => {
      const anchor = summaryFooterAnchorRef.current;
      const panel = summaryPanelRef.current;
      if (!anchor || !panel) {
        setIsSummaryFooterFixed(false);
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const viewportBottom = window.innerHeight - 24;
      const resumeStillVisibleAtTop = panelRect.top > 96;
      const footerIsBelowViewport = anchorRect.top > viewportBottom;

      setIsSummaryFooterFixed(!resumeStillVisibleAtTop && footerIsBelowViewport);
    };

    updateSummaryFooterPosition();
    window.addEventListener("scroll", updateSummaryFooterPosition, { passive: true });
    window.addEventListener("resize", updateSummaryFooterPosition);

    return () => {
      window.removeEventListener("scroll", updateSummaryFooterPosition);
      window.removeEventListener("resize", updateSummaryFooterPosition);
    };
  }, []);

  useEffect(() => {
    const payload = buildPayload(form);
    const canQuote =
      !!token &&
      !!payload.destinationId &&
      !!payload.planificationVoyageId &&
      !!payload.categorieClientId &&
      payload.nombrePersonnes > 0 &&
      (form.clientMode === "REGISTERED"
        ? !!payload.utilisateurId
        : !!payload.clientNom || !!payload.clientPrenom);

    if (!canQuote) {
      setQuote(null);
      return;
    }

    let active = true;
    const loadQuote = async () => {
      setLoadingQuote(true);
      try {
        const response = await calculateReservationQuote(payload, token);
        if (active) setQuote(response.data ?? null);
      } catch {
        if (active) setQuote(null);
      } finally {
        if (active) setLoadingQuote(false);
      }
    };

    void loadQuote();

    return () => {
      active = false;
    };
  }, [form, token]);

  const updateProfile = (index: number, updates: Partial<VoyageurProfile>) => {
    setForm((current) => ({
      ...current,
      profilsVoyageurs: current.profilsVoyageurs.map((profile, profileIndex) =>
        profileIndex === index ? { ...profile, ...updates } : profile
      ),
    }));
  };

  const addProfile = () => {
    setForm((current) => ({
      ...current,
      profilsVoyageurs: [
        ...current.profilsVoyageurs,
        {
          ...initialProfile,
          categorieClientId: categories[0]?.id || "",
        },
      ],
    }));
  };

  const removeProfile = (index: number) => {
    setForm((current) => ({
      ...current,
      profilsVoyageurs:
        current.profilsVoyageurs.length > 1
          ? current.profilsVoyageurs.filter((_, profileIndex) => profileIndex !== index)
          : current.profilsVoyageurs,
    }));
  };

  const updateElementQuantity = (element: ElementJourPlanification, quantity: number) => {
    const nextQuantity = Math.max(0, Math.min(quantity, Math.max(totalPeople || 1, 1)));
    const nextSelections = [
      ...selectedElementSelections.filter((selection) => selection.elementId !== element.id),
      ...(nextQuantity > 0
        ? [{
            elementId: element.id,
            quantite: nextQuantity,
            type: element.codeTypeElementJour ?? undefined,
          }]
        : []),
    ];

    setForm((current) => ({
      ...current,
      elementsSelectionnes: nextSelections.length > 0 ? JSON.stringify(nextSelections) : "",
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const payload = buildPayload(form);
      if (form.source === "SIMULATION") {
        await createReservationFromSimulation(payload, token);
      } else {
        await createReservationFromPrice(payload, token);
      }
      router.push("/admin?section=reservations-liste");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Impossible de creer la reservation."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Ajouter une reservation</h1>
          <p className="mt-1 text-slate-500">
            Creer une demande depuis un prix direct ou une simulation faite par l&apos;admin.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin?section=reservations-liste")}>
          Voir la liste
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-emerald-600" />
                Client et source
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Type de client</Label>
                <Select
                  value={form.clientMode}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      clientMode: value as FormState["clientMode"],
                    }))
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="REGISTERED">Client avec compte</SelectItem>
                    <SelectItem value="MANUAL">Client libre sans compte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.clientMode === "REGISTERED" ? (
                <div className="space-y-2 md:col-span-2">
                  <Label>Client</Label>
                  <Select
                    value={form.utilisateurId}
                    onValueChange={(value) => setForm((current) => ({ ...current, utilisateurId: value }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selectionner un client" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {formatUser(user)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    L&apos;email n&apos;est pas obligatoire pour l&apos;affichage admin: si le client a seulement un telephone, son compte reste selectionnable.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Nom du client</Label>
                    <Input
                      value={form.clientNom}
                      onChange={(event) => setForm((current) => ({ ...current, clientNom: event.target.value }))}
                      placeholder="Nom"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prenom du client</Label>
                    <Input
                      value={form.clientPrenom}
                      onChange={(event) => setForm((current) => ({ ...current, clientPrenom: event.target.value }))}
                      placeholder="Prenom"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Contact optionnel</Label>
                    <Input
                      value={form.clientContact}
                      onChange={(event) => setForm((current) => ({ ...current, clientContact: event.target.value }))}
                      placeholder="Telephone, email ou note de contact"
                      className="h-11"
                    />
                    <p className="text-xs text-slate-500">
                      Pour un client sans compte, le nom ou le prenom suffit. Le contact reste optionnel.
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Type de reservation</Label>
                <Select
                  value={form.source}
                  onValueChange={(value) => setForm((current) => ({ ...current, source: value as ReservationSource }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="PRIX_DIRECT">Prix direct</SelectItem>
                    <SelectItem value="SIMULATION">Simulation admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Commentaire client ou appel</Label>
                <Input
                  value={form.commentaireClient}
                  onChange={(event) => setForm((current) => ({ ...current, commentaireClient: event.target.value }))}
                  placeholder="Ex: client contacte par telephone"
                  className="h-11"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-emerald-600" />
                Destination et forfait
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Destination</Label>
                <Select
                  value={form.destinationId}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      destinationId: value,
                      planificationVoyageId: "",
                      elementsSelectionnes: "",
                      resumeSimulation: "",
                    }))
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selectionner une destination" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {destinations.map((destination) => (
                      <SelectItem key={destination.id} value={destination.id}>
                        {destination.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Forfait / planification</Label>
                <Select
                  value={form.planificationVoyageId}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      planificationVoyageId: value,
                      elementsSelectionnes: "",
                      resumeSimulation: "",
                    }))
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selectionner un forfait" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {planifications.map((planification) => (
                      <SelectItem key={planification.id} value={planification.id}>
                        {planification.nomPlanification}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-emerald-600" />
                  Profils voyageurs
                </CardTitle>
                <Button type="button" variant="outline" onClick={addProfile} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter un profil
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.profilsVoyageurs.map((profile, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">Profil {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeProfile(index)}
                      disabled={form.profilsVoyageurs.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Categorie client</Label>
                      <Select
                        value={profile.categorieClientId}
                        onValueChange={(value) => updateProfile(index, { categorieClientId: value })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Categorie" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {categories.map((categorie) => (
                            <SelectItem key={categorie.id} value={categorie.id}>
                              {categorie.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Gamme</Label>
                      <Select value={profile.gamme} onValueChange={(value) => updateProfile(index, { gamme: value })}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {gammeOptions.map((gamme) => (
                            <SelectItem key={gamme} value={gamme}>
                              {gamme}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre de personnes</Label>
                      <Input
                        type="number"
                        min={1}
                        value={profile.nombrePersonnes}
                        onChange={(event) =>
                          updateProfile(index, { nombrePersonnes: Number(event.target.value) || 1 })
                        }
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {form.source === "SIMULATION" ? (
            <Card className="border-emerald-200 bg-emerald-50/40 shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Simulation admin</CardTitle>
                    <p className="mt-1 text-sm text-emerald-800">
                      Selectionnez les blocs du forfait et ajustez le nombre de personnes.
                    </p>
                  </div>
                  <Badge variant="outline" className="w-fit border-emerald-200 bg-white text-emerald-700">
                    {selectedElementSelections.length} bloc(s)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {simulationDays.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-emerald-200 bg-white p-5 text-sm text-slate-500">
                    Aucun jour disponible pour ce forfait. Verifiez la planification selectionnee.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {simulationDays.map((jour) => {
                      const elements = [...(jour.elements ?? [])]
                        .filter((element) => element.estActif)
                        .sort((a, b) => (a.ordreAffichage ?? 999) - (b.ordreAffichage ?? 999));

                      return (
                        <div key={jour.id} className="rounded-2xl border border-emerald-100 bg-white p-4">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">
                                Jour {jour.numeroJour ?? "-"} - {jour.titre || "Planning"}
                              </p>
                              {jour.description ? (
                                <p className="mt-1 text-xs text-slate-500">{jour.description}</p>
                              ) : null}
                            </div>
                            <Badge variant="secondary">{elements.length} bloc(s)</Badge>
                          </div>

                          {elements.length === 0 ? (
                            <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                              Aucun bloc actif pour ce jour.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {elements.map((element) => {
                                const quantity = selectedQuantityByElement.get(element.id) ?? 0;
                                const price = getElementPrice(element);
                                const hourRange = formatHourRange(element);

                                return (
                                  <div
                                    key={element.id}
                                    className={`rounded-xl border p-3 transition ${
                                      quantity > 0
                                        ? "border-emerald-300 bg-emerald-50"
                                        : "border-slate-200 bg-white"
                                    }`}
                                  >
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <Badge variant="outline">
                                            {element.nomTypeElementJour || element.codeTypeElementJour || "Bloc"}
                                          </Badge>
                                          {element.estObligatoire ? (
                                            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                                              Obligatoire
                                            </Badge>
                                          ) : null}
                                          {hourRange ? <span className="text-xs text-slate-500">{hourRange}</span> : null}
                                        </div>
                                        <p className="mt-2 font-semibold text-slate-950">{getElementTitle(element)}</p>
                                        {element.description ? (
                                          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{element.description}</p>
                                        ) : null}
                                        <p className="mt-2 text-sm font-medium text-emerald-700">
                                          {formatCurrency(price, element.devise || selectedPlanification?.deviseBudget || "MGA")} / personne
                                        </p>
                                      </div>

                                      <div className="flex shrink-0 items-center justify-between gap-3 rounded-full border border-slate-200 bg-white p-1">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-9 w-9 rounded-full"
                                          onClick={() => updateElementQuantity(element, quantity - 1)}
                                          disabled={quantity <= 0}
                                        >
                                          <Minus className="h-4 w-4" />
                                        </Button>
                                        <div className="w-20 text-center">
                                          <p className="text-lg font-bold text-slate-950">{quantity}</p>
                                          <p className="text-[11px] text-slate-500">pers.</p>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-9 w-9 rounded-full text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                          onClick={() => updateElementQuantity(element, quantity + 1)}
                                          disabled={quantity >= Math.max(totalPeople || 1, 1)}
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Résumé simulation</Label>
                  <Textarea
                    value={form.resumeSimulation}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, resumeSimulation: event.target.value }))
                    }
                    placeholder="Notez les choix proposes au client, les ajustements et le budget retenu."
                    rows={4}
                    className="bg-white"
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <aside ref={summaryPanelRef} className="space-y-4 xl:relative xl:self-start">
          <Card className="flex flex-col gap-0 overflow-hidden border-slate-200 py-0 shadow-sm">
            <CardHeader className="shrink-0 border-b border-slate-200 px-6 py-5">
              <CardTitle>Resume</CardTitle>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col p-0">
              <div className="min-h-0 flex-1 space-y-4 px-6 py-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Client</p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {clientSummary}
                  </p>
                  {form.clientMode === "MANUAL" && form.clientContact ? (
                    <p className="mt-1 text-sm text-slate-500">{form.clientContact}</p>
                  ) : null}
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Forfait</p>
                  <p className="mt-2 font-semibold text-slate-950">{selectedDestination?.title || "-"}</p>
                  <p className="text-sm text-slate-500">{selectedPlanification?.nomPlanification || "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Voyageurs</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">{totalPeople || 0}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Source</p>
                    <p className="mt-2 font-bold text-slate-950">
                      {form.source === "SIMULATION" ? "Simulation" : "Prix direct"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-900">Devis</p>
                  <p className="mt-2 text-sm text-emerald-800">
                    {loadingQuote
                      ? "Calcul du prix en cours..."
                      : quote
                        ? `${formatCurrency(quote.prixTotal, quote.devise)} pour ${quote.dureeJours} jour(s)`
                        : "Completez les champs requis pour obtenir le prix."}
                  </p>
                  {quote?.lignes?.length ? (
                    <div className="mt-3 space-y-2">
                      {quote.lignes.map((line, index) => (
                        <div key={`${line.categorieClientId}-${line.gamme}-${index}`} className="rounded-xl bg-white/80 p-3 text-xs text-emerald-900">
                          <div className="font-semibold">
                            {line.categorieClientNom} - {line.gamme}
                          </div>
                          <div>
                            {line.nombrePersonnes} pers x {formatCurrency(line.prixUnitaire, quote.devise)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div
                ref={summaryFooterAnchorRef}
                className="h-px"
                aria-hidden="true"
              />
              <div
                className={`relative z-10 shrink-0 space-y-3 border-t border-slate-200 bg-white px-6 py-3 shadow-[0_-18px_35px_-28px_rgba(15,23,42,0.7)] ${
                  isSummaryFooterFixed
                    ? "xl:fixed xl:bottom-6 xl:right-6 xl:w-[320px] 2xl:right-8 2xl:w-[340px] xl:rounded-2xl xl:border xl:border-slate-200"
                    : ""
                }`}
              >
                {form.source === "SIMULATION" ? (
                <div className="rounded-2xl border border-emerald-200 bg-white p-3 shadow-sm">
                  <p className="text-sm font-semibold text-slate-950">Resume marge</p>
                  <div className="mt-2 grid gap-2">
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Total brut
                      </p>
                      <p className="mt-1 text-base font-bold text-slate-950">
                        {formatCurrency(selectedSimulationTotal, selectedPlanification?.deviseBudget || "MGA")}
                      </p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        Marge brute
                      </p>
                      <p className="mt-1 text-base font-bold text-emerald-700">
                        {loadingQuote
                          ? "Calcul..."
                          : formatCurrency(simulationMargeBrute, quote?.devise || selectedPlanification?.deviseBudget || "MGA")}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-950 px-3 py-2 text-white">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
                        Total avec marge
                      </p>
                      <p className="mt-1 text-base font-bold">
                        {loadingQuote
                          ? "Calcul..."
                          : formatCurrency(simulationTotalAvecMarge, quote?.devise || selectedPlanification?.deviseBudget || "MGA")}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] leading-4 text-slate-500">
                    La marge brute vient du devis final calcule par le backend. Le total brut reste indicatif selon le prix par personne du bloc.
                  </p>
                </div>
                ) : null}

                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={isSubmitting || !quote} className="h-10 gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Save className="h-4 w-4" />
                    {isSubmitting ? "Reservation..." : "Enregistrer"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.back()} className="h-10">
                    Annuler
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  );
}
