"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  Gauge,
  ImageIcon,
  MapPin,
  Pencil,
  Plus,
  Tags,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { AdminFooter } from "@/app/admin/components/footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api/client";
import {
  createActivitePhotos,
  createCategorieClientActivite,
  createTarifActivite,
  deleteActivitePhoto,
  deleteTarifActivite,
  getActivite,
  listCategorieClientActivites,
  updateTarifActivite,
} from "@/lib/api/activites";
import { loadAuth } from "@/lib/auth";
import {
  Activite,
  CategorieClientActivite,
  SavePhotoActivitePayload,
  SaveTarifActivitePayload,
  TarifActivite,
} from "@/lib/type/activite";
import { useAdminNavigation } from "../../contexts/admin-navigation-context";
import { useBreadcrumbs } from "../../contexts/breadcrumbs-context";

type Props = { activiteId: string };

type TarifFormState = {
  idCategorieClient: string;
  prixParPersonne: string;
  prixParHeur: string;
  devise: string;
  estActif: boolean;
  dateValiditeDebut: string;
  dateValiditeFin: string;
};

type GalleryImage = {
  id: string;
  url: string;
  label: string;
};

const HebergementMap = dynamic(
  () => import("@/components/hebergement-map").then((mod) => mod.HebergementMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 text-sm text-emerald-700">
        Chargement de la carte...
      </div>
    ),
  }
);

const initialTarifForm: TarifFormState = {
  idCategorieClient: "",
  prixParPersonne: "",
  prixParHeur: "",
  devise: "MGA",
  estActif: true,
  dateValiditeDebut: "",
  dateValiditeFin: "",
};

const greenButtonScopeClass =
  "[&_button[data-slot='button']:not([data-variant='destructive'])]:border-emerald-200 [&_button[data-slot='button']:not([data-variant='destructive'])]:bg-emerald-50 [&_button[data-slot='button']:not([data-variant='destructive'])]:text-emerald-700 [&_button[data-slot='button']:not([data-variant='destructive']):hover]:border-emerald-300 [&_button[data-slot='button']:not([data-variant='destructive']):hover]:bg-emerald-100 [&_button[data-slot='button']:not([data-variant='destructive']):hover]:text-emerald-800";
const greenPrimaryButtonClass =
  "!border-transparent !bg-gradient-to-r !from-emerald-600 !to-teal-600 !text-white !shadow-lg !shadow-emerald-500/20 hover:!from-emerald-700 hover:!to-teal-700";
const greenOutlineButtonClass =
  "!border-emerald-200 !bg-emerald-50 !text-emerald-700 hover:!border-emerald-300 hover:!bg-emerald-100 hover:!text-emerald-800";

function formatCurrency(value: number | null | undefined, devise = "MGA") {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toLocaleString("fr-FR")} ${devise}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTarifLabel(tarif: TarifActivite) {
  if (tarif.prixParPersonne && tarif.prixParHeur) {
    return `${formatCurrency(tarif.prixParPersonne, tarif.devise)} / personne - ${formatCurrency(tarif.prixParHeur, tarif.devise)} / heure`;
  }
  if (tarif.prixParPersonne) return `${formatCurrency(tarif.prixParPersonne, tarif.devise)} / personne`;
  if (tarif.prixParHeur) return `${formatCurrency(tarif.prixParHeur, tarif.devise)} / heure`;
  return "-";
}

