"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  LayoutGrid,
  List,
  Map,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Timer,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Activite } from "@/lib/type/activite";

const HebergementsOverviewMap = dynamic(
  () =>
    import("@/components/hebergements-overview-map").then(
      (mod) => mod.HebergementsOverviewMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[380px] items-center justify-center rounded-2xl border border-dashed border-border/50 bg-muted/20 text-sm text-muted-foreground">
        Chargement de la carte...
      </div>
    ),
  }
);

type AdminActivitesListeProps = {
  activites: Activite[];
  isLoading: boolean;
  isDeletingId: string | null;
  error: string;
  successMessage: string;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

type ViewMode = "cards" | "list" | "map";
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
const pageSizeOptions = [4, 8, 12] as const;

const viewModeButtonClass =
  "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 data-[state=on]:bg-gradient-to-r data-[state=on]:from-emerald-600 data-[state=on]:to-teal-600 data-[state=on]:text-white data-[state=on]:shadow-md data-[state=on]:shadow-emerald-500/20";
const greenOutlineButtonClass =
  "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800";
const greenPrimaryButtonClass =
  "border-transparent bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700";

function normalizeSearch(value: string | number | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

export function AdminActivitesListe({
  activites,
  isLoading,
  isDeletingId,
  error,
  successMessage,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
}: AdminActivitesListeProps) {
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [durationMinFilter, setDurationMinFilter] = useState("");
  const [durationMaxFilter, setDurationMaxFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(4);

  useEffect(() => {
    if (!successMessage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSuccessAlert(false);
      return;
    }

    setShowSuccessAlert(true);
    const timeout = window.setTimeout(() => {
      setShowSuccessAlert(false);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    if (!error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowErrorAlert(false);
      return;
    }

    setShowErrorAlert(true);
    const timeout = window.setTimeout(() => {
      setShowErrorAlert(false);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [error]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(activites.map((activite) => activite.nomCategorie).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [activites]);

  const difficulties = useMemo(() => {
    return Array.from(
      new Set(activites.map((activite) => activite.niveauxDeDifficulte).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [activites]);

  const filteredActivites = useMemo(() => {
    const normalizedSearch = normalizeSearch(searchTerm);
    const minDuration = durationMinFilter ? Number(durationMinFilter) : null;
    const maxDuration = durationMaxFilter ? Number(durationMaxFilter) : null;

    return activites.filter((activite) => {
      const searchable = [
        activite.nom,
        activite.slug,
        activite.description,
        activite.nomCategorie,
        activite.niveauxDeDifficulte,
        activite.dureeHeures,
        activite.participantMin,
        activite.participantsMax,
        activite.latitude,
        activite.longitude,
        activite.estActif ? "actif active visible" : "inactif inactive masque",
        ...(activite.equipementsFournis ?? []),
        ...(activite.tarifs ?? []).flatMap((tarif) => [
          tarif.nomCategorieClient,
          tarif.devise,
          tarif.prixParPersonne,
          tarif.prixParHeur,
          tarif.estActif ? "tarif actif" : "tarif inactif",
        ]),
      ]
        .map(normalizeSearch)
        .join(" ");

      if (normalizedSearch && !searchable.includes(normalizedSearch)) return false;
      if (categoryFilter !== "ALL" && activite.nomCategorie !== categoryFilter) return false;
      if (difficultyFilter !== "ALL" && activite.niveauxDeDifficulte !== difficultyFilter) return false;
      if (statusFilter === "ACTIVE" && !activite.estActif) return false;
      if (statusFilter === "INACTIVE" && activite.estActif) return false;
      if (minDuration !== null && !Number.isNaN(minDuration) && Number(activite.dureeHeures || 0) < minDuration) return false;
      if (maxDuration !== null && !Number.isNaN(maxDuration) && Number(activite.dureeHeures || 0) > maxDuration) return false;
      return true;
    });
  }, [
    activites,
    categoryFilter,
    difficultyFilter,
    durationMaxFilter,
    durationMinFilter,
    searchTerm,
    statusFilter,
  ]);

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("ALL");
    setStatusFilter("ALL");
    setDifficultyFilter("ALL");
    setDurationMinFilter("");
    setDurationMaxFilter("");
    setCurrentPage(1);
  };

  const totalPages = Math.max(Math.ceil(filteredActivites.length / pageSize), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginationStart = filteredActivites.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const paginationEnd = Math.min(safeCurrentPage * pageSize, filteredActivites.length);
  const paginatedActivites = filteredActivites.slice(paginationStart - 1, paginationEnd);
  const visiblePages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
    const start = Math.min(Math.max(safeCurrentPage - 2, 1), Math.max(totalPages - 4, 1));
    return start + index;
  });

  const renderActiviteCard = (activite: Activite) => (
    <div
      key={activite.id}
      className="overflow-hidden rounded-2xl border border-border/50 bg-card/50 shadow-sm"
    >
      <div className="relative">
        {activite.imagePrincipale ? (
          <img
            src={activite.imagePrincipale}
            alt={activite.nom}
            className="aspect-[16/9] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[16/9] w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">
            Aucune image
          </div>
        )}
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm ${
            activite.estActif
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-700"
          }`}
        >
          {activite.estActif ? "Actif" : "Inactif"}
        </span>
      </div>

      <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{activite.nom}</h3>
          <p className="text-sm text-muted-foreground">
            {activite.nomCategorie || "Categorie non renseignee"}
          </p>
        </div>
      </div>

      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
        {activite.description || "Aucune description"}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-muted px-2.5 py-1">{activite.slug}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
          <Timer className="size-3.5" />
          {activite.dureeHeures} h
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
          <Users className="size-3.5" />
          {activite.participantMin} - {activite.participantsMax}
        </span>
      </div>

      {activite.equipementsFournis.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {activite.equipementsFournis.map((equipement) => (
            <span
              key={`${activite.id}-${equipement}`}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700"
            >
              {equipement}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" asChild className={greenPrimaryButtonClass}>
          <Link href={`/admin/activites/${activite.id}`}>Voir details</Link>
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(activite.id)} className={greenOutlineButtonClass}>
          <Pencil className="size-4" />
          Modifier
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(activite.id)}
          disabled={isDeletingId === activite.id}
        >
          <Trash2 className="size-4" />
          {isDeletingId === activite.id ? "Suppression..." : "Supprimer"}
        </Button>
      </div>
      </div>
    </div>
  );

  const renderActiviteListItem = (activite: Activite) => (
    <div
      key={activite.id}
      className="flex items-center justify-between border-b border-border/50 p-4 last:border-0 hover:bg-muted/20"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <h3 className="truncate font-semibold">{activite.nom}</h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              activite.estActif
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {activite.estActif ? "Actif" : "Inactif"}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span>{activite.nomCategorie || "Categorie non renseignee"}</span>
          <span className="flex items-center gap-1">
            <Timer className="size-3.5" />
            {activite.dureeHeures} h
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {activite.participantMin} - {activite.participantsMax}
          </span>
          <span className="max-w-[200px] truncate">{activite.slug}</span>
        </div>
        {activite.equipementsFournis.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {activite.equipementsFournis.slice(0, 3).map((equipement) => (
              <span
                key={`${activite.id}-${equipement}`}
                className="rounded-full bg-muted px-2 py-0.5 text-xs"
              >
                {equipement}
              </span>
            ))}
            {activite.equipementsFournis.length > 3 ? (
              <span className="text-xs text-muted-foreground">
                +{activite.equipementsFournis.length - 3}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="ml-4 flex shrink-0 gap-2">
        <Button size="sm" asChild className={greenPrimaryButtonClass}>
          <Link href={`/admin/activites/${activite.id}`}>Voir details</Link>
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(activite.id)} className={greenOutlineButtonClass}>
          <Pencil className="size-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(activite.id)}
          disabled={isDeletingId === activite.id}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );

  function renderContent() {
    if (isLoading) {
      return <p className="text-sm text-muted-foreground">Chargement...</p>;
    }

    if (activites.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          Aucune activite disponible.
        </p>
      );
    }

    if (filteredActivites.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          Aucune activite ne correspond aux criteres de recherche.
        </p>
      );
    }

    if (viewMode === "cards") {
      return <div className="grid gap-4 md:grid-cols-2">{paginatedActivites.map(renderActiviteCard)}</div>;
    }

    if (viewMode === "list") {
      return <div className="divide-y divide-border/50">{paginatedActivites.map(renderActiviteListItem)}</div>;
    }

    return (
      <HebergementsOverviewMap
        items={paginatedActivites}
        getDetailHref={(item) => `/admin/activites/${item.id}`}
      />
    );
  }

  function getCardDescription() {
    if (viewMode === "cards") {
      return `${filteredActivites.length} activite(s) sur ${activites.length} en mode cartes`;
    }

    if (viewMode === "list") {
      return `${filteredActivites.length} activite(s) sur ${activites.length} en mode liste`;
    }

    return `Visualisation de ${paginatedActivites.length} activite(s) sur ${filteredActivites.length} resultat(s) sur la carte`;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Activites
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowFilters((current) => !current)}
            className={greenOutlineButtonClass}
            title="Recherche multi-critere"
          >
            <SlidersHorizontal className="size-4" />
            <span className="sr-only">Afficher la recherche multi-critere</span>
          </Button>

          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (!value) return;
              setViewMode(value as ViewMode);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-emerald-200 bg-emerald-50/60"
          >
            <ToggleGroupItem value="cards" aria-label="Vue en cartes" className={viewModeButtonClass}>
              <LayoutGrid className="size-4" />
              <span className="sr-only md:not-sr-only md:ml-2">Mosaiques</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Vue en liste" className={viewModeButtonClass}>
              <List className="size-4" />
              <span className="sr-only md:not-sr-only md:ml-2">Liste</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="map" aria-label="Vue carte" className={viewModeButtonClass}>
              <Map className="size-4" />
              <span className="sr-only md:not-sr-only md:ml-2">Carte</span>
            </ToggleGroupItem>
          </ToggleGroup>

          <Button variant="outline" onClick={onRefresh} disabled={isLoading} className={greenOutlineButtonClass}>
            <RefreshCcw className="size-4" />
            Actualiser
          </Button>
          <Button onClick={onCreate} className={greenPrimaryButtonClass}>
            <Plus className="size-4" />
            Creer
          </Button>
        </div>
      </div>

      {error && showErrorAlert ? (
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
      ) : null}

      {successMessage && showSuccessAlert ? (
        <Alert
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
      ) : null}

      {showFilters ? (
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Recherche multi-critere</CardTitle>
                <CardDescription>
                  Nom, categorie, statut, difficulte, duree, equipements ou tarifs.
                </CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={resetFilters} className={greenOutlineButtonClass}>
                Reinitialiser
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Nom, categorie, equipement, tarif, devise..."
                className="h-11 pl-9"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_0.7fr_0.7fr]">
              <select
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-emerald-500"
              >
                <option value="ALL">Toutes les categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter);
                  setCurrentPage(1);
                }}
                className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-emerald-500"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIVE">Actif</option>
                <option value="INACTIVE">Inactif</option>
              </select>

              <select
                value={difficultyFilter}
                onChange={(event) => {
                  setDifficultyFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-emerald-500"
              >
                <option value="ALL">Toutes les difficultes</option>
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>

              <Input
                type="number"
                min={0}
                value={durationMinFilter}
                onChange={(event) => {
                  setDurationMinFilter(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Duree min"
                className="h-11"
              />

              <Input
                type="number"
                min={0}
                value={durationMaxFilter}
                onChange={(event) => {
                  setDurationMaxFilter(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Duree max"
                className="h-11"
              />
            </div>

            <p className="text-sm text-muted-foreground">
              {filteredActivites.length} resultat(s) sur {activites.length} activite(s).
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>
            {viewMode === "cards" ? "Vue en cartes" : null}
            {viewMode === "list" ? "Vue en liste" : null}
            {viewMode === "map" ? "Vue carte" : null}
          </CardTitle>
          <CardDescription>{getCardDescription()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderContent()}

          {filteredActivites.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Afficher</span>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value) as (typeof pageSizeOptions)[number]);
                    setCurrentPage(1);
                  }}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none transition focus:border-emerald-500"
                >
                  {pageSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span>par page</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                >
                  {"<"}
                </Button>
                {visiblePages.map((page) => (
                  <Button
                    key={page}
                    type="button"
                    variant={page === safeCurrentPage ? "default" : "outline"}
                    size="icon"
                    className={`h-9 w-9 ${
                      page === safeCurrentPage
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : ""
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                >
                  {">"}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground sm:text-right">
                {paginationStart} - {paginationEnd} sur {filteredActivites.length}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
