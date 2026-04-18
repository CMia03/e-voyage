// app/[username]/simulation/components/PlanificationSelector.tsx
"use client";

import { PlanificationType } from "@/lib/type/simulation.types";

type PlanificationSelectorProps = {
    planifications: PlanificationType[];
    value: string;
    onChange: (id: string) => void;
    disabled?: boolean;
    loading?: boolean;
};

export function PlanificationSelector({ planifications, value, onChange, disabled, loading }: PlanificationSelectorProps) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">📋 Forfait</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled || loading || planifications.length === 0}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
            >
                {planifications.length === 0 ? (
                    <option value="">Aucune planification disponible</option>
                ) : (
                    planifications.map((planif) => (
                        <option key={planif.id} value={planif.id}>
                            {planif.nomPlanification} - {planif.budgetTotal?.toLocaleString()} Ar
                        </option>
                    ))
                )}
            </select>
        </div>
    );
}