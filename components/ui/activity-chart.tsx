"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ActivityData {
  month: string;
  destination: number;
  hebergement: number;
  activite: number;
}

interface ActivityChartProps {
  data: ActivityData[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="month" 
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px"
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="destination" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Destination"
            dot={{ fill: "#10b981", r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="hebergement" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Hébergement"
            dot={{ fill: "#3b82f6", r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="activite" 
            stroke="#a855f7" 
            strokeWidth={2}
            name="Activité"
            dot={{ fill: "#a855f7", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
