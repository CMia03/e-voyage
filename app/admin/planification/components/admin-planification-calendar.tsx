"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer, SlotInfo, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale/fr";
import "react-big-calendar/lib/css/react-big-calendar.css";

import {
  createPlanificationVoyage,
  deletePlanificationVoyage,
  listAdminDestinations,
  listPlanificationsByDestination,
  updatePlanificationVoyage,
} from "@/lib/api/destinations";
import { getErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarDays, Edit3, ExternalLink, List, RotateCcw, Search, Trash2 } from "lucide-react";
import type { PlanificationVoyage, SavePlanificationVoyagePayload } from "@/lib/type/destination";

const locales = {
  fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: PlanificationVoyage;
};

type DisplayMode = "calendar" | "list";

type VisibilityFilter = "all" | "visible" | "hidden";

type PlanificationFormState = {
  nomPlanification: string;
  idDestination: string;
  budgetTotal: string;
  deviseBudget: string;
  depart: string;
  arriver: string;
  dateHeureDebut: string;
  dateHeureFin: string;
  estVisibleClient: boolean;
};

const initialFormState: PlanificationFormState = {
  nomPlanification: "",
  idDestination: "",
  budgetTotal: "",
  deviseBudget: "MGA",
  depart: "",
  arriver: "",
  dateHeureDebut: "",
  dateHeureFin: "",
  estVisibleClient: false,
};

function toDate(value?: string | null) {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value: string) {
  if (!value) {
    return undefined;
  }

  return new Date(value).toISOString();
}

