"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  };
}

export function AdminPlanificationCalendar({ accessToken }: { accessToken?: string }) {
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
    () =>
      planifications.map((planification) => ({
        id: planification.id,
        title: `${planification.nomPlanification} - ${planification.nomDestination}`,
        start: toDate(planification.dateHeureDebut),
        end: toDate(planification.dateHeureFin ?? planification.dateHeureDebut),
        resource: planification,
      })),
    [planifications]
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
          <CardTitle>Calendrier des planifications</CardTitle>
          <CardDescription>
            Cliquez sur une plage horaire pour créer une planification, ou sur un élément
            existant pour le modifier.
          </CardDescription>
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
                eventPropGetter={() => ({
                  style: {
                    backgroundColor: "#0f766e",
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
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    Supprimer
                  </Button>
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
