"use client";

import Image from "next/image";
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

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {destinations.map((destination) => {
          const selected = value === destination.id;
          const imageSrc = destination.image?.trim() ? destination.image : null;
          return (
            <button
              key={destination.id}
              type="button"
              onClick={() => onChange(destination.id)}
              disabled={disabled}
              className={`group relative min-w-[220px] max-w-[220px] overflow-hidden rounded-3xl border text-left transition ${
                selected
                  ? "border-emerald-500 bg-emerald-50 shadow-[0_20px_45px_-30px_rgba(16,185,129,0.65)]"
                  : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <div className="relative h-28 w-full overflow-hidden">
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={destination.title}
                    fill
                    className={`object-cover transition duration-500 ${selected ? "scale-105" : "group-hover:scale-105"}`}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(16,185,129,0.2),_rgba(15,23,42,0.12))]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/15 to-transparent" />
                {selected ? (
                  <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                    Selectionnee
                  </span>
                ) : null}
              </div>

              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="line-clamp-2 text-sm font-semibold text-slate-900">
                    {destination.title}
                  </h4>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                    {destination.price}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs leading-5 text-slate-600">
                  {destination.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
