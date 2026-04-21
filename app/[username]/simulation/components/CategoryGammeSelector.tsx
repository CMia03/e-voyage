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
  const inputClassName =
    "h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100";

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="mb-4 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Profil voyageur
        </p>
        <h3 className="text-base font-semibold text-slate-900">
          Affinez votre niveau de confort
        </h3>
        <p className="text-sm text-slate-600">
          La categorie client, la gamme et le nombre de personnes influencent les
          tarifs retenus par la simulation.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Categorie client</label>
          <select
            value={selectedCategorieId}
            onChange={(event) => onCategorieChange(event.target.value)}
            disabled={disabled}
            className={inputClassName}
          >
            {categories.map((categorie) => (
              <option key={categorie.id} value={categorie.id}>
                {categorie.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Gamme</label>
          <select
            value={selectedGamme}
            onChange={(event) => onGammeChange(event.target.value)}
            disabled={disabled}
            className={inputClassName}
          >
            <option value="MOYENNE">Moyenne</option>
            <option value="LUXE">Luxe</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Nombre de personnes</label>
          <input
            type="number"
            min="1"
            value={nombrePersonnes}
            onChange={(event) =>
              onNombrePersonnesChange(parseInt(event.target.value, 10) || 1)
            }
            disabled={disabled}
            className={inputClassName}
          />
        </div>
      </div>
    </div>
  );
}
