"use client";

import { useState } from "react";
import {
  BedDouble,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Info,
  Plus,
  Save,
  Tag,
  Users,
  Utensils,
} from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GammeTarif, TypeChambre } from "@/lib/type/hebergement";

export type TarifFormState = {
  prixReservation: string;
  prixParNuit: string;
  devise: string;
  gamme: GammeTarif;
  capacite: string;
  petitDejeunerInclus: boolean;
  estActif: boolean;
  dateValiditeDebut: string;
  dateValiditeFin: string;
  idTypeChambre: string;
};

type FormTarifHebergementProps = {
  form: TarifFormState;
  typeChambres: TypeChambre[];
  newTypeChambreName: string;
  isSubmitting: boolean;
  submitLabel?: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdate: <K extends keyof TarifFormState>(key: K, value: TarifFormState[K]) => void;
  onNewTypeChambreNameChange: (value: string) => void;
  onCreateTypeChambre: () => void;
};

export function FormTarifHebergement({
  form,
  typeChambres,
  newTypeChambreName,
  isSubmitting,
  submitLabel = "Ajouter le tarif",
  onSubmit,
  onUpdate,
  onNewTypeChambreNameChange,
  onCreateTypeChambre,
}: FormTarifHebergementProps) {
  const [showTypeCreator, setShowTypeCreator] = useState(false);
  const selectedTypeChambre = typeChambres.find((type) => type.id === form.idTypeChambre);
  const prixParNuit = Number(form.prixParNuit) || 0;
  const prixReservation = Number(form.prixReservation) || 0;
  const dateDebutLabel = form.dateValiditeDebut
    ? new Date(`${form.dateValiditeDebut}T00:00:00`).toLocaleDateString("fr-FR")
    : "Debut non defini";
  const dateFinLabel = form.dateValiditeFin
    ? new Date(`${form.dateValiditeFin}T00:00:00`).toLocaleDateString("fr-FR")
    : "Fin non definie";

  return (
    <form className="space-y-2.5" onSubmit={onSubmit}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-2.5">
          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-start gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <BedDouble className="size-4" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-950">1. Chambre</h3>
                <p className="text-[11px] text-slate-500">Type de chambre et capacite maximale.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900">
                  Type de chambre <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <Select value={form.idTypeChambre} onValueChange={(value) => onUpdate("idTypeChambre", value)}>
                    <SelectTrigger className="h-9 w-full rounded-lg border-slate-200 bg-white">
                      <SelectValue placeholder="Choisir un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeChambres.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9 shrink-0 rounded-lg"
                    onClick={() => setShowTypeCreator((current) => !current)}
                    aria-label="Ajouter un type de chambre"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>

                {showTypeCreator ? (
                  <div className="mt-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={newTypeChambreName}
                        onChange={(event) => onNewTypeChambreNameChange(event.target.value)}
                        placeholder="Ex: Suite, Deluxe, Familiale..."
                      />
                      <Button type="button" onClick={onCreateTypeChambre} className="bg-emerald-600 text-white hover:bg-emerald-700">
                        Ajouter
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900">
                  Capacite <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Users className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="number"
                    min="1"
                    value={form.capacite}
                    onChange={(event) => onUpdate("capacite", event.target.value)}
                    className="h-9 rounded-lg border-slate-200 pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-start gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CalendarDays className="size-4" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-950">2. Periode de validite</h3>
                <p className="text-[11px] text-slate-500">Dates pendant lesquelles ce tarif est disponible.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900">
                  Date de debut <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={form.dateValiditeDebut}
                  onChange={(event) => onUpdate("dateValiditeDebut", event.target.value)}
                  className="h-9 rounded-lg border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900">Date de fin</label>
                <Input
                  type="date"
                  value={form.dateValiditeFin}
                  onChange={(event) => onUpdate("dateValiditeFin", event.target.value)}
                  className="h-9 rounded-lg border-slate-200"
                />
              </div>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <Checkbox
                id="dateFinIllimitee"
                checked={!form.dateValiditeFin}
                onCheckedChange={(checked) => {
                  if (checked === true) {
                    onUpdate("dateValiditeFin", "");
                  }
                }}
              />
              <label htmlFor="dateFinIllimitee" className="text-sm font-medium text-slate-700">
                Pas de date de fin (tarif sans limite)
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-start gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Tag className="size-4" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-950">3. Tarification</h3>
                <p className="text-[11px] text-slate-500">Prix par nuit, prix de reservation, devise et gamme.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900">
                  Prix / nuit <span className="text-red-500">*</span>
                </label>
                <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.prixParNuit}
                    onChange={(event) => onUpdate("prixParNuit", event.target.value)}
                    className="h-9 rounded-none border-0"
                    required
                  />
                  <span className="flex h-9 min-w-14 items-center justify-center border-l bg-slate-50 px-3 text-sm text-slate-600">
                    {form.devise || "MGA"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900">
                  Prix reservation <span className="text-red-500">*</span>
                </label>
                <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.prixReservation}
                    onChange={(event) => onUpdate("prixReservation", event.target.value)}
                    className="h-9 rounded-none border-0"
                  />
                  <span className="flex h-9 min-w-14 items-center justify-center border-l bg-slate-50 px-3 text-sm text-slate-600">
                    {form.devise || "MGA"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900">
                  Devise <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.devise}
                  onChange={(event) => onUpdate("devise", event.target.value)}
                  placeholder="MGA, EUR, USD..."
                  className="h-9 rounded-lg border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900">
                  Gamme <span className="text-red-500">*</span>
                </label>
                <Select value={form.gamme} onValueChange={(value) => onUpdate("gamme", value as GammeTarif)}>
                  <SelectTrigger className="h-9 w-full rounded-lg border-slate-200">
                    <SelectValue placeholder="Choisir une gamme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MOYENNE">Moyenne</SelectItem>
                    <SelectItem value="LUXE">Luxe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 md:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <Checkbox
                  id="petitDejeunerInclus"
                  checked={form.petitDejeunerInclus}
                  onCheckedChange={(checked) => onUpdate("petitDejeunerInclus", checked === true)}
                />
                <Utensils className="size-4 text-emerald-700" />
                <label htmlFor="petitDejeunerInclus" className="text-sm font-semibold text-slate-900">
                  Petit dejeuner inclus
                </label>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <Checkbox
                  id="tarifActif"
                  checked={form.estActif}
                  onCheckedChange={(checked) => onUpdate("estActif", checked === true)}
                />
                <CheckCircle2 className="size-4 text-emerald-700" />
                <label htmlFor="tarifActif" className="text-sm font-semibold text-emerald-800">
                    Tarif actif
                </label>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-2 lg:self-start">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <ClipboardList className="size-4" />
              </span>
              <h3 className="text-base font-semibold text-slate-950">Resume du tarif</h3>
            </div>

            <div className="divide-y divide-slate-200 text-xs">
              <div className="py-2 first:pt-0">
                <p className="text-slate-500">Chambre</p>
                <p className="mt-1 font-semibold text-slate-950">{selectedTypeChambre?.nom || "-"}</p>
              </div>
              <div className="py-2">
                <p className="text-slate-500">Capacite</p>
                <p className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-950">
                  <Users className="size-4 text-slate-500" />
                  {form.capacite || "0"}
                </p>
              </div>
              <div className="py-2">
                <p className="text-slate-500">Prix / nuit</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {prixParNuit > 0 ? `${prixParNuit.toLocaleString("fr-FR")} ${form.devise || "MGA"}` : "-"}
                </p>
              </div>
              <div className="py-2">
                <p className="text-slate-500">Prix reservation</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {prixReservation > 0 ? `${prixReservation.toLocaleString("fr-FR")} ${form.devise || "MGA"}` : "-"}
                </p>
              </div>
              <div className="py-2">
                <p className="text-slate-500">Devise</p>
                <p className="mt-1 font-semibold text-slate-950">{form.devise || "-"}</p>
              </div>
              <div className="py-2">
                <p className="text-slate-500">Gamme</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {form.gamme === "MOYENNE" ? "Moyenne" : "Luxe"}
                </p>
              </div>
              <div className="py-2">
                <p className="text-slate-500">Periode</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {dateDebutLabel} - {dateFinLabel}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-2.5 text-[11px] leading-5 text-blue-800">
              <Info className="mt-0.5 size-4 shrink-0" />
              <p>
                Les champs marques d&apos;un asterisque (<span className="text-red-500">*</span>) sont necessaires
                pour publier correctement cette disponibilite.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 h-10 w-full gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700"
            >
              <Save className="size-4" />
              {isSubmitting ? "Enregistrement..." : submitLabel}
            </Button>
          </div>
        </aside>
      </div>
    </form>
  );
}
