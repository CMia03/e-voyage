"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminFooter } from "@/app/admin/components/footer";
import { AdminHeader } from "@/app/admin/components/header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadAuth } from "@/lib/auth";
import {
  createDestinationPhotosBulk,
  getAdminDestination,
} from "@/lib/api/destinations";
import { getErrorMessage } from "@/lib/api/client";
import type {
  AdminDestination,
  SavePhotoDestinationBulkPayload,
} from "@/lib/type/destination";

import { PhotoDestinationForm, PhotoDestinationFormState } from "./photo-form";

const initialPhotoForm: PhotoDestinationFormState = {
  titre: "",
  description: "",
  ordreAffichage: "0",
  dateObtenir: "",
  estPrincipale: false,
  imageFiles: [],
};

type AdminDestinationDetailContentProps = {
  destinationId: string;
};

export function AdminDestinationDetailContent({
  destinationId,
}: AdminDestinationDetailContentProps) {
  const router = useRouter();
  const imageSectionRef = useRef<HTMLDivElement | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [role, setRole] = useState("");
  const [destination, setDestination] = useState<AdminDestination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingImages, setIsSavingImages] = useState(false);
  const [action, setAction] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [photoForm, setPhotoForm] = useState<PhotoDestinationFormState>(initialPhotoForm);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedPhotoGroups = useMemo(
    () =>
      [...(destination?.photos ?? [])].sort(
        (a, b) => (a.ordreAffichage ?? 0) - (b.ordreAffichage ?? 0)
      ),
    [destination]
  );

  const totalImages = useMemo(
    () =>
      (destination?.photos ?? []).reduce(
        (count, group) => count + (group.images?.length ?? 0),
        0
      ),
    [destination]
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

    async function loadDestination() {
      setIsLoading(true);
      setError("");

      try {
        const response = await getAdminDestination(destinationId, accessToken);
        setDestination(response.data ?? null);
      } catch (loadError) {
        setError(getErrorMessage(loadError, "Impossible de charger cette destination"));
      } finally {
        setIsLoading(false);
      }
    }

    void loadDestination();
  }, [accessToken, role, destinationId]);

  function updatePhotoForm<K extends keyof PhotoDestinationFormState>(
    key: K,
    value: PhotoDestinationFormState[K]
  ) {
    setPhotoForm((current) => ({ ...current, [key]: value }));
  }

  async function reloadDestination() {
    if (!accessToken) return;
    const response = await getAdminDestination(destinationId, accessToken);
    setDestination(response.data ?? null);
  }

  function openImageDialog() {
    setPhotoForm(initialPhotoForm);
    setError("");
    setIsDialogOpen(true);
  }

  function closeImageDialog() {
    if (!isSubmitting) {
      setIsDialogOpen(false);
      setError("");
      setPhotoForm(initialPhotoForm);
    }
  }

  async function handleSubmitImages(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;

    setIsSubmitting(true);
    setIsSavingImages(true);
    setError("");

    try {
      const payload: SavePhotoDestinationBulkPayload = {
        titre: photoForm.titre.trim(),
        description: photoForm.description.trim(),
        ordreAffichage: Number(photoForm.ordreAffichage || 0),
        estPrincipale: photoForm.estPrincipale,
        dateObtenir: photoForm.dateObtenir
          ? new Date(photoForm.dateObtenir).toISOString().slice(0, 19)
          : "",
        imageFiles: photoForm.imageFiles,
      };

      await createDestinationPhotosBulk(destinationId, payload, accessToken);
      await reloadDestination();
      setPhotoForm(initialPhotoForm);
      setSuccessMessage("Images ajoutées avec succès.");
      setIsDialogOpen(false);
      
      // Scroll vers la galerie après ajout réussi
      setTimeout(() => {
        const galleryElement = document.getElementById("gallery-section");
        if (galleryElement) {
          galleryElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible d'ajouter les images"));
    } finally {
      setIsSavingImages(false);
      setIsSubmitting(false);
    }
  }

  function handleActionChange(value: string) {
    setAction(value);

    if (value === "add-image") {
      openImageDialog();
    } else if (value === "gallery") {
      const galleryElement = document.getElementById("gallery-section");
      if (galleryElement) {
        galleryElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setAction("");
    } else if (value === "planning") {
      router.push(`/admin/destination/${destinationId}/planning`);
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
          {/* En-tête avec actions rapides */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin">← Retour aux destinations</Link>
              </Button>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {destination?.nom ?? "Détail destination"}
                </h1>
                {/* <p className="text-sm text-muted-foreground">
                  Gérez les données détaillées de la destination et ajoutez du contenu multimédia.
                </p> */}
              </div>
            </div>

            <div className="w-full max-w-xs">
              <Select value={action} onValueChange={handleActionChange}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Actions rapides" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add-image">📷 Ajouter des images</SelectItem>
                  <SelectItem value="gallery">🖼️ Voir la galerie</SelectItem>
                  <SelectItem value="planning">📅 Planning voyage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Messages d'alerte */}
          {error && !isDialogOpen ? (
            <Alert variant="destructive">
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {successMessage ? (
            <Alert variant="success" className="animate-in fade-in-50 slide-in-from-top-5">
              <AlertTitle>Succès</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          ) : null}

          {/* Informations principales */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Informations principales</CardTitle>
              <CardDescription>Résumé rapide de la destination.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : destination ? (
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4">
                    {destination.urlImagePrincipale ? (
                      <div className="overflow-hidden rounded-2xl bg-muted/20 p-3">
                        <img
                          src={destination.urlImagePrincipale}
                          alt={destination.nom}
                          className="max-h-[360px] w-full rounded-xl object-contain transition-transform hover:scale-105"
                        />
                      </div>
                    ) : null}
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>{destination.description || "Aucune description"}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                      <p className="font-medium">Adresse</p>
                      <p className="mt-1 text-muted-foreground">
                        {destination.adresse || "Non renseignée"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                      <p className="font-medium">Région</p>
                      <p className="mt-1 text-muted-foreground">
                        {destination.region || "Non renseignée"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                      <p className="font-medium">Coordonnées</p>
                      <p className="mt-1 text-muted-foreground">
                        {destination.latitude}, {destination.longitude}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Destination introuvable.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Galerie d'images */}
          <div id="gallery-section">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Galerie multimédia</CardTitle>
                    <CardDescription>
                      {totalImages} image{totalImages > 1 ? "s" : ""} répartie
                      {totalImages > 1 ? "s" : ""} dans {sortedPhotoGroups.length} lot
                      {sortedPhotoGroups.length > 1 ? "s" : ""}
                    </CardDescription>
                  </div>
                  <Button onClick={openImageDialog} size="sm">
                    + Ajouter des images
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sortedPhotoGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 text-4xl">📷</div>
                    <p className="text-sm text-muted-foreground">
                      Aucune image disponible pour le moment.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={openImageDialog}
                    >
                      Ajouter vos premières images
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sortedPhotoGroups.map((photoGroup, index) => (
                      <div
                        key={`${photoGroup.titre}-${photoGroup.dateObtenir ?? index}-${photoGroup.ordreAffichage ?? 0}`}
                        className="space-y-4 rounded-2xl border border-border/50 bg-card/50 p-5 transition-shadow hover:shadow-md"
                      >
                        <div className="space-y-3">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                              <h3 className="text-lg font-semibold">
                                {photoGroup.titre || "Sans titre"}
                              </h3>
                              {photoGroup.dateObtenir && (
                                <p className="text-xs text-muted-foreground">
                                  📅 {new Date(photoGroup.dateObtenir).toLocaleDateString("fr-FR", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </p>
                              )}
                            </div>
                            <span
                              className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                                photoGroup.estPrincipale
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {photoGroup.estPrincipale ? "⭐ Principale" : "📸 Secondaire"}
                            </span>
                          </div>
                          {photoGroup.description && (
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                              {photoGroup.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {photoGroup.images.length} image{photoGroup.images.length > 1 ? "s" : ""} dans ce lot
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {photoGroup.images.map((image) => (
                            <div
                              key={image.id}
                              className="group relative overflow-hidden rounded-xl border border-border/50 bg-muted/20 transition-all hover:shadow-lg"
                            >
                              <img
                                src={image.url}
                                alt={photoGroup.titre || destination?.nom || "Photo destination"}
                                className="aspect-[4/3] w-full rounded-lg object-cover transition-transform group-hover:scale-105"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modal d'ajout d'images */}
      <Dialog open={isDialogOpen} onOpenChange={closeImageDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ajouter des images</DialogTitle>
            <DialogDescription>
              Ajoutez plusieurs images avec les mêmes métadonnées (titre, description, date).
              Les images seront regroupées automatiquement.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitImages}>
            <div className="py-4">
              <PhotoDestinationForm
                form={photoForm}
                onUpdate={updatePhotoForm}
              />
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeImageDialog}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Ajout en cours...
                  </>
                ) : (
                  "Ajouter les images"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AdminFooter />
    </div>
  );
}
