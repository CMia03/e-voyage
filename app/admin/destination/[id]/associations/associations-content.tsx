"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BedDouble, CheckCircle2, Compass, Gift, Loader2, MapPin, Map as MapIcon, Tag, X } from "lucide-react";

import { AdminFooter } from "@/app/admin/components/footer";
import { AdminHeader } from "@/app/admin/components/header";
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
};

type ViewMode = "list" | "map";
type MapCategoryFilter = "all" | "hebergement" | "activite";

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

export function AdminDestinationAssociationsContent({ destinationId }: Props) {
  const router = useRouter();
  const hebergementsRef = useRef<HTMLDivElement | null>(null);
  const activitesRef = useRef<HTMLDivElement | null>(null);
  const prestationsRef = useRef<HTMLDivElement | null>(null);

  const [accessToken, setAccessToken] = useState("");
  const [role, setRole] = useState("");
  const [data, setData] = useState<DestinationAssociations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
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

  function scrollToSection(section: "hebergements" | "activites" | "prestations") {
    const target =
      section === "hebergements"
        ? hebergementsRef.current
        : section === "activites"
          ? activitesRef.current
          : prestationsRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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
        setSuccessMessage("Hebergement associe a la destination avec succes.");
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
        setSuccessMessage("Hebergement retire de la destination avec succes.");
      }
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, "Impossible de mettre a jour l'hebergement"));
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
        setSuccessMessage("Activite associee a la destination avec succes.");
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
        setSuccessMessage("Activite retiree de la destination avec succes.");
      }
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, "Impossible de mettre a jour l'activite"));
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
        setSuccessMessage("Prestation ajoutee a la destination avec succes.");
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
        setSuccessMessage("Prestation retiree de la destination avec succes.");
      }
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, "Impossible de mettre a jour la prestation"));
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
      setSuccessMessage("Statut de la prestation mis a jour avec succes.");
    } catch (updateError) {
      setError(getErrorMessage(updateError, "Impossible de mettre a jour le statut de la prestation"));
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
      setSuccessMessage("Nouvelle prestation ajoutee avec succes.");
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

    const timeout = window.setTimeout(() => setSuccessMessage(""), 3500);
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
          setViewMode("map");
        }}
      >
        <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted/20">
          {item.image ? (
            <img src={item.image} alt={item.nom} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              Aucune image
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold">{item.nom}</h3>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                  <MapPin className="size-3.5" />
                  {item.place || "Place non renseignee"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                  <Tag className="size-3.5" />
                  {item.region || "Region non renseignee"}
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
                  aria-label={`Associer ${item.nom}`}
                />
                <span className="text-sm font-medium">
                  {item.estSelectionne ? "Actif pour la destination" : "Non associe"}
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
        className={`grid gap-4 px-4 py-4 transition-colors md:grid-cols-[1.9fr_1.2fr_1fr_0.9fr_1.4fr] ${
          focusedItemId === item.id ? "bg-primary/5" : "bg-card/50 hover:bg-muted/20"
        }`}
        onClick={() => {
          setFocusedItemId(item.id);
          setViewMode("map");
        }}
      >
        <div className="flex min-w-0 flex-col items-start gap-2">
          <div className="h-12 w-14 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted/20">
            {item.image ? (
              <img src={item.image} alt={item.nom} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-1 text-center text-[9px] leading-tight text-muted-foreground">
                Aucune image
              </div>
            )}
          </div>
          <div className="min-w-0 max-w-full">
            <p className="truncate text-base font-medium text-foreground">{item.nom}</p>
          </div>
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <span className="truncate">{item.place || "Place non renseignee"}</span>
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <span className="truncate">{item.region || "Region non renseignee"}</span>
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <span className="truncate">
            {item.meta || (type === "hebergement" ? "Non classe" : "Duree non renseignee")}
          </span>
        </div>

        <div className="flex items-center justify-start gap-3">
          {pending ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
          <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>

            <Checkbox
              checked={item.estSelectionne}
              disabled={pending}
              onCheckedChange={(checked) =>
                type === "hebergement"
                  ? void handleToggleHebergement(item, checked === true)
                  : void handleToggleActivite(item, checked === true)
              }
              aria-label={`Associer ${item.nom}`}
            />

            <span className="whitespace-nowrap text-sm font-medium">
              {item.estSelectionne ? "Actif pour la destination" : "Non associe"}
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
        className="grid gap-3 px-4 py-4 md:grid-cols-[1.2fr_1.4fr_180px_220px_120px]"
      >
        <div className="min-w-0">
          <p className="font-medium text-foreground">{item.libelle}</p>
        </div>

        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {item.description || "Aucune description"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pending ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={item.estSelectionne}
              disabled={pending}
              onCheckedChange={(checked) => void handleTogglePrestation(item, checked === true)}
              aria-label={`Associer ${item.libelle}`}
            />
            <span className="text-sm font-medium">
              {item.estSelectionne ? "Associee à cette destination" : "Non associee à cette destination"}
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
            <SelectTrigger className="w-full">
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
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${
              item.statut === "EN_SUS"
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
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
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background text-foreground">
      <AdminHeader />
      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/destination/${destinationId}`}>Retour au detail de la destination</Link>
              </Button>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  Hebergements et activites
                </h1>
                <p className="text-sm text-muted-foreground">
                  Selectionnez ce que les voyageurs pourront faire et ou ils pourront se loger pour cette destination.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => scrollToSection("hebergements")}>
                <BedDouble className="size-4" />
                Ajouter hebergement
              </Button>
              <Button type="button" variant="outline" onClick={() => scrollToSection("activites")}>
                <Compass className="size-4" />
                Ajouter Activiter
              </Button>
              <Button type="button" variant="outline" onClick={() => scrollToSection("prestations")}>
                <Gift className="size-4" />
                Prestation
              </Button>
              <Button
                type="button"
                variant={viewMode === "map" ? "default" : "outline"}
                onClick={() => setViewMode((current) => (current === "map" ? "list" : "map"))}
              >
                <MapIcon className="size-4" />
                {viewMode === "map" ? "Vue liste" : "Vue sur cart"}
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

          {viewMode === "map" ? (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1.5">
                  <CardTitle>Vue sur cart</CardTitle>
                  <CardDescription>
                    Visualisez les hebergements et activites sur la carte, puis activez-les directement depuis le popup ou la liste.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={mapCategoryFilter === "all" ? "default" : "outline"}
                    onClick={() => setMapCategoryFilter("all")}
                  >
                    Tous
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={mapCategoryFilter === "hebergement" ? "default" : "outline"}
                    onClick={() => setMapCategoryFilter("hebergement")}
                  >
                    Hebergements
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={mapCategoryFilter === "activite" ? "default" : "outline"}
                    onClick={() => setMapCategoryFilter("activite")}
                  >
                    Activites
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
                  <DestinationAssociationsMap
                    items={filteredMapItems}
                    pendingKey={pendingKey}
                    focusedItemId={focusedItemId}
                    onToggle={(item, checked) => void handleToggleFromMap(item, checked)}
                    onFocusChange={(item) => setFocusedItemId(item.id)}
                  />

                  <div className="space-y-6">
                    {mapCategoryFilter !== "activite" ? (
                      <div className="rounded-2xl border border-border/50 bg-card/50 p-4">
                        <p className="text-sm font-semibold">Hebergements</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {totalHebergementsSelectionnes} selectionne(s)
                        </p>
                        <div className="mt-4 max-h-[220px] space-y-3 overflow-y-auto pr-2">
                          {(data?.hebergements ?? []).map((item) => renderItem(item, "hebergement"))}
                        </div>
                      </div>
                    ) : null}

                    {mapCategoryFilter !== "hebergement" ? (
                      <div className="rounded-2xl border border-border/50 bg-card/50 p-4">
                        <p className="text-sm font-semibold">Activites</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {totalActivitesSelectionnees} selectionne(s)
                        </p>
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
            <Card ref={hebergementsRef} className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Hebergements</CardTitle>
                <CardDescription>
                  {isLoading
                    ? "Chargement..."
                    : `${totalHebergementsSelectionnes} hebergement(s) actif(s) pour ${data?.nomDestination ?? "cette destination"}`}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-border/50">

                    <div className="hidden bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[1.9fr_1.2fr_1fr_0.9fr_1.4fr] md:gap-4">
                      <span>Hebergement</span>
                      <span>Adresse</span>
                      <span>Type</span>
                      {/* <span>Etoiles</span> */}
                      <span>Statut</span>
                    </div>

                    <div className="divide-y divide-border/40">
                      {(data?.hebergements ?? []).map((item) => renderListTableItem(item, "hebergement"))}
                    </div>

                  </div>
                )}
              </CardContent>


            </Card>

            <Card ref={activitesRef} className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Activites</CardTitle>
                <CardDescription>
                  {isLoading
                    ? "Chargement..."
                    : `${totalActivitesSelectionnees} activite(s) active(s) pour ${data?.nomDestination ?? "cette destination"}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-border/50">
                    <div className="hidden bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[1.9fr_1.2fr_1fr_0.9fr_1.4fr] md:gap-4">
                      <span>Activite</span>
                      <span>Categorie</span>
                      <span>Difficulte</span>
                      <span>Duree</span>
                      <span>Statut</span>
                    </div>
                    <div className="divide-y divide-border/40">
                      {(data?.activites ?? []).map((item) => renderListTableItem(item, "activite"))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card ref={prestationsRef} className="border-border/50 shadow-sm xl:col-span-2">
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1.5">
                  <CardTitle>Prestations</CardTitle>
                  <CardDescription>
                    {isLoading
                      ? "Chargement..."
                      : `${totalPrestationsSelectionnees} prestation(s) active(s) pour ${data?.nomDestination ?? "cette destination"}`}
                  </CardDescription>
                </div>

                <Button type="button" variant="outline" onClick={() => setIsCreatePrestationDialogOpen(true)}>
                  <Gift className="size-4" />
                  Ajouter prestation
                </Button>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-border/50">
                    <div className="hidden bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[1.2fr_1.4fr_180px_220px_120px] md:gap-3">
                      <span>Prestation</span>
                      <span>Description</span>
                      <span>Association</span>
                      <span>Choix</span>
                      <span>Statut</span>
                    </div>
                    <div className="divide-y divide-border/50">
                      {(data?.prestations ?? []).map(renderPrestationItem)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          )}
        </div>
      </main>

      <Dialog open={isCreatePrestationDialogOpen} onOpenChange={setIsCreatePrestationDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter prestation</DialogTitle>
            <DialogDescription>
              Ajoute une nouvelle prestation dans la liste globale par defaut. Elle sera ensuite disponible pour toutes les destinations.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePrestation} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="prestation-libelle" className="text-sm font-medium">
                Libelle
              </label>
              <Input
                id="prestation-libelle"
                value={newPrestation.libelle}
                onChange={(event) =>
                  setNewPrestation((current) => ({ ...current, libelle: event.target.value }))
                }
                placeholder="Ex: Assurance voyage"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="prestation-description" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="prestation-description"
                value={newPrestation.description}
                onChange={(event) =>
                  setNewPrestation((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Description courte de la prestation"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="prestation-ordre" className="text-sm font-medium">
                Ordre d'affichage
              </label>
              <Input
                id="prestation-ordre"
                type="number"
                value={newPrestation.ordreAffichage}
                onChange={(event) =>
                  setNewPrestation((current) => ({ ...current, ordreAffichage: event.target.value }))
                }
                placeholder="0"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreatePrestationDialogOpen(false);
                  resetPrestationForm();
                }}
                disabled={isCreatingPrestation}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isCreatingPrestation}>
                {isCreatingPrestation ? "Ajout..." : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AdminFooter />
    </div>
  );
}
