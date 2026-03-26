"use client"

import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import frLocale from "@fullcalendar/core/locales/fr"
import type { EventClickArg, EventInput } from "@fullcalendar/core"

import { PlanificationVoyage } from "@/lib/type/destination"

type PlanningVoyageCalendarProps = {
  planifications: PlanificationVoyage[]
  selectedPlanificationId?: string
  onSelectPlanification?: (planificationId: string) => void
  initialDate?: Date
}

function toCalendarEvents(planifications: PlanificationVoyage[], selectedPlanificationId?: string): EventInput[] {
  return planifications.map((planification) => ({
    id: planification.id,
    title: planification.nomPlanification,
    start: planification.dateHeureDebut || undefined,
    end: planification.dateHeureFin || undefined,
    allDay: false,
    classNames: planification.id === selectedPlanificationId ? ["planning-event-selected"] : ["planning-event"],
    extendedProps: {
      depart: planification.depart,
      arriver: planification.arriver,
    },
  }))
}

export function PlanningVoyageCalendar({
  planifications,
  selectedPlanificationId,
  onSelectPlanification,
  initialDate,
}: PlanningVoyageCalendarProps) {
  const events = toCalendarEvents(planifications, selectedPlanificationId)

  function handleEventClick(info: EventClickArg) {
    onSelectPlanification?.(info.event.id)
  }

  return (
    <div className="planning-calendar rounded-2xl border border-border/50 bg-card/50 p-3">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        buttonText={{
          today: "Aujourd'hui",
          month: "Mois",
          week: "Semaine",
          day: "Jour",
        }}
        locale={frLocale}
        initialDate={initialDate}
        height="auto"
        weekends
        editable={false}
        selectable={false}
        events={events}
        eventClick={handleEventClick}
      />
    </div>
  )
}
