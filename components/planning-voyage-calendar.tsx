"use client"

import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import frLocale from "@fullcalendar/core/locales/fr"
import type { EventClickArg, EventInput } from "@fullcalendar/core"

import { PlanificationVoyage, Transport } from "@/lib/type/destination"

type PlanningVoyageCalendarProps = {
  planifications: PlanificationVoyage[]
  selectedPlanificationId?: string
  selectedTransportId?: string
  onSelectPlanification?: (planificationId: string) => void
  onSelectTransport?: (transportId: string, planificationId: string) => void
  initialDate?: Date
}

function transportClassName(typeName: string, selected: boolean) {
  const value = typeName.toLowerCase()
  const classes = ["transport-event"]

  if (value.includes("avion")) classes.push("transport-event-air")
  else if (value.includes("bateau")) classes.push("transport-event-sea")
  else if (value.includes("train")) classes.push("transport-event-rail")
  else if (value.includes("marche")) classes.push("transport-event-walk")
  else classes.push("transport-event-road")

  if (selected) classes.push("transport-event-selected")
  return classes
}

function inferTransportStart(planification: PlanificationVoyage, transport: Transport) {
  if (!planification.dateHeureDebut) {
    return undefined
  }

  const start = new Date(planification.dateHeureDebut)
  if (Number.isNaN(start.getTime())) {
    return undefined
  }

  const offset = Math.max((transport.ordreEtape ?? 1) - 1, 0)
  start.setDate(start.getDate() + offset)
  return start.toISOString()
}

function inferTransportEnd(planification: PlanificationVoyage, transport: Transport) {
  const start = inferTransportStart(planification, transport)
  if (!start) {
    return undefined
  }

  const end = new Date(start)
  end.setHours(end.getHours() + 2)
  return end.toISOString()
}

function toCalendarEvents(
  planifications: PlanificationVoyage[],
  selectedPlanificationId?: string,
  selectedTransportId?: string
): EventInput[] {
  const planificationEvents = planifications.map((planification) => ({
    id: `planification:${planification.id}`,
    title: planification.nomPlanification,
    start: planification.dateHeureDebut || undefined,
    end: planification.dateHeureFin || undefined,
    allDay: false,
    classNames: planification.id === selectedPlanificationId ? ["planning-event-selected"] : ["planning-event"],
    extendedProps: {
      eventType: "planification",
      planificationId: planification.id,
      depart: planification.depart,
      arriver: planification.arriver,
    },
  }))

  const transportEvents = planifications.flatMap((planification) =>
    planification.transports
      .filter((transport) => inferTransportStart(planification, transport))
      .map((transport) => ({
        id: `transport:${transport.id}`,
        title: `${transport.depart} -> ${transport.arrivee} (${transport.nomTypeTransport})`,
        start: inferTransportStart(planification, transport),
        end: inferTransportEnd(planification, transport),
        allDay: false,
        classNames: transportClassName(
          transport.nomTypeTransport || "",
          transport.id === selectedTransportId
        ),
        extendedProps: {
          eventType: "transport",
          transportId: transport.id,
          planificationId: planification.id,
          ordreEtape: transport.ordreEtape,
          nomTypeTransport: transport.nomTypeTransport,
        },
      }))
  )

  return [...planificationEvents, ...transportEvents]
}

export function PlanningVoyageCalendar({
  planifications,
  selectedPlanificationId,
  selectedTransportId,
  onSelectPlanification,
  onSelectTransport,
  initialDate,
}: PlanningVoyageCalendarProps) {
  const events = toCalendarEvents(planifications, selectedPlanificationId, selectedTransportId)

  function handleEventClick(info: EventClickArg) {
    const eventType = info.event.extendedProps.eventType as "planification" | "transport" | undefined
    const planificationId = info.event.extendedProps.planificationId as string | undefined
    const transportId = info.event.extendedProps.transportId as string | undefined

    if (eventType === "transport" && transportId && planificationId) {
      onSelectPlanification?.(planificationId)
      onSelectTransport?.(transportId, planificationId)
      return
    }

    if (planificationId) {
      onSelectPlanification?.(planificationId)
    }
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
