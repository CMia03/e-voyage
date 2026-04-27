"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/api/client";
import { deleteMyReservation, getReservationById } from "@/lib/api/reservations";
import { Reservation, ReservationStatus } from "@/lib/type/reservation";

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
  const detail = reservation?.details[0] ?? null;

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

  const editHref = useMemo(() => {
    if (!reservation || !detail) return null;

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
    params.set("nombrePersonnes", String(detail.nombrePersonnes));
    if (detail.elementsSelectionnes.length > 0) {
      params.set("elementsSelectionnes", detail.elementsSelectionnes.join(","));
    }
    if (detail.resumeSimulation) {
      params.set("resumeSimulation", detail.resumeSimulation);
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

    const params = new URLSearchParams();
    params.set("editReservationId", reservation.id);
    params.set("destinationId", detail.destinationId);
    params.set("destinationTitle", detail.nomDestination);
    params.set("planificationId", detail.planificationVoyageId);
    params.set("planificationTitle", detail.nomPlanification);
    params.set("categorieId", detail.categorieClientId);
    params.set("categorieTitle", detail.nomCategorieClient);
    params.set("gamme", detail.gamme);
    params.set("nombrePersonnes", String(detail.nombrePersonnes));
    const budgetClient = extractBudgetClientFromSummary(detail.resumeSimulation);
    if (budgetClient > 0) {
      params.set("budgetClient", String(budgetClient));
    }
    if (detail.elementsSelectionnes.length > 0) {
      params.set("elementsSelectionnes", detail.elementsSelectionnes.join(","));
    }
    if (detail.resumeSimulation) {
      params.set("resumeSimulation", detail.resumeSimulation);
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

            {reservation.details.map((detail, index) => (
              <Card key={detail.id} className="border-border/50">
                <CardHeader>
                  <CardTitle>
                    Detail voyage {reservation.details.length > 1 ? index + 1 : ""}
                  </CardTitle>
                  <CardDescription>
                    {detail.nomDestination} - {detail.nomPlanification}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-xl border border-border/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Categorie</p>
                      <p className="mt-2 font-medium">{detail.nomCategorieClient}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Gamme</p>
                      <p className="mt-2 font-medium">{detail.gamme}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Voyageurs</p>
                      <p className="mt-2 font-medium">{detail.nombrePersonnes}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Prix unitaire</p>
                      <p className="mt-2 font-medium">
                        {formatCurrency(detail.prixUnitaire, reservation.devise)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Prix total</p>
                      <p className="mt-2 font-medium">
                        {formatCurrency(detail.prixTotal, reservation.devise)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Cree le</p>
                      <p className="mt-2 font-medium">{formatDate(detail.dateCreation)}</p>
                    </div>
                  </div>

                  {detail.elementsSelectionnes.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Elements selectionnes</p>
                      <div className="flex flex-wrap gap-2">
                        {detail.elementsSelectionnes.map((element) => (
                          <Badge key={element} variant="outline">
                            {element}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {detail.resumeSimulation ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                      <p className="text-sm font-medium text-emerald-900">Resume de simulation</p>
                      <pre className="mt-3 whitespace-pre-wrap text-sm text-emerald-900/85">
                        {detail.resumeSimulation}
                      </pre>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
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
                <div className="rounded-xl border border-dashed border-border/70 p-4">
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
                </div>
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
    </div>
  );
}
