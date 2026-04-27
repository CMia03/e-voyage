"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { loadAuth } from "@/lib/auth";
import { listDestinations } from "@/lib/api/destinations";
import { listPlanificationsByDestination } from "@/lib/api/destinations";
import { listBudgetisationsByPlanification } from "@/lib/api/budgetisation-planification";
import type { DestinationDetails, PlanificationVoyage } from "@/lib/type/destination";
import type { BudgetisationPlanificationVoyage } from "@/lib/type/budgetisation-planification";
import { Button } from "@/components/ui/button";

function formatAr(value?: number | null) {
  return `${Math.round(value ?? 0).toLocaleString("fr-MG")} Ar`;
}

export default function PlanificationsPage() {
  const params = useParams<{ username: string }>();
  const username = typeof params?.username === "string" ? params.username : "client";
  const [destinations, setDestinations] = useState<DestinationDetails[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>("");
  const [planifications, setPlanifications] = useState<PlanificationVoyage[]>([]);
  const [budgetisationsByPlanification, setBudgetisationsByPlanification] = useState<Record<string, BudgetisationPlanificationVoyage[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        const data = await listDestinations();
        setDestinations(data);
        if (data.length > 0) {
          setSelectedDestinationId(data[0].id);
        }
      } catch (requestError) {
        console.error("Erreur chargement destinations:", requestError);
        setError("Impossible de charger les destinations");
      }
    };
    void loadDestinations();
  }, []);

  useEffect(() => {
    if (!selectedDestinationId) return;

    const loadPlanifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const session = loadAuth();
        const token = session?.accessToken;
        const response = await listPlanificationsByDestination(selectedDestinationId, token);

        if (response.data) {
          setPlanifications(response.data);
        } else {
          setPlanifications([]);
        }
      } catch (requestError: unknown) {
        console.error("Erreur chargement planifications:", requestError);
        setError(requestError instanceof Error ? requestError.message : "Erreur lors du chargement des planifications");
        setPlanifications([]);
      } finally {
        setLoading(false);
      }
    };

    void loadPlanifications();
  }, [selectedDestinationId]);

  useEffect(() => {
    if (planifications.length === 0) {
      setBudgetisationsByPlanification({});
      return;
    }

    let active = true;

    const loadBudgetisations = async () => {
      try {
        const session = loadAuth();
        const token = session?.accessToken;
        const entries = await Promise.all(
          planifications.map(async (planification) => {
            const response = await listBudgetisationsByPlanification(planification.id, token);
            return [planification.id, response.data ?? []] as const;
          })
        );

        if (active) {
          setBudgetisationsByPlanification(Object.fromEntries(entries));
        }
      } catch (requestError) {
        console.error("Erreur chargement budgetisations:", requestError);
        if (active) {
          setBudgetisationsByPlanification({});
        }
      }
    };

    void loadBudgetisations();

    return () => {
      active = false;
    };
  }, [planifications]);

  const selectedDestination =
    destinations.find((destination) => destination.id === selectedDestinationId) ?? null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Planifications</h1>
      <p className="text-sm text-muted-foreground">
        Decouvrez les forfaits disponibles pour chaque destination.
      </p>

      <div className="rounded-xl border border-border/60 bg-card p-4">
        <label className="text-sm font-medium">Destination</label>
        <select
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
          value={selectedDestinationId}
          onChange={(e) => setSelectedDestinationId(e.target.value)}
        >
          {destinations.map((dest) => (
            <option key={dest.id} value={dest.id}>
              {dest.title}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Chargement des planifications...</p>
        </div>
      )}

      {!loading && planifications.length > 0 && (
        <div className="grid gap-4">
          {planifications.map((planif) => (
            <div key={planif.id} className="rounded-xl border border-border/60 bg-card p-4 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg">{planif.nomPlanification}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {planif.jours?.length || 0} jours • {(planif.budgetTotal || 0).toLocaleString()} Ar
              </p>
              <p className="text-sm mt-2">
                Depart: {planif.depart || "Non specifie"} ? Arrivee: {planif.arriver || "Non specifie"}
              </p>
              {planif.description ? (
                <p className="text-sm text-muted-foreground mt-2">{planif.description}</p>
              ) : null}
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Reservation directe depuis le prix
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Choisissez une ligne de budgetisation pour reserver tout de suite sans passer par la simulation.
                  </p>

                  <div className="mt-3 grid gap-3">
                    {(budgetisationsByPlanification[planif.id] ?? []).length > 0 ? (
                      (budgetisationsByPlanification[planif.id] ?? []).map((budgetisation) => (
                        <div
                          key={budgetisation.id}
                          className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-white p-3 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                                {budgetisation.nomCategorieClient}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                                {budgetisation.gamme}
                              </span>
                              <span>{budgetisation.nombrePersonnes} pers</span>
                            </div>
                            <p className="text-base font-semibold text-emerald-700">
                              {formatAr(budgetisation.prixAvecReduction)}
                            </p>
                          </div>

                          <Button asChild size="sm">
                            <Link
                              href={`/${username}/reservations?source=PRIX_DIRECT&destinationId=${encodeURIComponent(
                                selectedDestinationId
                              )}&destinationTitle=${encodeURIComponent(
                                selectedDestination?.title ?? ""
                              )}&planificationId=${encodeURIComponent(
                                planif.id
                              )}&planificationTitle=${encodeURIComponent(
                                planif.nomPlanification
                              )}&categorieId=${encodeURIComponent(
                                budgetisation.idCategorieClient
                              )}&categorieTitle=${encodeURIComponent(
                                budgetisation.nomCategorieClient
                              )}&gamme=${encodeURIComponent(
                                budgetisation.gamme
                              )}&nombrePersonnes=${encodeURIComponent(
                                String(budgetisation.nombrePersonnes)
                              )}`}
                            >
                              Reserver tout de suite
                            </Link>
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-emerald-200 px-4 py-3 text-sm text-muted-foreground">
                        Aucune budgetisation disponible pour cette planification.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/${username}/simulation?destinationId=${encodeURIComponent(selectedDestinationId)}&planificationId=${encodeURIComponent(planif.id)}`}>
                      Simuler puis reserver
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && planifications.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-border/70 bg-card p-6 text-center">
          <p className="text-muted-foreground">
            Aucune planification disponible pour cette destination.
          </p>
        </div>
      )}
    </div>
  );
}
