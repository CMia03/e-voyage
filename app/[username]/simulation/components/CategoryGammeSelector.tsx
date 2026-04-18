// app/[username]/simulation/components/CategoryGammeSelector.tsx
"use client";

import { CategorieType } from "@/lib/type/simulation.types";

type CategoryGammeSelectorProps = {
    categories: CategorieType[];
    selectedCategorieId: string;
    onCategorieChange: (id: string) => void;
    selectedGamme: string;
    onGammeChange: (gamme: string) => void;
    nombrePersonnes: number;
    onNombrePersonnesChange: (nb: number) => void;
    disabled?: boolean;
};

export function CategoryGammeSelector({
    categories,
    selectedCategorieId,
    onCategorieChange,
    selectedGamme,
    onGammeChange,
    nombrePersonnes,
    onNombrePersonnesChange,
    disabled,
}: CategoryGammeSelectorProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">👤 Catégorie</label>
                <select
                    value={selectedCategorieId}
                    onChange={(e) => onCategorieChange(e.target.value)}
                    disabled={disabled}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                >
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.nom}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">⭐ Gamme</label>
                <select
                    value={selectedGamme}
                    onChange={(e) => onGammeChange(e.target.value)}
                    disabled={disabled}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                >
                    <option value="MOYENNE">Moyenne</option>
                    <option value="LUXE">Luxe</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">👥 Nombre de personnes</label>
                <input
                    type="number"
                    min="1"
                    value={nombrePersonnes}
                    onChange={(e) => onNombrePersonnesChange(parseInt(e.target.value) || 1)}
                    disabled={disabled}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                />
            </div>
        </div>
    );
}