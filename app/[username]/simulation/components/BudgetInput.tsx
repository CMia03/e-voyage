"use client";

type BudgetInputProps = {
  value: number;
  onChange: (value: number) => void;
  minBudget?: number | null;
  adminBudget?: number | null;
  disabled?: boolean;
};

function formatAr(value: number) {
  return `${value.toLocaleString()} Ar`;
}

export function BudgetInput({
  value,
  onChange,
  minBudget,
  adminBudget,
  disabled,
}: BudgetInputProps) {
  const hasMinimumBudget = typeof minBudget === "number" && minBudget > 0;
  const minimumBudget = hasMinimumBudget ? minBudget : 0;
  const budgetPlaceholder = hasMinimumBudget ? formatAr(minimumBudget) : "Ex: 500000";
  const computedAdminBudget = adminBudget && adminBudget > 0 ? adminBudget : 0;
  const maxBudget = Math.max(computedAdminBudget, value, minimumBudget, 100000);
  const budgetRange = Math.max(maxBudget - minimumBudget, 1);
  const clampedValue = Math.min(Math.max(value, minimumBudget), maxBudget);
  const ratio = ((clampedValue - minimumBudget) / budgetRange) * 100;

  return (
    <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(248,250,252,0.96))] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Budget client
          </p>
          <h3 className="text-base font-semibold text-slate-900">
            Definissez votre zone de confort
          </h3>
          <p className="text-sm text-slate-600">
            Vous pouvez saisir un montant librement ou l&apos;ajuster avec la barre.
          </p>
        </div>


        {/* <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">
            Budget saisi
          </p>
          <p className="mt-2 text-lg font-semibold text-emerald-950">
            {value > 0 ? formatAr(value) : "Non renseigne"}
          </p>
        </div> */}


      </div>

      <div className="mt-5 space-y-4">
        <input
          type="number"
          value={value || ""}
          onChange={(event) => onChange(parseInt(event.target.value, 10) || 0)}
          placeholder={budgetPlaceholder}
          disabled={disabled}
          className="h-13 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100"
        />

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            <span>{hasMinimumBudget ? formatAr(minimumBudget) : "A calculer"}</span>
            <span>{formatAr(maxBudget)}</span>
          </div>

          <div className="relative">
            <input
              type="range"
              min={minimumBudget}
              max={maxBudget}
              step="1000"
              value={clampedValue}
              onChange={(event) => onChange(parseInt(event.target.value, 10) || 0)}
              disabled={disabled}
              className="relative z-20 w-full cursor-pointer appearance-none bg-transparent accent-emerald-600"
            />
            <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, ratio))}%` }}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Budget min
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {hasMinimumBudget ? formatAr(minimumBudget) : "A calculer"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Budget max
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {formatAr(maxBudget)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
