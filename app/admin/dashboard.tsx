"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/client";
import { listUsers, UserSummary } from "@/lib/api/users";
import { getDashboardData } from "@/lib/api/dashboard";
import { DashboardResponse } from "@/lib/type/dashboard";
import { Loader2 } from "lucide-react";

type AdminDashboardProps = {
  role: string;
  accessToken: string;
};

export function AdminDashboard({ role, accessToken }: AdminDashboardProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [usersError, setUsersError] = useState("");
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [dashboardError, setDashboardError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== "ADMIN" || !accessToken) return;
    let active = true;
    const loadUsers = async () => {
      try {
        const response = await listUsers(accessToken);
        if (active) {
          setUsers(response?.data ?? []);
        }
      } catch (error) {
        if (active) {
          setUsersError(
            getErrorMessage(error, "Network error while loading users")
          );
        }
      }
    };
    loadUsers();
    return () => {
      active = false;
    };
  }, [role, accessToken]);

  useEffect(() => {
    let active = true;
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await getDashboardData(accessToken);
        if (active) {
          setDashboardData(data);
        }
      } catch (error) {
        if (active) {
          setDashboardError(
            getErrorMessage(error, "Network error while loading dashboard data")
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadDashboardData();
    return () => {
      active = false;
    };
  }, [accessToken]);
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Tableau de bord
        </h1>
        <p className="text-sm text-muted-foreground">
          Vue d&apos;ensemble de l&apos;activité et de l&apos;état du contenu pour Cool Voyage.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement des données...</p>
          </div>
        </div>
      ) : (
        <>
          {dashboardError ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{dashboardError}</p>
            </div>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardDescription>Destinations</CardDescription>
                <CardTitle className="text-2xl">
                  {dashboardData?.data.destinations.count || 0}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Dernière mise à jour: {dashboardData?.data.destinations.lastUpdate || "N/A"}
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader>
                <CardDescription>Hébergements</CardDescription>
                <CardTitle className="text-2xl">
                  {dashboardData?.data.hebergements.count || 0}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {dashboardData?.data.hebergements.pendingReviews || 0} avis en attente
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader>
                <CardDescription>Activités</CardDescription>
                <CardTitle className="text-2xl">
                  {dashboardData?.data.activites.count || 0}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {dashboardData?.data.activites.newThisMonth || 0} nouvelles ce mois-ci
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader>
                <CardDescription>Avis en attente</CardDescription>
                <CardTitle className="text-2xl">
                  {dashboardData?.data.avisEnAttente.count || 0}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {dashboardData?.data.avisEnAttente.status || "N/A"}
              </CardContent>
            </Card>
          </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Derniers changements dans les modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-foreground">
              <div className="flex items-center justify-between rounded-md border bg-card/50 px-3 py-2">
                <span>Mise à jour des tarifs de destination: Manambato</span>
                <span className="text-xs text-muted-foreground">il y a 2h</span>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-card/50 px-3 py-2">
                <span>Nouvelle activité ajoutée: Tour en paddle</span>
                <span className="text-xs text-muted-foreground">il y a 6h</span>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-card/50 px-3 py-2">
                <span>3 réservations demandées</span>
                <span className="text-xs text-muted-foreground">Hier</span>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-card/50 px-3 py-2">
                <span>2 avis en attente d&apos;approbation</span>
                <span className="text-xs text-muted-foreground">Hier</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Raccourcis</CardTitle>
            <CardDescription>Tâches administratives courantes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              className="w-full" 
              variant="default"
              onClick={() => router.push('/admin/destination/creation')}
            >
             + Destination
            </Button>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => router.push('/admin/hebergements/creation')}
            >
              + Hébergement
            </Button>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => router.push('/admin/activites/creation')}
            >
              + Activité
            </Button>
            <Button className="w-full" variant="ghost">
              Vérifier les avis en attente
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Snapshots du trafic</CardTitle>
            <CardDescription>Visites et recherches hebdomadaires</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground">
            <div className="flex items-center justify-between rounded-md border bg-card/50 px-3 py-2">
              <span>Visites</span>
              <span className="text-sm font-medium">4,120</span>
            </div>
            <div className="flex items-center justify-between rounded-md border bg-card/50 px-3 py-2">
              <span>Recherches</span>
              <span className="text-sm font-medium">1,480</span>
            </div>
            <div className="flex items-center justify-between rounded-md border bg-card/50 px-3 py-2">
              <span>Taux de conversion</span>
              <span className="text-sm font-medium">3.1%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>État du système</CardTitle>
            <CardDescription>Liste de vérification des opérations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground">
            <div className="flex items-center justify-between rounded-md border bg-card/50 px-3 py-2">
              <span>Connectivité API</span>
              <span className="text-emerald-600">OK</span>
            </div>
            <div className="flex items-center justify-between rounded-md border bg-card/50 px-3 py-2">
              <span>File d&apos;attente email</span>
              <span className="text-emerald-600">Fonctionnel</span>
            </div>
            <div className="flex items-center justify-between rounded-md border bg-card/50 px-3 py-2">
              <span>Sauvegardes</span>
              <span className="text-emerald-600">À jour</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {role === "ADMIN" ? (
        <section className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs</CardTitle>
              <CardDescription>Liste de tous les utilisateurs (admin uniquement).</CardDescription>
            </CardHeader>
            <CardContent>
              {usersError ? (
                <p className="text-sm text-red-600">{usersError}</p>
              ) : null}
              <div className="space-y-2 text-sm">
                {users.length === 0 && !usersError ? (
                  <p className="text-muted-foreground">Aucun utilisateur chargé.</p>
                ) : null}
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 bg-card/50 px-3 py-2"
                  >
                    <div className="min-w-[180px] font-medium">
                      {user.nom} {user.prenom}
                    </div>
                    <div className="min-w-[180px] text-muted-foreground">
                      {user.email}
                    </div>
                    <div className="text-xs uppercase text-muted-foreground">
                      {user.role}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.estActif ? "Actif" : "Inactif"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}
        </>
      )}
    </div>
  );
}

