"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { loadAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/api/client";
import { listDestinations, listPlanificationsByDestination } from "@/lib/api/destinations";
import { listCategorieClientActivites } from "@/lib/api/activites";
import {
  calculateReservationQuote,
  createReservationFromPrice,
  createReservationFromSimulation,
  listMyReservations,
} from "@/lib/api/reservations";
import {
  Reservation,
  ReservationCreatePayload,
  ReservationQuote,
  ReservationSource,
  ReservationStatus,
} from "@/lib/type/reservation";
import type { DestinationDetails, PlanificationVoyage } from "@/lib/type/destination";

type CategorieClient = {
  id: string;
  nom: string;
};

type ReservationFormState = {
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

const initialForm: ReservationFormState = {
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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR");
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildPayload(form: ReservationFormState): ReservationCreatePayload {
  return {
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
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined,
    resumeSimulation:
      form.source === "SIMULATION" && form.resumeSimulation.trim()
        ? form.resumeSimulation.trim()
        : undefined,
  };
}

export default function ReservationsPage() {
  const params = useParams<{ username: string }>();
  const searchParams = useSearchParams();
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

  const session = useMemo(() => loadAuth(), []);
  const token = session?.accessToken;

  const prefill = useMemo(() => ({
    source: searchParams?.get("source") === "SIMULATION" ? "SIMULATION" as ReservationSource : null,
    destinationId: searchParams?.get("destinationId") || null,
    planificationVoyageId: searchParams?.get("planificationId") || null,
    categorieClientId: searchParams?.get("categorieId") || null,
    gamme: searchParams?.get("gamme") || null,
    nombrePersonnes: parsePositiveInteger(searchParams?.get("nombrePersonnes") ?? null, initialForm.nombrePersonnes),
    elementsSelectionnes: searchParams?.get("elementsSelectionnes") || null,
    resumeSimulation: searchParams?.get("resumeSimulation") || null,
    commentaireClient: searchParams?.get("commentaireClient") || null,
  }), [searchParams]);

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
        setForm((current) => ({
          ...current,
          destinationId: current.destinationId || prefill.destinationId || loadedDestinations[0]?.id || "",
          categorieClientId: current.categorieClientId || prefill.categorieClientId || loadedCategories[0]?.id || "",
          gamme: current.gamme || prefill.gamme || initialForm.gamme,
          nombrePersonnes: current.nombrePersonnes || prefill.nombrePersonnes || initialForm.nombrePersonnes,
        }));
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Impossible de charger les donnees de reservation."));
      } finally {
        setLoadingReservations(false);
      }
    };

    void loadInitialData();
  }, [prefill.categorieClientId, prefill.destinationId, prefill.gamme, prefill.nombrePersonnes, token]);

  useEffect(() => {
    if (!searchParams) return;

    setForm((current) => ({
      ...current,
      source: prefill.source ?? current.source,
      destinationId: prefill.destinationId ?? current.destinationId,
      planificationVoyageId: prefill.planificationVoyageId ?? current.planificationVoyageId,
      categorieClientId: prefill.categorieClientId ?? current.categorieClientId,
      gamme: prefill.gamme ?? current.gamme,
      nombrePersonnes: prefill.nombrePersonnes || current.nombrePersonnes,
      elementsSelectionnes: prefill.elementsSelectionnes ?? current.elementsSelectionnes,
      resumeSimulation: prefill.resumeSimulation ?? current.resumeSimulation,
      commentaireClient: prefill.commentaireClient ?? current.commentaireClient,
    }));
  }, [prefill, searchParams]);

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
            loadedPlanifications.some((item) => item.id === current.planificationVoyageId)
              ? current.planificationVoyageId
              : loadedPlanifications.some((item) => item.id === prefill.planificationVoyageId)
                ? prefill.planificationVoyageId || ""
                : loadedPlanifications[0]?.id || "",
        }));
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Impossible de charger les planifications."));
        setPlanifications([]);
      }
    };

    void loadPlanifications();
  }, [form.destinationId, prefill.planificationVoyageId, token]);

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
    token,
  ]);

  const selectedDestination = destinations.find((item) => item.id === form.destinationId) ?? null;
  const selectedPlanification = planifications.find((item) => item.id === form.planificationVoyageId) ?? null;
  const canSubmitReservation = !!token && !!form.destinationId && !!form.planificationVoyageId && !!form.categorieClientId && !!form.gamme && form.nombrePersonnes > 0 && !isSubmitting;

  const handleCreateReservation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    if (!form.destinationId || !form.planificationVoyageId || !form.categorieClientId || !form.gamme || form.nombrePersonnes <= 0) {
      setError("Veuillez completer les informations obligatoires avant de reserver.");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const payload = buildPayload(form);
      const response =
        form.source === "SIMULATION"
          ? await createReservationFromSimulation(payload, token)
          : await createReservationFromPrice(payload, token);

      const created = response.data;
      if (created) {
        setReservations((current) => [created, ...current]);
      }
      setSuccess(response.message ?? "Reservation creee avec succes.");
      setForm((current) => ({
        ...initialForm,
        destinationId: current.destinationId,
        categorieClientId: current.categorieClientId,
      }));
      setQuote(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Impossible de creer la reservation."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mes reservations</h1>
        <p className="text-sm text-muted-foreground">
          Creez une reservation depuis un prix direct ou en vous appuyant sur votre simulation.
        </p>
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Nouvelle reservation</CardTitle>
            <CardDescription>
              Choisissez votre mode de reservation puis confirmez votre demande.
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
                  onClick={() => setForm((current) => ({ ...current, source: "SIMULATION" }))}
                >
                  <p className="font-medium">Depuis une simulation</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Conservez les choix d'une simulation pour lancer votre demande.
                  </p>
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, planificationVoyageId: value }))
                    }
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
                      <SelectValue placeholder="Selectionner une gamme" />
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
                      placeholder="Ex: ACT-01, HEB-02, TRANS-03"
                    />
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
                    {isSubmitting ? "Reservation en cours..." : "Confirmer la reservation"}
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
              <CardDescription>Un devis est calcule automatiquement selon vos choix.</CardDescription>
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
                  ? `Estimation basee sur ${quote.dureeJours} jour(s) et ${form.nombrePersonnes} voyageur(s).`
                  : quoteError || "Selectionnez une planification, une categorie et une gamme pour obtenir un devis."}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Historique</CardTitle>
              <CardDescription>Vos reservations les plus recentes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingReservations ? (
                <p className="text-sm text-muted-foreground">Chargement des reservations...</p>
              ) : reservations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune reservation pour le moment.</p>
              ) : (
                reservations.map((reservation) => {
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
          </Card>
        </div>
      </div>
    </div>
  );
}
