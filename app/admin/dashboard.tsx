"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/client";
import { listUsers, UserSummary } from "@/lib/api/users";
import { getDashboardData } from "@/lib/api/dashboard";
import { DashboardResponse } from "@/lib/type/dashboard";
import { DASHBOARD_TEXTS } from "@/lib/constants/texts";
import { Loader2 } from "lucide-react";
import { ActivityChart } from "@/components/ui/activity-chart";
import { UserStatsChart } from "@/components/ui/user-stats-chart";
import { ActivityData } from "@/lib/type/dashboard";

type AdminDashboardProps = {
  role: string;
  accessToken: string;
};

export function AdminDashboard({ role, accessToken }: AdminDashboardProps) {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [usersError, setUsersError] = useState("");
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [dashboardError, setDashboardError] = useState("");
  const [loading, setLoading] = useState(true);

  // Generate dynamic activity data based on current dashboard counts
  const activityData = useMemo((): ActivityData[] => {
    // Use current values from dashboard cards
    const currentDestinations = dashboardData?.data.destinations.count || 0;
    const currentHebergements = dashboardData?.data.hebergements.count || 0;
    const currentActivites = dashboardData?.data.activites.count || 0;
    
    // Create simple historical progression based on current values
    return [
      { month: "Jan", destination: Math.max(0, currentDestinations - 4), hebergement: Math.max(0, currentHebergements - 3), activite: Math.max(0, currentActivites - 2) },
      { month: "Fév", destination: Math.max(0, currentDestinations - 3), hebergement: Math.max(0, currentHebergements - 2), activite: Math.max(0, currentActivites - 1) },
      { month: "Mar", destination: Math.max(0, currentDestinations - 2), hebergement: Math.max(0, currentHebergements - 1), activite: Math.max(0, currentActivites - 1) },
      { month: "Avr", destination: Math.max(0, currentDestinations - 1), hebergement: Math.max(0, currentHebergements - 1), activite: Math.max(0, currentActivites) },
      { month: "Mai", destination: Math.max(0, currentDestinations - 1), hebergement: Math.max(0, currentHebergements), activite: Math.max(0, currentActivites) },
      { month: "Jun", destination: currentDestinations, hebergement: currentHebergements, activite: currentActivites },
    ];
  }, [dashboardData]);

  // Mock data for user stats
  const userStatsData = [
    { name: "Admins", value: 5, color: "#3b82f6" },
    { name: "Premium", value: 120, color: "#10b981" },
    { name: "Standard", value: 280, color: "#6b7280" },
    { name: "Nouveaux", value: 45, color: "#f59e0b" },
  ];

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
          {DASHBOARD_TEXTS.TITLE}
        </h1>
        <p className="text-sm text-muted-foreground">
          {DASHBOARD_TEXTS.DESCRIPTION}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{DASHBOARD_TEXTS.LOADING}</p>
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
                <CardDescription>{DASHBOARD_TEXTS.DESTINATIONS}</CardDescription>
                <CardTitle className="text-2xl">
                  {dashboardData?.data.destinations.count || 0}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {DASHBOARD_TEXTS.LAST_UPDATE}: {dashboardData?.data.destinations.lastUpdate || DASHBOARD_TEXTS.NO_DATA}
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader>
                <CardDescription>{DASHBOARD_TEXTS.HEBERGEMENTS}</CardDescription>
                <CardTitle className="text-2xl">
                  {dashboardData?.data.hebergements.count || 0}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {dashboardData?.data.hebergements.pendingReviews || 0} {DASHBOARD_TEXTS.PENDING_REVIEWS}
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader>
                <CardDescription>{DASHBOARD_TEXTS.ACTIVITES}</CardDescription>
                <CardTitle className="text-2xl">
                  {dashboardData?.data.activites.count || 0}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {dashboardData?.data.activites.newThisMonth || 0} {DASHBOARD_TEXTS.NEW_THIS_MONTH}
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader>
                <CardDescription>{DASHBOARD_TEXTS.AVIS_EN_ATTENTE}</CardDescription>
                <CardTitle className="text-2xl">
                  {dashboardData?.data.avisEnAttente.count || 0}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {dashboardData?.data.avisEnAttente.status || DASHBOARD_TEXTS.NO_DATA}
              </CardContent>
            </Card>
          </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{DASHBOARD_TEXTS.RECENT_ACTIVITY}</CardTitle>
            <CardDescription>{DASHBOARD_TEXTS.LATEST_CHANGES}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <ActivityChart data={activityData} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{DASHBOARD_TEXTS.SHORTCUTS}</CardTitle>
            <CardDescription>{DASHBOARD_TEXTS.COMMON_TASKS}</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <h4 className="text-sm font-medium mb-3">Utilisateurs enregistrés</h4>
              <UserStatsChart data={userStatsData} />
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

