"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, ImageIcon, Star, Trash, Settings, Package } from "lucide-react";

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
import { loadAuth } from "@/lib/auth";
import {
  createDestinationMarketing,
  createDestinationPhotosBulk,
  deleteDestinationPhoto,
  deleteDestinationMarketing,
  getAdminDestination,
  updateDestinationPhotoPrincipale,
} from "@/lib/api/destinations";
import { getErrorMessage } from "@/lib/api/client";
import type {
  AdminDestination,
  PhotoDestinationGroup,
  SaveDestinationMarketingPayload,
  SavePhotoDestinationBulkPayload,
} from "@/lib/type/destination";
import { useBreadcrumbs } from "../../contexts/breadcrumbs-context";
import { useExtraActions } from "../../contexts/extra-actions-context";
import { useAdminNavigation } from "../../contexts/admin-navigation-context";

import { AdminDestinationAssociationsContent } from "./associations/associations-content";
import { AdminDestinationPlanningContentNext } from "./planning/planning-content-admin";
import { PhotoDestinationForm, PhotoDestinationFormState } from "./photo-form";
import { AdminBreadcrumbs } from "../../components/breadcrumbs";

const initialPhotoForm: PhotoDestinationFormState = {
  titre: "",
  description: "",
  ordreAffichage: "0",
  dateObtenir: "",
  estPrincipale: false,
  imageFiles: [],
};

type MarketingFormState = {
  libelle: string;
  description: string;
  ordreAffichage: string;
  estActif: boolean;
};

const initialMarketingForm: MarketingFormState = {
  libelle: "",
  description: "",
  ordreAffichage: "0",
  estActif: true,
};

type AdminDestinationDetailContentProps = {
  destinationId: string;
  initialSection?: DetailSection;
};

type DetailSection = "marketing" | "gallery" | "planning" | "settings";

const greenButtonScopeClass =
  "[&_button[data-slot='button']]:border-emerald-200 [&_button[data-slot='button']]:bg-emerald-50 [&_button[data-slot='button']]:text-emerald-700 [&_button[data-slot='button']]:shadow-sm [&_button[data-slot='button']:hover]:border-emerald-300 [&_button[data-slot='button']:hover]:bg-emerald-100 [&_button[data-slot='button']:hover]:text-emerald-800";
const greenPrimaryButtonClass =
  "!border-transparent !bg-gradient-to-r !from-emerald-600 !to-teal-600 !text-white !shadow-lg !shadow-emerald-500/20 hover:!from-emerald-700 hover:!to-teal-700";
const greenOutlineButtonClass =
  "!border-emerald-200 !bg-emerald-50 !text-emerald-700 hover:!border-emerald-300 hover:!bg-emerald-100 hover:!text-emerald-800";

const legacyEncodingMap: Record<string, string> = {
  "‚": "é",
  "ƒ": "â",
  "…": "à",
  "‡": "ç",
  "ˆ": "ê",
  "‰": "ë",
  "Š": "è",
  "‹": "ï",
  "Œ": "î",
  "“": "ô",
  "”": "ö",
  "–": "û",
  "—": "ù",
  "×": "Î",
};

function displayText(value?: string | null, fallback = "-") {
  if (!value) return fallback;
  return value.replace(/[‚ƒ…‡ˆ‰Š‹Œ“”–—×]/g, (char) => legacyEncodingMap[char] ?? char);
}

function sectionButtonClass(isActive: boolean) {
  return isActive ? greenPrimaryButtonClass : greenOutlineButtonClass;
}

