"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface UserStatsData {
  name: string;
  value: number;
  color: string;
  count?: number;
}

interface UserStatsChartProps {
  data: UserStatsData[];
}

export function UserStatsChart({ data }: UserStatsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] w-full items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
        Aucune donnée disponible.
      </div>
    );
  }

  return (
    <div className="grid min-h-[220px] grid-cols-[minmax(135px,1fr)_minmax(105px,140px)] items-center gap-4">
      <div className="h-[210px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="45%"
              outerRadius="82%"
              paddingAngle={data.length > 1 ? 4 : 0}
              dataKey="value"
              stroke="hsl(var(--card))"
              strokeWidth={4}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="min-w-0 space-y-2">
        {data.map((item) => {
          const count = item.count ?? 0;
          const percentage = Number(item.value || 0);

          return (
            <div key={item.name} className="flex min-w-0 items-start gap-2 text-sm">
              <span
                className="mt-1 h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800" title={item.name}>
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {count} pers - {percentage.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
