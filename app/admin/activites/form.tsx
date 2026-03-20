"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategorieActivite } from "@/lib/type/activite";

const HebergementMap = dynamic(
  () => import("@/components/hebergement-map").then((mod) => mod.HebergementMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-border/50 bg-muted/20 text-sm text-muted-foreground">
        Chargement de la carte...
      </div>
    ),
  }
);

export type ActiviteFormState = {
  nom: string;
  slug: string;
  description: string;
  imagePrincipale: string;
  dureeHeures: string;
  participantMin: string;
  participantsMax: string;
  niveauxDeDifficulte: string;
  latitude: string;
  longitude: string;
  estActif: boolean;
  idCategorie: string;
  equipementsFournis: string[];
};

type ActiviteFormProps = {
  form: ActiviteFormState;
  categories: CategorieActivite[];
  isSaving: boolean;
  newCategoryName: string;
  newEquipementName: string;
  taxonomyMessage: string;
  submitLabel: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onCreateCategory: () => void;
  onCategoryNameChange: (value: string) => void;
  onEquipementNameChange: (value: string) => void;
  onUpdate: <K extends keyof ActiviteFormState>(
    key: K,
    value: ActiviteFormState[K]
  ) => void;
  makeSlug: (value: string) => string;
  isEditing?: boolean;
};

export function ActiviteForm({
  form,
  categories,
  isSaving,
  newCategoryName,
  newEquipementName,
  taxonomyMessage,
  submitLabel,
  onSubmit,
  onCancel,
  onCreateCategory,
  onCategoryNameChange,
  onEquipementNameChange,
  onUpdate,
  makeSlug,
  isEditing = false,
}: ActiviteFormProps) {
  const [showCategoryCreator, setShowCategoryCreator] = useState(false);

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nom</label>
          <Input
            value={form.nom}
            onChange={(event) => {
              const nom = event.target.value;
              onUpdate("nom", nom);
              if (!isEditing || form.slug === makeSlug(form.nom)) {
                onUpdate("slug", makeSlug(nom));
              }
            }}
            placeholder="Nom de l'activite"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Slug</label>
          <Input
            value={form.slug}
            onChange={(event) => onUpdate("slug", makeSlug(event.target.value))}
            placeholder="activite-aventure"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(event) => onUpdate("description", event.target.value)}
            placeholder="Description de l'activite"
            className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Image principale</label>
          <Input
            value={form.imagePrincipale}
            onChange={(event) => onUpdate("imagePrincipale", event.target.value)}
            placeholder="https://..."
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Duree (heures)</label>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={form.dureeHeures}
            onChange={(event) => onUpdate("dureeHeures", event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Participants minimum</label>
          <Input
            type="number"
            min="0"
            value={form.participantMin}
            onChange={(event) => onUpdate("participantMin", event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Participants maximum</label>
          <Input
            value={form.participantsMax}
            onChange={(event) => onUpdate("participantsMax", event.target.value)}
            placeholder="10"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Niveau de difficulte</label>
          <Input
            value={form.niveauxDeDifficulte}
            onChange={(event) =>
              onUpdate("niveauxDeDifficulte", event.target.value)
            }
            placeholder="Facile, Moyen, Difficile"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Categorie</label>
          <div className="flex gap-2">
            <Select
              value={form.idCategorie}
              onValueChange={(value) => onUpdate("idCategorie", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir une categorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((categorie) => (
                  <SelectItem key={categorie.id} value={categorie.id}>
                    {categorie.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowCategoryCreator((current) => !current)}
              aria-label="Ajouter une categorie"
            >
              <Plus className="size-4" />
            </Button>
          </div>
          {showCategoryCreator ? (
            <div className="flex gap-2">
              <Input
                value={newCategoryName}
                onChange={(event) => onCategoryNameChange(event.target.value)}
                placeholder="Nouvelle categorie"
              />
              <Button type="button" variant="outline" onClick={onCreateCategory}>
                Ajouter
              </Button>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
          <Checkbox
            checked={form.estActif}
            onCheckedChange={(checked) => onUpdate("estActif", checked === true)}
            id="activite-est-actif"
          />
          <label htmlFor="activite-est-actif" className="text-sm font-medium">
            Activite active
          </label>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Latitude</label>
              <Input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(event) => onUpdate("latitude", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Longitude</label>
              <Input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(event) => onUpdate("longitude", event.target.value)}
                required
              />
            </div>
          </div>

          <HebergementMap
            latitude={Number(form.latitude)}
            longitude={Number(form.longitude)}
            onChange={({ latitude, longitude }) => {
              onUpdate("latitude", String(latitude));
              onUpdate("longitude", String(longitude));
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-border/50 p-4">
            <div>
              <p className="text-sm font-medium">Equipements fournis</p>
              <p className="text-sm text-muted-foreground">
                Ajoute les equipements sous forme de texte.
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                value={newEquipementName}
                onChange={(event) => onEquipementNameChange(event.target.value)}
                placeholder="Casque, Gilet, Palmes..."
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const value = newEquipementName.trim();
                  if (!value) return;
                  if (form.equipementsFournis.includes(value)) return;
                  onUpdate("equipementsFournis", [...form.equipementsFournis, value]);
                  onEquipementNameChange("");
                }}
              >
                Ajouter
              </Button>
            </div>

            {taxonomyMessage ? (
              <p className="text-sm text-muted-foreground">{taxonomyMessage}</p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {form.equipementsFournis.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun equipement renseigne.
                </p>
              ) : null}
              {form.equipementsFournis.map((equipement) => (
                <span
                  key={equipement}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
                >
                  {equipement}
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate(
                        "equipementsFournis",
                        form.equipementsFournis.filter((item) => item !== equipement)
                      )
                    }
                    aria-label={`Retirer ${equipement}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Enregistrement..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
