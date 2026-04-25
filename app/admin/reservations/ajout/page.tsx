"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
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
import { ReservationCreatePayload, ReservationQuote, ReservationSource } from "@/lib/type/reservation";
import type { DestinationDetails, PlanificationVoyage } from "@/lib/type/destination";

type UserSummary = {
  id: string;
  nom?: string;
  prenom?: string;
  email?: string;
};

type CategorieClient = {
  id: string;
  nom: string;
};

type FormState = {
  utilisateurId: string;
  source: ReservationSource;
  destinationId: string;
  planificationVoyageId: string;
  categorieClientId: string;
  gamme: string;
  nombrePersonnes: number;
  commentaireClient: string;
  elementsSelectionnes: string;
  resumeSimulation: string;
};

const initialForm: FormState = {
  utilisateurId: "",
  source: "PRIX_DIRECT",
  destinationId: "",
  planificationVoyageId: "",
  categorieClientId: "",
  gamme: "MOYENNE",
  nombrePersonnes: 1,
  commentaireClient: "",
  elementsSelectionnes: "",
  resumeSimulation: "",
};

function buildPayload(form: FormState): ReservationCreatePayload {
  return {
    utilisateurId: form.utilisateurId,
    source: form.source,
    destinationId: form.destinationId,
    planificationVoyageId: form.planificationVoyageId,
    categorieClientId: form.categorieClientId,
    gamme: form.gamme,
    nombrePersonnes: form.nombrePersonnes,
    commentaireClient: form.commentaireClient || undefined,
    elementsSelectionnes:
      form.source === "SIMULATION"
        ? form.elementsSelectionnes
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        : undefined,
    resumeSimulation:
      form.source === "SIMULATION" && form.resumeSimulation.trim()
        ? form.resumeSimulation.trim()
        : undefined,
  };
}

function formatCurrency(amount: number | undefined, devise = "MGA") {
  return `${Math.round(amount ?? 0).toLocaleString("fr-MG")} ${devise}`;
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

  const session = useMemo(() => loadAuth(), []);
  const token = session?.accessToken;

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
          categorieClientId: current.categorieClientId || loadedCategories[0]?.id || "",
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
    const canQuote =
      !!token &&
      !!form.utilisateurId &&
      !!form.destinationId &&
      !!form.planificationVoyageId &&
      !!form.categorieClientId &&
      form.nombrePersonnes > 0;

    if (!canQuote) {
      setQuote(null);
      return;
    }

    let active = true;
    const loadQuote = async () => {
      setLoadingQuote(true);
      try {
        const response = await calculateReservationQuote(buildPayload(form), token);
        if (active) {
          setQuote(response.data ?? null);
        }
      } catch {
        if (active) {
          setQuote(null);
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
  }, [form, token]);

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
      <div>
        <h1 className="text-3xl font-bold">Ajouter une reservation</h1>
        <p className="text-muted-foreground">Creer une reservation depuis un tarif ou une simulation.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Informations de la reservation</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Client</Label>
                <Select
                  value={form.utilisateurId}
                  onValueChange={(value) => setForm((current) => ({ ...current, utilisateurId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {`${user.prenom ?? ""} ${user.nom ?? ""}`.trim() || user.email || user.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Source</Label>
                <Select
                  value={form.source}
                  onValueChange={(value) => setForm((current) => ({ ...current, source: value as ReservationSource }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIX_DIRECT">Prix direct</SelectItem>
                    <SelectItem value="SIMULATION">Simulation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Destination</Label>
                <Select
                  value={form.destinationId}
                  onValueChange={(value) => setForm((current) => ({ ...current, destinationId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner une destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((destination) => (
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
                  onValueChange={(value) => setForm((current) => ({ ...current, planificationVoyageId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner une planification" />
                  </SelectTrigger>
                  <SelectContent>
                    {planifications.map((planification) => (
                      <SelectItem key={planification.id} value={planification.id}>
                        {planification.nomPlanification}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categorie client</Label>
                <Select
                  value={form.categorieClientId}
                  onValueChange={(value) => setForm((current) => ({ ...current, categorieClientId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner une categorie" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Select
                  value={form.gamme}
                  onValueChange={(value) => setForm((current) => ({ ...current, gamme: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MOYENNE">MOYENNE</SelectItem>
                    <SelectItem value="LUXE">LUXE</SelectItem>
                    
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Nombre de personnes</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.nombrePersonnes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      nombrePersonnes: Number(event.target.value) || 1,
                    }))
                  }
                />
              </div>
            </div>

            {form.source === "SIMULATION" ? (
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Elements selectionnes</Label>
                  <Input
                    value={form.elementsSelectionnes}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, elementsSelectionnes: event.target.value }))
                    }
                    placeholder="Ex: ACT-01, HEB-03"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Resume simulation</Label>
                  <Textarea
                    value={form.resumeSimulation}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, resumeSimulation: event.target.value }))
                    }
                    rows={4}
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Commentaire client</Label>
              <Textarea
                value={form.commentaireClient}
                onChange={(event) =>
                  setForm((current) => ({ ...current, commentaireClient: event.target.value }))
                }
                rows={4}
              />
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
              <p className="text-sm font-medium">Devis</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {loadingQuote
                  ? "Calcul du prix en cours..."
                  : quote
                    ? `${formatCurrency(quote.prixTotal, quote.devise)} pour ${quote.dureeJours} jour(s)`
                    : "Completez la reservation pour obtenir le prix."}
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting || !quote} className="gap-2">
                <Save className="h-4 w-4" />
                {isSubmitting ? "Reservation..." : "Reserver"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
