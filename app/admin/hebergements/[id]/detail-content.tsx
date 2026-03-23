"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminFooter } from "@/app/admin/components/footer";
import { AdminHeader } from "@/app/admin/components/header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  createTarifHebergement,
  createTarifPhotos,
  createTypeChambre,
  createTypeSalle,
  deleteTarifHebergement,
  deleteTarifPhoto,
  getHebergement,
  listTypeChambres,
  listTypeSalles,
} from "@/lib/api/hebergements";
import { loadAuth } from "@/lib/auth";
import {
  Hebergement,
  SaveTarifHebergementPayload,
  SaveTarifPhotoPayload,
  TypeChambre,
  TypeSalle,
} from "@/lib/type/hebergement";

type AdminHebergementDetailContentProps = {
  hebergementId: string;
};

type TarifFormState = {
  prixReservation: string;
  prixParNuit: string;
  devise: string;
  capacite: string;
  petitDejeunerInclus: boolean;
  estActif: boolean;
  dateValiditeDebut: string;
  dateValiditeFin: string;
  idTypeChambre: string;
};

type PhotoFormState = {
  idTypeSalle: string;
  imageFiles: File[];
};

const initialTarifForm: TarifFormState = {
  prixReservation: "",
  prixParNuit: "",
  devise: "MGA",
  capacite: "2",
  petitDejeunerInclus: false,
  estActif: true,
  dateValiditeDebut: "",
  dateValiditeFin: "",
  idTypeChambre: "",
};

const initialPhotoForm: PhotoFormState = {
  idTypeSalle: "",
  imageFiles: [],
};

function formatMoney(value: number | null | undefined, devise: string) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toLocaleString("fr-FR")} ${devise}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Non definie";
  return new Date(value).toLocaleDateString("fr-FR");
}

