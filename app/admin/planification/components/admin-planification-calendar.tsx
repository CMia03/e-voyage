"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer, SlotInfo, ToolbarProps, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale/fr";
import "react-big-calendar/lib/css/react-big-calendar.css";

import {
  createPlanificationVoyage,
  deletePlanificationVoyage,
  listAdminDestinations,
  listAdminPlanificationsPage,
  listPlanificationsByDestination,
  updatePlanificationVoyage,
} from "@/lib/api/destinations";
import { getErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CalendarDays,
  Edit3,
  ExternalLink,
  FileText,
  Info,
  List,
  MapPin,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Wallet,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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

function displayText(value?: string | number | null, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value).replace(/[‚ƒ…‡ˆ‰Š‹Œ“”–—×]/g, (char) => legacyEncodingMap[char] ?? char);
}

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: PlanificationVoyage;
};

function PlanificationCalendarToolbar({
  label,
  onNavigate,
  onView,
  view,
}: ToolbarProps<CalendarEvent, object>) {
  const viewOptions: Array<{ value: View; label: string }> = [
    { value: Views.MONTH, label: "Mois" },
    { value: Views.WEEK, label: "Semaine" },
    { value: Views.DAY, label: "Jour" },
    { value: Views.AGENDA, label: "Agenda" },
  ];

  return (
    <div className="mb-4 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" className="h-10 gap-2" onClick={() => onNavigate("TODAY")}>
            <CalendarDays className="h-4 w-4" />
            Aujourd&apos;hui
          </Button>
          <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-11 rounded-none border-r"
              onClick={() => onNavigate("PREV")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-11 rounded-none"
              onClick={() => onNavigate("NEXT")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-lg font-semibold text-slate-950">
          <CalendarDays className="h-5 w-5 text-slate-600" />
          {label}
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {viewOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onView(option.value)}
              className={`h-9 gap-2 rounded-md px-4 ${
                view === option.value
                  ? "bg-emerald-50 text-emerald-700 shadow-sm hover:bg-emerald-100 hover:text-emerald-800"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {option.value === Views.AGENDA ? <CalendarDays className="h-4 w-4" /> : null}
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

type DisplayMode = "calendar" | "list";

type VisibilityFilter = "all" | "visible" | "hidden";

const listPageSizeOptions = [5, 10, 20] as const;

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

function getPlanificationColor(planificationId: string): string {
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
  for (let i = 0; i < planificationId.length; i++) {
    hash = planificationId.charCodeAt(i) + ((hash << 5) - hash);
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
  const [listPlanifications, setListPlanifications] = useState<PlanificationVoyage[]>([]);
  const [listTotalElements, setListTotalElements] = useState(0);
  const [listTotalItems, setListTotalItems] = useState(0);
  const [listTotalPages, setListTotalPages] = useState(1);
  const [listLoading, setListLoading] = useState(false);
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
  const [listCurrentPage, setListCurrentPage] = useState(1);
  const [listPageSize, setListPageSize] = useState<(typeof listPageSizeOptions)[number]>(5);

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

  const monthPlanificationCount = useMemo(
    () =>
      filteredPlanifications.filter((planification) => {
        const date = toDate(planification.dateHeureDebut);
        return date.getFullYear() === calendarDate.getFullYear() && date.getMonth() === calendarDate.getMonth();
      }).length,
    [calendarDate, filteredPlanifications]
  );

  const selectedCalendarDayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(calendarDate),
    [calendarDate]
  );

  const events = useMemo<CalendarEvent[]>(
    () =>
      filteredPlanifications.map((planification) => ({
        id: planification.id,
        title: `${displayText(planification.nomPlanification)} - ${displayText(planification.nomDestination)}`,
        start: toDate(planification.dateHeureDebut),
        end: toDate(planification.dateHeureFin ?? planification.dateHeureDebut),
        resource: planification,
      })),
    [filteredPlanifications]
  );

  const loadListData = useCallback(async () => {
    if (!accessToken) {
      setListPlanifications([]);
      setListTotalElements(0);
      setListTotalItems(0);
      setListTotalPages(1);
      return;
    }

    setListLoading(true);

    try {
      const response = await listAdminPlanificationsPage(
        {
          destinationId: selectedDestinationFilter === "all" ? undefined : selectedDestinationFilter,
          search: listSearch.trim() || undefined,
          visibility: visibilityFilter,
          dateFrom: dateFromFilter || undefined,
          dateTo: dateToFilter || undefined,
          budgetMin: budgetMinFilter || undefined,
          budgetMax: budgetMaxFilter || undefined,
          page: listCurrentPage - 1,
          size: listPageSize,
        },
        accessToken
      );

      const data = response.data;
      const nextTotalPages = Math.max(1, data?.totalPages ?? 1);

      if (data && listCurrentPage > nextTotalPages) {
        setListCurrentPage(nextTotalPages);
        return;
      }

      setListPlanifications(data?.content ?? []);
      setListTotalElements(data?.totalElements ?? 0);
      setListTotalItems(data?.totalCount ?? data?.totalElements ?? 0);
      setListTotalPages(nextTotalPages);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger la liste des planifications."));
      setListPlanifications([]);
      setListTotalElements(0);
      setListTotalItems(0);
      setListTotalPages(1);
    } finally {
      setListLoading(false);
    }
  }, [
    accessToken,
    budgetMaxFilter,
    budgetMinFilter,
    dateFromFilter,
    dateToFilter,
    listCurrentPage,
    listPageSize,
    listSearch,
    selectedDestinationFilter,
    visibilityFilter,
  ]);

  useEffect(() => {
    void loadListData();
  }, [loadListData]);

  const hasListFilters =
    listSearch.trim() ||
    visibilityFilter !== "all" ||
    dateFromFilter ||
    dateToFilter ||
    budgetMinFilter ||
    budgetMaxFilter;

  const safeListCurrentPage = Math.min(listCurrentPage, listTotalPages);
  const listPaginationStart = listTotalElements === 0 ? 0 : (safeListCurrentPage - 1) * listPageSize + 1;
  const listPaginationEnd = Math.min(safeListCurrentPage * listPageSize, listTotalElements);
  const listPageNumbers = useMemo(() => {
    const maxVisiblePages = 5;
    const total = Math.max(1, listTotalPages);
    const half = Math.floor(maxVisiblePages / 2);
    const start = Math.max(1, Math.min(safeListCurrentPage - half, total - maxVisiblePages + 1));
    const end = Math.min(total, start + maxVisiblePages - 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [listTotalPages, safeListCurrentPage]);

  useEffect(() => {
    setListCurrentPage(1);
  }, [
    budgetMaxFilter,
    budgetMinFilter,
    dateFromFilter,
    dateToFilter,
    listPageSize,
    listSearch,
    selectedDestinationFilter,
    visibilityFilter,
  ]);

  const resetListFilters = () => {
    setListSearch("");
    setVisibilityFilter("all");
    setDateFromFilter("");
    setDateToFilter("");
    setBudgetMinFilter("");
    setBudgetMaxFilter("");
    setListCurrentPage(1);
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
      await loadListData();
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
      await loadListData();
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

    const confirmed = window.confirm(`Supprimer la planification "${displayText(planification.nomPlanification)}" ?`);
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await deletePlanificationVoyage(planification.id, accessToken);
      await loadCalendarData();
      await loadListData();
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de supprimer la planification."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <CalendarDays className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Planification
            </h1>
            {/* <p className="mt-2 max-w-3xl text-base leading-7 text-slate-500">
              Toutes les planifications sont disponibles en calendrier ou en liste, avec creation,
              modification et suppression directement depuis cette vue.
            </p> */}
          </div>
        </div>

        <Button
          onClick={() => openCreateModal()}
          className="h-11 gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-5 font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700"
        >
          <Plus className="h-4 w-4" />
          Ajouter une planification
        </Button>
      </div>

      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="px-6 py-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle className="text-xl text-slate-950">
                {displayMode === "calendar" ? "Calendrier des planifications" : "Liste des planifications"}
              </CardTitle>
              <CardDescription className="mt-2 max-w-xl text-base leading-7">
                {displayMode === "calendar"
                  ? "Cliquez sur une plage horaire pour creer une planification, ou sur un element existant pour le modifier."
                  : "Consultez, modifiez ou supprimez les planifications dans un tableau clair."}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="space-y-2">
                <Label htmlFor="destination-filter" className="text-sm font-semibold text-slate-500">
                  Filtrer par destination
                </Label>
                <Select
                  value={selectedDestinationFilter}
                  onValueChange={setSelectedDestinationFilter}
                >
                  <SelectTrigger className="h-12 w-[280px] rounded-lg border-slate-200 bg-white text-base shadow-sm">
                    <MapPin className="mr-2 h-5 w-5 text-emerald-600" />
                    <SelectValue placeholder="Toutes les destinations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les destinations</SelectItem>
                    {destinations.map((destination) => (
                      <SelectItem key={destination.id} value={destination.id}>
                        {displayText(destination.nom)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="inline-flex h-12 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                <Button
                  type="button"
                  size="sm"
                  variant={displayMode === "calendar" ? "default" : "ghost"}
                  onClick={() => setDisplayMode("calendar")}
                  className={`h-10 gap-2 rounded-md px-4 ${
                    displayMode === "calendar"
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <CalendarDays className="h-4 w-4" />
                  Calendrier
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={displayMode === "list" ? "default" : "ghost"}
                  onClick={() => setDisplayMode("list")}
                  className={`h-10 gap-2 rounded-md px-4 ${
                    displayMode === "list"
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <List className="h-4 w-4" />
                  Liste
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {loading ? (
            <div className="flex h-[600px] items-center justify-center text-sm text-muted-foreground">
              Chargement des planifications...
            </div>
          ) : displayMode === "calendar" ? (
            <div className="admin-planification-calendar">
              <div className="h-[620px]">
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
                components={{
                  toolbar: PlanificationCalendarToolbar,
                }}
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
                    background: getPlanificationColor(event.resource.id),
                    borderRadius: "6px",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    paddingInline: "4px",
                    boxShadow: "0 6px 14px rgba(88, 28, 135, 0.18)",
                  },
                })}
              />
              </div>
              <div className="mt-5 grid gap-4 rounded-xl bg-white pt-1 md:grid-cols-3">
                <div className="flex items-center gap-3">
                  <span className="h-9 w-9 rounded-lg bg-emerald-50" />
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{selectedCalendarDayLabel}</p>
                    <p className="text-sm text-slate-500">Jour selectionne</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* <span className="h-3 w-3 rounded-full bg-violet-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{monthPlanificationCount} planification(s)</p>
                    <p className="text-sm text-slate-500">Total ce mois</p>
                  </div> */}
                </div>

                {/* <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700">
                  <Info className="h-5 w-5 shrink-0" />
                  <p className="text-sm">Cliquez et faites glisser pour selectionner une plage et creer rapidement une planification.</p>
                </div> */}
                <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700">
                     <span className="h-3 w-3 rounded-full bg-violet-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{monthPlanificationCount} planification(s)</p>
                      <p className="text-sm text-slate-500">Total ce mois</p>
                    </div>
                </div>
               
              </div>
              <style jsx global>{`
                .admin-planification-calendar .rbc-calendar {
                  color: #0f172a;
                  font-family: inherit;
                }
                .admin-planification-calendar .rbc-month-view,
                .admin-planification-calendar .rbc-time-view,
                .admin-planification-calendar .rbc-agenda-view {
                  border-color: #e2e8f0;
                  border-radius: 0;
                  overflow: hidden;
                }
                .admin-planification-calendar .rbc-header {
                  border-color: #e2e8f0;
                  padding: 12px 8px;
                  font-size: 14px;
                  color: #0f172a;
                  background: #fff;
                }
                .admin-planification-calendar .rbc-month-row,
                .admin-planification-calendar .rbc-day-bg,
                .admin-planification-calendar .rbc-date-cell {
                  border-color: #e2e8f0;
                }
                .admin-planification-calendar .rbc-date-cell {
                  padding: 10px 12px 0 0;
                  font-size: 16px;
                  color: #0f172a;
                }
                .admin-planification-calendar .rbc-off-range {
                  color: #94a3b8;
                }
                .admin-planification-calendar .rbc-today {
                  background: linear-gradient(180deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.03));
                }
                .admin-planification-calendar .rbc-event {
                  min-height: 24px;
                  display: flex;
                  align-items: center;
                  font-weight: 600;
                }
              `}</style>
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
                <div className="mt-3 text-sm text-muted-foreground">
                  <p>
                    {listTotalElements === 0
                      ? "Aucun resultat"
                      : `${listPaginationStart}-${listPaginationEnd} sur ${listTotalElements} resultat(s)`}
                    {" "}sur {listTotalItems} planification(s).
                  </p>
                </div>
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
                    {listLoading ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                          Chargement des planifications...
                        </td>
                      </tr>
                    ) : listPlanifications.length > 0 ? (
                      listPlanifications.map((planification) => (
                        <tr key={planification.id} className="transition hover:bg-muted/30">
                          <td className="px-4 py-4">
                            <div className="flex items-start gap-3">
                              <span
                                className="mt-1 h-3 w-3 shrink-0 rounded-full"
                                style={{ backgroundColor: getPlanificationColor(planification.id) }}
                                aria-hidden="true"
                              />
                              <div>
                                <p className="font-semibold text-foreground">{displayText(planification.nomPlanification)}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {planification.jours?.length ?? 0} jour(s), {planification.transports?.length ?? 0} transport(s)
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {displayText(planification.nomDestination)}
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-medium text-foreground">{displayText(planification.depart)}</span>
                            <span className="mx-2 text-muted-foreground">vers</span>
                            <span className="font-medium text-foreground">{displayText(planification.arriver)}</span>
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
                {listTotalElements > 0 ? (
                  <div className="grid gap-3 border-t bg-white px-4 py-4 text-sm text-muted-foreground lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                    <div className="flex items-center gap-2">
                      <span>Afficher</span>
                      <Select
                        value={String(listPageSize)}
                        onValueChange={(value) => {
                          setListPageSize(Number(value) as (typeof listPageSizeOptions)[number]);
                          setListCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="h-10 w-[82px] rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {listPageSizeOptions.map((option) => (
                            <SelectItem key={option} value={String(option)}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span>par page</span>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-xl border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
                        disabled={listLoading || safeListCurrentPage <= 1}
                        onClick={() => setListCurrentPage((page) => Math.max(1, page - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {listPageNumbers.map((pageNumber) => (
                        <Button
                          key={pageNumber}
                          type="button"
                          variant={pageNumber === safeListCurrentPage ? "default" : "outline"}
                          size="icon"
                          onClick={() => setListCurrentPage(pageNumber)}
                          disabled={listLoading}
                          className={`h-10 w-10 rounded-xl ${
                            pageNumber === safeListCurrentPage
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                              : "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {pageNumber}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-xl border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
                        disabled={listLoading || safeListCurrentPage >= listTotalPages}
                        onClick={() => setListCurrentPage((page) => Math.min(listTotalPages, page + 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <span className="text-left lg:text-right">
                      {listPaginationStart} - {listPaginationEnd} sur {listTotalElements}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border-slate-200 shadow-2xl">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSave();
              }}
            >
              <CardHeader className="border-b bg-white px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <CalendarDays className="h-7 w-7" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-semibold text-slate-950">
                        {selectedPlanification ? "Modifier la planification" : "Ajouter une planification"}
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm text-slate-500">
                        Renseignez les informations principales de la planification.
                      </CardDescription>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={closeModal} disabled={saving}>
                    <X className="h-5 w-5" />
                    <span className="sr-only">Fermer</span>
                  </Button>
                </div>
              </CardHeader>

            <CardContent className="max-h-[72vh] space-y-6 overflow-y-auto px-6 py-6">
              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="nom-planification" className="text-sm font-semibold text-slate-900">
                  Nom de la planification <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
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
                    className="h-12 border-emerald-300 pr-11 text-base focus-visible:ring-emerald-200"
                  />
                  <FileText className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-900">
                    Destination <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.idDestination}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, idDestination: value }))
                    }
                  >
                    <SelectTrigger className="h-12 text-base">
                      <MapPin className="mr-2 h-5 w-5 text-emerald-600" />
                      <SelectValue placeholder="Selectionner une destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map((destination) => (
                        <SelectItem key={destination.id} value={destination.id}>
                          {displayText(destination.nom)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget-total" className="text-sm font-semibold text-slate-900">
                    Budget total <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex h-12 overflow-hidden rounded-md border border-slate-200 bg-white focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
                    <Input
                      value={form.deviseBudget}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, deviseBudget: event.target.value }))
                      }
                      className="h-full w-24 rounded-none border-0 bg-emerald-50 text-center font-semibold shadow-none focus-visible:ring-0"
                    />
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
                      className="h-full rounded-none border-0 text-base shadow-none focus-visible:ring-0"
                    />
                    <div className="flex items-center px-3 text-slate-400">
                      <Wallet className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="est-visible-client"
                  checked={form.estVisibleClient}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      estVisibleClient: checked === true,
                    }))
                  }
                  className="mt-1 h-5 w-5"
                />
                <div>
                  <Label htmlFor="est-visible-client" className="text-sm font-semibold text-slate-900">
                    Visible par les clients
                  </Label>
                  <p className="mt-1 text-sm text-slate-500">
                    Rendre cette planification visible pour vos clients.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="depart" className="text-sm font-semibold text-slate-900">
                    Depart <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />
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
                      className="h-12 pl-11 text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arriver" className="text-sm font-semibold text-slate-900">
                    Arrivee <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />
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
                      className="h-12 pl-11 text-base"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date-debut" className="text-sm font-semibold text-slate-900">
                    Date et heure de debut <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
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
                      className="h-12 pl-11 text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-fin" className="text-sm font-semibold text-slate-900">
                    Date et heure de fin <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
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
                      className="h-12 pl-11 text-base"
                    />
                  </div>
                </div>
              </div>

              
            </CardContent>

              <div className="flex flex-wrap justify-end gap-3 border-t bg-white px-6 py-4">
                {selectedPlanification ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/admin/destination/${selectedPlanification.idDestination}/planning`)}
                      disabled={saving}
                    >
                      Voir detail
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

                <Button
                  type="submit"
                  disabled={saving}
                  className="min-w-40 gap-2 bg-emerald-600 shadow-lg shadow-emerald-500/20 hover:bg-emerald-700"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

    </div>
  );
}
