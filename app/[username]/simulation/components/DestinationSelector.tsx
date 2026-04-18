// app/[username]/simulation/components/DestinationSelector.tsx
"use client";

import { DestinationType } from "@/lib/type/simulation.types";

type DestinationSelectorProps = {
    destinations: DestinationType[];
    value: string;
    onChange: (id: string) => void;
    disabled?: boolean;
};

export function DestinationSelector({ destinations, value, onChange, disabled }: DestinationSelectorProps) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">📍 Destination</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
            >
                {destinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                        {dest.title}
                    </option>
                ))}
            </select>
        </div>
    );
}