export function AdminHebergementDetailContent({
  hebergementId,
}: AdminHebergementDetailContentProps) {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [role, setRole] = useState("");
  const [hebergement, setHebergement] = useState<Hebergement | null>(null);
  const [typeChambres, setTypeChambres] = useState<TypeChambre[]>([]);
  const [typeSalles, setTypeSalles] = useState<TypeSalle[]>([]);
  const [tarifForm, setTarifForm] = useState<TarifFormState>(initialTarifForm);
  const [photoForms, setPhotoForms] = useState<Record<string, PhotoFormState>>({});
  const [newTypeChambreName, setNewTypeChambreName] = useState("");
  const [newTypeSalleName, setNewTypeSalleName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingTarif, setIsSubmittingTarif] = useState(false);
  const [isSubmittingPhotoFor, setIsSubmittingPhotoFor] = useState<string | null>(null);
  const [isDeletingTarifId, setIsDeletingTarifId] = useState<string | null>(null);
  const [isDeletingPhotoId, setIsDeletingPhotoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const tarifs = useMemo(
    () =>
      [...(hebergement?.tarifs ?? [])].sort((a, b) => {
        const dateA = a.dateCreation ? new Date(a.dateCreation).getTime() : 0;
        const dateB = b.dateCreation ? new Date(b.dateCreation).getTime() : 0;
        return dateB - dateA;
      }),
    [hebergement]
  );

  useEffect(() => {
    const session = loadAuth();
    if (!session?.accessToken) {
      router.push("/login");
      return;
    }

    if (session.role !== "ADMIN") {
      router.push("/admin");
      return;
    }

    setAccessToken(session.accessToken);
    setRole(session.role);
  }, [router]);

  useEffect(() => {
    if (!accessToken || role !== "ADMIN") return;

    async function loadPage() {
      setIsLoading(true);
      setError("");

      try {
        const [hebergementResponse, typeChambresResponse, typeSallesResponse] =
          await Promise.all([
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

    void loadPage();
  }, [accessToken, role, hebergementId]);

  function updateTarifForm<K extends keyof TarifFormState>(
    key: K,
    value: TarifFormState[K]
  ) {
    setTarifForm((current) => ({ ...current, [key]: value }));
  }

  function updatePhotoForm<K extends keyof PhotoFormState>(
    tarifId: string,
    key: K,
    value: PhotoFormState[K]
  ) {
    setPhotoForms((current) => ({
      ...current,
      [tarifId]: {
        ...(current[tarifId] ?? initialPhotoForm),
        [key]: value,
      },
    }));
  }

  async function reloadHebergement() {
    const response = await getHebergement(hebergementId, accessToken);
    setHebergement(response.data ?? null);
  }

  async function handleCreateTypeChambre() {
    if (!newTypeChambreName.trim()) return;

    try {
      const response = await createTypeChambre(newTypeChambreName.trim(), accessToken);
      if (response.data) {
        setTypeChambres((current) => [...current, response.data!]);
        setTarifForm((current) => ({
          ...current,
          idTypeChambre: response.data?.id ?? current.idTypeChambre,
        }));
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
        prixReservation: tarifForm.prixReservation
          ? Number(tarifForm.prixReservation)
          : null,
        prixParNuit: Number(tarifForm.prixParNuit),
        devise: tarifForm.devise.trim() || "MGA",
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
      setTarifForm(initialTarifForm);
      setSuccessMessage("Tarif ajoute avec succes.");
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible d'ajouter le tarif"));
    } finally {
      setIsSubmittingTarif(false);
    }
  }

  async function handleDeleteTarif(tarifId: string) {
    const confirmed = window.confirm("Supprimer ce tarif ?");
    if (!confirmed) return;

    setIsDeletingTarifId(tarifId);
    setError("");
    setSuccessMessage("");

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

  async function handleSubmitPhotos(
    event: React.FormEvent<HTMLFormElement>,
    tarifId: string
  ) {
    event.preventDefault();
    const form = photoForms[tarifId] ?? initialPhotoForm;
    if (!form.idTypeSalle || form.imageFiles.length === 0) return;

    setIsSubmittingPhotoFor(tarifId);
    setError("");
    setSuccessMessage("");

    try {
      const payload: SaveTarifPhotoPayload = {
        idTypeSalle: form.idTypeSalle,
        imageFiles: form.imageFiles,
      };

      await createTarifPhotos(tarifId, payload, accessToken);
      await reloadHebergement();
      setPhotoForms((current) => ({
        ...current,
        [tarifId]: initialPhotoForm,
      }));
      setSuccessMessage("Photos de chambre ajoutees avec succes.");
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible d'ajouter les photos"));
    } finally {
      setIsSubmittingPhotoFor(null);
    }
  }

  async function handleDeletePhoto(photoId: string) {
    const confirmed = window.confirm("Supprimer cette photo ?");
    if (!confirmed) return;

    setIsDeletingPhotoId(photoId);
    setError("");
    setSuccessMessage("");

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

  if (!accessToken || role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background text-foreground">
      <AdminHeader />
      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin">Retour aux hebergements</Link>
              </Button>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {hebergement?.nom ?? "Detail hebergement"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gestion des tarifs, types de chambre et photos de salles.
                </p>
              </div>
            </div>
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {successMessage ? (
            <Alert variant="success">
              <AlertTitle>Succes</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          ) : null}

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Informations principales</CardTitle>
              <CardDescription>Resume de l&apos;hebergement selectionne.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : hebergement ? (
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-4">
                    {hebergement.urlImagePrincipale ? (
                      <div className="overflow-hidden rounded-2xl bg-muted/20 p-3">
                        <img
                          src={hebergement.urlImagePrincipale}
                          alt={hebergement.nom}
                          className="max-h-[360px] w-full rounded-xl object-contain"
                        />
                      </div>
                    ) : null}
                    <p className="text-sm text-muted-foreground">
                      {hebergement.description || "Aucune description"}
                    </p>
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                      <p className="font-medium">Type</p>
                      <p className="mt-1 text-muted-foreground">
                        {hebergement.nomTypeHebergement || "Non renseigne"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                      <p className="font-medium">Adresse</p>
                      <p className="mt-1 text-muted-foreground">
                        {hebergement.adresse || "Non renseignee"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                      <p className="font-medium">Coordonnees</p>
                      <p className="mt-1 text-muted-foreground">
                        {hebergement.latitude}, {hebergement.longitude}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Hebergement introuvable.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Ajouter un tarif</CardTitle>
              <CardDescription>
                Cree une nouvelle offre de chambre pour cet hebergement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmitTarif}>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type de chambre</label>
                    <Select
                      value={tarifForm.idTypeChambre}
                      onValueChange={(value) => updateTarifForm("idTypeChambre", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {typeChambres.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prix / nuit</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tarifForm.prixParNuit}
                      onChange={(event) => updateTarifForm("prixParNuit", event.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prix reservation</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tarifForm.prixReservation}
                      onChange={(event) => updateTarifForm("prixReservation", event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Devise</label>
                    <Input
                      value={tarifForm.devise}
                      onChange={(event) => updateTarifForm("devise", event.target.value)}
                      placeholder="MGA"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Capacite</label>
                    <Input
                      type="number"
                      min="1"
                      value={tarifForm.capacite}
                      onChange={(event) => updateTarifForm("capacite", event.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date debut</label>
                    <Input
                      type="date"
                      value={tarifForm.dateValiditeDebut}
                      onChange={(event) =>
                        updateTarifForm("dateValiditeDebut", event.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date fin</label>
                    <Input
                      type="date"
                      value={tarifForm.dateValiditeFin}
                      onChange={(event) =>
                        updateTarifForm("dateValiditeFin", event.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nouveau type chambre</label>
                    <div className="flex gap-2">
                      <Input
                        value={newTypeChambreName}
                        onChange={(event) => setNewTypeChambreName(event.target.value)}
                        placeholder="Suite, Deluxe..."
                      />
                      <Button type="button" variant="outline" onClick={handleCreateTypeChambre}>
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="petitDejeunerInclus"
                      checked={tarifForm.petitDejeunerInclus}
                      onCheckedChange={(checked) =>
                        updateTarifForm("petitDejeunerInclus", checked === true)
                      }
                    />
                    <label htmlFor="petitDejeunerInclus" className="text-sm font-medium">
                      Petit dejeuner inclus
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="tarifActif"
                      checked={tarifForm.estActif}
                      onCheckedChange={(checked) =>
                        updateTarifForm("estActif", checked === true)
                      }
                    />
                    <label htmlFor="tarifActif" className="text-sm font-medium">
                      Tarif actif
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmittingTarif}>
                    {isSubmittingTarif ? "Enregistrement..." : "Ajouter le tarif"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Tarifs de l&apos;hebergement</CardTitle>
              <CardDescription>
                {tarifs.length} tarif{tarifs.length > 1 ? "s" : ""} enregistres.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tarifs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun tarif ajoute pour cet hebergement.
                </p>
              ) : (
                <div className="space-y-6">
                  {tarifs.map((tarif) => {
                    const photoForm = photoForms[tarif.id] ?? initialPhotoForm;

                    return (
                      <div
                        key={tarif.id}
                        className="rounded-2xl border border-border/50 bg-card/50 p-5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold">{tarif.nomTypeChambre}</h3>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span className="rounded-full bg-muted px-2.5 py-1">
                                {formatMoney(tarif.prixParNuit, tarif.devise)} / nuit
                              </span>
                              <span className="rounded-full bg-muted px-2.5 py-1">
                                Reservation: {formatMoney(tarif.prixReservation, tarif.devise)}
                              </span>
                              <span className="rounded-full bg-muted px-2.5 py-1">
                                Capacite: {tarif.capacite}
                              </span>
                              <span className="rounded-full bg-muted px-2.5 py-1">
                                {tarif.petitDejeunerInclus
                                  ? "Petit dejeuner inclus"
                                  : "Sans petit dejeuner"}
                              </span>
                              <span className="rounded-full bg-muted px-2.5 py-1">
                                {formatDate(tarif.dateValiditeDebut)} - {formatDate(tarif.dateValiditeFin)}
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTarif(tarif.id)}
                            disabled={isDeletingTarifId === tarif.id}
                          >
                            {isDeletingTarifId === tarif.id ? "Suppression..." : "Supprimer"}
                          </Button>
                        </div>

                        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Photos de chambre</h4>
                              <span className="text-sm text-muted-foreground">
                                {tarif.photos.length} photo{tarif.photos.length > 1 ? "s" : ""}
                              </span>
                            </div>

                            {tarif.photos.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Aucune photo pour ce tarif.
                              </p>
                            ) : (
                              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {tarif.photos.map((photo) => (
                                  <div
                                    key={photo.id}
                                    className="overflow-hidden rounded-xl border border-border/50 bg-muted/20"
                                  >
                                    <img
                                      src={photo.urlImage}
                                      alt={photo.nomTypeSalle}
                                      className="aspect-[4/3] w-full object-cover"
                                    />
                                    <div className="space-y-2 p-3">
                                      <p className="text-sm font-medium">{photo.nomTypeSalle}</p>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDeletePhoto(photo.id)}
                                        disabled={isDeletingPhotoId === photo.id}
                                      >
                                        {isDeletingPhotoId === photo.id
                                          ? "Suppression..."
                                          : "Supprimer"}
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <Card className="border-border/50">
                            <CardHeader>
                              <CardTitle className="text-base">Ajouter des photos</CardTitle>
                              <CardDescription>
                                Associe des images a un type de salle.
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <form className="space-y-4" onSubmit={(event) => handleSubmitPhotos(event, tarif.id)}>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Type de salle</label>
                                  <Select
                                    value={photoForm.idTypeSalle}
                                    onValueChange={(value) =>
                                      updatePhotoForm(tarif.id, "idTypeSalle", value)
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choisir un type de salle" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {typeSalles.map((typeSalle) => (
                                        <SelectItem key={typeSalle.id} value={typeSalle.id}>
                                          {typeSalle.nom}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Photos</label>
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(event) =>
                                      updatePhotoForm(
                                        tarif.id,
                                        "imageFiles",
                                        Array.from(event.target.files ?? [])
                                      )
                                    }
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Nouveau type salle</label>
                                  <div className="flex gap-2">
                                    <Input
                                      value={newTypeSalleName}
                                      onChange={(event) => setNewTypeSalleName(event.target.value)}
                                      placeholder="Chambre, salon, salle d'eau..."
                                    />
                                    <Button type="button" variant="outline" onClick={handleCreateTypeSalle}>
                                      Ajouter
                                    </Button>
                                  </div>
                                </div>

                                <Button
                                  type="submit"
                                  disabled={isSubmittingPhotoFor === tarif.id}
                                >
                                  {isSubmittingPhotoFor === tarif.id
                                    ? "Envoi..."
                                    : "Ajouter les photos"}
                                </Button>
                              </form>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <AdminFooter />
    </div>
  );
}
