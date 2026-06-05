"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BedDouble, CalendarDays, CheckCircle2, Compass, Gift, Info, Loader2, MapPin, Map as MapIcon, SlidersHorizontal, Tag, X } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api/client";
import {
  createPrestationReference,
  getDestinationAssociations,
  linkDestinationActivite,
  linkDestinationHebergement,
  linkDestinationPrestation,
  unlinkDestinationActivite,
  unlinkDestinationHebergement,
  unlinkDestinationPrestation,
} from "@/lib/api/destinations";
import { loadAuth } from "@/lib/auth";
import type {
  DestinationAssociationItem,
  DestinationAssociations,
  DestinationPrestationItem,
} from "@/lib/type/destination";

type Props = {
  destinationId: string;
  embedded?: boolean;
  initialSection?: "top" | "hebergements" | "activites" | "prestations" | "carte";
  title?: string;
  description?: string;
  showBackToDetail?: boolean;
};

type ActiveSection = "hebergements" | "activites" | "prestations" | "carte";
type MapCategoryFilter = "all" | "hebergement" | "activite";

const greenPrimaryButtonClass =
  "border-transparent bg-gradient-to-r from-emerald-600 to-teal-600 !text-white shadow-sm shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 hover:!text-white";
const greenOutlineButtonClass =
  "border-emerald-200 bg-white text-emerald-700 shadow-sm hover:bg-emerald-50 hover:text-emerald-800";

function sectionButtonClass(isActive: boolean) {
  return isActive ? greenPrimaryButtonClass : greenOutlineButtonClass;
}

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

const mojibakeTextMap: Record<string, string> = {
  "Ã©": "é",
  "Ã¨": "è",
  "Ãª": "ê",
  "Ã ": "à",
  "Ã¹": "ù",
  "Ã§": "ç",
  "Ã®": "î",
  "Ã´": "ô",
  "Ã»": "û",
  "Å“": "œ",
};

function displayText(value?: string | number | null, fallback = "-") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return Object.entries(mojibakeTextMap).reduce(
    (text, [broken, fixed]) => text.replaceAll(broken, fixed),
    String(value).replace(/[‚ƒ…‡ˆ‰Š‹Œ“”–—×]/g, (char) => legacyEncodingMap[char] ?? char)
  );
}

const DestinationAssociationsMap = dynamic(
  () =>
    import("@/components/destination-associations-map").then(
      (mod) => mod.DestinationAssociationsMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] items-center justify-center rounded-2xl border border-dashed border-border/50 bg-muted/20 text-sm text-muted-foreground">
        Chargement de la carte...
      </div>
    ),
  }
);

