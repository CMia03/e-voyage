"use client";

import { useState } from "react";
import { BedDouble, CalendarDays, CheckCircle2, CreditCard, Plus, Users, Utensils } from "lucide-react";

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
  const isEditMode = submitLabel.toLowerCase().includes("modification") || submitLabel.toLowerCase().includes("enregistrer");

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      {/* <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/90 to-white p-5">
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_280px] 2xl:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              {isEditMode ? "Modification du tarif" : "Nouvelle offre de chambre"}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">
              {selectedTypeChambre?.nom || "Type de chambre a definir"}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Renseigne la chambre, la periode, le prix et les options qui seront affiches dans les disponibilites.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white/90 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Apercu tarif
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {prixParNuit > 0 ? `${prixParNuit.toLocaleString("fr-FR")} ${form.devise || "MGA"}` : "-"}
              <span className="text-sm font-normal text-slate-500"> / nuit</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-100 px-2.5 py-1">{form.gamme}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1">{form.capacite || 0} hote(s)</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1">{form.estActif ? "Actif" : "Inactif"}</span>
            </div>
          </div>
        </div>
      </div> */}

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                <BedDouble className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold">Chambre</h3>
                <p className="text-sm text-muted-foreground">Type de chambre et capacite maximale.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type de chambre *</label>
            <div className="flex gap-2">
              <Select value={form.idTypeChambre} onValueChange={(value) => onUpdate("idTypeChambre", value)}>
                <SelectTrigger className="w-full">
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Capacite *</label>
                <div className="relative">
                  <Users className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="number"
              min="1"
              value={form.capacite}
              onChange={(event) => onUpdate("capacite", event.target.value)}
                    className="pl-9"
              required
            />
                </div>
              </div>
            </div>
          </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                <CalendarDays className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold">Periode de validite</h3>
                <p className="text-sm text-muted-foreground">Dates pendant lesquelles ce tarif est disponible.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date debut</label>
            <Input
              type="date"
              value={form.dateValiditeDebut}
              onChange={(event) => onUpdate("dateValiditeDebut", event.target.value)}
            />
          </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date fin</label>
            <Input
              type="date"
              value={form.dateValiditeFin}
              onChange={(event) => onUpdate("dateValiditeFin", event.target.value)}
            />
          </div>
        </div>

          <div className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                <CreditCard className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold">Tarification</h3>
                <p className="text-sm text-muted-foreground">Prix par nuit, prix de reservation, devise et gamme.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
                <label className="text-sm font-medium">Prix / nuit *</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.prixParNuit}
              onChange={(event) => onUpdate("prixParNuit", event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Prix reservation</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.prixReservation}
              onChange={(event) => onUpdate("prixReservation", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Devise</label>
            <Input
              value={form.devise}
              onChange={(event) => onUpdate("devise", event.target.value)}
              placeholder="MGA, EUR, USD..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Gamme</label>
            <Select value={form.gamme} onValueChange={(value) => onUpdate("gamme", value as GammeTarif)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir une gamme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MOYENNE">Moyenne</SelectItem>
                <SelectItem value="LUXE">Luxe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
            <Checkbox
              id="petitDejeunerInclus"
              checked={form.petitDejeunerInclus}
              onCheckedChange={(checked) => onUpdate("petitDejeunerInclus", checked === true)}
            />
            <label htmlFor="petitDejeunerInclus" className="text-sm font-medium">
                  <span className="inline-flex items-center gap-2">
                    <Utensils className="size-4 text-emerald-700" />
              Petit dejeuner inclus
                  </span>
            </label>
          </div>

              <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
            <Checkbox
              id="tarifActif"
              checked={form.estActif}
              onCheckedChange={(checked) => onUpdate("estActif", checked === true)}
            />
            <label htmlFor="tarifActif" className="text-sm font-medium">
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-700" />
                    Tarif actif
                  </span>
            </label>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm 2xl:sticky 2xl:top-20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Validation</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="grid gap-1 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
                <span className="text-slate-500">Chambre</span>
                <span className="font-medium text-slate-900 sm:text-right">{selectedTypeChambre?.nom || "-"}</span>
              </div>
              <div className="grid gap-1 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
                <span className="text-slate-500">Prix nuit</span>
                <span className="font-medium text-slate-900 sm:text-right">
                  {prixParNuit > 0 ? `${prixParNuit.toLocaleString("fr-FR")} ${form.devise || "MGA"}` : "-"}
                </span>
              </div>
              <div className="grid gap-1 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
                <span className="text-slate-500">Reservation</span>
                <span className="font-medium text-slate-900 sm:text-right">
                  {prixReservation > 0 ? `${prixReservation.toLocaleString("fr-FR")} ${form.devise || "MGA"}` : "-"}
                </span>
              </div>
              <div className="grid gap-1 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-start">
                <span className="text-slate-500">Periode</span>
                <span className="font-medium text-slate-900 sm:text-right">
                  {form.dateValiditeDebut || "Debut non defini"} - {form.dateValiditeFin || "Fin non definie"}
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
              Les champs marques d&apos;un asterisque sont necessaires pour publier correctement cette disponibilite.
            </div>

            <Button type="submit" disabled={isSubmitting} className="mt-5 w-full bg-emerald-600 text-white hover:bg-emerald-700">
              {isSubmitting ? "Enregistrement..." : submitLabel}
            </Button>
          </div>
        </aside>
      </div>

    </form>
  );
}
