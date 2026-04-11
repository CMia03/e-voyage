"use client";

import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { fr } from "date-fns/locale/fr";
import { useBreadcrumbs } from "../contexts/breadcrumbs-context";

const locales = {
  fr: fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function PlanificationPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const [events] = useState([
    {
      id: 1,
      title: "Réservation - Manambato",
      start: new Date(),
      end: new Date(new Date().getTime() + 2 * 60 * 60 * 1000),
    },
    {
      id: 2,
      title: "Tour - Paddle",
      start: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      end: new Date(new Date().getTime() + 27 * 60 * 60 * 1000),
    },
  ]);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Admin", href: "/admin" },
      { label: "Planification", isActive: true }
    ]);
  }, [setBreadcrumbs]);

  return (
    <div className="space-y-8 h-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Planification
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestion de la planification et des plannings.
        </p>
      </div>

      <div className="flex-1 bg-card rounded-lg border border-border/50 p-4">
        <div className="h-full min-h-[600px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%", minHeight: "600px" }}
            culture="fr"
            messages={{
              next: "Suivant",
              previous: "Précédent",
              today: "Aujourd'hui",
              month: "Mois",
              week: "Semaine",
              day: "Jour",
              agenda: "Agenda",
              date: "Date",
              time: "Heure",
              event: "Événement",
              noEventsInRange: "Aucun événement dans cette période.",
            }}
          />
        </div>
      </div>
    </div>
  );
}
