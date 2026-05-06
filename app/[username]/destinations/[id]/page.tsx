"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings, Package, MapPin, Phone, Calendar, Clock, Star } from "lucide-react";
import { DestinationDetailsComponent } from "@/components/destination-details";
import { destinationsData as fallbackDestinations } from "@/lib/destinations";
import { listDestinations } from "@/lib/api/destinations";
import type { DestinationDetails } from "@/lib/type/destination";

export default function DestinationDetailPage() {
  const params = useParams<{ username: string; id: string }>();
  const router = useRouter();
  const username = typeof params?.username === "string" ? params.username : "client";
  const destinationId = typeof params?.id === "string" ? params.id : "";
  
  const [destination, setDestination] = useState<DestinationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDestination = async () => {
      try {
        setLoading(true);
        const data = await listDestinations();
        if (data.length > 0) {
          const found = data.find((dest: DestinationDetails) => dest.id === destinationId);
          if (found) {
            setDestination(found);
          } else {
            // Fallback to static data
            const fallback = fallbackDestinations.find((dest: DestinationDetails) => dest.id === destinationId);
            if (fallback) {
              setDestination(fallback);
            } else {
              setError("Destination non trouvée");
            }
          }
        } else {
          // Fallback to static data
          const fallback = fallbackDestinations.find((dest: DestinationDetails) => dest.id === destinationId);
          if (fallback) {
            setDestination(fallback);
          } else {
            setError("Destination non trouvée");
          }
        }
      } catch (err) {
        console.error("Erreur chargement destination:", err);
        // Fallback to static data
        const fallback = fallbackDestinations.find((dest: DestinationDetails) => dest.id === destinationId);
        if (fallback) {
          setDestination(fallback);
        } else {
          setError("Destination non trouvée");
        }
      } finally {
        setLoading(false);
      }
    };

    if (destinationId) {
      loadDestination();
    }
  }, [destinationId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement de la destination...</p>
        </div>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Destination non trouvée</h2>
            <p className="text-slate-600 mb-4">{error || "La destination demandée n'existe pas."}</p>
            <Button asChild>
              <Link href={`/${username}/destinations`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux destinations
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header avec navigation et boutons d'action */}
      <div className="bg-white border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/${username}/destinations`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{destination.title}</h1>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4" />
                  <span>{destination.departure?.location || "Localisation non spécifiée"}</span>
                  {destination.rating && (
                    <>
                      <span className="text-slate-400">•</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{destination.rating.toFixed(1)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Bouton Paramétrage */}
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => {
                  // TODO: Implémenter la navigation vers la page de paramétrage
                  console.log("Paramétrage pour la destination:", destination.id);
                }}
              >
                <Settings className="h-4 w-4" />
                Paramétrage
              </Button>
              
              {/* Bouton Prestation */}
              <Button 
                className="flex items-center gap-2"
                onClick={() => {
                  // TODO: Implémenter la navigation vers la page des prestations
                  console.log("Prestations pour la destination:", destination.id);
                }}
              >
                <Package className="h-4 w-4" />
                Prestations
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DestinationDetailsComponent destination={destination} />
      </div>
    </div>
  );
}
