"use client";

import { Globe2, Info } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface UserStatsData {
  name: string;
  value: number;
  color: string;
  count?: number;
}

interface UserStatsChartProps {
  data: UserStatsData[];
  updatedAt?: string;
}

function formatUpdatedDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function UserStatsChart({ data, updatedAt }: UserStatsChartProps) {
  const totalTravelers = data.reduce((sum, item) => sum + (item.count ?? 0), 0);
  const updateLabel = formatUpdatedDate(updatedAt);

  if (data.length === 0) {
    return (
      <div className="flex min-h-[360px] w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 text-center text-sm text-muted-foreground">
        Aucune donnee disponible.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Globe2 className="mt-1 h-7 w-7 shrink-0 text-emerald-600" />
          <div>
            <h3 className="text-xl font-semibold text-slate-950">Voyageurs par destination</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Repartition des voyageurs selon les destinations.
            </p>
          </div>
        </div>

        <div className="w-fit rounded-2xl bg-emerald-50 px-7 py-5 text-center text-emerald-700">
          <p className="text-3xl font-semibold leading-none">{totalTravelers}</p>
          <p className="mt-2 text-base font-medium">voyageurs</p>
        </div>
      </div>

      <div className="grid items-center gap-8 xl:grid-cols-[minmax(220px,1fr)_minmax(220px,0.9fr)]">
        <div className="h-[280px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="45%"
                outerRadius="82%"
                paddingAngle={data.length > 1 ? 3 : 0}
                dataKey="value"
                stroke="hsl(var(--card))"
                strokeWidth={5}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="min-w-0 space-y-5">
          {data.map((item) => {
            const count = item.count ?? 0;
            const percentage = Number(item.value || 0);

            return (
              <div key={item.name} className="flex min-w-0 items-start gap-4">
                <span
                  className="mt-1.5 h-6 w-6 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-slate-950" title={item.name}>
                    {item.name}
                  </p>
                  <p className="mt-2 text-base text-slate-500">
                    {count} voyageurs
                    <span className="mx-2 text-emerald-600">•</span>
                    {percentage.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {updateLabel ? (
        <>
          <div className="border-t border-slate-200" />
          <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-5 py-4 text-slate-500">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Info className="h-5 w-5" />
            </span>
            <p className="text-sm">Donnees mises a jour le {updateLabel}</p>
          </div>
        </>
      ) : null}
    </div>
  );
}
