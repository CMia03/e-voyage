"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Link2, Home, Activity, Package, ArrowLeft } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadAuth } from "@/lib/auth";
import { getAdminDestination } from "@/lib/api/destinations";
import type { AdminDestination } from "@/lib/type/destination";

type AdminDestinationParametrageContentProps = {
  destinationId: string;
};

export function AdminDestinationParametrageContent({
  destinationId,
}: AdminDestinationParametrageContentProps) {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [role, setRole] = useState("");
  const [destination, setDestination] = useState<AdminDestination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("associations");

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
      <main className="mx-auto w-full px-4 py-6 sm:py-8">
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
                    {destination?.nom ?? "Paramétrage destination"}
                  </h1>
                  <p className="text-muted-foreground">
                    Gérez les relations et associations pour cette destination
                  </p>
                </div>
              </div>
            </div>

            {/* Boutons de section - toujours visibles */}
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                variant={activeTab === "associations" ? "default" : "outline"}
                size="sm"
              >
                <Link href={`/admin/destination/${destinationId}/parametrage`}>
                  <Link2 className="mr-2 h-4 w-4" />
                  Associations
                </Link>
              </Button>
              <Button
                asChild
                variant={activeTab === "hebergements" ? "default" : "outline"}
                size="sm"
              >
                <Link href={`/admin/destination/${destinationId}/parametrage?tab=hebergements`}>
                  <Home className="mr-2 h-4 w-4" />
                  Hébergements
                </Link>
              </Button>
              <Button
                asChild
                variant={activeTab === "activites" ? "default" : "outline"}
                size="sm"
              >
                <Link href={`/admin/destination/${destinationId}/parametrage?tab=activites`}>
                  <Activity className="mr-2 h-4 w-4" />
                  Activités
                </Link>
              </Button>
              <Button
                asChild
                variant={activeTab === "prestations" ? "default" : "outline"}
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

          {/* Contenu principal selon la section active */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>
                {activeTab === "associations" && "Gestion des associations"}
                {activeTab === "hebergements" && "Gestion des hébergements"}
                {activeTab === "activites" && "Gestion des activités"}
              </CardTitle>
              <CardDescription>
                {activeTab === "associations" && "Configurez les relations entre la destination et ses éléments associés."}
                {activeTab === "hebergements" && "Gérez les hébergements disponibles pour cette destination."}
                {activeTab === "activites" && "Gérez les activités proposées pour cette destination."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-6">
                  {activeTab === "associations" && (
                    <div className="text-center py-12">
                      <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Gestion des associations</h3>
                      <p className="text-muted-foreground mb-4">
                        Configurez ici les relations entre activités, hébergements et cette destination.
                      </p>
                      <Button onClick={() => router.push(`/admin/destination/${destinationId}/associations`)}>
                        Gérer les associations
                      </Button>
                    </div>
                  )}
                  
                  {activeTab === "hebergements" && (
                    <div className="text-center py-12">
                      <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Gestion des hébergements</h3>
                      <p className="text-muted-foreground mb-4">
                        Ajoutez, modifiez ou supprimez les hébergements pour cette destination.
                      </p>
                      <Button>Ajouter un hébergement</Button>
                    </div>
                  )}
                  
                  {activeTab === "activites" && (
                    <div className="text-center py-12">
                      <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Gestion des activités</h3>
                      <p className="text-muted-foreground mb-4">
                        Configurez les activités disponibles pour cette destination.
                      </p>
                      <Button>Ajouter une activité</Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