export function AdminDestinationAssociationsContent({
  destinationId,
  embedded = false,
  initialSection = "top",
  title = "Hébergements et activités",
  description = "Sélectionnez ce que les voyageurs pourront faire et où ils pourront se loger pour cette destination.",
  showBackToDetail = !embedded,
}: Props) {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [role, setRole] = useState("");
  const [data, setData] = useState<DestinationAssociations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>(
    initialSection === "top" ? "hebergements" : initialSection
  );
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [mapCategoryFilter, setMapCategoryFilter] = useState<MapCategoryFilter>("all");
  const [isCreatePrestationDialogOpen, setIsCreatePrestationDialogOpen] = useState(false);
  const [isCreatingPrestation, setIsCreatingPrestation] = useState(false);
  const [newPrestation, setNewPrestation] = useState({
    libelle: "",
    description: "",
    ordreAffichage: "",
  });

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
    if (!accessToken || role !== "ADMIN") {
      return;
    }

    async function loadData() {
      setIsLoading(true);
      setError("");

      try {
        const response = await getDestinationAssociations(destinationId, accessToken);
        setData(response.data ?? null);
        const firstItem =
          response.data?.hebergements.find((item) => item.latitude && item.longitude) ??
          response.data?.activites.find((item) => item.latitude && item.longitude) ??
          null;
        setFocusedItemId(firstItem?.id ?? null);
      } catch (loadError) {
        setError(getErrorMessage(loadError, "Impossible de charger les associations de la destination"));
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [accessToken, role, destinationId]);

  function resetPrestationForm() {
    setNewPrestation({
      libelle: "",
      description: "",
      ordreAffichage: "",
    });
  }

  const totalHebergementsSelectionnes = useMemo(
    () => data?.hebergements.filter((item) => item.estSelectionne).length ?? 0,
    [data]
  );

  const totalActivitesSelectionnees = useMemo(
    () => data?.activites.filter((item) => item.estSelectionne).length ?? 0,
    [data]
  );

  const totalPrestationsSelectionnees = useMemo(
    () => data?.prestations.filter((item) => item.estSelectionne).length ?? 0,
    [data]
  );

  const mapItems = useMemo(
    () => [
      ...(data?.hebergements ?? []).map((item) => ({ ...item, type: "hebergement" as const })),
      ...(data?.activites ?? []).map((item) => ({ ...item, type: "activite" as const })),
    ],
    [data]
  );

  const filteredMapItems = useMemo(
    () =>
      mapItems.filter((item) =>
        mapCategoryFilter === "all" ? true : item.type === mapCategoryFilter
      ),
    [mapCategoryFilter, mapItems]
  );

  useEffect(() => {
    if (filteredMapItems.length === 0) {
      setFocusedItemId(null);
      return;
    }

    const stillVisible = filteredMapItems.some((item) => item.id === focusedItemId);
    if (!stillVisible) {
      setFocusedItemId(filteredMapItems[0]?.id ?? null);
    }
  }, [filteredMapItems, focusedItemId]);

  useEffect(() => {
    setActiveSection(initialSection === "top" ? "hebergements" : initialSection);
  }, [initialSection]);

  async function handleToggleHebergement(item: DestinationAssociationItem, checked: boolean) {
    if (!accessToken) {
      return;
    }

    const key = `hebergement-${item.id}`;
    setPendingKey(key);
    setError("");

    try {
      if (checked) {
        const response = await linkDestinationHebergement(destinationId, item.id, accessToken);
        setData(response.data ?? null);
        setFocusedItemId(item.id);
        setSuccessMessage("Hébergement associé à la destination avec succès.");
      } else {
        await unlinkDestinationHebergement(destinationId, item.id, accessToken);
        setData((current) =>
          current
            ? {
                ...current,
                hebergements: current.hebergements.map((entry) =>
                  entry.id === item.id
                    ? { ...entry, estSelectionne: false, estActif: false }
                    : entry
                ),
              }
            : current
        );
        setFocusedItemId(item.id);
        setSuccessMessage("Hébergement retiré de la destination avec succès.");
      }
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, "Impossible de mettre à jour l'hébergement"));
    } finally {
      setPendingKey(null);
    }
  }

  async function handleToggleActivite(item: DestinationAssociationItem, checked: boolean) {
    if (!accessToken) {
      return;
    }

    const key = `activite-${item.id}`;
    setPendingKey(key);
    setError("");

    try {
      if (checked) {
        const response = await linkDestinationActivite(destinationId, item.id, accessToken);
        setData(response.data ?? null);
        setFocusedItemId(item.id);
        setSuccessMessage("Activité associée à la destination avec succès.");
      } else {
        await unlinkDestinationActivite(destinationId, item.id, accessToken);
        setData((current) =>
          current
            ? {
                ...current,
                activites: current.activites.map((entry) =>
                  entry.id === item.id
                    ? { ...entry, estSelectionne: false, estActif: false }
                    : entry
                ),
              }
            : current
        );
        setFocusedItemId(item.id);
        setSuccessMessage("Activité retirée de la destination avec succès.");
      }
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, "Impossible de mettre à jour l'activité"));
    } finally {
      setPendingKey(null);
    }
  }

  async function handleToggleFromMap(
    item: DestinationAssociationItem & { type: "hebergement" | "activite" },
    checked: boolean
  ) {
    if (item.type === "hebergement") {
      await handleToggleHebergement(item, checked);
      return;
    }

    await handleToggleActivite(item, checked);
  }

  async function handleTogglePrestation(item: DestinationPrestationItem, checked: boolean) {
    if (!accessToken) {
      return;
    }

    const key = `prestation-${item.id}`;
    setPendingKey(key);
    setError("");

    try {
      if (checked) {
        const response = await linkDestinationPrestation(
          destinationId,
          item.id,
          item.statut ?? "INCLUS",
          accessToken
        );
        setData(response.data ?? null);
        setSuccessMessage("Prestation ajoutée à la destination avec succès.");
      } else {
        await unlinkDestinationPrestation(destinationId, item.id, accessToken);
        setData((current) =>
          current
            ? {
                ...current,
                prestations: current.prestations.map((entry) =>
                  entry.id === item.id
                    ? { ...entry, estSelectionne: false, estActif: false }
                    : entry
                ),
              }
            : current
        );
        setSuccessMessage("Prestation retirée de la destination avec succès.");
      }
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, "Impossible de mettre à jour la prestation"));
    } finally {
      setPendingKey(null);
    }
  }

  async function handlePrestationStatutChange(
    item: DestinationPrestationItem,
    statut: "INCLUS" | "EN_SUS"
  ) {
    if (!accessToken) {
      return;
    }

    const key = `prestation-${item.id}`;
    setPendingKey(key);
    setError("");

    try {
      const response = await linkDestinationPrestation(destinationId, item.id, statut, accessToken);
      setData(response.data ?? null);
      setSuccessMessage("Statut de la prestation mis à jour avec succès.");
    } catch (updateError) {
      setError(getErrorMessage(updateError, "Impossible de mettre à jour le statut de la prestation"));
    } finally {
      setPendingKey(null);
    }
  }

  async function handleCreatePrestation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) {
      return;
    }

    setIsCreatingPrestation(true);
    setError("");

    try {
      await createPrestationReference(
        {
          libelle: newPrestation.libelle.trim(),
          description: newPrestation.description.trim(),
          estActif: true,
          ordreAffichage: Number(newPrestation.ordreAffichage || 0),
        },
        accessToken
      );

      const response = await getDestinationAssociations(destinationId, accessToken);
      setData(response.data ?? null);
      setSuccessMessage("Nouvelle prestation ajoutée avec succès.");
      setIsCreatePrestationDialogOpen(false);
      resetPrestationForm();
    } catch (createError) {
      setError(getErrorMessage(createError, "Impossible d'ajouter la prestation"));
    } finally {
      setIsCreatingPrestation(false);
    }
  }

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setSuccessMessage(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  function renderItem(
    item: DestinationAssociationItem,
    type: "hebergement" | "activite"
  ) {
    const pending = pendingKey === `${type}-${item.id}`;

    return (
      <div
        key={item.id}
        className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors ${
          focusedItemId === item.id
            ? "border-primary/40 bg-primary/5"
            : "border-border/50 bg-card/50 hover:bg-muted/20"
        }`}
        onClick={() => {
          setFocusedItemId(item.id);
          setActiveSection("carte");
        }}
      >
        <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted/20">
          {item.image ? (
            <img src={item.image} alt={displayText(item.nom)} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              Aucune image
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold">{displayText(item.nom)}</h3>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                  <MapPin className="size-3.5" />
                  {displayText(item.place, "Place non renseignée")}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                  <Tag className="size-3.5" />
                  {displayText(item.region, "Région non renseignée")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {pending ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={item.estSelectionne}
                  disabled={pending}
                  onCheckedChange={(checked) =>
                    type === "hebergement"
                      ? void handleToggleHebergement(item, checked === true)
                      : void handleToggleActivite(item, checked === true)
                  }
                  aria-label={`Associer ${displayText(item.nom)}`}
                />
                <span className="text-sm font-medium">
                  {item.estSelectionne ? "Actif pour la destination" : "Non associé"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderListTableItem(
    item: DestinationAssociationItem,
    type: "hebergement" | "activite"
  ) {
    const pending = pendingKey === `${type}-${item.id}`;

    return (
      <div
        key={item.id}
        className={`grid gap-4 px-4 py-4 transition-all duration-200 md:grid-cols-[1.9fr_1.2fr_1fr_0.9fr_1.4fr] hover:bg-muted/30 ${
          focusedItemId === item.id 
            ? "bg-primary/5 border-l-4 border-l-primary" 
            : "border-l-4 border-l-transparent hover:border-l-border/40"
        }`}
        onClick={() => {
          setFocusedItemId(item.id);
          setActiveSection("carte");
        }}
      >
        <div className="flex min-w-0 flex-col items-start gap-3">
          <div className="h-12 w-14 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted/20 shadow-sm">
            {item.image ? (
              <img src={item.image} alt={displayText(item.nom)} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-1 text-center text-[9px] leading-tight text-muted-foreground">
                Aucune image
              </div>
            )}
          </div>
          <div className="min-w-0 max-w-full">
            <p className="truncate text-base font-medium text-foreground">{displayText(item.nom)}</p>
          </div>
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <span className="truncate">{displayText(item.place, "Place non renseignée")}</span>
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <span className="truncate">{displayText(item.region, "Région non renseignée")}</span>
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <span className="truncate">
            {displayText(item.meta, type === "hebergement" ? "Non classé" : "Durée non renseignée")}
          </span>
        </div>

        <div className="flex items-center justify-start gap-3">
          {pending ? <Loader2 className="size-4 animate-spin text-primary" /> : null}
          <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
            <Checkbox
              checked={item.estSelectionne}
              disabled={pending}
              onCheckedChange={(checked) =>
                type === "hebergement"
                  ? void handleToggleHebergement(item, checked === true)
                  : void handleToggleActivite(item, checked === true)
              }
              aria-label={`Associer ${displayText(item.nom)}`}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="whitespace-nowrap text-sm font-medium">
              {item.estSelectionne ? (
                <span className="text-emerald-600">Actif</span>
              ) : (
                <span className="text-muted-foreground">Non associé</span>
              )}
            </span>
          </div>
        </div>
      </div>
    );
  }

  function renderPrestationItem(item: DestinationPrestationItem) {
    const pending = pendingKey === `prestation-${item.id}`;

    return (
      <div
        key={item.id}
        className="grid gap-3 px-4 py-4 transition-all duration-200 md:grid-cols-[1.2fr_1.4fr_180px_220px_120px] hover:bg-muted/30 border-l-4 border-l-transparent hover:border-l-border/40"
      >
        <div className="min-w-0">
          <p className="font-medium text-foreground">{displayText(item.libelle)}</p>
        </div>

        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {displayText(item.description, "Aucune description")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pending ? <Loader2 className="size-4 animate-spin text-primary" /> : null}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={item.estSelectionne}
              disabled={pending}
              onCheckedChange={(checked) => void handleTogglePrestation(item, checked === true)}
              aria-label={`Associer ${displayText(item.libelle)}`}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-sm font-medium">
              {item.estSelectionne ? (
                <span className="text-emerald-600">Associée</span>
              ) : (
                <span className="text-muted-foreground">Non associée</span>
              )}
            </span>
          </div>
        </div>

        <div className="w-full">
          <Select
            value={item.statut}
            disabled={!item.estSelectionne || pending}
            onValueChange={(value) =>
              void handlePrestationStatutChange(item, value as "INCLUS" | "EN_SUS")
            }
          >
            <SelectTrigger className="w-full shadow-sm">
              <SelectValue placeholder="Choisir le statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCLUS">Inclus</SelectItem>
              <SelectItem value="EN_SUS">Non inclus / En sus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center">
          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium shadow-sm ${
              item.statut === "EN_SUS"
                ? "bg-amber-100 text-amber-700 border border-amber-200"
                : "bg-emerald-100 text-emerald-700 border border-emerald-200"
            }`}
          >
            {item.statut === "EN_SUS" ? "EN SUS" : "INCLUS"}
          </span>
        </div>
      </div>
    );
  }

  if (!accessToken || role !== "ADMIN") {
    return null;
  }

  return (
    <div className={embedded ? "text-foreground" : "min-h-screen bg-gradient-to-b from-background via-muted/30 to-background text-foreground"}>
      <main className={embedded ? "w-full" : "mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8"}>
        <div id="destination-management" className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              
              {showBackToDetail ? (
                <Button asChild variant="ghost" size="sm" className="w-fit px-2">
                  <Link href={`/admin/destination/${destinationId}`}>
                    <ArrowLeft className="mr-2 size-4" />
                    Retour au détail
                  </Link>
                </Button>
              ) : null}

              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{displayText(title)}</h1>
                <p className="text-sm text-muted-foreground mt-2">{displayText(description)}</p>
                {data?.nomDestination && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Destination: <span className="font-medium">{displayText(data.nomDestination)}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {!embedded ? (
                <>
                  <Button asChild type="button" variant="outline" className="shadow-sm">
                    <Link href={`/admin/destination/${destinationId}`}>
                      <Info className="size-4 mr-2" />
                      Détails
                    </Link>
                  </Button>
                  <Button asChild type="button" variant="outline" className="shadow-sm">
                    <Link href={`/admin/destination/${destinationId}/parametrage`}>
                      <SlidersHorizontal className="size-4 mr-2" />
                      Paramétrage
                    </Link>
                  </Button>
                  <Button asChild type="button" variant="outline" className="shadow-sm">
                    <Link href={`/admin/destination/${destinationId}/planning`}>
                      <CalendarDays className="size-4 mr-2" />
                      Planning
                    </Link>
                  </Button>
                </>
              ) : null}
              <Button 
                type="button" 
                variant={activeSection === "hebergements" ? "default" : "outline"}
                onClick={() => setActiveSection("hebergements")}
                className={sectionButtonClass(activeSection === "hebergements")}
              >
                <BedDouble className="size-4 mr-2" />
                Hébergements
              </Button>
              <Button 
                type="button" 
                variant={activeSection === "activites" ? "default" : "outline"}
                onClick={() => setActiveSection("activites")}
                className={sectionButtonClass(activeSection === "activites")}
              >
                <Compass className="size-4 mr-2" />
                Activités
              </Button>
              <Button 
                type="button" 
                variant={activeSection === "prestations" ? "default" : "outline"}
                onClick={() => setActiveSection("prestations")}
                className={sectionButtonClass(activeSection === "prestations")}
              >
                <Gift className="size-4 mr-2" />
                Prestations
              </Button>
              <Button
                type="button"
                variant={activeSection === "carte" ? "default" : "outline"}
                onClick={() => setActiveSection("carte")}
                className={sectionButtonClass(activeSection === "carte")}
              >
                <MapIcon className="size-4 mr-2" />
                Vue carte
              </Button>
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
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <AlertTitle>Succes</AlertTitle>
                  <AlertDescription>{successMessage}</AlertDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessMessage("")}
                  className="rounded-md p-1 text-emerald-700/70 transition-colors hover:bg-emerald-100 hover:text-emerald-900"
                  aria-label="Fermer l'alerte"
                >
                  <X className="size-4" />
                </button>
              </div>
            </Alert>
          ) : null}

          {activeSection === "carte" ? (
            <Card className="border-border/50 shadow-lg">
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between bg-gradient-to-r from-muted/20 to-transparent">
                <div className="space-y-1.5">
                  <CardTitle className="text-xl">Vue carte</CardTitle>
                  <CardDescription className="text-sm">
                    Visualisez les hébergements et activités sur la carte, puis activez-les directement depuis le popup ou la liste.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={mapCategoryFilter === "all" ? "default" : "outline"}
                    onClick={() => setMapCategoryFilter("all")}
                    className="shadow-sm"
                  >
                    Tous
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={mapCategoryFilter === "hebergement" ? "default" : "outline"}
                    onClick={() => setMapCategoryFilter("hebergement")}
                    className="shadow-sm"
                  >
                    Hébergements
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={mapCategoryFilter === "activite" ? "default" : "outline"}
                    onClick={() => setMapCategoryFilter("activite")}
                    className="shadow-sm"
                  >
                    Activités
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
                  <div className="rounded-2xl border border-border/30 bg-gradient-to-br from-background to-muted/10 overflow-hidden">
                    <DestinationAssociationsMap
                      items={filteredMapItems}
                      pendingKey={pendingKey}
                      focusedItemId={focusedItemId}
                      onToggle={(item, checked) => void handleToggleFromMap(item, checked)}
                      onFocusChange={(item) => setFocusedItemId(item.id)}
                    />
                  </div>

                  <div className="space-y-4">
                    {mapCategoryFilter !== "activite" ? (
                      <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-muted/20 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-foreground">Hébergements</p>
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            {totalHebergementsSelectionnes} sélectionné(s)
                          </span>
                        </div>
                        <div className="mt-4 max-h-[220px] space-y-3 overflow-y-auto pr-2">
                          {(data?.hebergements ?? []).map((item) => renderItem(item, "hebergement"))}
                        </div>
                      </div>
                    ) : null}

                    {mapCategoryFilter !== "hebergement" ? (
                      <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-muted/20 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-foreground">Activités</p>
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            {totalActivitesSelectionnees} sélectionné(s)
                          </span>
                        </div>
                        <div className="mt-4 max-h-[220px] space-y-3 overflow-y-auto pr-2">
                          {(data?.activites ?? []).map((item) => renderItem(item, "activite"))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {activeSection === "hebergements" ? (
            <Card className="border-border/50 shadow-lg overflow-hidden xl:col-span-2">
              <CardHeader className="bg-gradient-to-r from-muted/20 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <BedDouble className="size-5 text-primary" />
                      Hébergements
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {isLoading
                        ? "Chargement..."
                        : `${totalHebergementsSelectionnes} hébergement(s) actif(s) pour ${displayText(data?.nomDestination, "cette destination")}`}
                    </CardDescription>
                  </div>
                  {totalHebergementsSelectionnes > 0 && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-sm font-medium">
                      {totalHebergementsSelectionnes}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="size-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Chargement des hébergements...</p>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[60vh] overflow-y-auto">
                    <div className="sticky top-0 bg-gradient-to-b from-background via-background to-transparent z-10">
                      <div className="hidden bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[1.9fr_1.2fr_1fr_0.9fr_1.4fr] md:gap-4 border-b border-border/30">
                        <span>Hébergement</span>
                        <span>Adresse</span>
                        <span>Type</span>
                        <span>Statut</span>
                        <span>Actions</span>
                      </div>
                    </div>

                    <div className="divide-y divide-border/30">
                      {(data?.hebergements ?? []).map((item) => renderListTableItem(item, "hebergement"))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            ) : null}

            {activeSection === "activites" ? (
            <Card className="border-border/50 shadow-lg overflow-hidden xl:col-span-2">
              <CardHeader className="bg-gradient-to-r from-muted/20 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Compass className="size-5 text-primary" />
                      Activités
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {isLoading
                        ? "Chargement..."
                        : `${totalActivitesSelectionnees} activité(s) active(s) pour ${displayText(data?.nomDestination, "cette destination")}`}
                    </CardDescription>
                  </div>
                  {totalActivitesSelectionnees > 0 && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-sm font-medium">
                      {totalActivitesSelectionnees}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="size-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Chargement des activités...</p>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[60vh] overflow-y-auto">
                    <div className="sticky top-0 bg-gradient-to-b from-background via-background to-transparent z-10">
                      <div className="hidden bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[1.9fr_1.2fr_1fr_0.9fr_1.4fr] md:gap-4 border-b border-border/30">
                        <span>Activité</span>
                        <span>Catégorie</span>
                        <span>Difficulté</span>
                        <span>Durée</span>
                        <span>Actions</span>
                      </div>
                    </div>
                    <div className="divide-y divide-border/30">
                      {(data?.activites ?? []).map((item) => renderListTableItem(item, "activite"))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            ) : null}

            {activeSection === "prestations" ? (
            <Card className="border-border/50 shadow-lg overflow-hidden xl:col-span-2">
              <CardHeader className="bg-gradient-to-r from-muted/20 to-transparent">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1.5">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Gift className="size-5 text-primary" />
                      Prestations
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {isLoading
                        ? "Chargement..."
                        : `${totalPrestationsSelectionnees} prestation(s) active(s) pour ${displayText(data?.nomDestination, "cette destination")}`}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-3">
                    {totalPrestationsSelectionnees > 0 && (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-sm font-medium">
                        {totalPrestationsSelectionnees}
                      </span>
                    )}
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreatePrestationDialogOpen(true)}
                      className="shadow-sm"
                    >
                      <Gift className="size-4 mr-2" />
                      Ajouter prestation
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="size-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Chargement des prestations...</p>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[60vh] overflow-y-auto">
                    <div className="sticky top-0 bg-gradient-to-b from-background via-background to-transparent z-10">
                      <div className="hidden bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[1.2fr_1.4fr_180px_220px_120px] md:gap-3 border-b border-border/30">
                        <span>Prestation</span>
                        <span>Description</span>
                        <span>Association</span>
                        <span>Choix</span>
                        <span>Statut</span>
                      </div>
                    </div>
                    <div className="divide-y divide-border/30">
                      {(data?.prestations ?? []).map(renderPrestationItem)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            ) : null}
          </div>
          )}
        </div>
      </main>

      <Dialog open={isCreatePrestationDialogOpen} onOpenChange={setIsCreatePrestationDialogOpen}>
        <DialogContent className="sm:max-w-lg shadow-xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Gift className="size-5 text-primary" />
              Ajouter prestation
            </DialogTitle>
            <DialogDescription className="text-sm">
              Ajoute une nouvelle prestation dans la liste globale par défaut. Elle sera ensuite disponible pour toutes les destinations.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePrestation} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="prestation-libelle" className="text-sm font-medium text-foreground">
                Libelle
              </label>
              <Input
                id="prestation-libelle"
                value={newPrestation.libelle}
                onChange={(event) =>
                  setNewPrestation((current) => ({ ...current, libelle: event.target.value }))
                }
                placeholder="Ex: Assurance voyage"
                className="shadow-sm"
                required
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="prestation-description" className="text-sm font-medium text-foreground">
                Description
              </label>
              <Input
                id="prestation-description"
                value={newPrestation.description}
                onChange={(event) =>
                  setNewPrestation((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Description courte de la prestation"
                className="shadow-sm"
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="prestation-ordre" className="text-sm font-medium text-foreground">
                Ordre d&apos;affichage
              </label>
              <Input
                id="prestation-ordre"
                type="number"
                value={newPrestation.ordreAffichage}
                onChange={(event) =>
                  setNewPrestation((current) => ({ ...current, ordreAffichage: event.target.value }))
                }
                placeholder="0"
                className="shadow-sm"
                min="0"
              />
            </div>

            <DialogFooter className="gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreatePrestationDialogOpen(false);
                  resetPrestationForm();
                }}
                disabled={isCreatingPrestation}
                className="shadow-sm"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isCreatingPrestation}
                className="shadow-sm"
              >
                {isCreatingPrestation ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Ajout...
                  </>
                ) : (
                  "Ajouter"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
