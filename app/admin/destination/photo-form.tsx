"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
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
  isSaving: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdate: <K extends keyof PhotoDestinationFormState>(
    key: K,
    value: PhotoDestinationFormState[K]
  ) => void;
};

export function PhotoDestinationForm({
  form,
  isSaving,
  onSubmit,
  onUpdate,
}: PhotoDestinationFormProps) {
  const [fileNames, setFileNames] = useState<string[]>([]);

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
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
              setFileNames(files.map((file) => file.name));
            }}
            required
          />
          {fileNames.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {fileNames.length} image(s) selectionnee(s) : {fileNames.join(", ")}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Toutes les images reprendront le meme titre, la meme description et la meme date.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Enregistrement..." : "Ajouter les images"}
        </Button>
      </div>
    </form>
  );
}
