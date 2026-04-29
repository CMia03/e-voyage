"use client";

import { Plus, Trash2 } from "lucide-react";

import { CategorieType, VoyageurProfile } from "@/lib/type/simulation.types";

type CategoryGammeSelectorProps = {
  categories: CategorieType[];
  profiles: VoyageurProfile[];
  onProfilesChange: (profiles: VoyageurProfile[]) => void;
  disabled?: boolean;
};

function buildDefaultProfile(categories: CategorieType[]): VoyageurProfile {
  return {
    categorieClientId: categories[0]?.id ?? "",
    gamme: "MOYENNE",
    nombrePersonnes: 1,
  };
}

export function CategoryGammeSelector({
  categories,
  profiles,
  onProfilesChange,
  disabled,
}: CategoryGammeSelectorProps) {
  const inputClassName =
    "h-12 w-full max-w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100";

  const updateProfile = (index: number, nextProfile: VoyageurProfile) => {
    onProfilesChange(profiles.map((profile, currentIndex) => (currentIndex === index ? nextProfile : profile)));
  };

  const addProfile = () => {
    onProfilesChange([...profiles, buildDefaultProfile(categories)]);
  };

  const removeProfile = (index: number) => {
    if (profiles.length <= 1) return;
    onProfilesChange(profiles.filter((_, currentIndex) => currentIndex !== index));
  };

  const totalVoyageurs = profiles.reduce((sum, profile) => sum + Math.max(profile.nombrePersonnes || 0, 0), 0);

  return (
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Profils voyageurs
          </p>
          <h3 className="text-base font-semibold text-slate-900">
            Composez votre groupe
          </h3>
          <p className="text-sm text-slate-600">
            Vous pouvez melanger plusieurs categories et plusieurs gammes dans une meme simulation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-medium text-emerald-800">
            {totalVoyageurs} voyageur(s)

             {/* {profiles.length} profil(s)  */}
          </div>
          <button
            type="button"
            onClick={addProfile}
            disabled={disabled || categories.length === 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Plus className="h-4 w-4" />
            Ajouter un profil
          </button>
        </div>
      </div>

      <div className="grid min-w-0 gap-4">
        {profiles.map((profile, index) => (
          <div
            key={`${profile.categorieClientId || "profil"}-${index}`}
            className="min-w-0 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Profil {index + 1}</p>
                <p className="text-xs text-slate-500">Categorie, gamme et nombre de personnes</p>
              </div>
              <button
                type="button"
                onClick={() => removeProfile(index)}
                disabled={disabled || profiles.length <= 1}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_minmax(135px,160px)_minmax(135px,160px)] xl:items-end">
              <div className="min-w-0 max-w-[280px] space-y-2">
                <label className="whitespace-nowrap text-sm font-medium text-slate-700">Categorie client</label>
                <select
                  value={profile.categorieClientId}
                  onChange={(event) =>
                    updateProfile(index, {
                      ...profile,
                      categorieClientId: event.target.value,
                    })
                  }
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

              <div className="min-w-0 max-w-[160px] space-y-2">
                <label className="whitespace-nowrap text-sm font-medium text-slate-700">Gamme</label>
                <select
                  value={profile.gamme}
                  onChange={(event) =>
                    updateProfile(index, {
                      ...profile,
                      gamme: event.target.value,
                    })
                  }
                  disabled={disabled}
                  className={inputClassName}
                >
                  <option value="MOYENNE">Moyenne</option>
                  <option value="LUXE">Luxe</option>
                </select>
              </div>

              <div className="min-w-0 max-w-[160px] space-y-2 md:col-span-2 xl:col-span-1">
                <label className="whitespace-nowrap text-sm font-medium text-slate-700">Nombre de personnes</label>
                <input
                  type="number"
                  min="1"
                  value={profile.nombrePersonnes}
                  onChange={(event) =>
                    updateProfile(index, {
                      ...profile,
                      nombrePersonnes: parseInt(event.target.value, 10) || 1,
                    })
                  }
                  disabled={disabled}
                  className={inputClassName}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
