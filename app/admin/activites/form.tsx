"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Clock,
  Gauge,
  ImageIcon,
  MapPin,
  Plus,
  Tags,
  Users,
  X,
} from "lucide-react";

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
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 text-sm text-emerald-700">
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
  imageFile: File | null;
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

const greenPrimaryButtonClass =
  "!border-transparent !bg-gradient-to-r !from-emerald-600 !to-teal-600 !text-white !shadow-lg !shadow-emerald-500/20 hover:!from-emerald-700 hover:!to-teal-700";
const greenOutlineButtonClass =
  "!border-emerald-200 !bg-emerald-50 !text-emerald-700 hover:!border-emerald-300 hover:!bg-emerald-100 hover:!text-emerald-800";

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

  const selectedCategory = useMemo(
    () => categories.find((categorie) => categorie.id === form.idCategorie),
    [categories, form.idCategorie]
  );
  const imagePreview = useMemo(
    () => (form.imageFile ? URL.createObjectURL(form.imageFile) : form.imagePrincipale || ""),
    [form.imageFile, form.imagePrincipale]
  );

  useEffect(() => {
    if (!form.imageFile || !imagePreview) return;
    return () => URL.revokeObjectURL(imagePreview);
  }, [form.imageFile, imagePreview]);

  const canShowMap =
    Number.isFinite(Number(form.latitude)) && Number.isFinite(Number(form.longitude));

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      {/* <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5 p-5 sm:p-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 shadow-sm">
              <Camera className="size-4" />
              {isEditing ? "Modification activite" : "Nouvelle activite"}
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                {form.nom || "Activite a definir"}
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                {form.description ||
                  "Renseigne le titre, la duree, le groupe et les informations utiles avant de publier cette activite."}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <PreviewStat icon={Tags} label="Categorie" value={selectedCategory?.nom || "-"} />
              <PreviewStat icon={Clock} label="Duree" value={form.dureeHeures ? `${form.dureeHeures} h` : "-"} />
              <PreviewStat
                icon={Users}
                label="Groupe"
                value={`${form.participantMin || "-"} - ${form.participantsMax || "-"}`}
              />
              <PreviewStat icon={Gauge} label="Difficulte" value={form.niveauxDeDifficulte || "-"} />
            </div>
          </div>
          <div className="min-h-[260px] bg-slate-900/5 lg:min-h-full">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt={form.nom || "Apercu activite"}
                className="h-full min-h-[260px] w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 px-6 text-center text-slate-500">
                <ImageIcon className="size-10 text-emerald-500" />
                <p className="text-sm">L&apos;image principale apparaitra ici.</p>
              </div>
            )}
          </div>
        </div>
      </section> */}

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <FormSection
            icon={Tags}
            title="Informations principales"
            description="Nom, description, categorie et statut de publication."
          >
            <div className="grid gap-4 md:grid-cols-2">
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
                  placeholder="Ex: Balade en pirogue"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(event) => onUpdate("description", event.target.value)}
                  placeholder="Description visible dans la fiche detail."
                  className="min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Categorie *</label>
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
                    className={greenOutlineButtonClass}
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
                    <Button type="button" variant="outline" onClick={onCreateCategory} className={greenOutlineButtonClass}>
                      Ajouter
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Niveau de difficulte *</label>
                <Input
                  value={form.niveauxDeDifficulte}
                  onChange={(event) => onUpdate("niveauxDeDifficulte", event.target.value)}
                  placeholder="Facile, Moyen, Difficile..."
                  required
                />
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 md:col-span-2">
                <Checkbox
                  checked={form.estActif}
                  onCheckedChange={(checked) => onUpdate("estActif", checked === true)}
                  id="activite-est-actif"
                />
                <label htmlFor="activite-est-actif" className="text-sm font-medium text-emerald-900">
                  Activite active
                </label>
              </div>
            </div>
          </FormSection>

          <FormSection
            icon={ImageIcon}
            title="Image principale"
            description="Image d'accroche utilisee dans la fiche et la galerie."
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("activite-image-file-input")?.click()}
                  className={`w-full justify-center ${greenOutlineButtonClass}`}
                >
                  <ImageIcon className="size-4" />
                  Choisir un fichier
                </Button>
                <Input
                  id="activite-image-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    onUpdate("imageFile", event.target.files?.[0] ?? null)
                  }
                />
                <Input
                  value={form.imagePrincipale}
                  onChange={(event) => onUpdate("imagePrincipale", event.target.value)}
                  placeholder="https://... (optionnel si fichier choisi)"
                />
                <p className="text-xs text-muted-foreground">
                  Choisis un fichier pour l&apos;upload Cloudinary, ou colle une URL existante.
                </p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border/50 bg-muted/20">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt={form.nom || "Apercu activite"}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center px-4 text-center text-sm text-muted-foreground">
                    Apercu image
                  </div>
                )}
              </div>
            </div>
          </FormSection>

          <FormSection
            icon={Users}
            title="Duree et capacite"
            description="Informations affichees dans le bloc detail de l'activite."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Duree (heures) *</label>
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
                <label className="text-sm font-medium">Participants minimum *</label>
                <Input
                  type="number"
                  min="0"
                  value={form.participantMin}
                  onChange={(event) => onUpdate("participantMin", event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Participants maximum *</label>
                <Input
                  value={form.participantsMax}
                  onChange={(event) => onUpdate("participantsMax", event.target.value)}
                  placeholder="Ex: 25"
                  required
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            icon={MapPin}
            title="Localisation"
            description="Coordonnees exactes pour afficher l'activite sur la carte."
          >
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

            <div className="mt-4">
              <HebergementMap
                latitude={canShowMap ? Number(form.latitude) : 0}
                longitude={canShowMap ? Number(form.longitude) : 0}
                onChange={({ latitude, longitude }) => {
                  onUpdate("latitude", String(latitude));
                  onUpdate("longitude", String(longitude));
                }}
              />
            </div>
          </FormSection>

          <FormSection
            icon={CheckCircle2}
            title="Equipements fournis"
            description="Liste ce qui sera fourni au client pendant l'activite."
          >
            <div className="flex flex-col gap-2 sm:flex-row">
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
                className={greenOutlineButtonClass}
              >
                Ajouter
              </Button>
            </div>

            {taxonomyMessage ? (
              <p className="text-sm text-muted-foreground">{taxonomyMessage}</p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {form.equipementsFournis.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun equipement renseigne.
                </p>
              ) : null}
              {form.equipementsFournis.map((equipement) => (
                <span
                  key={equipement}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
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
          </FormSection>
        </div>

        <aside className="h-fit rounded-3xl border border-border/50 bg-white p-5 shadow-sm 2xl:sticky 2xl:top-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Validation
          </p>
          <div className="mt-5 space-y-4 text-sm">
            <ValidationLine label="Nom" value={form.nom || "-"} />
            <ValidationLine label="Categorie" value={selectedCategory?.nom || "-"} />
            <ValidationLine label="Duree" value={form.dureeHeures ? `${form.dureeHeures} h` : "-"} />
            <ValidationLine
              label="Groupe"
              value={`${form.participantMin || "-"} - ${form.participantsMax || "-"}`}
            />
            <ValidationLine
              label="Coordonnees"
              value={form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}` : "-"}
            />
          </div>
          <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
            Les champs marques d&apos;un asterisque sont necessaires pour publier correctement cette activite.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Button type="submit" disabled={isSaving} className={greenPrimaryButtonClass}>
              {isSaving ? "Enregistrement..." : submitLabel}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className={greenOutlineButtonClass}>
              Annuler
            </Button>
          </div>
        </aside>
      </div>
    </form>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border/50 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Icon className="size-5" />
        </span>
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function PreviewStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-emerald-700">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ValidationLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words font-semibold">{value}</span>
    </div>
  );
}
