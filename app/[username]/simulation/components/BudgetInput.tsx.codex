// app/[username]/simulation/components/BudgetInput.tsx
"use client";

type BudgetInputProps = {
    value: number;
    onChange: (value: number) => void;
    adminBudget?: number | null;
    disabled?: boolean;
};

export function BudgetInput({ value, onChange, adminBudget, disabled }: BudgetInputProps) {
    const maxBudget = adminBudget && adminBudget > 0 ? adminBudget : Math.max(value, 100000);
    const ratio = maxBudget > 0 ? Math.min(100, (value / maxBudget) * 100) : 0;

    return (
        <div className="space-y-3 rounded-xl border border-border/60 bg-card p-4">
            <label className="text-sm font-medium">Votre budget (Ar)</label>
            <input
                type="number"
                value={value || ""}
                onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
                placeholder="Ex: 500000"
                disabled={disabled}
                className="w-full rounded-lg border p-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
            />
            <input
                type="range"
                min="0"
                max={maxBudget}
                step="1000"
                value={Math.min(value, maxBudget)}
                onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
                disabled={disabled}
                className="w-full accent-emerald-600"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>0 Ar</span>
                <span>Budget admin: {maxBudget.toLocaleString()} Ar</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${ratio}%` }} />
            </div>
            <p className="text-xs text-emerald-700">
                Budget client saisi: <span className="font-medium">{value.toLocaleString()} Ar</span>
            </p>
        </div>
    );
}
