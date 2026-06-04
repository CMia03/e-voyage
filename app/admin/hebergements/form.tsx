"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Globe2,
  ImageIcon,
  Mail,
  MapPin,
  Phone,
  Plus,
  Star,
  Tags,
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
  const selectedType = types.find((type) => type.id === form.idTypeHebergement);

  useEffect(() => {
    return () => {
      if (form.imageFile && imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [form.imageFile, imagePreview]);

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      {/* <section className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/90 to-white p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              {isEditing ? "Modification hebergement" : "Nouvel hebergement"}
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">
              {form.nom || "Nom de l'hebergement"}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Renseigne les informations visibles, les contacts, la localisation et les equipements.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-white/90 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Apercu</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{selectedType?.nom || "Type non defini"}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-100 px-2.5 py-1">{form.nombreEtoiles || 0} etoile(s)</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1">{selectedEquipements.length} equipement(s)</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1">{form.estActif ? "Actif" : "Inactif"}</span>
            </div>
          </div>
        </div>
      </section> */}

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                <Building2 className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold">Informations principales</h3>
                <p className="text-sm text-muted-foreground">Nom, description, adresse et type d&apos;hebergement.</p>
              </div>
            </div>

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

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <div className="flex gap-2">
                  <Select value={form.idTypeHebergement} onValueChange={(value) => onUpdate("idTypeHebergement", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choisir un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type.id} value={type.id}>{type.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowTypeCreator((current) => !current)} aria-label="Ajouter un type">
                    <Plus className="size-4" />
                  </Button>
                </div>
                {showTypeCreator ? (
                  <div className="mt-2 flex gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-3">
                    <Input value={newTypeName} onChange={(event) => onTypeNameChange(event.target.value)} placeholder="Nouveau type" />
                    <Button type="button" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={onCreateType}>Ajouter</Button>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre d&apos;etoiles</label>
                <div className="relative">
                  <Star className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-amber-400" />
                  <Input
                    type="number"
                    min="0"
                    max="5"
                    value={form.nombreEtoiles}
                    onChange={(event) => onUpdate("nombreEtoiles", event.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 md:col-span-2">
                <Checkbox checked={form.estActif} onCheckedChange={(checked) => onUpdate("estActif", checked === true)} id="estActif" />
                <label htmlFor="estActif" className="inline-flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="size-4 text-emerald-700" />
                  Hebergement actif
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                <ImageIcon className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold">Image principale</h3>
                <p className="text-sm text-muted-foreground">Upload Cloudinary ou URL existante.</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-3">
                <Button type="button" variant="secondary" onClick={() => document.getElementById("hebergement-image-file-input")?.click()} className="w-full">
                  Choisir un fichier
                </Button>
                <Input
                  id="hebergement-image-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => onUpdate("imageFile", event.target.files?.[0] ?? null)}
                />
                <Input value={form.urlImagePrincipale} onChange={(event) => onUpdate("urlImagePrincipale", event.target.value)} placeholder="https://... (optionnel si fichier choisi)" />
              </div>
              <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/20">
                {imagePreview ? (
                  <img src={imagePreview} alt={form.nom || "Apercu hebergement"} className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-muted-foreground">Apercu image</div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                <Phone className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold">Contact</h3>
                <p className="text-sm text-muted-foreground">Telephone, email et site web de l&apos;hebergement.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Telephone</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input value={form.telephone} onChange={(event) => onUpdate("telephone", event.target.value)} placeholder="+261..." className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input type="email" value={form.email} onChange={(event) => onUpdate("email", event.target.value)} placeholder="contact@..." className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Site web</label>
                <div className="relative">
                  <Globe2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input value={form.siteWeb} onChange={(event) => onUpdate("siteWeb", event.target.value)} placeholder="https://..." className="pl-9" />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                <MapPin className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold">Localisation</h3>
                <p className="text-sm text-muted-foreground">Clique sur la carte pour ajuster latitude et longitude.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Latitude *</label>
                <Input type="number" step="any" value={form.latitude} onChange={(event) => onUpdate("latitude", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Longitude *</label>
                <Input type="number" step="any" value={form.longitude} onChange={(event) => onUpdate("longitude", event.target.value)} required />
              </div>
            </div>
            <div className="mt-4">
              <HebergementMap
                latitude={Number(form.latitude)}
                longitude={Number(form.longitude)}
                onChange={({ latitude, longitude }) => {
                  onUpdate("latitude", String(latitude));
                  onUpdate("longitude", String(longitude));
                }}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border/50 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                <Tags className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold">Equipements</h3>
                <p className="text-sm text-muted-foreground">Selectionne les caracteristiques qui seront affichees.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={selectedEquipementId} onValueChange={setSelectedEquipementId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir un equipement" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipements.map((equipement) => (
                      <SelectItem key={equipement.id} value={equipement.id}>{equipement.equipement}</SelectItem>
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
                <Button type="button" variant="outline" size="icon" onClick={() => setShowEquipementCreator((current) => !current)} aria-label="Ajouter un equipement">
                  <Plus className="size-4" />
                </Button>
              </div>

              {showEquipementCreator ? (
                <div className="flex flex-col gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-3 sm:flex-row">
                  <Input value={newEquipementName} onChange={(event) => onEquipementNameChange(event.target.value)} placeholder="Nouvel equipement" />
                  <Button
                    type="button"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => {
                      if (!newEquipementName.trim()) return;
                      onCreateEquipement();
                      setShowEquipementCreator(false);
                    }}
                  >
                    Ajouter
                  </Button>
                </div>
              ) : null}

              {taxonomyMessage ? <p className="text-sm text-muted-foreground">{taxonomyMessage}</p> : null}

              <div className="flex flex-wrap gap-2">
                {selectedEquipements.length === 0 ? <p className="text-sm text-muted-foreground">Aucun equipement selectionne.</p> : null}
                {selectedEquipements.map((equipement) => (
                  <span key={equipement.id} className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                    {equipement.equipement}
                    <button type="button" onClick={() => onUpdate("idsPlus", form.idsPlus.filter((id) => id !== equipement.id))} aria-label={`Retirer ${equipement.equipement}`}>
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm 2xl:sticky 2xl:top-20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Validation</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="grid gap-1 sm:grid-cols-[110px_minmax(0,1fr)]">
                <span className="text-slate-500">Nom</span>
                <span className="font-medium text-slate-900 sm:text-right">{form.nom || "-"}</span>
              </div>
              <div className="grid gap-1 sm:grid-cols-[110px_minmax(0,1fr)]">
                <span className="text-slate-500">Type</span>
                <span className="font-medium text-slate-900 sm:text-right">{selectedType?.nom || "-"}</span>
              </div>
              <div className="grid gap-1 sm:grid-cols-[110px_minmax(0,1fr)]">
                <span className="text-slate-500">Contact</span>
                <span className="font-medium text-slate-900 sm:text-right">{form.telephone || form.email || "-"}</span>
              </div>
              <div className="grid gap-1 sm:grid-cols-[110px_minmax(0,1fr)]">
                <span className="text-slate-500">Coordonnees</span>
                <span className="font-medium text-slate-900 sm:text-right">{form.latitude || "-"}, {form.longitude || "-"}</span>
              </div>
            </div>
            <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
              Les champs marques d&apos;un asterisque sont obligatoires.
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <Button type="submit" disabled={isSaving} className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
                {isSaving ? "Enregistrement..." : submitLabel}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="w-full">
                Annuler
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}
