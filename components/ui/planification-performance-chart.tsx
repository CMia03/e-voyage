"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface PlanificationPerformanceData {
  destinationId: string;
  destinationName: string;
  planificationId: string;
  planificationName: string;
  periodMonth: string;
  validees: number;
  enAttente: number;
  annulees: number;
  total: number;
}

interface PlanificationPerformanceChartProps {
  data: PlanificationPerformanceData[];
  groupBy: "month" | "planification";
}

function getShortLabel(value: string) {
  return value.length > 22 ? `${value.slice(0, 22)}...` : value;
}

function formatDashboardText(value?: string | null) {
  return (value ?? "")
    .replace(/S‚jour/g, "Séjour")
    .replace(/SÃ©jour/g, "Séjour")
    .replace(/Ao–t/g, "Août")
    .replace(/AoÃ»t/g, "Août")
    .replace(/…/g, "à")
    .replace(/‚/g, "é")
    .replace(/–/g, "û")
    .replace(/“/g, "ô")
    .replace(/Š/g, "è")
    .replace(/Œ/g, "î")
    .replace(/Ã©/g, "é")
    .replace(/Ã¨/g, "è")
    .replace(/Ãª/g, "ê")
    .replace(/Ã«/g, "ë")
    .replace(/Ã /g, "à")
    .replace(/Ã¢/g, "â")
    .replace(/Ã®/g, "î")
    .replace(/Ã´/g, "ô")
    .replace(/Ã»/g, "û")
    .replace(/Ã¹/g, "ù")
    .replace(/Ã§/g, "ç");
}

function formatMonth(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

export function PlanificationPerformanceChart({ data, groupBy }: PlanificationPerformanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Aucune reservation a analyser.
      </div>
    );
  }

  const groupedData = new Map<
    string,
    {
      labelSource: string;
      planificationName?: string;
      destinationName?: string;
      validees: number;
      enAttente: number;
      annulees: number;
      total: number;
    }
  >();

  data.forEach((item) => {
    const key = groupBy === "planification" ? item.planificationId : item.periodMonth;
    const planificationName = formatDashboardText(item.planificationName);
    const destinationName = formatDashboardText(item.destinationName);
    const existing = groupedData.get(key) ?? {
      labelSource: groupBy === "planification" ? planificationName : item.periodMonth,
      planificationName: groupBy === "planification" ? planificationName : undefined,
      destinationName: groupBy === "planification" ? destinationName : undefined,
      validees: 0,
      enAttente: 0,
      annulees: 0,
      total: 0,
    };

    groupedData.set(key, {
      ...existing,
      validees: existing.validees + item.validees,
      enAttente: existing.enAttente + item.enAttente,
      annulees: existing.annulees + item.annulees,
      total: existing.total + item.total,
    });
  });

  const chartData = Array.from(groupedData.values())
    .sort((a, b) => {
      if (groupBy === "month") {
        return (
          new Date(`${a.labelSource}T00:00:00`).getTime() -
          new Date(`${b.labelSource}T00:00:00`).getTime()
        );
      }

      return b.total - a.total || a.labelSource.localeCompare(b.labelSource);
    })
    .map((item) => ({
      ...item,
      label: groupBy === "planification" ? getShortLabel(item.labelSource) : formatMonth(item.labelSource),
    }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-5 text-sm">
        <span className="inline-flex items-center gap-2 text-emerald-600">
          <span className="h-2.5 w-2.5 rounded-full border border-emerald-500" />
          Validées
        </span>
        <span className="inline-flex items-center gap-2 text-amber-600">
          <span className="h-2.5 w-2.5 rounded-full border border-amber-500" />
          En attente
        </span>
        <span className="inline-flex items-center gap-2 text-rose-600">
          <span className="h-2.5 w-2.5 rounded-full border border-rose-500" />
          Annulées
        </span>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={{ fontSize: 12, fill: "#475569" }}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#475569" }} />
            <Tooltip
              formatter={(value, name) => {
                const labels: Record<string, string> = {
                  validees: "Validées",
                  enAttente: "En attente",
                  annulees: "Annulées",
                };
                return [`${value} réservation(s)`, labels[String(name)] ?? String(name)];
              }}
              labelFormatter={(label, payload) => {
                const item = payload?.[0]?.payload as
                  | { planificationName?: string; destinationName?: string }
                  | undefined;
                if (groupBy === "month") return `Période : ${label}`;
                return item?.destinationName
                  ? `${item.planificationName ?? label} - ${item.destinationName}`
                  : `Planification : ${label}`;
              }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="validees"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))" }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="enAttente"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))" }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="annulees"
              stroke="#fb7185"
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
