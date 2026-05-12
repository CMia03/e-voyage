"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Bath,
  BedDouble,
  CheckCircle2,
  ChevronRight,
  ImageIcon,
  Mail,
  Phone,
  Plus,
  Share2,
  Snowflake,
  Star,
  Globe2,
  Users,
  X,
} from "lucide-react";

import { FormTarifHebergement, TarifFormState } from "./form-tarif-hebergement";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api/client";
import {
  createTarifHebergement,
  createTarifPhotos,
  createTypeChambre,
  createTypeSalle,
  deleteTarifHebergement,
  deleteTarifPhoto,
  getHebergement,
  listTypeChambres,
  listTypeSalles,
  updateTarifHebergement,
} from "@/lib/api/hebergements";
import { loadAuth } from "@/lib/auth";
import { Hebergement, SaveTarifHebergementPayload, SaveTarifPhotoPayload, TarifHebergement, TypeChambre, TypeSalle } from "@/lib/type/hebergement";
import { useAdminNavigation } from "../../contexts/admin-navigation-context";

type Props = { hebergementId: string };
type PhotoFormState = { idTypeSalle: string; imageFiles: File[] };
type GalleryImage = {
  url: string;
  label: string;
  subtitle?: string;
};

const initialTarifForm: TarifFormState = {
  prixReservation: "",
  prixParNuit: "",
  devise: "MGA",
  gamme: "MOYENNE",
  capacite: "2",
  petitDejeunerInclus: false,
  estActif: true,
  dateValiditeDebut: "",
  dateValiditeFin: "",
  idTypeChambre: "",
};

const initialPhotoForm: PhotoFormState = { idTypeSalle: "", imageFiles: [] };

const HebergementMap = dynamic(
  () => import("@/components/hebergement-map").then((mod) => mod.HebergementMap),
  { ssr: false }
);

function formatMoney(value: number | null | undefined, devise = "MGA") {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toLocaleString("fr-FR")} ${devise}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Non definie";
  return new Date(value).toLocaleDateString("fr-FR");
}

