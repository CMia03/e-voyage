"use client";

import { useState, useEffect } from "react";
import { loadAuth } from "@/lib/auth";
import { listDestinations } from "@/lib/api/destinations";
import { listPlanificationsByDestination } from "@/lib/api/destinations";
import type { DestinationDetails, PlanificationVoyage } from "@/lib/type/destination";

export default function PlanificationsPage() {
  const [destinations, setDestinations] = useState<DestinationDetails[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>("");
  const [planifications, setPlanifications] = useState<PlanificationVoyage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les destinations
  useEffect(() => {
    const loadDestinations = async () => {
      try {
        const data = await listDestinations();
        setDestinations(data);
        if (data.length > 0) {
          setSelectedDestinationId(data[0].id);
        }
      } catch (error) {
        console.error("Erreur chargement destinations:", error);
        setError("Impossible de charger les destinations");
      }
    };
    loadDestinations();
  }, []);

  // Charger les planifications quand la destination change
  useEffect(() => {
    if (!selectedDestinationId) return;
    
    const loadPlanifications = async () => {
      setLoading(true);
      setError(null);
      try {
        // Récupérer le token de l'utilisateur connecté
        const session = loadAuth();
        const token = session?.accessToken;
        
        console.log("Chargement planifications pour destination:", selectedDestinationId);
        console.log("Token présent:", !!token);
        
        // Appel avec le token
        const response = await listPlanificationsByDestination(selectedDestinationId, token);
        console.log("Réponse reçue:", response);
        
        if (response.data) {
          setPlanifications(response.data);
        } else {
          setPlanifications([]);
        }
      } catch (error: any) {
        console.error("Erreur chargement planifications:", error);
        setError(error.message || "Erreur lors du chargement des planifications");
        setPlanifications([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadPlanifications();
  }, [selectedDestinationId]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Planifications</h1>
      <p className="text-sm text-muted-foreground">
        Découvrez les forfaits disponibles pour chaque destination.
      </p>

      {/* Sélecteur de destination */}
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

      {/* Message d'erreur */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">
          ❌ {error}
        </div>
      )}

      {/* Chargement */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Chargement des planifications...</p>
        </div>
      )}

      {/* Liste des planifications */}
      {!loading && planifications.length > 0 && (
        <div className="grid gap-4">
          {planifications.map((planif) => (
            <div key={planif.id} className="rounded-xl border border-border/60 bg-card p-4 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg">{planif.nomPlanification}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                📅 {planif.jours?.length || 0} jours • 💰 {(planif.budgetTotal || 0).toLocaleString()} Ar
              </p>
              <p className="text-sm mt-2">
                🚀 Départ: {planif.depart || "Non spécifié"} → 🏁 Arrivée: {planif.arriver || "Non spécifié"}
              </p>
              {planif.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  📝 {planif.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Aucun résultat */}
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