export function AdminDestinationDetailContent({
  destinationId,
  initialSection = "marketing",
}: AdminDestinationDetailContentProps) {
  const router = useRouter();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { setExtraActions, clearExtraActions } = useExtraActions();
  const { setActive } = useAdminNavigation();
  const imageSectionRef = useRef<HTMLDivElement | null>(null);
  const photoScrollerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [accessToken, setAccessToken] = useState("");
  const [role, setRole] = useState("");
  const [destination, setDestination] = useState<AdminDestination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingImages, setIsSavingImages] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [photoForm, setPhotoForm] = useState<PhotoDestinationFormState>(initialPhotoForm);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingPhotoId, setUpdatingPhotoId] = useState<string | null>(null);
  const [isMarketingDialogOpen, setIsMarketingDialogOpen] = useState(false);
  const [marketingForm, setMarketingForm] = useState<MarketingFormState>(initialMarketingForm);
  const [isSubmittingMarketing, setIsSubmittingMarketing] = useState(false);
  const [activeSection, setActiveSection] = useState<DetailSection>(initialSection);

  const sortedPhotoGroups = useMemo(() => {
    const groups = new Map<string, PhotoDestinationGroup>();

    (destination?.photos ?? []).forEach((group) => {
      const groupKey = [
        group.titre?.trim() ?? "",
        group.description?.trim() ?? "",
        group.dateObtenir ?? "",
        group.ordreAffichage ?? 0,
      ].join("|");
      const current = groups.get(groupKey);

      if (!current) {
        groups.set(groupKey, {
          ...group,
          estPrincipale: Boolean(group.estPrincipale),
          images: [...group.images].sort(
            (a, b) => Number(Boolean(a.estPrincipale)) - Number(Boolean(b.estPrincipale))
          ),
        });
        return;
      }

      const existingImageIds = new Set(current.images.map((image) => image.id));
      const nextImages = group.images.filter((image) => !existingImageIds.has(image.id));
      current.images.push(...nextImages);
      current.estPrincipale =
        current.estPrincipale ||
        Boolean(group.estPrincipale);
      current.images.sort(
        (a, b) => Number(Boolean(a.estPrincipale)) - Number(Boolean(b.estPrincipale))
      );
    });

    return Array.from(groups.values()).sort(
      (a, b) => (a.ordreAffichage ?? 0) - (b.ordreAffichage ?? 0)
    );
  }, [destination]);

  const totalImages = useMemo(
    () =>
      (destination?.photos ?? []).reduce(
        (count, group) => count + (group.images?.length ?? 0),
        0
      ),
    [destination]
  );

  const primaryPhotoImages = useMemo(
    () =>
      sortedPhotoGroups.flatMap((group, groupIndex) =>
        group.images
          .filter((image) => image.estPrincipale)
          .map((image) => ({
            image,
            group,
            groupKey: `primary-${group.titre}-${group.dateObtenir ?? "no-date"}-${group.ordreAffichage ?? 0}-${groupIndex}`,
          }))
      ),
    [sortedPhotoGroups]
  );

  const marketingItems = useMemo(
    () =>
      [...(destination?.marketing ?? [])].sort(
        (a, b) => (a.ordreAffichage ?? 0) - (b.ordreAffichage ?? 0)
      ),
    [destination]
  );

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    // Synchroniser la section active avec la navigation admin
    setActive("destinations-view");
  }, [setActive]);

  useEffect(() => {
    const destinationLabel = destination?.nom
      ? displayText(destination.nom, "Détail destination")
      : "Détail destination";

    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Destinations", href: "/admin?section=destinations" },
      { label: destinationLabel, isActive: true }
    ]);
  }, [destination?.nom, setBreadcrumbs]);

  useEffect(() => {
    const actions = (
      <>
        <Button
          type="button"
          size="sm"
          variant={activeSection === "marketing" ? "default" : "outline"}
          className={sectionButtonClass(activeSection === "marketing")}
          onClick={() => setActiveSection("marketing")}
        >
          Marketing
        </Button>
        <Button
          type="button"
          variant={activeSection === "gallery" ? "default" : "outline"}
          size="sm"
          className={sectionButtonClass(activeSection === "gallery")}
          onClick={handleOpenGallery}
        >
          Galérie
        </Button>
        <Button
          type="button"
          variant={activeSection === "planning" ? "default" : "outline"}
          size="sm"
          className={sectionButtonClass(activeSection === "planning")}
          onClick={() => setActiveSection("planning")}
        >
          Planning voyage
        </Button>
        <Button
          type="button"
          variant={activeSection === "settings" ? "default" : "outline"}
          size="sm"
          className={sectionButtonClass(activeSection === "settings")}
          onClick={handleOpenManagement}
        >
          <Settings className="mr-2 h-4 w-4" />
          Paramétrage
        </Button>
      </>
    );
    
    setExtraActions(actions);
    
    return () => {
      clearExtraActions();
    };
  }, [activeSection, setExtraActions, clearExtraActions]);

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

  function updateMarketingForm<K extends keyof MarketingFormState>(
    key: K,
    value: MarketingFormState[K]
  ) {
    setMarketingForm((current) => ({ ...current, [key]: value }));
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

  function openMarketingDialog() {
    setMarketingForm(initialMarketingForm);
    setError("");
    setIsMarketingDialogOpen(true);
  }

  function closeMarketingDialog() {
    if (!isSubmittingMarketing) {
      setIsMarketingDialogOpen(false);
      setMarketingForm(initialMarketingForm);
      setError("");
    }
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
      setActiveSection("gallery");
      
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

  async function handleSubmitMarketing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;

    setIsSubmittingMarketing(true);
    setError("");

    try {
      const payload: SaveDestinationMarketingPayload = {
        libelle: marketingForm.libelle.trim(),
        description: marketingForm.description.trim() || null,
        ordreAffichage: Number(marketingForm.ordreAffichage || 0),
        estActif: marketingForm.estActif,
      };

      await createDestinationMarketing(destinationId, payload, accessToken);
      await reloadDestination();
      setIsMarketingDialogOpen(false);
      setMarketingForm(initialMarketingForm);
      setSuccessMessage("Element marketing ajoute avec succes.");
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Impossible d'ajouter cet element marketing"));
    } finally {
      setIsSubmittingMarketing(false);
    }
  }

  async function handleDeleteMarketing(marketingId: string) {
    if (!accessToken) return;
    const confirmed = window.confirm("Supprimer cet element marketing ?");
    if (!confirmed) return;

    setError("");
    try {
      await deleteDestinationMarketing(destinationId, marketingId, accessToken);
      await reloadDestination();
      setSuccessMessage("Element marketing supprime avec succes.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Impossible de supprimer cet element marketing"));
    }
  }

  async function handleTogglePhotoPrincipale(photoId: string, estPrincipale: boolean) {
    if (!accessToken) return;

    setUpdatingPhotoId(photoId);
    setError("");

    try {
      await updateDestinationPhotoPrincipale(photoId, estPrincipale, accessToken);
      await reloadDestination();
      setSuccessMessage(estPrincipale ? "Image marquee comme principale." : "Image retiree des principales.");
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, "Impossible de modifier le statut principal de cette image"));
    } finally {
      setUpdatingPhotoId(null);
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!accessToken) return;
    const confirmed = window.confirm("Supprimer cette image ?");
    if (!confirmed) return;

    setError("");
    try {
      await deleteDestinationPhoto(imageId, accessToken);
      setSuccessMessage("Image supprimee avec succes.");
      await reloadDestination();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Impossible de supprimer cette image"));
    }
  }

  function handleOpenGallery() {
    setActiveSection("gallery");
  }

  function handleOpenManagement() {
    setActiveSection("settings");
  }

  function scrollPhotoGroup(groupKey: string, direction: "left" | "right") {
    const container = photoScrollerRefs.current[groupKey];
    if (!container) return;

    const amount = 220;
    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  if (!accessToken || role !== "ADMIN") {
    return null;
  }

  return (
    <div className={`bg-gradient-to-b from-background via-muted/30 to-background text-foreground ${greenButtonScopeClass}`}>
      <main className="mx-auto w-full px-4 py-6 sm:py-8">
        <div className="space-y-8">

          {/* Messages d'alerte */}
          {error && !isDialogOpen && !isMarketingDialogOpen ? (
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

          {activeSection === "marketing" ? (
            <>
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg font-semibold text-gray-900">Informations principales</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                </div>
              ) : destination ? (
                <div className="space-y-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                    {/* Image */}
                    <div className="lg:w-1/3">
                      {destination.urlImagePrincipale ? (
                        <div className="overflow-hidden rounded-lg border border-gray-200">
                          <img
                            src={destination.urlImagePrincipale}
                            alt={displayText(destination.nom)}
                            className="h-64 w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
                          <div className="text-center">
                            <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-500" />
                            </div>
                            <p className="text-sm text-gray-500">Aucune image</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Informations */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {displayText(destination.nom)}
                        </h2>
                        <p className="mt-2 text-gray-600">
                          {displayText(destination.description, "Aucune description disponible")}
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Adresse</p>
                          <p className="mt-1 text-sm text-gray-900">{displayText(destination.adresse, "Non renseignée")}</p>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Coordonnées GPS</p>
                          <p className="mt-1 text-sm text-gray-900">
                            {destination.latitude && destination.longitude 
                              ? `${destination.latitude}, ${destination.longitude}`
                              : "Non renseignées"
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">Destination introuvable</p>
                </div>
              )}
            </CardContent>
          </Card>




          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Marketing destination</CardTitle>
                  <CardDescription className="text-gray-600">
                    {marketingItems.length} élément{marketingItems.length > 1 ? "s" : ""} marketing pour cette destination
                  </CardDescription>
                </div>
                <Button type="button" size="sm" onClick={openMarketingDialog}>
                 Ajouter Marketing
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {marketingItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-4">Aucun élément marketing</p>
                  <Button variant="outline" onClick={openMarketingDialog}>
                    Ajouter le premier élément
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {marketingItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs font-medium text-gray-600">
                              {item.ordreAffichage ?? index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-medium text-gray-900">{displayText(item.libelle)}</h3>
                              {item.description && (
                                <p className="mt-1 text-sm text-gray-600">{displayText(item.description)}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center gap-4">
                            <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${
                              item.estActif 
                                ? "bg-green-100 text-green-800" 
                                : "bg-gray-100 text-gray-600"
                            }`}>
                              {item.estActif ? "Actif" : "Inactif"}
                            </span>
                            <span className="text-xs text-gray-500">
                              Ordre: {item.ordreAffichage ?? 0}
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMarketing(item.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
            </>
          ) : null}

          {/* Galerie d'images */}
          {activeSection === "gallery" ? (
          <div id="gallery-section">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Galérie multimédia</CardTitle>
                    <CardDescription className="text-gray-600">
                      {totalImages} image{totalImages > 1 ? "s" : ""} répartie{totalImages > 1 ? "s" : ""} dans {sortedPhotoGroups.length} lot{sortedPhotoGroups.length > 1 ? "s" : ""}
                    </CardDescription>
                  </div>
                  <Button onClick={openImageDialog} size="sm">
                    Ajouter des images
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sortedPhotoGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <ImageIcon className="h-7 w-7" />
                    </div>
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
                  <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-2">
                    {sortedPhotoGroups.map((photoGroup, index) => {
                      const groupKey = `${photoGroup.titre}-${photoGroup.dateObtenir ?? "no-date"}-${photoGroup.ordreAffichage ?? 0}-${index}`;
                      const secondaryImages = photoGroup.images.filter((image) => !image.estPrincipale);
                      return (
                      <div
                        key={groupKey}
                        className="grid gap-4 rounded-2xl border border-border/50 bg-card/50 p-5 transition-shadow hover:shadow-md xl:grid-cols-[300px_minmax(0,1fr)]"
                      >
                        <div className="relative">
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <h3 className="text-lg font-semibold">
                                {photoGroup.titre || "Sans titre"}
                              </h3>
                              {photoGroup.dateObtenir && (
                                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  {new Date(photoGroup.dateObtenir).toLocaleDateString("fr-FR", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                          {photoGroup.description && (
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                              {photoGroup.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {secondaryImages.length} image{secondaryImages.length > 1 ? "s" : ""} secondaire{secondaryImages.length > 1 ? "s" : ""} dans ce lot
                          </p>
                        </div>

                        <div className="relative">
                          <div className="absolute inset-y-0 left-2 right-2 z-40 flex items-center justify-between pointer-events-none">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="pointer-events-auto relative z-50 h-9 w-9 rounded-full bg-background/90 px-0 shadow-md backdrop-blur"
                              onClick={() =>
                                scrollPhotoGroup(
                                  groupKey,
                                  "left"
                                )
                              }
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="pointer-events-auto relative z-50 h-9 w-9 rounded-full bg-background/90 px-0 shadow-md backdrop-blur"
                              onClick={() =>
                                scrollPhotoGroup(
                                  groupKey,
                                  "right"
                                )
                              }
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        <div
                          ref={(node) => {
                            photoScrollerRefs.current[
                              groupKey
                            ] = node;
                          }}
                          className="space-y-4 overflow-x-hidden overflow-y-visible px-12 py-6"
                        >
                          {[
                            { id: "secondary", images: secondaryImages },
                          ]
                            .filter((row) => row.images.length > 0)
                            .map((row) => (
                              <div
                                key={row.id}
                                className={row.id === "primary" ? "border-t border-border/40 pt-4" : ""}
                              >
                                <div className="flex min-w-max gap-3">
                                  {row.images.map((image) => (
                                    <div
                                      key={image.id}
                                      className="group relative z-0 w-[180px] min-w-[180px] overflow-visible rounded-xl transition-all hover:z-20"
                                    >
                                      <div className="relative overflow-visible rounded-xl border border-border/50 bg-muted/20 transition-all hover:shadow-lg">
                                      <img
                                        src={image.url}
                                        alt={photoGroup.titre || destination?.nom || "Photo destination"}
                                        className="relative z-0 h-32 w-full rounded-lg object-cover transition-transform duration-700 ease-out group-hover:scale-[1.75] group-hover:shadow-2xl"
                                      />
                                      <div className="relative z-30 border-t border-border/40 bg-background/95 px-2 py-2">
                                        <div className="flex items-center justify-between gap-2">
                                          <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <input
                                              type="checkbox"
                                              checked={Boolean(image.estPrincipale)}
                                              disabled={updatingPhotoId === image.id}
                                              onChange={(event) =>
                                                handleTogglePhotoPrincipale(image.id, event.target.checked)
                                              }
                                            />
                                            <span>
                                              {updatingPhotoId === image.id ? "Mise a jour..." : "Image principale"}
                                            </span>
                                          </label>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDeleteImage(image.id)}
                                          >
                                            <Trash className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>

                                      {/* {image.description ? (
                                        <div className="border-t border-border/40 bg-background/95 px-3 py-2">
                                          <p className="line-clamp-2 text-xs text-muted-foreground">
                                            {image.description}
                                          </p>
                                        </div>
                                      ) : null} */}

                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          {secondaryImages.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                              Les images de ce lot sont classées dans la liste des images principales.
                            </div>
                          ) : null}
                        </div>
                        </div>
                      </div>
                    )})}
                    {primaryPhotoImages.length > 0 ? (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                              <Star className="h-4 w-4 fill-emerald-700 text-emerald-700" />
                              Images principales
                            </h3>
                            <p className="text-sm text-slate-600">
                              {primaryPhotoImages.length} image{primaryPhotoImages.length > 1 ? "s" : ""} principale{primaryPhotoImages.length > 1 ? "s" : ""} regroupée{primaryPhotoImages.length > 1 ? "s" : ""} dans une seule liste.
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {primaryPhotoImages.map(({ image, group }) => (
                            <div key={image.id} className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm">
                              <img
                                src={image.url}
                                alt={group.titre || destination?.nom || "Photo principale"}
                                className="h-36 w-full object-cover"
                              />
                              <div className="space-y-2 border-t border-border/40 px-3 py-3">
                                <div>
                                  <p className="truncate text-sm font-semibold text-slate-950">
                                    {group.titre || "Sans titre"}
                                  </p>
                                  {group.dateObtenir ? (
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(group.dateObtenir).toLocaleDateString("fr-FR", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                      })}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <label className="flex items-center gap-2 text-xs text-emerald-700">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(image.estPrincipale)}
                                      disabled={updatingPhotoId === image.id}
                                      onChange={(event) =>
                                        handleTogglePhotoPrincipale(image.id, event.target.checked)
                                      }
                                    />
                                    <span>
                                      {updatingPhotoId === image.id ? "Mise a jour..." : "Image principale"}
                                    </span>
                                  </label>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                                    onClick={() => handleDeleteImage(image.id)}
                                  >
                                    <Trash className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          ) : null}

          {activeSection === "planning" ? (
            <AdminDestinationPlanningContentNext destinationId={destinationId} embedded />
          ) : null}

          {activeSection === "settings" ? (
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg font-semibold text-gray-900">Paramétrage destination</CardTitle>
              <CardDescription className="text-gray-600">
                Gérez les hébergements, activités, prestations et la vue carte depuis le détail de cette destination
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <AdminDestinationAssociationsContent
                destinationId={destinationId}
                embedded
                showBackToDetail={false}
                title="Gestion de la destination"
                description="Associez les hébergements, activités et prestations qui composent cette destination."
              />
            </CardContent>
          </Card>
          ) : null}
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

      <Dialog open={isMarketingDialogOpen} onOpenChange={closeMarketingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Marketing</DialogTitle>
            <DialogDescription>
              Ajoutez un argument marketing qui sera affiche dans le detail de la destination.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitMarketing} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Libelle</label>
              <input
                value={marketingForm.libelle}
                onChange={(event) => updateMarketingForm("libelle", event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Ex: Plages paradisiaques"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={marketingForm.description}
                onChange={(event) => updateMarketingForm("description", event.target.value)}
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Description marketing (optionnel)"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ordre d&apos;affichage</label>
                <input
                  type="number"
                  min={0}
                  value={marketingForm.ordreAffichage}
                  onChange={(event) => updateMarketingForm("ordreAffichage", event.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <label className="mt-7 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={marketingForm.estActif}
                  onChange={(event) => updateMarketingForm("estActif", event.target.checked)}
                />
                Marketing actif
              </label>
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeMarketingDialog}
                disabled={isSubmittingMarketing}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmittingMarketing}>
                {isSubmittingMarketing ? "Ajout..." : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}



