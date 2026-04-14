"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Plus, X } from "lucide-react";

import { FormTarifHebergement, TarifFormState } from "./form-tarif-hebergement";
import { ListeTarifHebergement } from "./liste-tarif-hebergement";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

type Props = { hebergementId: string };
type PhotoFormState = { idTypeSalle: string; imageFiles: File[] };

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

export function AdminHebergementDetailContentNext({ hebergementId }: Props) {
  const router = useRouter();
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

  const tarifs = useMemo(
    () => [...(hebergement?.tarifs ?? [])].sort((a, b) => new Date(b.dateCreation ?? 0).getTime() - new Date(a.dateCreation ?? 0).getTime()),
    [hebergement]
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
        <div className="space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Button asChild variant="outline" size="sm"><Link href="/admin">Retour aux hebergements</Link></Button>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{hebergement?.nom ?? "Detail hebergement"}</h1>
                <p className="text-sm text-muted-foreground">Gestion des tarifs, types de chambre et photos de salles.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={openTarifDialog}>
                <Plus className="size-4" />
                Ajouter tarif
              </Button>
            </div>
          </div>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Informations principales</CardTitle>
              <CardDescription>Resume de l&apos;hebergement selectionne.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <p className="text-sm text-muted-foreground">Chargement...</p> : hebergement ? (
                <div className="rounded-2xl border border-border/50 bg-card/40 p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                    {hebergement.urlImagePrincipale ? (
                      <div className="w-full overflow-hidden rounded-xl border border-border/40 bg-muted/20 sm:w-[170px] sm:min-w-[170px]">
                        <img src={hebergement.urlImagePrincipale} alt={hebergement.nom} className="h-32 w-full object-cover" />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1 space-y-2">
                      <h2 className="text-xl font-semibold tracking-tight">{hebergement.nom}</h2>
                      <p className="text-sm leading-6 text-muted-foreground">{hebergement.description || "Aucune description"}</p>
                    </div>
                    <div className="grid gap-2 text-sm xl:w-[260px] xl:min-w-[260px]">
                      <div className="rounded-xl border border-border/50 bg-card/50 px-3 py-2.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</p>
                        <p className="mt-1 text-sm text-muted-foreground">{hebergement.nomTypeHebergement || "Non renseigne"}</p>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-card/50 px-3 py-2.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Adresse</p>
                        <p className="mt-1 text-sm text-muted-foreground">{hebergement.adresse || "Non renseignee"}</p>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-card/50 px-3 py-2.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Coordonnees</p>
                        <p className="mt-1 text-sm text-muted-foreground">{hebergement.latitude}, {hebergement.longitude}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : <p className="text-sm text-muted-foreground">Hebergement introuvable.</p>}
            </CardContent>
          </Card>

          <ListeTarifHebergement
            tarifs={tarifs}
            isDeletingTarifId={isDeletingTarifId}
            isDeletingPhotoId={isDeletingPhotoId}
            onEditTarif={openEditTarifDialog}
            onDeleteTarif={handleDeleteTarif}
            onDeletePhoto={handleDeletePhoto}
            onOpenPhotoModal={openPhotoDialog}
          />
        </div>
      </div>

      <Dialog open={isTarifDialogOpen} onOpenChange={setIsTarifDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
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
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
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
    </>
  );
}





