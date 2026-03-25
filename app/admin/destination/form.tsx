"use client";

import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

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

export type DestinationFormState = {
  nom: string;
  slug: string;
  description: string;
  adresse: string;
  urlImagePrincipale: string;
  imageFile: File | null;
  latitude: string;
  longitude: string;
  nombreEtoiles: string;
  estActif: boolean;
  region: string;
  district: string;
  commune: string;
};

type DestinationFormProps = {
  form: DestinationFormState;
  isSaving: boolean;
  submitLabel: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onUpdate: <K extends keyof DestinationFormState>(
    key: K,
    value: DestinationFormState[K]
  ) => void;
  makeSlug: (value: string) => string;
  isEditing?: boolean;
};

export function DestinationForm({
  form,
  isSaving,
  submitLabel,
  onSubmit,
  onCancel,
  onUpdate,
  makeSlug,
  isEditing = false,
}: DestinationFormProps) {
  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
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
            placeholder="Nom de la destination"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(event) => onUpdate("description", event.target.value)}
            placeholder="Description de la destination"
            className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Adresse</label>
          <Input
            value={form.adresse}
            onChange={(event) => onUpdate("adresse", event.target.value)}
            placeholder="Adresse ou point de depart"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Image principale</label>
          <Input
            type="file"
            accept="image/*"
            onChange={(event) =>
              onUpdate("imageFile", event.target.files?.[0] ?? null)
            }
          />
          <Input
            value={form.urlImagePrincipale}
            onChange={(event) => onUpdate("urlImagePrincipale", event.target.value)}
            placeholder="https://... (optionnel si fichier choisi)"
          />
          <p className="text-xs text-muted-foreground">
            Choisis un fichier pour l&apos;upload Cloudinary, ou colle une URL existante.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Region</label>
          <Input
            value={form.region}
            onChange={(event) => onUpdate("region", event.target.value)}
            placeholder="Alaotra Mangoro"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">District</label>
          <Input
            value={form.district}
            onChange={(event) => onUpdate("district", event.target.value)}
            placeholder="Toamasina II"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Commune</label>
          <Input
            value={form.commune}
            onChange={(event) => onUpdate("commune", event.target.value)}
            placeholder="Manambato"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Nombre d&apos;etoiles</label>
          <Input
            type="number"
            min="0"
            max="5"
            value={form.nombreEtoiles}
            onChange={(event) => onUpdate("nombreEtoiles", event.target.value)}
            placeholder="0"
          />
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3 md:col-span-2">
          <Checkbox
            checked={form.estActif}
            onCheckedChange={(checked) => onUpdate("estActif", checked === true)}
            id="destination-est-actif"
          />
          <label htmlFor="destination-est-actif" className="text-sm font-medium">
            Destination active
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

        <div className="rounded-2xl border border-border/50 p-4">
          <p className="text-sm font-medium">Resume</p>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Nom :</span> {form.nom || "-"}
            </p>
            <p>
              <span className="font-medium text-foreground">Region :</span> {form.region || "-"}
            </p>
            <p>
              <span className="font-medium text-foreground">Adresse :</span> {form.adresse || "-"}
            </p>
            <p>
              <span className="font-medium text-foreground">Image :</span>{" "}
              {form.imageFile?.name || form.urlImagePrincipale || "-"}
            </p>
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
