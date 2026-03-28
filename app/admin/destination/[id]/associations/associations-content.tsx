"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BedDouble, CheckCircle2, Compass, Loader2, MapPin, Map as MapIcon, Tag, X } from "lucide-react";

import { AdminFooter } from "@/app/admin/components/footer";
import { AdminHeader } from "@/app/admin/components/header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { getErrorMessage } from "@/lib/api/client";
import {
  getDestinationAssociations,
  linkDestinationActivite,
  linkDestinationHebergement,
  unlinkDestinationActivite,
  unlinkDestinationHebergement,
} from "@/lib/api/destinations";
import { loadAuth } from "@/lib/auth";
import type { DestinationAssociationItem, DestinationAssociations } from "@/lib/type/destination";

type Props = {
  destinationId: string;
};

type ViewMode = "list" | "map";

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

  const [accessToken, setAccessToken] = useState("");
  const [role, setRole] = useState("");
  const [data, setData] = useState<DestinationAssociations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);

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

  const totalHebergementsSelectionnes = useMemo(
    () => data?.hebergements.filter((item) => item.estSelectionne).length ?? 0,
    [data]
  );

  const totalActivitesSelectionnees = useMemo(
    () => data?.activites.filter((item) => item.estSelectionne).length ?? 0,
    [data]
  );

  const mapItems = useMemo(
    () => [
      ...(data?.hebergements ?? []).map((item) => ({ ...item, type: "hebergement" as const })),
      ...(data?.activites ?? []).map((item) => ({ ...item, type: "activite" as const })),
    ],
    [data]
  );

  function scrollToSection(section: "hebergements" | "activites") {
    const target = section === "hebergements" ? hebergementsRef.current : activitesRef.current;
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
              <CardHeader>
                <CardTitle>Vue sur cart</CardTitle>
                <CardDescription>
                  Visualisez les hebergements et activites sur la carte, puis activez-les directement depuis le popup ou la liste.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
                  <DestinationAssociationsMap
                    items={mapItems}
                    pendingKey={pendingKey}
                    focusedItemId={focusedItemId}
                    onToggle={(item, checked) => void handleToggleFromMap(item, checked)}
                    onFocusChange={(item) => setFocusedItemId(item.id)}
                  />

                  <div className="space-y-6">
                    <div className="rounded-2xl border border-border/50 bg-card/50 p-4">
                      <p className="text-sm font-semibold">Hebergements</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {totalHebergementsSelectionnes} selectionne(s)
                      </p>
                      <div className="mt-4 max-h-[220px] space-y-3 overflow-y-auto pr-2">
                        {(data?.hebergements ?? []).map((item) => renderItem(item, "hebergement"))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/50 bg-card/50 p-4">
                      <p className="text-sm font-semibold">Activites</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {totalActivitesSelectionnees} selectionne(s)
                      </p>
                      <div className="mt-4 max-h-[220px] space-y-3 overflow-y-auto pr-2">
                        {(data?.activites ?? []).map((item) => renderItem(item, "activite"))}
                      </div>
                    </div>
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
                  <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
                    {(data?.hebergements ?? []).map((item) => renderItem(item, "hebergement"))}
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
                  <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
                    {(data?.activites ?? []).map((item) => renderItem(item, "activite"))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          )}
        </div>
      </main>
      <AdminFooter />
    </div>
  );
}
