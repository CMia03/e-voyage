"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Link2, Home, Activity, Plus, ArrowLeft, Search, Filter } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loadAuth } from "@/lib/auth";
import { getAdminDestination } from "@/lib/api/destinations";
import type { AdminDestination } from "@/lib/type/destination";

type AdminDestinationPrestationsContentProps = {
  destinationId: string;
};

export function AdminDestinationPrestationsContent({
  destinationId,
}: AdminDestinationPrestationsContentProps) {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [role, setRole] = useState("");
  const [destination, setDestination] = useState<AdminDestination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const auth = loadAuth();
    if (auth) {
      setAccessToken(auth.accessToken);
      setRole(auth.role);
    }
  }, []);

  useEffect(() => {
    async function loadDestination() {
      if (!accessToken) return;
      try {
        const response = await getAdminDestination(destinationId, accessToken);
        setDestination(response.data ?? null);
      } catch (err) {
        setError("Impossible de charger les informations de la destination.");
      } finally {
        setIsLoading(false);
      }
    }

    if (accessToken) {
      loadDestination();
    }
  }, [destinationId, accessToken]);

  if (!accessToken || role !== "ADMIN") {
    return null;
  }

  return (
    <div className="bg-gradient-to-b from-background via-muted/30 to-background text-foreground">
      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="space-y-8">
          {/* Header avec navigation et boutons de section */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/destination/${destinationId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                  </Link>
                </Button>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    {destination?.nom ?? "Prestations destination"}
                  </h1>
                  <p className="text-muted-foreground">
                    Gérez les prestations et services pour cette destination
                  </p>
                </div>
              </div>
            </div>

            {/* Boutons de section - toujours visibles */}
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
              >
                <Link href={`/admin/destination/${destinationId}/parametrage`}>
                  <Link2 className="mr-2 h-4 w-4" />
                  Paramétrage
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
              >
                <Link href={`/admin/destination/${destinationId}/associations`}>
                  <Home className="mr-2 h-4 w-4" />
                  Hébergements
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
              >
                <Link href={`/admin/destination/${destinationId}/associations`}>
                  <Activity className="mr-2 h-4 w-4" />
                  Activités
                </Link>
              </Button>
              <Button
                asChild
                variant="default"
                size="sm"
              >
                <Link href={`/admin/destination/${destinationId}/prestations`}>
                  <Package className="mr-2 h-4 w-4" />
                  Prestations
                </Link>
              </Button>
            </div>
          </div>

          {/* Messages d'alerte */}
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {/* Contenu principal - Prestations */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Gestion des prestations</CardTitle>
                  <CardDescription>
                    Ajoutez, modifiez ou supprimez les prestations disponibles pour cette destination.
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une prestation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Barre de recherche et filtres */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher une prestation..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Filtrer
                    </Button>
                  </div>

                  {/* Liste des prestations */}
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune prestation</h3>
                    <p className="text-muted-foreground mb-4">
                      Commencez par ajouter des prestations pour cette destination.
                    </p>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter la première prestation
                    </Button>
                  </div>

                  {/* Exemple de carte de prestation (à décommenter quand il y aura des données) */}
                  {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="text-base">Nom de la prestation</CardTitle>
                        <CardDescription>Type de prestation</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Description détaillée de la prestation...
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Prix: 0 Ar</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">Modifier</Button>
                            <Button size="sm" variant="destructive">Supprimer</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div> */}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
