"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

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
import { TypeChambre } from "@/lib/type/hebergement";

export type TarifFormState = {
  prixReservation: string;
  prixParNuit: string;
  devise: string;
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

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      <div className="rounded-2xl border border-border/50 bg-card/40 p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold">Chambre et disponibilite</h3>
          <p className="text-sm text-muted-foreground">
            Renseigne le type de chambre, la capacite et la periode de validite.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2 xl:col-span-2">
            <label className="text-sm font-medium">Type de chambre</label>
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
              <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={newTypeChambreName}
                    onChange={(event) => onNewTypeChambreNameChange(event.target.value)}
                    placeholder="Ex: Suite, Deluxe, Familiale..."
                  />
                  <Button type="button" onClick={onCreateTypeChambre}>
                    Ajouter
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium">Capacite</label>
            <Input
              type="number"
              min="1"
              value={form.capacite}
              onChange={(event) => onUpdate("capacite", event.target.value)}
              required
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <label className="text-sm font-medium">Date debut</label>
            <Input
              type="date"
              value={form.dateValiditeDebut}
              onChange={(event) => onUpdate("dateValiditeDebut", event.target.value)}
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium">Date fin</label>
            <Input
              type="date"
              value={form.dateValiditeFin}
              onChange={(event) => onUpdate("dateValiditeFin", event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/40 p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold">Tarification</h3>
          <p className="text-sm text-muted-foreground">
            Definis les prix, la devise et les options appliquees a cette offre.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Prix / nuit</label>
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
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
            <Checkbox
              id="petitDejeunerInclus"
              checked={form.petitDejeunerInclus}
              onCheckedChange={(checked) => onUpdate("petitDejeunerInclus", checked === true)}
            />
            <label htmlFor="petitDejeunerInclus" className="text-sm font-medium">
              Petit dejeuner inclus
            </label>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
            <Checkbox
              id="tarifActif"
              checked={form.estActif}
              onCheckedChange={(checked) => onUpdate("estActif", checked === true)}
            />
            <label htmlFor="tarifActif" className="text-sm font-medium">
              Tarif actif
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-border/50 pt-2">
        <div className="rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
          Complete les informations avant validation
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enregistrement..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
