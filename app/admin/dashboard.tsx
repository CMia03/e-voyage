"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/client";
import { getDashboardData } from "@/lib/api/dashboard";
import { getUsers, UserSummary } from "@/lib/api/users";
import { DASHBOARD_TEXTS } from "@/lib/constants/texts";
import { DashboardResponse } from "@/lib/type/dashboard";
import { Loader2, UsersRound } from "lucide-react";
import { PlanificationPerformanceChart } from "@/components/ui/planification-performance-chart";
import { UserStatsChart } from "@/components/ui/user-stats-chart";

type AdminDashboardProps = {
  role: string;
  accessToken: string;
};

const destinationTravelerColors = ["#10b981", "#f59e0b", "#3b82f6", "#64748b", "#14b8a6", "#a855f7"];
const periodOptions = [
  { value: "MONTH", label: "Ce mois" },
  { value: "LAST_3_MONTHS", label: "3 derniers mois" },
  { value: "YEAR", label: "Cette année" },
  { value: "ALL", label: "Toutes les périodes" },
  { value: "BY_PLANIFICATION", label: "Par planification" },
] as const;

type PeriodFilter = (typeof periodOptions)[number]["value"];

function isInSelectedPeriod(periodMonth: string | null | undefined, filter: PeriodFilter) {
  if (filter === "ALL" || filter === "BY_PLANIFICATION") return true;
  if (!periodMonth) return false;

  const current = new Date();
  const period = new Date(`${periodMonth}T00:00:00`);
  if (Number.isNaN(period.getTime())) return false;

  const currentMonth = new Date(current.getFullYear(), current.getMonth(), 1);
  const periodStart = new Date(period.getFullYear(), period.getMonth(), 1);

  if (filter === "MONTH") {
    return periodStart.getTime() === currentMonth.getTime();
  }

  if (filter === "LAST_3_MONTHS") {
    const start = new Date(current.getFullYear(), current.getMonth() - 2, 1);
    return periodStart >= start && periodStart <= currentMonth;
  }

  return periodStart.getFullYear() === current.getFullYear();
}

export function AdminDashboard({ role, accessToken }: AdminDashboardProps) {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [dashboardError, setDashboardError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDestinationId, setSelectedDestinationId] = useState("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("ALL");

  const destinationTravelerData = useMemo(
    () =>
      (dashboardData?.data.voyageursParDestination ?? []).map((item, index) => ({
        name: item.destinationName,
        value: item.pourcentage,
        count: item.nombrePersonnes,
        color: destinationTravelerColors[index % destinationTravelerColors.length],
      })),
    [dashboardData?.data.voyageursParDestination]
  );

  const totalClients = users.filter((user) => user.role === "USER").length;

  const performancePlanifications = useMemo(
    () => dashboardData?.data.performancePlanifications ?? [],
    [dashboardData?.data.performancePlanifications]
  );
  const destinationOptions = useMemo(() => {
    const destinations = new Map<string, string>();
    performancePlanifications.forEach((item) => {
      destinations.set(item.destinationId, item.destinationName);
    });
    return Array.from(destinations.entries()).map(([id, name]) => ({ id, name }));
  }, [performancePlanifications]);

  const filteredPerformancePlanifications = useMemo(() => {
    return performancePlanifications
      .filter((item) => selectedDestinationId === "ALL" || item.destinationId === selectedDestinationId)
      .filter((item) => isInSelectedPeriod(item.periodMonth, selectedPeriod))
      .sort(
        (a, b) =>
          new Date(`${a.periodMonth}T00:00:00`).getTime() -
          new Date(`${b.periodMonth}T00:00:00`).getTime()
      );
  }, [performancePlanifications, selectedDestinationId, selectedPeriod]);

  useEffect(() => {
    if (role !== "ADMIN" || !accessToken) return;
    let active = true;
    const loadUsers = async () => {
      try {
        const response = await getUsers(accessToken);
        if (active) {
          setUsers(response?.data ?? []);
        }
      } catch (error) {
        if (active) {
          console.error(getErrorMessage(error, "Network error while loading users"));
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
          setDashboardError(getErrorMessage(error, "Network error while loading dashboard data"));
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
        <p className="text-sm text-muted-foreground">{DASHBOARD_TEXTS.DESCRIPTION}</p>
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
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-600">{dashboardError}</p>
            </div>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardDescription>{DASHBOARD_TEXTS.DESTINATIONS}</CardDescription>
                <CardTitle className="text-2xl">{dashboardData?.data.destinations.count || 0}</CardTitle>
              </CardHeader>
             
            </Card>
            <Card className="border-border/50">
              <CardHeader>
                <CardDescription>{DASHBOARD_TEXTS.HEBERGEMENTS}</CardDescription>
                <CardTitle className="text-2xl">{dashboardData?.data.hebergements.count || 0}</CardTitle>
              </CardHeader>
             
            </Card>
            <Card className="border-border/50">
              <CardHeader>
                <CardDescription>{DASHBOARD_TEXTS.ACTIVITES}</CardDescription>
                <CardTitle className="text-2xl">{dashboardData?.data.activites.count || 0}</CardTitle>
              </CardHeader>
             
            </Card>
            <Card className="border-border/50">
              <CardHeader>
                <CardDescription>{DASHBOARD_TEXTS.AVIS_EN_ATTENTE}</CardDescription>
                <CardTitle className="text-2xl">{totalClients}</CardTitle>
              </CardHeader>
              
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(420px,0.9fr)]">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Évolution des réservations</CardTitle>
                    <CardDescription>
                      Courbe des reservations validees, en attente et annulees par planification.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      value={selectedDestinationId}
                      onChange={(event) => setSelectedDestinationId(event.target.value)}
                      className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-emerald-500"
                    >
                      <option value="ALL">Toutes les destinations</option>
                      {destinationOptions.map((destination) => (
                        <option key={destination.id} value={destination.id}>
                          {destination.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedPeriod}
                      onChange={(event) => setSelectedPeriod(event.target.value as PeriodFilter)}
                      className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-emerald-500"
                    >
                      {periodOptions.map((period) => (
                        <option key={period.value} value={period.value}>
                          {period.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PlanificationPerformanceChart
                  data={filteredPerformancePlanifications}
                  groupBy={selectedPeriod === "BY_PLANIFICATION" ? "planification" : "month"}
                />
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <UsersRound className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold tracking-tight text-slate-950">
                      {DASHBOARD_TEXTS.SHORTCUTS}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <UserStatsChart data={destinationTravelerData} updatedAt={dashboardData?.timestamp} />
              </CardContent>
            </Card>
          </section>

        </>
      )}
    </div>
  );
}
