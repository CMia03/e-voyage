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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List } from "lucide-react";
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
  const [showListModal, setShowListModal] = useState(false);

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

  const events = useMemo<CalendarEvent[]>(
    () => {
      const filteredPlanifications = selectedDestinationFilter === "all" 
        ? planifications 
        : planifications.filter(p => p.idDestination === selectedDestinationFilter);
      
      return filteredPlanifications.map((planification) => ({
        id: planification.id,
        title: `${planification.nomPlanification} - ${planification.nomDestination}`,
        start: toDate(planification.dateHeureDebut),
        end: toDate(planification.dateHeureFin ?? planification.dateHeureDebut),
        resource: planification,
      }));
    },
    [planifications, selectedDestinationFilter]
  );

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Planification
          </h1>
          <p className="text-sm text-muted-foreground">
            Toutes les planifications sont affichées dans le calendrier, avec création,
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
              <CardTitle>Calendrier des planifications</CardTitle>
              <CardDescription>
                Cliquez sur une plage horaire pour créer une planification, ou sur un élément
                existant pour le modifier.
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="destination-filter">Filtrer par destination:</Label>
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
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowListModal(true)}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                Liste des planifications
              </Button>
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
          ) : (
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

      {/* Modal liste des planifications */}
      {showListModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Liste des planifications</CardTitle>
              <CardDescription>
                Toutes les planifications disponibles
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {planifications.length > 0 ? (
                  planifications.map((planification) => (
                    <div key={planification.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{planification.nomPlanification}</h3>
                          <p className="text-sm text-muted-foreground">
                            {planification.nomDestination} • {planification.depart} → {planification.arriver}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              Début: {planification.dateHeureDebut ? new Date(planification.dateHeureDebut).toLocaleDateString('fr-FR') : 'Non défini'}
                            </span>
                            <span>
                              Fin: {planification.dateHeureFin ? new Date(planification.dateHeureFin).toLocaleDateString('fr-FR') : 'Non défini'}
                            </span>
                            {planification.budgetTotal && (
                              <span>Budget: {planification.budgetTotal} {planification.deviseBudget}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            planification.estVisibleClient 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {planification.estVisibleClient ? 'Visible' : 'Masqué'}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPlanification(planification);
                              setForm(buildFormState(planification));
                              setShowListModal(false);
                              setShowModal(true);
                            }}
                          >
                            Ouvrir
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune planification trouvée.
                  </p>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={() => setShowListModal(false)}>
                  Fermer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