function formatPlanificationDate(value?: string | null) {
  if (!value) {
    return "Non defini";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Non defini";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatBudget(amount?: number | null, devise = "MGA") {
  if (amount === null || amount === undefined) {
    return "-";
  }

  return `${Math.round(amount).toLocaleString("fr-FR")} ${devise || "MGA"}`;
}

function normalizeSearchValue(value?: string | number | null) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Generate consistent colors based on destination ID
function getDestinationColor(destinationId: string): string {
  const colors = [
    "#0f766e", // teal
    "#dc2626", // red
    "#7c3aed", // violet
    "#ea580c", // orange
    "#059669", // emerald
    "#2563eb", // blue
    "#c2410c", // amber
    "#7c2d12", // brown
    "#be185d", // pink
    "#0d9488", // cyan
  ];
  
  let hash = 0;
  for (let i = 0; i < destinationId.length; i++) {
    hash = destinationId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

function buildFormState(planification?: PlanificationVoyage | null): PlanificationFormState {
  if (!planification) {
    return initialFormState;
  }

  return {
    nomPlanification: planification.nomPlanification ?? "",
    idDestination: planification.idDestination ?? "",
    budgetTotal:
      planification.budgetTotal === null || planification.budgetTotal === undefined
        ? ""
        : String(planification.budgetTotal),
    deviseBudget: planification.deviseBudget ?? "MGA",
    depart: planification.depart ?? "",
    arriver: planification.arriver ?? "",
    dateHeureDebut: toDateTimeLocalValue(planification.dateHeureDebut),
    dateHeureFin: toDateTimeLocalValue(planification.dateHeureFin),
    estVisibleClient: planification.estVisibleClient ?? false,
  };
}

export function AdminPlanificationCalendar({ accessToken }: { accessToken?: string }) {
  const router = useRouter();
  const [displayMode, setDisplayMode] = useState<DisplayMode>("calendar");
  const [calendarView, setCalendarView] = useState<View>(Views.MONTH);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [destinations, setDestinations] = useState<Array<{ id: string; nom: string }>>([]);
  const [planifications, setPlanifications] = useState<PlanificationVoyage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlanification, setSelectedPlanification] = useState<PlanificationVoyage | null>(null);
  const [form, setForm] = useState<PlanificationFormState>(initialFormState);
  const [selectedDestinationFilter, setSelectedDestinationFilter] = useState<string>("all");
  const [listSearch, setListSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [budgetMinFilter, setBudgetMinFilter] = useState("");
  const [budgetMaxFilter, setBudgetMaxFilter] = useState("");

  const loadCalendarData = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const destinationResponse = await listAdminDestinations(accessToken);
      const destinationItems =
        destinationResponse.data?.map((destination) => ({
          id: destination.id,
          nom: destination.nom,
        })) ?? [];

      setDestinations(destinationItems);

      const responses = await Promise.all(
        destinationItems.map((destination) =>
          listPlanificationsByDestination(destination.id, accessToken)
        )
      );

      const merged = responses.flatMap((response) => response.data ?? []);
      setPlanifications(merged);
    } catch (err) {
      setError(
        getErrorMessage(err, "Impossible de charger le calendrier des planifications.")
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadCalendarData();
  }, [loadCalendarData]);

  const filteredPlanifications = useMemo(
    () =>
      selectedDestinationFilter === "all"
        ? planifications
        : planifications.filter((planification) => planification.idDestination === selectedDestinationFilter),
    [planifications, selectedDestinationFilter]
  );

  const events = useMemo<CalendarEvent[]>(
    () =>
      filteredPlanifications.map((planification) => ({
        id: planification.id,
        title: `${planification.nomPlanification} - ${planification.nomDestination}`,
        start: toDate(planification.dateHeureDebut),
        end: toDate(planification.dateHeureFin ?? planification.dateHeureDebut),
        resource: planification,
      })),
    [filteredPlanifications]
  );

  const listPlanifications = useMemo(() => {
    const query = normalizeSearchValue(listSearch);
    const minBudget = budgetMinFilter ? Number(budgetMinFilter) : null;
    const maxBudget = budgetMaxFilter ? Number(budgetMaxFilter) : null;
    const startBoundary = dateFromFilter ? new Date(`${dateFromFilter}T00:00:00`) : null;
    const endBoundary = dateToFilter ? new Date(`${dateToFilter}T23:59:59`) : null;

    return filteredPlanifications.filter((planification) => {
      if (query) {
        const searchable = normalizeSearchValue([
          planification.nomPlanification,
          planification.nomDestination,
          planification.depart,
          planification.arriver,
          planification.deviseBudget,
          planification.budgetTotal,
        ].join(" "));

        if (!searchable.includes(query)) {
          return false;
        }
      }

      if (visibilityFilter === "visible" && !planification.estVisibleClient) {
        return false;
      }

      if (visibilityFilter === "hidden" && planification.estVisibleClient) {
        return false;
      }

      const startDate = planification.dateHeureDebut ? new Date(planification.dateHeureDebut) : null;
      const endDate = planification.dateHeureFin ? new Date(planification.dateHeureFin) : startDate;

      if (startBoundary && endDate && endDate < startBoundary) {
        return false;
      }

      if (endBoundary && startDate && startDate > endBoundary) {
        return false;
      }

      const budget = planification.budgetTotal;
      if (minBudget !== null && (budget === null || budget === undefined || budget < minBudget)) {
        return false;
      }

      if (maxBudget !== null && (budget === null || budget === undefined || budget > maxBudget)) {
        return false;
      }

      return true;
    });
  }, [
    budgetMaxFilter,
    budgetMinFilter,
    dateFromFilter,
    dateToFilter,
    filteredPlanifications,
    listSearch,
    visibilityFilter,
  ]);

  const hasListFilters =
    listSearch.trim() ||
    visibilityFilter !== "all" ||
    dateFromFilter ||
    dateToFilter ||
    budgetMinFilter ||
    budgetMaxFilter;

  const resetListFilters = () => {
    setListSearch("");
    setVisibilityFilter("all");
    setDateFromFilter("");
    setDateToFilter("");
    setBudgetMinFilter("");
    setBudgetMaxFilter("");
  };

  const openCreateModal = (slot?: SlotInfo) => {
    setSelectedPlanification(null);
    setError(null);
    setForm({
      ...initialFormState,
      dateHeureDebut: slot?.start ? toDateTimeLocalValue(slot.start.toISOString()) : "",
      dateHeureFin: slot?.end ? toDateTimeLocalValue(slot.end.toISOString()) : "",
    });
    setShowModal(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setSelectedPlanification(event.resource);
    setError(null);
    setForm(buildFormState(event.resource));
    setShowModal(true);
  };

  const openEditPlanification = (planification: PlanificationVoyage) => {
    setSelectedPlanification(planification);
    setError(null);
    setForm(buildFormState(planification));
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedPlanification(null);
    setForm(initialFormState);
    setShowModal(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!accessToken) {
      setError("Session introuvable.");
      return;
    }

    if (!form.nomPlanification || !form.idDestination || !form.depart || !form.arriver) {
      setError("Le nom, la destination, le départ et l'arrivée sont obligatoires.");
      return;
    }

    if (!form.dateHeureDebut || !form.dateHeureFin) {
      setError("La date de début et la date de fin sont obligatoires.");
      return;
    }

    const payload: SavePlanificationVoyagePayload = {
      nomPlanification: form.nomPlanification,
      idDestination: form.idDestination,
      budgetTotal: form.budgetTotal ? Number(form.budgetTotal) : null,
      deviseBudget: form.deviseBudget || "MGA",
      depart: form.depart,
      arriver: form.arriver,
      dateHeureDebut: fromDateTimeLocalValue(form.dateHeureDebut),
      dateHeureFin: fromDateTimeLocalValue(form.dateHeureFin),
      estVisibleClient: form.estVisibleClient,
    };

    setSaving(true);
    setError(null);

    try {
      if (selectedPlanification) {
        await updatePlanificationVoyage(selectedPlanification.id, payload, accessToken);
      } else {
        await createPlanificationVoyage(payload, accessToken);
      }

      await loadCalendarData();
      closeModal();
    } catch (err) {
      setError(getErrorMessage(err, "Impossible d'enregistrer la planification."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!accessToken || !selectedPlanification) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await deletePlanificationVoyage(selectedPlanification.id, accessToken);
      await loadCalendarData();
      closeModal();
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de supprimer la planification."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlanification = async (planification: PlanificationVoyage) => {
    if (!accessToken) {
      setError("Session introuvable.");
      return;
    }

    const confirmed = window.confirm(`Supprimer la planification "${planification.nomPlanification}" ?`);
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await deletePlanificationVoyage(planification.id, accessToken);
      await loadCalendarData();
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de supprimer la planification."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Planification
          </h1>
          <p className="text-sm text-muted-foreground">
            Toutes les planifications sont disponibles en calendrier ou en liste, avec creation,
            modification et suppression directement depuis cette vue.
          </p>
        </div>

        <Button onClick={() => openCreateModal()}>
          Ajouter une planification
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>
                {displayMode === "calendar" ? "Calendrier des planifications" : "Liste des planifications"}
              </CardTitle>
              <CardDescription>
                {displayMode === "calendar"
                  ? "Cliquez sur une plage horaire pour creer une planification, ou sur un element existant pour le modifier."
                  : "Consultez, modifiez ou supprimez les planifications dans un tableau clair."}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Label htmlFor="destination-filter" className="text-sm text-muted-foreground">
                  Filtrer par destination
                </Label>
                <Select
                  value={selectedDestinationFilter}
                  onValueChange={setSelectedDestinationFilter}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Toutes les destinations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les destinations</SelectItem>
                    {destinations.map((destination) => (
                      <SelectItem key={destination.id} value={destination.id}>
                        {destination.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="inline-flex rounded-md border border-border bg-muted/40 p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={displayMode === "calendar" ? "default" : "ghost"}
                  onClick={() => setDisplayMode("calendar")}
                  className="h-9 gap-2"
                >
                  <CalendarDays className="h-4 w-4" />
                  Calendrier
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={displayMode === "list" ? "default" : "ghost"}
                  onClick={() => setDisplayMode("list")}
                  className="h-9 gap-2"
                >
                  <List className="h-4 w-4" />
                  Liste
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex h-[600px] items-center justify-center text-sm text-muted-foreground">
              Chargement des planifications...
            </div>
          ) : displayMode === "calendar" ? (
            <div className="h-[600px]">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={calendarView}
                onView={(nextView) => setCalendarView(nextView)}
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                date={calendarDate}
                onNavigate={(nextDate) => setCalendarDate(nextDate)}
                onSelectSlot={openCreateModal}
                onSelectEvent={(event) => openEditModal(event as CalendarEvent)}
                selectable
                style={{ height: "100%" }}
                culture="fr"
                messages={{
                  next: "Suivant",
                  previous: "Precedent",
                  today: "Aujourd'hui",
                  month: "Mois",
                  week: "Semaine",
                  day: "Jour",
                  agenda: "Agenda",
                  date: "Date",
                  time: "Heure",
                  event: "Planification",
                  noEventsInRange: "Aucune planification sur cette periode.",
                }}
                eventPropGetter={(event) => ({
                  style: {
                    backgroundColor: getDestinationColor(event.resource.idDestination),
                    borderRadius: "6px",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    paddingInline: "4px",
                  },
                })}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="space-y-4">
                  <div className="grid gap-3 lg:grid-cols-[minmax(320px,1fr)_auto] lg:items-end">
                    <div className="space-y-2">
                      <Label htmlFor="planification-search">Recherche</Label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="planification-search"
                          value={listSearch}
                          onChange={(event) => setListSearch(event.target.value)}
                          placeholder="Nom, destination, trajet, devise..."
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetListFilters}
                      disabled={!hasListFilters}
                      className="w-full gap-2 lg:w-auto"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reinitialiser
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="space-y-2">
                      <Label>Visibilite</Label>
                      <Select value={visibilityFilter} onValueChange={(value) => setVisibilityFilter(value as VisibilityFilter)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="visible">Visible</SelectItem>
                          <SelectItem value="hidden">Masque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date-from-filter">Debut apres</Label>
                      <Input
                        id="date-from-filter"
                        type="date"
                        value={dateFromFilter}
                        onChange={(event) => setDateFromFilter(event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date-to-filter">Fin avant</Label>
                      <Input
                        id="date-to-filter"
                        type="date"
                        value={dateToFilter}
                        onChange={(event) => setDateToFilter(event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="budget-min-filter">Budget min</Label>
                      <Input
                        id="budget-min-filter"
                        type="number"
                        min="0"
                        value={budgetMinFilter}
                        onChange={(event) => setBudgetMinFilter(event.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="budget-max-filter">Budget max</Label>
                      <Input
                        id="budget-max-filter"
                        type="number"
                        min="0"
                        value={budgetMaxFilter}
                        onChange={(event) => setBudgetMaxFilter(event.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {listPlanifications.length} resultat(s) sur {filteredPlanifications.length} planification(s).
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Planification</th>
                      <th className="px-4 py-3 font-semibold">Destination</th>
                      <th className="px-4 py-3 font-semibold">Trajet</th>
                      <th className="px-4 py-3 font-semibold">Debut</th>
                      <th className="px-4 py-3 font-semibold">Fin</th>
                      <th className="px-4 py-3 font-semibold">Budget</th>
                      <th className="px-4 py-3 font-semibold">Statut</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {listPlanifications.length > 0 ? (
                      listPlanifications.map((planification) => (
                        <tr key={planification.id} className="transition hover:bg-muted/30">
                          <td className="px-4 py-4">
                            <div className="flex items-start gap-3">
                              <span
                                className="mt-1 h-3 w-3 shrink-0 rounded-full"
                                style={{ backgroundColor: getDestinationColor(planification.idDestination) }}
                                aria-hidden="true"
                              />
                              <div>
                                <p className="font-semibold text-foreground">{planification.nomPlanification}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {planification.jours?.length ?? 0} jour(s), {planification.transports?.length ?? 0} transport(s)
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {planification.nomDestination || "-"}
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-medium text-foreground">{planification.depart || "-"}</span>
                            <span className="mx-2 text-muted-foreground">vers</span>
                            <span className="font-medium text-foreground">{planification.arriver || "-"}</span>
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {formatPlanificationDate(planification.dateHeureDebut)}
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {formatPlanificationDate(planification.dateHeureFin)}
                          </td>
                          <td className="px-4 py-4 font-medium">
                            {formatBudget(planification.budgetTotal, planification.deviseBudget)}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                planification.estVisibleClient
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                  : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                              }`}
                            >
                              {planification.estVisibleClient ? "Visible" : "Masque"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={() => openEditPlanification(planification)}
                                disabled={saving}
                                title="Modifier"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={() => router.push(`/admin/destination/${planification.idDestination}/planning`)}
                                title="Voir le detail"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={() => void handleDeletePlanification(planification)}
                                disabled={saving}
                                title="Supprimer"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                          Aucune planification trouvee pour ces criteres.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>
                {selectedPlanification ? "Modifier la planification" : "Ajouter une planification"}
              </CardTitle>
              <CardDescription>
                Renseignez les informations principales de la planification.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nom-planification">Nom de la planification</Label>
                  <Input
                    id="nom-planification"
                    value={form.nomPlanification}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        nomPlanification: event.target.value,
                      }))
                    }
                    placeholder="Ex: Circuit Sainte-Marie 2 jours"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Destination</Label>
                  <Select
                    value={form.idDestination}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, idDestination: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionner une destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map((destination) => (
                        <SelectItem key={destination.id} value={destination.id}>
                          {destination.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget-total">Budget total</Label>
                  <Input
                    id="budget-total"
                    type="number"
                    min="0"
                    value={form.budgetTotal}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        budgetTotal: event.target.value,
                      }))
                    }
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="est-visible-client"
                      checked={form.estVisibleClient}
                      onCheckedChange={(checked) =>
                        setForm((current) => ({
                          ...current,
                          estVisibleClient: checked === true,
                        }))
                      }
                    />
                    <Label htmlFor="est-visible-client">Visible par les clients</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depart">Depart</Label>
                  <Input
                    id="depart"
                    value={form.depart}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        depart: event.target.value,
                      }))
                    }
                    placeholder="Ex: Antananarivo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arriver">Arrivee</Label>
                  <Input
                    id="arriver"
                    value={form.arriver}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        arriver: event.target.value,
                      }))
                    }
                    placeholder="Ex: Sainte-Marie"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-debut">Date et heure de debut</Label>
                  <Input
                    id="date-debut"
                    type="datetime-local"
                    value={form.dateHeureDebut}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        dateHeureDebut: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-fin">Date et heure de fin</Label>
                  <Input
                    id="date-fin"
                    type="datetime-local"
                    value={form.dateHeureFin}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        dateHeureFin: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                {selectedPlanification ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/admin/destination/${selectedPlanification.idDestination}/planning`)}
                      disabled={saving}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={saving}
                    >
                      Supprimer
                    </Button>
                  </>
                ) : null}

                <Button variant="outline" onClick={closeModal} disabled={saving}>
                  Annuler
                </Button>

                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Enregistrement..." : selectedPlanification ? "Mettre a jour" : "Enregistrer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

    </div>
  );
}