export function AdminHebergementDetailContentNext({ hebergementId }: Props) {
  const router = useRouter();
  const { setActive } = useAdminNavigation();
  const [accessToken, setAccessToken] = useState("");
  const [role, setRole] = useState("");
  const [hebergement, setHebergement] = useState<Hebergement | null>(null);
  const [typeChambres, setTypeChambres] = useState<TypeChambre[]>([]);
  const [typeSalles, setTypeSalles] = useState<TypeSalle[]>([]);
  const [tarifForm, setTarifForm] = useState<TarifFormState>(initialTarifForm);
  const [photoForm, setPhotoForm] = useState<PhotoFormState>(initialPhotoForm);
  const [selectedTarifId, setSelectedTarifId] = useState<string | null>(null);
  const [newTypeChambreName, setNewTypeChambreName] = useState("");
  const [newTypeSalleName, setNewTypeSalleName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingTarif, setIsSubmittingTarif] = useState(false);
  const [isSubmittingPhoto, setIsSubmittingPhoto] = useState(false);
  const [isDeletingTarifId, setIsDeletingTarifId] = useState<string | null>(null);
  const [isDeletingPhotoId, setIsDeletingPhotoId] = useState<string | null>(null);
  const [isTarifDialogOpen, setIsTarifDialogOpen] = useState(false);
  const [isEditTarifDialogOpen, setIsEditTarifDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [showTypeSalleCreator, setShowTypeSalleCreator] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [editingTarifId, setEditingTarifId] = useState<string | null>(null);
  const [roomPhotoIndexes, setRoomPhotoIndexes] = useState<Record<string, number>>({});
  const [isGalleryDialogOpen, setIsGalleryDialogOpen] = useState(false);

  const tarifs = useMemo(
    () => [...(hebergement?.tarifs ?? [])].sort((a, b) => new Date(b.dateCreation ?? 0).getTime() - new Date(a.dateCreation ?? 0).getTime()),
    [hebergement]
  );
  const galleryImages = useMemo<GalleryImage[]>(() => {
    const images: GalleryImage[] = [];
    const seen = new Set<string>();

    if (hebergement?.urlImagePrincipale?.trim()) {
      images.push({
        url: hebergement.urlImagePrincipale,
        label: "Image principale",
        subtitle: hebergement.nom,
      });
      seen.add(hebergement.urlImagePrincipale);
    }

    tarifs.forEach((tarif) => {
      tarif.photos.forEach((photo) => {
        if (!photo.urlImage?.trim() || seen.has(photo.urlImage)) return;

        images.push({
          url: photo.urlImage,
          label: photo.nomTypeSalle || "Image",
          subtitle: tarif.nomTypeChambre,
        });
        seen.add(photo.urlImage);
      });
    });

    return images;
  }, [hebergement?.nom, hebergement?.urlImagePrincipale, tarifs]);
  const minTarif = useMemo(
    () =>
      tarifs.reduce<(typeof tarifs)[number] | null>((lowest, tarif) => {
        if (!lowest) return tarif;
        return Number(tarif.prixParNuit ?? 0) < Number(lowest.prixParNuit ?? 0) ? tarif : lowest;
      }, null),
    [tarifs]
  );
  const photoPreviews = useMemo(
    () =>
      photoForm.imageFiles.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [photoForm.imageFiles]
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
  }, [accessToken, role, hebergementId]);

  useEffect(() => {
    // Synchroniser la section active avec la navigation admin
    setActive("hebergements-view");
  }, [setActive]);

  useEffect(() => {
    if (!successMessage) {
      setShowSuccessAlert(false);
      return;
    }

    setShowSuccessAlert(true);
    const timeout = window.setTimeout(() => {
      setShowSuccessAlert(false);
    }, 4500);

    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    if (!error) {
      setShowErrorAlert(false);
      return;
    }

    setShowErrorAlert(true);
    const timeout = window.setTimeout(() => {
      setShowErrorAlert(false);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [error]);

  useEffect(() => {
    return () => {
      photoPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [photoPreviews]);

  useEffect(() => {
    if (tarifs.length === 0) return;

    const interval = window.setInterval(() => {
      setRoomPhotoIndexes((current) => {
        const next = { ...current };

        tarifs.forEach((tarif) => {
          const imageCount = Math.max(tarif.photos.length, 1);
          if (imageCount <= 1) {
            next[tarif.id] = 0;
            return;
          }

          next[tarif.id] = ((current[tarif.id] ?? 0) + 1) % imageCount;
        });

        return next;
      });
    }, 3500);

    return () => window.clearInterval(interval);
  }, [tarifs]);

  async function loadPage() {
    setIsLoading(true);
    setError("");
    try {
      const [hebergementResponse, typeChambresResponse, typeSallesResponse] = await Promise.all([
        getHebergement(hebergementId, accessToken),
        listTypeChambres(accessToken),
        listTypeSalles(accessToken),
      ]);
      setHebergement(hebergementResponse.data ?? null);
      setTypeChambres(typeChambresResponse.data ?? []);
      setTypeSalles(typeSallesResponse.data ?? []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Impossible de charger le detail"));
    } finally {
      setIsLoading(false);
    }
  }

  async function reloadHebergement() {
    const response = await getHebergement(hebergementId, accessToken);
    setHebergement(response.data ?? null);
  }

  function updateTarifForm<K extends keyof TarifFormState>(key: K, value: TarifFormState[K]) {
    setTarifForm((current) => ({ ...current, [key]: value }));
  }

  function mapTarifToForm(tarif: TarifHebergement): TarifFormState {
    return {
      prixReservation: tarif.prixReservation !== null && tarif.prixReservation !== undefined ? String(tarif.prixReservation) : "",
      prixParNuit: String(tarif.prixParNuit ?? ""),
      devise: tarif.devise ?? "MGA",
      gamme: tarif.gamme ?? "MOYENNE",
      capacite: String(tarif.capacite ?? "2"),
      petitDejeunerInclus: Boolean(tarif.petitDejeunerInclus),
      estActif: Boolean(tarif.estActif),
      dateValiditeDebut: tarif.dateValiditeDebut ?? "",
      dateValiditeFin: tarif.dateValiditeFin ?? "",
      idTypeChambre: tarif.idTypeChambre ?? "",
    };
  }

  function openTarifDialog() {
    setTarifForm(initialTarifForm);
    setNewTypeChambreName("");
    setEditingTarifId(null);
    setIsTarifDialogOpen(true);
  }

  function openEditTarifDialog(tarif: TarifHebergement) {
    setTarifForm(mapTarifToForm(tarif));
    setNewTypeChambreName("");
    setEditingTarifId(tarif.id);
    setIsEditTarifDialogOpen(true);
  }

  function openPhotoDialog(tarifId: string) {
    setSelectedTarifId(tarifId);
    setPhotoForm(initialPhotoForm);
    setNewTypeSalleName("");
    setShowTypeSalleCreator(false);
    setIsPhotoDialogOpen(true);
  }

  async function handleCreateTypeChambre() {
    if (!newTypeChambreName.trim()) return;
    try {
      const response = await createTypeChambre(newTypeChambreName.trim(), accessToken);
      if (response.data) {
        setTypeChambres((current) => [...current, response.data!]);
        setTarifForm((current) => ({ ...current, idTypeChambre: response.data?.id ?? current.idTypeChambre }));
      }
      setNewTypeChambreName("");
      setSuccessMessage("Type de chambre ajoute avec succes.");
    } catch (createError) {
      setError(getErrorMessage(createError, "Impossible d'ajouter le type de chambre"));
    }
  }

  async function handleCreateTypeSalle() {
    if (!newTypeSalleName.trim()) return;
    try {
      const response = await createTypeSalle(newTypeSalleName.trim(), accessToken);
      if (response.data) {
        setTypeSalles((current) => [...current, response.data!]);
        setPhotoForm((current) => ({ ...current, idTypeSalle: response.data?.id ?? current.idTypeSalle }));
      }
      setNewTypeSalleName("");
      setSuccessMessage("Type de salle ajoute avec succes.");
    } catch (createError) {
      setError(getErrorMessage(createError, "Impossible d'ajouter le type de salle"));
    }
  }

  async function handleSubmitTarif(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingTarif(true);
    setError("");
    setSuccessMessage("");
    try {
      const payload: SaveTarifHebergementPayload = {
        prixReservation: tarifForm.prixReservation ? Number(tarifForm.prixReservation) : null,
        prixParNuit: Number(tarifForm.prixParNuit),
        devise: tarifForm.devise.trim() || "MGA",
        gamme: tarifForm.gamme,
        capacite: Number(tarifForm.capacite),
        petitDejeunerInclus: tarifForm.petitDejeunerInclus,
        estActif: tarifForm.estActif,
        dateValiditeDebut: tarifForm.dateValiditeDebut,
        dateValiditeFin: tarifForm.dateValiditeFin,
        idTypeChambre: tarifForm.idTypeChambre,
        idHebergement: hebergementId,
      };
      await createTarifHebergement(payload, accessToken);
      await reloadHebergement();
      setIsTarifDialogOpen(false);
      setTarifForm(initialTarifForm);
      setSuccessMessage("Tarif ajoute avec succes.");
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible d'ajouter le tarif"));
    } finally {
      setIsSubmittingTarif(false);
    }
  }

  async function handleUpdateTarif(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTarifId) return;
    setIsSubmittingTarif(true);
    setError("");
    setSuccessMessage("");
    try {
      const payload: SaveTarifHebergementPayload = {
        prixReservation: tarifForm.prixReservation ? Number(tarifForm.prixReservation) : null,
        prixParNuit: Number(tarifForm.prixParNuit),
        devise: tarifForm.devise.trim() || "MGA",
        gamme: tarifForm.gamme,
        capacite: Number(tarifForm.capacite),
        petitDejeunerInclus: tarifForm.petitDejeunerInclus,
        estActif: tarifForm.estActif,
        dateValiditeDebut: tarifForm.dateValiditeDebut,
        dateValiditeFin: tarifForm.dateValiditeFin,
        idTypeChambre: tarifForm.idTypeChambre,
        idHebergement: hebergementId,
      };
      await updateTarifHebergement(editingTarifId, payload, accessToken);
      await reloadHebergement();
      setIsEditTarifDialogOpen(false);
      setEditingTarifId(null);
      setTarifForm(initialTarifForm);
      setSuccessMessage("Tarif modifie avec succes.");
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible de modifier le tarif"));
    } finally {
      setIsSubmittingTarif(false);
    }
  }

  async function handleSubmitPhotos(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!selectedTarifId) {
      setError("Le tarif selectionne est introuvable.");
      return;
    }

    if (!photoForm.idTypeSalle) {
      setError("Le type de salle est obligatoire.");
      return;
    }

    if (photoForm.imageFiles.length === 0) {
      setError("Au moins une image est obligatoire.");
      return;
    }

    setIsSubmittingPhoto(true);
    try {
      const payload: SaveTarifPhotoPayload = { idTypeSalle: photoForm.idTypeSalle, imageFiles: photoForm.imageFiles };
      await createTarifPhotos(selectedTarifId, payload, accessToken);
      await reloadHebergement();
      setIsPhotoDialogOpen(false);
      setPhotoForm(initialPhotoForm);
      setSuccessMessage("Photos de chambre ajoutees avec succes.");
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible d'ajouter les photos"));
    } finally {
      setIsSubmittingPhoto(false);
    }
  }

  async function handleDeleteTarif(tarifId: string) {
    if (!window.confirm("Supprimer ce tarif ?")) return;
    setIsDeletingTarifId(tarifId);
    try {
      await deleteTarifHebergement(tarifId, accessToken);
      await reloadHebergement();
      setSuccessMessage("Tarif supprime avec succes.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Impossible de supprimer le tarif"));
    } finally {
      setIsDeletingTarifId(null);
    }
  }

  async function handleDeletePhoto(photoId: string) {
    if (!window.confirm("Supprimer cette photo ?")) return;
    setIsDeletingPhotoId(photoId);
    try {
      await deleteTarifPhoto(photoId, accessToken);
      await reloadHebergement();
      setSuccessMessage("Photo de chambre supprimee avec succes.");
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
    <>
      {errorAlert}
      {successAlert}
      <div className="space-y-8">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Chargement...
          </div>
        ) : hebergement ? (
          <>
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-950">{hebergement.nom}</h1>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: Math.max(hebergement.nombreEtoiles || 0, 0) }).map((_, index) => (
                            <Star key={index} className="size-4 fill-current" />
                          ))}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span>{hebergement.adresse || "Adresse non renseignee"}</span>
                        {/* <span className="inline-flex items-center gap-1 text-blue-600">
                          <MapPin className="size-4" />
                          Voir la carte
                        </span> */}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold text-slate-900">{hebergement.estActif ? "Actif" : "Inactif"}</span>
                        <span className="text-slate-500">- {hebergement.nomTypeHebergement || "Type non renseigne"}</span>
                      </div>
                    </div>
                    <Button type="button" onClick={openTarifDialog} className="bg-emerald-600 text-white hover:bg-emerald-700">
                      <Plus className="size-4" />
                      Ajouter tarif
                    </Button>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,2.4fr)_minmax(260px,1fr)]">
                    <div className="relative min-h-[280px] overflow-hidden rounded-sm bg-slate-100">
                      {galleryImages[0]?.url ? (
                        <img src={galleryImages[0].url} alt={galleryImages[0].label} className="h-full min-h-[280px] w-full object-cover" />
                      ) : (
                        <div className="flex h-full min-h-[280px] items-center justify-center text-slate-400">
                          <ImageIcon className="size-10" />
                        </div>
                      )}
                    </div>
                    <div className="grid gap-3">
                      {[galleryImages[1], galleryImages[2]].map((image, index) => (
                        <div key={`${image?.url ?? "empty"}-${index}`} className="relative min-h-[132px] overflow-hidden rounded-sm bg-slate-100">
                          {image?.url ? (
                            <img src={image.url} alt={image.label} className="h-full min-h-[132px] w-full object-cover" />
                          ) : (
                            <div className="flex h-full min-h-[132px] items-center justify-center text-slate-400">
                              <ImageIcon className="size-8" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    {[galleryImages[3], galleryImages[4], galleryImages[5], galleryImages[6]].map((image, index) => (
                      <div key={`${image?.url ?? "thumb"}-${index}`} className="relative h-28 overflow-hidden rounded-sm bg-slate-100">
                        {image?.url ? (
                          <img src={image.url} alt={image.label} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400">
                            <ImageIcon className="size-6" />
                          </div>
                        )}
                        {index === 3 ? (
                          <button
                            type="button"
                            onClick={() => setIsGalleryDialogOpen(true)}
                            className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-lg font-bold text-white transition hover:bg-slate-950/65"
                          >
                            Voir {galleryImages.length} photos
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <aside className="space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <button type="button" className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Partager">
                      <Share2 className="size-4" />
                    </button>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">A partir de</p>
                      <p className="text-3xl font-bold text-slate-950">
                        {minTarif ? formatMoney(minTarif.prixParNuit, minTarif.devise) : "-"}
                        <span className="text-base font-normal text-slate-500"> / nuit</span>
                      </p>
                    </div>
                  </div>

                  {/* <Button type="button" onClick={openTarifDialog} className="h-14 w-full justify-between rounded-xl bg-yellow-400 px-6 text-base font-semibold text-slate-950 hover:bg-yellow-300">
                    Ajouter disponibilite
                    <ChevronRight className="size-6" />
                  </Button> */}

                  <div>
                    <h2 className="text-xl font-bold text-slate-950">Ou se trouve le logement ?</h2>
                    <div className="mt-4 overflow-hidden rounded-sm border border-slate-200 bg-slate-100 [&_.leaflet-container]:!h-48 [&_.leaflet-control-attribution]:hidden">
                      <HebergementMap
                        latitude={Number(hebergement.latitude)}
                        longitude={Number(hebergement.longitude)}
                        onChange={() => undefined}
                      />
                    </div>
                    <p className="mt-2 font-semibold text-emerald-700">{hebergement.adresse || "Emplacement renseigne"}</p>
                    <p className="mt-1 text-xs text-slate-500">{hebergement.latitude}, {hebergement.longitude}</p>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-950">Caracteristiques</h2>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-500">
                      {hebergement.equipements.length === 0 ? (
                        <span>Aucune caracteristique selectionnee.</span>
                      ) : null}
                      {hebergement.equipements.map((equipement) => (
                        <span key={equipement} className="inline-flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-emerald-600" />
                          {equipement}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-950">Contact</h2>
                    <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                      <div className="flex items-start gap-3">
                        <Phone className="mt-0.5 size-4 text-emerald-700" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Telephone</p>
                          <p className="mt-1 break-words font-medium text-slate-900">{hebergement.telephone || "Non renseigne"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Mail className="mt-0.5 size-4 text-emerald-700" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Email</p>
                          <p className="mt-1 break-words font-medium text-slate-900">{hebergement.email || "Non renseigne"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Globe2 className="mt-0.5 size-4 text-emerald-700" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Site web</p>
                          {hebergement.siteWeb ? (
                            <a
                              href={hebergement.siteWeb}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 block break-words font-medium text-blue-600 hover:underline"
                            >
                              {hebergement.siteWeb}
                            </a>
                          ) : (
                            <p className="mt-1 font-medium text-slate-900">Non renseigne</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-950">Chambres et disponibilites</h2>
                <span className="text-sm text-slate-500">{tarifs.length} resultat{tarifs.length > 1 ? "s" : ""} affiche{tarifs.length > 1 ? "s" : ""}</span>
              </div>

              {tarifs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  Aucun tarif ajoute pour cet hebergement.
                </div>
              ) : (
                <div className="space-y-5">
                  {tarifs.map((tarif) => {
                    const roomImages = tarif.photos.length > 0
                      ? tarif.photos.map((photo) => photo.urlImage)
                      : [hebergement.urlImagePrincipale].filter(Boolean);
                    const currentPhotoIndex = Math.min(roomPhotoIndexes[tarif.id] ?? 0, Math.max(roomImages.length - 1, 0));
                    const roomImage = roomImages[currentPhotoIndex];
                    const currentPhotoType = tarif.photos[currentPhotoIndex]?.nomTypeSalle ?? "";
                    const photoTypes = Array.from(
                      new Set(
                        tarif.photos
                          .map((photo) => photo.nomTypeSalle?.trim())
                          .filter((value): value is string => Boolean(value))
                      )
                    );

                    const goToRoomImage = (nextIndex: number) => {
                      if (roomImages.length <= 1) return;
                      setRoomPhotoIndexes((current) => ({
                        ...current,
                        [tarif.id]: (nextIndex + roomImages.length) % roomImages.length,
                      }));
                    };

                    return (
                      <article key={tarif.id} className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                        <div className="grid gap-0 lg:grid-cols-[360px_minmax(0,1fr)_260px]">
                          <div className="relative h-52 bg-slate-100">
                            {roomImage ? (
                              <img src={roomImage} alt={tarif.nomTypeChambre} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-slate-400">
                                <ImageIcon className="size-8" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                            <button
                              type="button"
                              onClick={() => goToRoomImage(currentPhotoIndex - 1)}
                              disabled={roomImages.length <= 1}
                              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-slate-950/45 p-1.5 text-white disabled:opacity-30"
                            >
                              <ChevronRight className="size-6 rotate-180" />
                            </button>
                            <button
                              type="button"
                              onClick={() => goToRoomImage(currentPhotoIndex + 1)}
                              disabled={roomImages.length <= 1}
                              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/75 p-1.5 text-slate-700 disabled:opacity-30"
                            >
                              <ChevronRight className="size-6" />
                            </button>
                            {currentPhotoType ? (
                              <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm">
                                {currentPhotoType}
                              </span>
                            ) : null}
                            <h3 className="absolute bottom-5 left-5 text-2xl font-bold text-white drop-shadow">{tarif.nomTypeChambre}</h3>
                            {roomImages.length > 1 ? (
                              <div className="absolute bottom-4 right-4 flex gap-1.5">
                                {roomImages.map((image, index) => (
                                  <button
                                    key={`${image}-${index}`}
                                    type="button"
                                    onClick={() => goToRoomImage(index)}
                                    aria-label={`Voir image ${index + 1}`}
                                    className={`h-1.5 rounded-full transition-all ${
                                      index === currentPhotoIndex ? "w-6 bg-white" : "w-1.5 bg-white/55"
                                    }`}
                                  />
                                ))}
                              </div>
                            ) : null}
                          </div>

                          <div className="space-y-5 p-5">
                            <button type="button" onClick={() => openEditTarifDialog(tarif)} className="inline-flex items-center gap-2 text-sm text-blue-600">
                              <ImageIcon className="size-4" />
                              Voir details
                            </button>
                            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
                              <span className="inline-flex items-center gap-2"><Users className="size-4" />{tarif.capacite} Hote{tarif.capacite > 1 ? "s" : ""}</span>
                              <span className="inline-flex items-center gap-2"><Snowflake className="size-4" />{tarif.gamme}</span>
                              <span className="inline-flex items-center gap-2"><BedDouble className="size-4" />{tarif.petitDejeunerInclus ? "Petit dejeuner inclus" : "Petit dejeuner non inclus"}</span>
                              {photoTypes.map((typeSalle) => (
                                <span key={typeSalle} className="inline-flex items-center gap-2">
                                  <Bath className="size-4" />
                                  {typeSalle}
                                </span>
                              ))}
                              <span>{formatDate(tarif.dateValiditeDebut)} - {formatDate(tarif.dateValiditeFin)}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => openPhotoDialog(tarif.id)}>Ajouter image</Button>
                              <Button size="sm" variant="secondary" onClick={() => openEditTarifDialog(tarif)}>Modifier</Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteTarif(tarif.id)} disabled={isDeletingTarifId === tarif.id}>
                                {isDeletingTarifId === tarif.id ? "Suppression..." : "Supprimer"}
                              </Button>
                            </div>

                            {tarif.photos.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {tarif.photos.map((photo, index) => (
                                  <button
                                    key={photo.id}
                                    type="button"
                                    onClick={() => goToRoomImage(index)}
                                    disabled={isDeletingPhotoId === photo.id}
                                    className={`group relative h-16 w-24 overflow-hidden rounded border ${
                                      index === currentPhotoIndex ? "border-emerald-500" : "border-slate-200"
                                    }`}
                                  >
                                    <img src={photo.urlImage} alt={photo.nomTypeSalle} className="h-full w-full object-cover" />
                                    <span className="absolute inset-x-0 bottom-0 truncate bg-slate-950/65 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                      {photo.nomTypeSalle}
                                    </span>
                                    <span
                                      role="button"
                                      tabIndex={0}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleDeletePhoto(photo.id);
                                      }}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                          event.preventDefault();
                                          event.stopPropagation();
                                          handleDeletePhoto(photo.id);
                                        }
                                      }}
                                      className="absolute right-1 top-1 hidden rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white group-hover:block"
                                    >
                                      X
                                    </span>
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex items-center justify-end p-5">
                            <div className="w-full space-y-4 text-right">
                              <p className="text-2xl font-bold text-slate-950">{formatMoney(tarif.prixParNuit, tarif.devise)}</p>
                              <p className="text-sm text-slate-500">Reservation: {formatMoney(tarif.prixReservation, tarif.devise)}</p>
                              {/* <Button type="button" onClick={() => openEditTarifDialog(tarif)} className="h-12 w-full justify-between rounded-xl bg-yellow-400 px-6 text-slate-950 hover:bg-yellow-300">
                                Voir disponibilite
                                <ChevronRight className="size-5" />
                              </Button> */}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Hebergement introuvable.
          </div>
        )}
      </div>

      <Dialog open={isTarifDialogOpen} onOpenChange={setIsTarifDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-5xl overflow-y-auto">
          <DialogHeader><DialogTitle>Ajouter un tarif</DialogTitle><DialogDescription>Cree une nouvelle offre de chambre pour cet hebergement.</DialogDescription></DialogHeader>
          <FormTarifHebergement
            form={tarifForm}
            typeChambres={typeChambres}
            newTypeChambreName={newTypeChambreName}
            isSubmitting={isSubmittingTarif}
            submitLabel="Ajouter le tarif"
            onSubmit={handleSubmitTarif}
            onUpdate={updateTarifForm}
            onNewTypeChambreNameChange={setNewTypeChambreName}
            onCreateTypeChambre={handleCreateTypeChambre}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditTarifDialogOpen}
        onOpenChange={(value) => {
          setIsEditTarifDialogOpen(value);
          if (!value) {
            setEditingTarifId(null);
            setTarifForm(initialTarifForm);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier un tarif</DialogTitle>
            <DialogDescription>Met a jour les informations de ce tarif d hebergement.</DialogDescription>
          </DialogHeader>
          <FormTarifHebergement
            form={tarifForm}
            typeChambres={typeChambres}
            newTypeChambreName={newTypeChambreName}
            isSubmitting={isSubmittingTarif}
            submitLabel="Enregistrer les modifications"
            onSubmit={handleUpdateTarif}
            onUpdate={updateTarifForm}
            onNewTypeChambreNameChange={setNewTypeChambreName}
            onCreateTypeChambre={handleCreateTypeChambre}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>Ajouter des images</DialogTitle><DialogDescription>Importe des images pour ce tarif et assigne un type de salle.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmitPhotos}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type de salle</label>
              <div className="flex gap-2">
                <Select value={photoForm.idTypeSalle} onValueChange={(value) => setPhotoForm((current) => ({ ...current, idTypeSalle: value }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Choisir un type de salle" /></SelectTrigger>
                  <SelectContent>{typeSalles.map((typeSalle) => <SelectItem key={typeSalle.id} value={typeSalle.id}>{typeSalle.nom}</SelectItem>)}</SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowTypeSalleCreator((current) => !current)}
                  aria-label="Ajouter un type de salle"
                >
                  <Plus className="size-4" />
                </Button>
              </div>

              {showTypeSalleCreator ? (
                <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={newTypeSalleName}
                      onChange={(event) => setNewTypeSalleName(event.target.value)}
                      placeholder="Chambre, salon, salle d'eau..."
                    />
                    <Button type="button" onClick={handleCreateTypeSalle}>Ajouter</Button>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Photos</label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) =>
                  setPhotoForm((current) => ({
                    ...current,
                    imageFiles: [...current.imageFiles, ...Array.from(event.target.files ?? [])],
                  }))
                }
              />

              {photoForm.imageFiles.length > 0 ? (
                <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                  <p className="mb-3 text-sm font-medium">
                    {photoForm.imageFiles.length} image{photoForm.imageFiles.length > 1 ? "s" : ""} selectionnee{photoForm.imageFiles.length > 1 ? "s" : ""}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {photoPreviews.map((preview, index) => (
                      <div key={`${preview.name}-${preview.url}`} className="overflow-hidden rounded-xl border border-border/50 bg-background">
                        <img src={preview.url} alt={preview.name} className="h-28 w-full object-cover" />
                        <div className="flex items-center justify-between gap-2 px-3 py-2">
                          <span className="max-w-[180px] truncate text-xs text-muted-foreground">{preview.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setPhotoForm((current) => ({
                                ...current,
                                imageFiles: current.imageFiles.filter((_, fileIndex) => fileIndex !== index),
                              }))
                            }
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
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmittingPhoto}>{isSubmittingPhoto ? "Envoi..." : "Ajouter les photos"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isGalleryDialogOpen} onOpenChange={setIsGalleryDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-4">
            <DialogTitle>Galerie photos</DialogTitle>
            <DialogDescription>
              {galleryImages.length} photo{galleryImages.length > 1 ? "s" : ""} pour {hebergement?.nom ?? "cet hebergement"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            {galleryImages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                Aucune image disponible.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {galleryImages.map((image, index) => (
                  <figure key={`${image.url}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <img src={image.url} alt={image.label} className="h-72 w-full object-cover" />
                    <figcaption className="space-y-1 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{image.label}</p>
                      {image.subtitle ? (
                        <p className="text-xs text-slate-500">{image.subtitle}</p>
                      ) : null}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}





