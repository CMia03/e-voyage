"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
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
import {
  EquipementHebergement,
  TypeHebergement,
} from "@/lib/type/hebergement";

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

export type HebergementFormState = {
  nom: string;
  slug: string;
  description: string;
  adresse: string;
  urlImagePrincipale: string;
  imageFile: File | null;
  latitude: string;
  longitude: string;
  nombreEtoiles: string;
  telephone: string;
  email: string;
  siteWeb: string;
  estActif: boolean;
  idTypeHebergement: string;
  idsPlus: string[];
};

type HebergementFormProps = {
  form: HebergementFormState;
  types: TypeHebergement[];
  equipements: EquipementHebergement[];
  isSaving: boolean;
  newTypeName: string;
  newEquipementName: string;
  taxonomyMessage: string;
  submitLabel: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onCreateType: () => void;
  onCreateEquipement: () => void;
  onTypeNameChange: (value: string) => void;
  onEquipementNameChange: (value: string) => void;
  onUpdate: <K extends keyof HebergementFormState>(
    key: K,
    value: HebergementFormState[K]
  ) => void;
  makeSlug: (value: string) => string;
  isEditing?: boolean;
};

export function HebergementForm({
  form,
  types,
  equipements,
  isSaving,
  newTypeName,
  newEquipementName,
  taxonomyMessage,
  submitLabel,
  onSubmit,
  onCancel,
  onCreateType,
  onCreateEquipement,
  onTypeNameChange,
  onEquipementNameChange,
  onUpdate,
  makeSlug,
  isEditing = false,
}: HebergementFormProps) {
  const [showTypeCreator, setShowTypeCreator] = useState(false);
  const [showEquipementCreator, setShowEquipementCreator] = useState(false);
  const [selectedEquipementId, setSelectedEquipementId] = useState("");
  const imagePreview = form.imageFile 
    ? URL.createObjectURL(form.imageFile)
    : form.urlImagePrincipale || "";

  const selectedEquipements = equipements.filter((equipement) =>
    form.idsPlus.includes(equipement.id)
  );

  useEffect(() => {
    return () => {
      if (form.imageFile) {
        URL.revokeObjectURL(form.imageFile);
      }
    };
  }, [form.imageFile]);

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Nom *</label>
          <Input
            value={form.nom}
            onChange={(event) => {
              const nom = event.target.value;
              onUpdate("nom", nom);
              if (!isEditing || form.slug === makeSlug(form.nom)) {
                onUpdate("slug", makeSlug(nom));
              }
            }}
            placeholder="Nom de l'hebergement"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Description *</label>
          <textarea
            value={form.description}
            onChange={(event) => onUpdate("description", event.target.value)}
            placeholder="Description de l'hebergement"
            className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Adresse *</label>
          <Input
            value={form.adresse}
            onChange={(event) => onUpdate("adresse", event.target.value)}
            placeholder="Adresse complete"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Image principale</label>
          <div className="grid gap-4 lg:grid-cols-1">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => document.getElementById('hebergement-image-file-input')?.click()}
                    className="flex-1"
                  >
                    Choisir un fichier
                  </Button>
                  <Input
                    id="hebergement-image-file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      onUpdate("imageFile", event.target.files?.[0] ?? null)
                    }
                  />
                </div>
                <Input
                  value={form.urlImagePrincipale}
                  onChange={(event) => onUpdate("urlImagePrincipale", event.target.value)}
                  placeholder="https://... (optionnel si fichier choisi)"
                />
                <p className="text-xs text-muted-foreground">
                  Choisis un fichier pour l&apos;upload Cloudinary, ou colle une URL existante.
                </p>
              </div>
              <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/20">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt={form.nom || "Apercu hebergement"}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-muted-foreground">
                    Apercu image
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Telephone</label>
          <Input
            value={form.telephone}
            onChange={(event) => onUpdate("telephone", event.target.value)}
            placeholder="+261..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            value={form.email}
            onChange={(event) => onUpdate("email", event.target.value)}
            placeholder="contact@..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Site web</label>
          <Input
            value={form.siteWeb}
            onChange={(event) => onUpdate("siteWeb", event.target.value)}
            placeholder="https://..."
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
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <div className="flex gap-2">
            <Select
              value={form.idTypeHebergement}
              onValueChange={(value) => onUpdate("idTypeHebergement", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir un type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => (
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
              aria-label="Ajouter un type"
            >
              <Plus className="size-4" />
            </Button>
          </div>
          {showTypeCreator ? (
            <div className="flex gap-2">
              <Input
                value={newTypeName}
                onChange={(event) => onTypeNameChange(event.target.value)}
                placeholder="Nouveau type"
              />
              <Button type="button" variant="outline" onClick={onCreateType}>
                Ajouter
              </Button>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
          <Checkbox
            checked={form.estActif}
            onCheckedChange={(checked) => onUpdate("estActif", checked === true)}
            id="estActif"
          />
          <label htmlFor="estActif" className="text-sm font-medium">
            Hebergement actif
          </label>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Latitude *</label>
              <Input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(event) => onUpdate("latitude", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Longitude *</label>
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
          <div className="space-y-3">
            <p className="text-sm font-medium">Equipements</p>
            <div className="space-y-3 rounded-2xl border border-border/50 p-4">
              <div className="flex gap-2">
                <Select
                  value={selectedEquipementId}
                  onValueChange={setSelectedEquipementId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir un equipement" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipements.map((equipement) => (
                      <SelectItem key={equipement.id} value={equipement.id}>
                        {equipement.equipement}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!selectedEquipementId) return;
                    if (form.idsPlus.includes(selectedEquipementId)) return;
                    onUpdate("idsPlus", [...form.idsPlus, selectedEquipementId]);
                    setSelectedEquipementId("");
                  }}
                >
                  Ajouter
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowEquipementCreator((current) => !current)}
                  aria-label="Ajouter un equipement"
                >
                  <Plus className="size-4" />
                </Button>
              </div>

              {showEquipementCreator ? (
                <div className="flex gap-2">
                  <Input
                    value={newEquipementName}
                    onChange={(event) => onEquipementNameChange(event.target.value)}
                    placeholder="Nouvel equipement"
                  />
                  <Button type="button" variant="outline" onClick={onCreateEquipement}>
                    Ajouter
                  </Button>
                </div>
              ) : null}

              {taxonomyMessage ? (
                <p className="text-sm text-muted-foreground">{taxonomyMessage}</p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {selectedEquipements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun equipement selectionne.
                  </p>
                ) : null}
                {selectedEquipements.map((equipement) => (
                  <span
                    key={equipement.id}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
                  >
                    {equipement.equipement}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdate(
                          "idsPlus",
                          form.idsPlus.filter((id) => id !== equipement.id)
                        )
                      }
                      aria-label={`Retirer ${equipement.equipement}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
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