export function AdminActiviteDetailContent({ activiteId }: Props) {
  const router = useRouter();
  const { setActive } = useAdminNavigation();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [accessToken, setAccessToken] = useState("");
  const [role, setRole] = useState("");
  const [activite, setActivite] = useState<Activite | null>(null);
  const [categoriesClient, setCategoriesClient] = useState<CategorieClientActivite[]>([]);
  const [newCategorieClientName, setNewCategorieClientName] = useState("");
  const [showCategorieClientCreator, setShowCategorieClientCreator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingTarif, setIsSavingTarif] = useState(false);
  const [isCreatingCategorieClient, setIsCreatingCategorieClient] = useState(false);
  const [isSavingPhotos, setIsSavingPhotos] = useState(false);
  const [isDeletingTarifId, setIsDeletingTarifId] = useState<string | null>(null);
  const [isDeletingPhotoId, setIsDeletingPhotoId] = useState<string | null>(null);
  const [tarifForm, setTarifForm] = useState<TarifFormState>(initialTarifForm);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [editingTarifId, setEditingTarifId] = useState<string | null>(null);
  const [isTarifDialogOpen, setIsTarifDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [isGalleryDialogOpen, setIsGalleryDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  const tarifs = useMemo(
    () =>
      [...(activite?.tarifs ?? [])].sort(
        (a, b) => new Date(b.dateCreation ?? 0).getTime() - new Date(a.dateCreation ?? 0).getTime()
      ),
    [activite]
  );
  const activeTarifs = useMemo(() => tarifs.filter((tarif) => tarif.estActif), [tarifs]);
  const lowestTarif = useMemo(() => {
    const pricedTarifs = activeTarifs
      .map((tarif) => ({
        tarif,
        amount: tarif.prixParPersonne ?? tarif.prixParHeur ?? null,
      }))
      .filter((item): item is { tarif: TarifActivite; amount: number } => item.amount !== null);

    return pricedTarifs.sort((a, b) => a.amount - b.amount)[0] ?? null;
  }, [activeTarifs]);
  const galleryImages = useMemo(() => {
    const items: GalleryImage[] = [
      ...(activite?.imagePrincipale
        ? [{ id: "principale", url: activite.imagePrincipale, label: "Image principale" }]
        : []),
      ...((activite?.photos ?? []).map((photo, index) => ({
        id: photo.id,
        url: photo.urlImage,
        label: `Photo ${index + 1}`,
      }))),
    ];

    return items.filter(
      (item, index, collection) =>
        item.url && collection.findIndex((candidate) => candidate.url === item.url) === index
    );
  }, [activite]);
  const hasPrixParPersonne = tarifForm.prixParPersonne.trim().length > 0;
  const hasPrixParHeur = tarifForm.prixParHeur.trim().length > 0;
  const photoPreviews = useMemo(
    () => photoFiles.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    [photoFiles]
  );

  useEffect(() => {
    const session = loadAuth();
    if (!session?.accessToken) return void router.push("/login");
    if (session.role !== "ADMIN") return void router.push("/admin");
    setAccessToken(session.accessToken);
    setRole(session.role);
  }, [router]);

  useEffect(() => {
    if (!accessToken || role !== "ADMIN") return;
    void loadPage();
  }, [accessToken, role, activiteId]);

  useEffect(() => {
    // Synchroniser la section active avec la navigation admin
    setActive("activites");
  }, [setActive]);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Activités", href: "/admin?section=activites" },
      { label: activite?.nom ?? "Détail activité", isActive: true },
    ]);
  }, [activite?.nom, setBreadcrumbs]);

  useEffect(() => {
    if (!successMessage) {
      setShowSuccessAlert(false);
      return;
    }
    setShowSuccessAlert(true);
    const timeout = window.setTimeout(() => setShowSuccessAlert(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    if (!error) {
      setShowErrorAlert(false);
      return;
    }
    setShowErrorAlert(true);
    const timeout = window.setTimeout(() => setShowErrorAlert(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [error]);

  useEffect(() => {
    return () => {
      photoPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [photoPreviews]);

  async function loadPage() {
    setIsLoading(true);
    setError("");
    try {
      const [activiteResponse, categoriesClientResponse] = await Promise.all([
        getActivite(activiteId, accessToken),
        listCategorieClientActivites(accessToken),
      ]);
      setActivite(activiteResponse.data ?? null);
      setCategoriesClient(
        [...(categoriesClientResponse.data ?? [])].sort((a, b) =>
          a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })
        )
      );
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Impossible de charger le detail de l'activite"));
    } finally {
      setIsLoading(false);
    }
  }

  async function reloadActivite() {
    const response = await getActivite(activiteId, accessToken);
    setActivite(response.data ?? null);
  }

  function updateTarifForm<K extends keyof TarifFormState>(key: K, value: TarifFormState[K]) {
    setTarifForm((current) => ({ ...current, [key]: value }));
  }

  function formFromTarif(tarif: TarifActivite): TarifFormState {
    return {
      idCategorieClient: tarif.idCategorieClient ?? "",
      prixParPersonne:
        tarif.prixParPersonne !== null && tarif.prixParPersonne !== undefined
          ? String(tarif.prixParPersonne)
          : "",
      prixParHeur: tarif.prixParHeur !== null && tarif.prixParHeur !== undefined ? String(tarif.prixParHeur) : "",
      devise: tarif.devise ?? "MGA",
      estActif: Boolean(tarif.estActif),
      dateValiditeDebut: tarif.dateValiditeDebut ?? "",
      dateValiditeFin: tarif.dateValiditeFin ?? "",
    };
  }

  function openCreateTarifDialog() {
    setEditingTarifId(null);
    setTarifForm(initialTarifForm);
    setNewCategorieClientName("");
    setShowCategorieClientCreator(false);
    setIsTarifDialogOpen(true);
  }

  function openEditTarifDialog(tarif: TarifActivite) {
    setEditingTarifId(tarif.id);
    setTarifForm(formFromTarif(tarif));
    setNewCategorieClientName("");
    setShowCategorieClientCreator(false);
    setIsTarifDialogOpen(true);
  }

  function buildTarifPayload(): SaveTarifActivitePayload {
    return {
      idCategorieClient: tarifForm.idCategorieClient,
      prixParPersonne: tarifForm.prixParPersonne ? Number(tarifForm.prixParPersonne) : null,
      prixParHeur: tarifForm.prixParHeur ? Number(tarifForm.prixParHeur) : null,
      devise: tarifForm.devise.trim() || "MGA",
      estActif: tarifForm.estActif,
      dateValiditeDebut: tarifForm.dateValiditeDebut,
      dateValiditeFin: tarifForm.dateValiditeFin,
      idActivite: activiteId,
    };
  }

  async function handleCreateCategorieClient() {
    const trimmed = newCategorieClientName.trim();
    if (!trimmed) {
      setError("Renseigne le nom de la categorie client.");
      return;
    }

    setIsCreatingCategorieClient(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await createCategorieClientActivite(trimmed, accessToken);
      const createdCategory = response.data;
      if (createdCategory) {
        setCategoriesClient((current) =>
          [...current, createdCategory].sort((a, b) =>
            a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })
          )
        );
        setTarifForm((current) => ({ ...current, idCategorieClient: createdCategory.id }));
      }
      setNewCategorieClientName("");
      setShowCategorieClientCreator(false);
      setSuccessMessage("Categorie client ajoutee avec succes.");
    } catch (createError) {
      setError(getErrorMessage(createError, "Impossible d'ajouter la categorie client"));
    } finally {
      setIsCreatingCategorieClient(false);
    }
  }

  async function handleSubmitTarif(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingTarif(true);
    setError("");
    setSuccessMessage("");
    try {
      const payload = buildTarifPayload();
      if (editingTarifId) {
        await updateTarifActivite(editingTarifId, payload, accessToken);
        setSuccessMessage("Tarif d'activite modifie avec succes.");
      } else {
        await createTarifActivite(payload, accessToken);
        setSuccessMessage("Tarif d'activite ajoute avec succes.");
      }
      await reloadActivite();
      setTarifForm(initialTarifForm);
      setEditingTarifId(null);
      setIsTarifDialogOpen(false);
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible d'enregistrer le tarif"));
    } finally {
      setIsSavingTarif(false);
    }
  }

  async function handleDeleteTarif(tarifId: string) {
    if (!window.confirm("Supprimer ce tarif ?")) return;
    setIsDeletingTarifId(tarifId);
    setError("");
    setSuccessMessage("");
    try {
      await deleteTarifActivite(tarifId, accessToken);
      await reloadActivite();
      setSuccessMessage("Tarif d'activite supprime avec succes.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Impossible de supprimer le tarif"));
    } finally {
      setIsDeletingTarifId(null);
    }
  }

  async function handleSubmitPhotos(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (photoFiles.length === 0) {
      setError("Au moins une image est obligatoire.");
      return;
    }

    setIsSavingPhotos(true);
    try {
      const payload: SavePhotoActivitePayload = { imageFiles: photoFiles };
      await createActivitePhotos(activiteId, payload, accessToken);
      await reloadActivite();
      setPhotoFiles([]);
      setIsPhotoDialogOpen(false);
      setSuccessMessage("Photos de l'activite ajoutees avec succes.");
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible d'ajouter les photos"));
    } finally {
      setIsSavingPhotos(false);
    }
  }

  async function handleDeletePhoto(photoId: string) {
    if (!window.confirm("Supprimer cette photo ?")) return;
    setIsDeletingPhotoId(photoId);
    setError("");
    setSuccessMessage("");
    try {
      await deleteActivitePhoto(photoId, accessToken);
      await reloadActivite();
      setSuccessMessage("Photo d'activite supprimee avec succes.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Impossible de supprimer la photo"));
    } finally {
      setIsDeletingPhotoId(null);
    }
  }

  if (!accessToken || role !== "ADMIN") return null;

  const successAlert = successMessage && showSuccessAlert ? (
    <Alert
      key={successMessage}
      variant="success"
      className="fixed right-6 top-24 z-[70] w-[min(420px,calc(100vw-2rem))] border-emerald-300 shadow-xl"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <AlertTitle>Succes</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </div>
        <button
          type="button"
          onClick={() => setShowSuccessAlert(false)}
          className="rounded-md p-1 text-emerald-700/70 transition-colors hover:bg-emerald-100 hover:text-emerald-900"
          aria-label="Fermer l'alerte"
        >
          <X className="size-4" />
        </button>
      </div>
    </Alert>
  ) : null;

  const errorAlert = error && showErrorAlert ? (
    <Alert
      variant="destructive"
      className="fixed right-6 top-24 z-[70] w-[min(420px,calc(100vw-2rem))] shadow-xl"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </div>
        <button
          type="button"
          onClick={() => setShowErrorAlert(false)}
          className="rounded-md p-1 text-red-700/70 transition-colors hover:bg-red-100 hover:text-red-900"
          aria-label="Fermer l'alerte"
        >
          <X className="size-4" />
        </button>
      </div>
    </Alert>
  ) : null;

  return (
    <div className={`min-h-screen bg-gradient-to-b from-background via-muted/30 to-background text-foreground ${greenButtonScopeClass}`}>
      {errorAlert}
      {successAlert}
      <main className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-8">
        <div className="space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Button asChild variant="outline" size="sm" className={greenOutlineButtonClass}>
                <Link href="/admin?section=activites">Retour aux activités</Link>
              </Button>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{activite?.nom ?? "Detail activite"}</h1>
                <p className="text-sm text-muted-foreground">
                  Géré la présentation, les tarifs et les photos de cette activité.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={openCreateTarifDialog} className={greenPrimaryButtonClass}>
                <Plus className="size-4" />
                Ajouter tarif
              </Button>
              <Button variant="outline" onClick={() => setIsPhotoDialogOpen(true)} className={greenOutlineButtonClass}>
                <Plus className="size-4" />
                Ajouter photos
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-3xl border border-border/50 bg-white p-8 text-sm text-muted-foreground shadow-sm">
              Chargement...
            </div>
          ) : activite ? (
            <>
              <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-6">
                  <div className="grid gap-2 overflow-hidden rounded-3xl border border-border/50 bg-white p-2 shadow-sm lg:h-[420px] lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]">
                    <button
                      type="button"
                      onClick={() => setIsGalleryDialogOpen(true)}
                      className="relative min-h-[260px] overflow-hidden rounded-2xl bg-muted/30 text-left"
                    >
                      <GalleryTile image={galleryImages[0]} title={activite.nom} large />
                    </button>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[1, 2, 3, 4].map((index) => {
                        const image = galleryImages[index];
                        const isLastImage = index === Math.min(galleryImages.length - 1, 4);
                        const canOpenGallery = galleryImages.length > 0;
                        return (
                          <button
                            key={image?.id ?? `empty-${index}`}
                            type="button"
                            onClick={() => {
                              if (canOpenGallery) setIsGalleryDialogOpen(true);
                            }}
                            disabled={!canOpenGallery}
                            className="relative min-h-[160px] overflow-hidden rounded-2xl bg-muted/30 text-left disabled:cursor-default"
                          >
                            <GalleryTile image={image} title={activite.nom} />
                            {image && isLastImage ? (
                              <span className="absolute inset-0 flex items-center justify-center bg-slate-950/45">
                                <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                                  <Camera className="size-4" />
                                  Galérie
                                </span>
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                        {activite.estActif ? "Actif" : "Inactif"}
                      </span>
                      <span className="text-muted-foreground">{activite.nomCategorie || "Categorie non renseignee"}</span>
                    </div>

                    <div>
                      <h2 className="max-w-5xl text-4xl font-semibold tracking-tight text-slate-950">
                        {activite.nom}
                      </h2>
                      <p className="mt-3 max-w-4xl text-base leading-7 text-muted-foreground">
                        {activite.description || "Aucune description renseignee."}
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <InfoBlock icon={Clock} label="Durée" value={`${activite.dureeHeures} h`} />
                      <InfoBlock icon={Gauge} label="Difficulté" value={activite.niveauxDeDifficulte || "-"} />
                      <InfoBlock
                        icon={Users}
                        label="Nombre maximum de personnes dans le groupe"
                        value={activite.participantsMax || "-"}
                      />
                      <InfoBlock icon={Users} label="Minimum requis" value={`${activite.participantMin} personne(s)`} />
                    </div>

                    <div className="rounded-3xl border border-border/50 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-5 text-emerald-600" />
                        <h3 className="font-semibold">Equipements fournis</h3>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {activite.equipementsFournis?.length ? (
                          activite.equipementsFournis.map((equipement) => (
                            <span
                              key={equipement}
                              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700"
                            >
                              {equipement}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Aucun équipement renseigné.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="space-y-5 xl:sticky xl:top-6 xl:h-fit">
                  <div className="rounded-3xl border border-border/50 bg-white p-5 shadow-xl shadow-slate-200/70">
                    <p className="text-sm text-muted-foreground">A partir de</p>
                    <div className="mt-1 flex items-end gap-2">
                      <p className="text-3xl font-semibold tracking-tight text-slate-950">
                        {lowestTarif ? formatCurrency(lowestTarif.amount, lowestTarif.tarif.devise) : "-"}
                      </p>
                      <span className="pb-1 text-sm text-muted-foreground">
                        {lowestTarif?.tarif.prixParPersonne
                          ? "/ personne"
                          : lowestTarif?.tarif.prixParHeur
                            ? "/ heure"
                            : ""}
                      </span>
                    </div>
                    <Button onClick={openCreateTarifDialog} className={`mt-5 w-full ${greenPrimaryButtonClass}`}>
                      Ajouter un tarif
                    </Button>
                  </div>

                  <div className="rounded-3xl border border-border/50 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <MapPin className="size-5 text-emerald-700" />
                      <h3 className="font-semibold">Localisation</h3>
                    </div>
                    <HebergementMap latitude={Number(activite.latitude)} longitude={Number(activite.longitude)} onChange={() => undefined} />
                    <p className="mt-3 text-xs text-muted-foreground">
                      {activite.latitude}, {activite.longitude}
                    </p>
                  </div>
                </aside>
              </section>

              <section className="rounded-3xl border border-border/50 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">Tarifs et disponibilités</h2>
                    <p className="text-sm text-muted-foreground">{tarifs.length} tarif(s) enregistrés.</p>
                  </div>
                  <Button onClick={openCreateTarifDialog} className={greenPrimaryButtonClass}>
                    <Plus className="size-4" />
                    Ajouter tarif
                  </Button>
                </div>

                {tarifs.length === 0 ? (
                  <p className="mt-5 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-5 text-sm text-muted-foreground">
                    Aucun tarif ajouté pour cette activité.
                  </p>
                ) : (
                  <div className="mt-5 space-y-4">
                    {tarifs.map((tarif) => (
                      <div key={tarif.id} className="grid gap-4 rounded-2xl border border-border/50 bg-card/50 p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                            <Wallet className="size-6" />
                          </div>
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold">{formatTarifLabel(tarif)}</h3>
                              <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                                {tarif.estActif ? "Actif" : "Inactif"}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <Tags className="size-4" />
                                {tarif.nomCategorieClient || "Catégorie client non renseignée"}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="size-4" />
                                {formatDate(tarif.dateValiditeDebut)} - {formatDate(tarif.dateValiditeFin)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <Button size="sm" variant="secondary" onClick={() => openEditTarifDialog(tarif)} className={greenOutlineButtonClass}>
                            <Pencil className="size-4" />
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteTarif(tarif.id)}
                            disabled={isDeletingTarifId === tarif.id}
                          >
                            <Trash2 className="size-4" />
                            {isDeletingTarifId === tarif.id ? "Suppression..." : "Supprimer"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-border/50 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">Photos des l&apos;activités</h2>
                    <p className="text-sm text-muted-foreground">{activite.photos?.length ?? 0} photo(s).</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {galleryImages.length ? (
                      <Button variant="outline" onClick={() => setIsGalleryDialogOpen(true)} className={greenOutlineButtonClass}>
                        <Camera className="size-4" />
                        Voir galerie
                      </Button>
                    ) : null}
                    <Button variant="outline" onClick={() => setIsPhotoDialogOpen(true)} className={greenOutlineButtonClass}>
                      <Plus className="size-4" />
                      Ajouter photos
                    </Button>
                  </div>
                </div>

                {activite.photos?.length ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {activite.photos.map((photo) => (
                      <div key={photo.id} className="overflow-hidden rounded-2xl border border-border/50 bg-muted/20">
                        <img src={photo.urlImage} alt={activite.nom} className="h-40 w-full object-cover" />
                        <div className="p-3">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 px-3 text-xs"
                            onClick={() => handleDeletePhoto(photo.id)}
                            disabled={isDeletingPhotoId === photo.id}
                          >
                            {isDeletingPhotoId === photo.id ? "Suppression..." : "Supprimer"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-5 text-sm text-muted-foreground">
                    Aucune photo ajoutée pour cette activité.
                  </p>
                )}
              </section>
            </>
          ) : (
            <div className="rounded-3xl border border-border/50 bg-white p-8 text-sm text-muted-foreground shadow-sm">
              Activite introuvable.
            </div>
          )}
        </div>
      </main>

      <Dialog open={isGalleryDialogOpen} onOpenChange={setIsGalleryDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Galérie activite</DialogTitle>
            <DialogDescription>
              {galleryImages.length} image{galleryImages.length > 1 ? "s" : ""} disponible{galleryImages.length > 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          {galleryImages.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {galleryImages.map((image) => (
                <figure key={image.id} className="overflow-hidden rounded-2xl border border-border/50 bg-muted/20">
                  <img src={image.url} alt={image.label} className="max-h-[520px] w-full object-cover" />
                  <figcaption className="px-4 py-3 text-sm text-muted-foreground">{image.label}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune image disponible.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isTarifDialogOpen}
        onOpenChange={(value) => {
          setIsTarifDialogOpen(value);
          if (!value) {
            setTarifForm(initialTarifForm);
            setEditingTarifId(null);
            setNewCategorieClientName("");
            setShowCategorieClientCreator(false);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTarifId ? "Modifié un tarif" : "Ajouter un tarif"}</DialogTitle>
            <DialogDescription>Renseigne un tarif clair et rapide a gerer pour cette activite.</DialogDescription>
          </DialogHeader>

          <form className="space-y-6" onSubmit={handleSubmitTarif}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Categorie client</label>
                <div className="flex gap-2">
                  <Select value={tarifForm.idCategorieClient} onValueChange={(value) => updateTarifForm("idCategorieClient", value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Choisir une categorie client" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesClient.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={greenOutlineButtonClass}
                    onClick={() => setShowCategorieClientCreator((current) => !current)}
                    aria-label="Ajouter une categorie client"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                {showCategorieClientCreator ? (
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        placeholder="Nouvelle categorie client"
                        value={newCategorieClientName}
                        onChange={(event) => setNewCategorieClientName(event.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button type="button" onClick={handleCreateCategorieClient} disabled={isCreatingCategorieClient} className={greenPrimaryButtonClass}>
                          {isCreatingCategorieClient ? "Ajout..." : "Ajouter"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setShowCategorieClientCreator(false);
                            setNewCategorieClientName("");
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prix par personne</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tarifForm.prixParPersonne}
                  onChange={(event) => updateTarifForm("prixParPersonne", event.target.value)}
                  placeholder="Ex: 50000"
                  disabled={hasPrixParHeur}
                />
                <p className="text-xs text-muted-foreground">Renseignez soit ce prix, soit le prix par heure.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prix par heure</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tarifForm.prixParHeur}
                  onChange={(event) => updateTarifForm("prixParHeur", event.target.value)}
                  placeholder="Optionnel"
                  disabled={hasPrixParPersonne}
                />
                <p className="text-xs text-muted-foreground">Renseignez soit ce prix, soit le prix par personne.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Devise</label>
                <Input value={tarifForm.devise} onChange={(event) => updateTarifForm("devise", event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date debut</label>
                <Input type="date" value={tarifForm.dateValiditeDebut} onChange={(event) => updateTarifForm("dateValiditeDebut", event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date fin</label>
                <Input type="date" value={tarifForm.dateValiditeFin} onChange={(event) => updateTarifForm("dateValiditeFin", event.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
              <Checkbox
                id="tarifActiviteActif"
                checked={tarifForm.estActif}
                onCheckedChange={(checked) => updateTarifForm("estActif", checked === true)}
              />
              <label htmlFor="tarifActiviteActif" className="text-sm font-medium">
                Tarif actif
              </label>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSavingTarif} className={greenPrimaryButtonClass}>
                {isSavingTarif ? "Enregistrement..." : editingTarifId ? "Enregistrer les modifications" : "Ajouter le tarif"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isPhotoDialogOpen}
        onOpenChange={(value) => {
          setIsPhotoDialogOpen(value);
          if (!value) setPhotoFiles([]);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter des photos</DialogTitle>
            <DialogDescription>Selectionne une ou plusieurs images pour cette activite.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmitPhotos}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Photos</label>
              <Input type="file" accept="image/*" multiple onChange={(event) => setPhotoFiles(Array.from(event.target.files ?? []))} />
            </div>

            {photoFiles.length > 0 ? (
              <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                <p className="mb-3 text-sm font-medium">
                  {photoFiles.length} image{photoFiles.length > 1 ? "s" : ""} selectionnee{photoFiles.length > 1 ? "s" : ""}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {photoPreviews.map((preview, index) => (
                    <div key={`${preview.name}-${preview.url}`} className="overflow-hidden rounded-xl border border-border/50 bg-background">
                      <img src={preview.url} alt={preview.name} className="h-28 w-full object-cover" />
                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <span className="max-w-[180px] truncate text-xs text-muted-foreground">{preview.name}</span>
                        <button
                          type="button"
                          onClick={() => setPhotoFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                          aria-label={`Retirer ${preview.name}`}
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSavingPhotos} className={greenPrimaryButtonClass}>
                {isSavingPhotos ? "Envoi..." : "Ajouter les photos"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function GalleryTile({ image, title, large = false }: { image?: GalleryImage; title: string; large?: boolean }) {
  if (!image) {
    return (
      <div className="flex h-full min-h-[160px] items-center justify-center bg-muted/30 text-muted-foreground">
        <ImageIcon className="size-8" />
      </div>
    );
  }

  return (
    <img
      src={image.url}
      alt={title}
      className={`h-full w-full object-cover transition-transform duration-300 hover:scale-105 ${large ? "min-h-[260px]" : "min-h-[160px]"}`}
    />
  );
}

function InfoBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-4 rounded-3xl border border-border/50 bg-white p-5 shadow-sm">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="font-semibold text-slate-950">{label}</p>
        <p className="mt-2 text-sm text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}
