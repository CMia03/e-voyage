"use client";

import { DestinationType } from "@/lib/type/simulation.types";

type DestinationSelectorProps = {
  destinations: DestinationType[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
};

export function DestinationSelector({
  destinations,
  value,
  onChange,
  disabled,
}: DestinationSelectorProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="mb-3 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Destination
        </p>
        <h3 className="text-base font-semibold text-slate-900">
          Ou souhaitez-vous partir ?
        </h3>
        <p className="text-sm text-slate-600">
          Choisissez la destination qui servira de base a votre simulation.
        </p>
      </div>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100"
      >
        {destinations.map((destination) => (
          <option key={destination.id} value={destination.id}>
            {destination.title}
          </option>
        ))}
      </select>
    </div>
  );
}
