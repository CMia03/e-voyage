"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Pencil, Plus, Trash2, X } from "lucide-react";

import { AdminFooter } from "@/app/admin/components/footer";
import { AdminHeader } from "@/app/admin/components/header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Activite, CategorieClientActivite, SavePhotoActivitePayload, SaveTarifActivitePayload, TarifActivite } from "@/lib/type/activite";

type Props = { activiteId: string };

type TarifFormState = {
  idCategorieClient: string;
  prixParHeur: string;
  devise: string;
  estActif: boolean;
  dateValiditeDebut: string;
  dateValiditeFin: string;
};

const initialTarifForm: TarifFormState = {
  idCategorieClient: "",
  prixParHeur: "",
  devise: "MGA",
  estActif: true,
  dateValiditeDebut: "",
  dateValiditeFin: "",
};

export function AdminActiviteDetailContent({ activiteId }: Props) {
  const router = useRouter();
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
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  const tarifs = useMemo(
    () => [...(activite?.tarifs ?? [])].sort((a, b) => new Date(b.dateCreation ?? 0).getTime() - new Date(a.dateCreation ?? 0).getTime()),
    [activite]
  );
  const photoPreviews = useMemo(
    () =>
      photoFiles.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
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
    if (!successMessage) {
      setShowSuccessAlert(false);
      return;
    }

    setShowSuccessAlert(true);
    const timeout = window.setTimeout(() => setShowSuccessAlert(false), 4500);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    if (!error) {
      setShowErrorAlert(false);
      return;
    }

    setShowErrorAlert(true);
    const timeout = window.setTimeout(() => setShowErrorAlert(false), 5000);
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
        [...(categoriesClientResponse.data ?? [])].sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }))
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
      prixParPersonne: null,
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
          [...current, createdCategory].sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }))
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
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background text-foreground">
      <AdminHeader />
      {errorAlert}
      {successAlert}
      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin?section=activites">Retour aux activites</Link>
              </Button>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{activite?.nom ?? "Detail activite"}</h1>
                <p className="text-sm text-muted-foreground">
                  Gere les tarifs et les photos de cette activite depuis une seule page.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={openCreateTarifDialog}>
                <Plus className="size-4" />
                Ajouter tarif
              </Button>
              <Button variant="outline" onClick={() => setIsPhotoDialogOpen(true)}>
                <Plus className="size-4" />
                Ajouter photos
              </Button>
            </div>
          </div>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Informations principales</CardTitle>
              <CardDescription>Resume de l'activite selectionnee.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : activite ? (
                <div className="rounded-2xl border border-border/50 bg-card/40 p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                    {activite.imagePrincipale ? (
                      <div className="w-full overflow-hidden rounded-xl border border-border/40 bg-muted/20 sm:w-[170px] sm:min-w-[170px]">
                        <img
                          src={activite.imagePrincipale}
                          alt={activite.nom}
                          className="h-32 w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1 space-y-2">
                      <h2 className="text-xl font-semibold tracking-tight">{activite.nom}</h2>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {activite.description || "Aucune description"}
                      </p>
                    </div>
                    <div className="grid gap-2 text-sm xl:w-[260px] xl:min-w-[260px]">
                      <div className="rounded-xl border border-border/50 bg-card/50 px-3 py-2.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Categorie</p>
                        <p className="mt-1 text-sm text-muted-foreground">{activite.nomCategorie || "Non renseignee"}</p>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-card/50 px-3 py-2.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Duree</p>
                        <p className="mt-1 text-sm text-muted-foreground">{activite.dureeHeures} h</p>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-card/50 px-3 py-2.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Participants</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {activite.participantMin} - {activite.participantsMax}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Activite introuvable.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Tarifs de l'activite</CardTitle>
              <CardDescription>{tarifs.length} tarif(s) enregistres.</CardDescription>
            </CardHeader>
            <CardContent>
              {tarifs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun tarif ajoute pour cette activite.</p>
              ) : (
                <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
                  {tarifs.map((tarif) => (
                    <div key={tarif.id} className="rounded-2xl border border-border/50 bg-card/50 p-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">
                            {tarif.prixParHeur ? `${Number(tarif.prixParHeur).toLocaleString("fr-FR")} ${tarif.devise} / heure` : "-"}
                          </h3>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="rounded-full bg-muted px-2.5 py-1">
                              Categorie client: {tarif.nomCategorieClient || "-"}
                            </span>
                            <span className="rounded-full bg-muted px-2.5 py-1">
                              {tarif.dateValiditeDebut || "-"} - {tarif.dateValiditeFin || "-"}
                            </span>
                            <span className="rounded-full bg-muted px-2.5 py-1">
                              {tarif.estActif ? "Actif" : "Inactif"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEditTarifDialog(tarif)}>
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Photos de l'activite</CardTitle>
              <CardDescription>{activite?.photos?.length ?? 0} photo(s).</CardDescription>
            </CardHeader>
            <CardContent>
              {activite?.photos?.length ? (
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {activite.photos.map((photo) => (
                      <div key={photo.id} className="overflow-hidden rounded-xl border border-border/50 bg-muted/20">
                        <img src={photo.urlImage} alt={activite.nom} className="h-36 w-full object-cover" />
                        <div className="p-2.5">
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
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune photo ajoutee pour cette activite.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

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
            <DialogTitle>{editingTarifId ? "Modifier un tarif" : "Ajouter un tarif"}</DialogTitle>
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
                        <Button type="button" onClick={handleCreateCategorieClient} disabled={isCreatingCategorieClient}>
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
                <label className="text-sm font-medium">Prix par heure</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tarifForm.prixParHeur}
                  onChange={(event) => updateTarifForm("prixParHeur", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Devise</label>
                <Input value={tarifForm.devise} onChange={(event) => updateTarifForm("devise", event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date debut</label>
                <Input
                  type="date"
                  value={tarifForm.dateValiditeDebut}
                  onChange={(event) => updateTarifForm("dateValiditeDebut", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date fin</label>
                <Input
                  type="date"
                  value={tarifForm.dateValiditeFin}
                  onChange={(event) => updateTarifForm("dateValiditeFin", event.target.value)}
                />
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
              <Button type="submit" disabled={isSavingTarif}>
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
          if (!value) {
            setPhotoFiles([]);
          }
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
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => setPhotoFiles(Array.from(event.target.files ?? []))}
              />
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
              <Button type="submit" disabled={isSavingPhotos}>
                {isSavingPhotos ? "Envoi..." : "Ajouter les photos"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AdminFooter />
    </div>
  );
}
