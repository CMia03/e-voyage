"use client";

import { useEffect, useMemo } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export type PhotoDestinationFormState = {
  titre: string;
  description: string;
  ordreAffichage: string;
  dateObtenir: string;
  estPrincipale: boolean;
  imageFiles: File[];
};

type PhotoDestinationFormProps = {
  form: PhotoDestinationFormState;
  onUpdate: <K extends keyof PhotoDestinationFormState>(
    key: K,
    value: PhotoDestinationFormState[K]
  ) => void;
};

export function PhotoDestinationForm({
  form,
  onUpdate,
}: PhotoDestinationFormProps) {
  const previews = useMemo(
    () =>
      form.imageFiles.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [form.imageFiles]
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Titre</label>
          <Input
            value={form.titre}
            onChange={(event) => onUpdate("titre", event.target.value)}
            placeholder="Galerie plage"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Date obtenir</label>
          <Input
            type="datetime-local"
            value={form.dateObtenir}
            onChange={(event) => onUpdate("dateObtenir", event.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(event) => onUpdate("description", event.target.value)}
            placeholder="Description commune a toutes les images"
            className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Ordre affichage</label>
          <Input
            type="number"
            min="0"
            value={form.ordreAffichage}
            onChange={(event) => onUpdate("ordreAffichage", event.target.value)}
            placeholder="1"
          />
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
          <Checkbox
            checked={form.estPrincipale}
            onCheckedChange={(checked) => onUpdate("estPrincipale", checked === true)}
            id="photo-est-principale"
          />
          <label htmlFor="photo-est-principale" className="text-sm font-medium">
            Definir comme principale
          </label>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Images</label>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              onUpdate("imageFiles", files);
            }}
            required
          />
          {previews.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {previews.length} image(s) selectionnee(s).
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Toutes les images reprendront le meme titre, la meme description et la meme date.
            </p>
          )}
          {previews.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {previews.map((preview) => (
                <div key={`${preview.name}-${preview.url}`} className="overflow-hidden rounded-xl border border-border/50 bg-muted/20">
                  <img src={preview.url} alt={preview.name} className="h-28 w-full object-cover" />
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    <span className="block truncate">{preview.name}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
