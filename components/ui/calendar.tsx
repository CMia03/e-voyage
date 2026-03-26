"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CalendarRange = {
  start?: Date | null
  end?: Date | null
  label?: string
}

type CalendarProps = {
  month?: Date
  onMonthChange?: (month: Date) => void
  ranges?: CalendarRange[]
  markers?: Date[]
  className?: string
}

const weekDays = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"]

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function startOfWeek(date: Date) {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

function endOfWeek(date: Date) {
  const result = startOfWeek(date)
  result.setDate(result.getDate() + 6)
  result.setHours(23, 59, 59, 999)
  return result
}

function addDays(date: Date, amount: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isBetween(date: Date, start?: Date | null, end?: Date | null) {
  if (!start || !end) return false
  const time = date.setHours(0, 0, 0, 0)
  const startTime = new Date(start).setHours(0, 0, 0, 0)
  const endTime = new Date(end).setHours(0, 0, 0, 0)
  return time >= startTime && time <= endTime
}

export function Calendar({
  month,
  onMonthChange,
  ranges = [],
  markers = [],
  className,
}: CalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState<Date>(
    startOfMonth(month ?? new Date())
  )

  React.useEffect(() => {
    if (month) {
      setInternalMonth(startOfMonth(month))
    }
  }, [month])

  const displayedMonth = month ? startOfMonth(month) : internalMonth
  const gridStart = startOfWeek(startOfMonth(displayedMonth))
  const gridEnd = endOfWeek(endOfMonth(displayedMonth))

  const days: Date[] = []
  for (let current = new Date(gridStart); current <= gridEnd; current = addDays(current, 1)) {
    days.push(new Date(current))
  }

  function changeMonth(offset: number) {
    const nextMonth = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth() + offset,
      1
    )
    if (onMonthChange) {
      onMonthChange(nextMonth)
      return
    }
    setInternalMonth(nextMonth)
  }

  return (
    <div className={cn("rounded-2xl border border-border/50 bg-card/50 p-4", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button type="button" variant="outline" size="icon-sm" onClick={() => changeMonth(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold">
            {displayedMonth.toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Button type="button" variant="outline" size="icon-sm" onClick={() => changeMonth(1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
        {weekDays.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {days.map((day) => {
          const inCurrentMonth = day.getMonth() === displayedMonth.getMonth()
          const hasMarker = markers.some((marker) => sameDay(marker, day))
          const range = ranges.find((item) => isBetween(new Date(day), item.start, item.end))
          const isRangeStart = range?.start ? sameDay(day, range.start) : false
          const isRangeEnd = range?.end ? sameDay(day, range.end) : false

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center rounded-xl border border-transparent text-sm transition-colors",
                inCurrentMonth ? "bg-background" : "bg-muted/30 text-muted-foreground",
                range ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "",
                (isRangeStart || isRangeEnd) ? "border-emerald-400 bg-emerald-100 font-semibold" : ""
              )}
            >
              <span>{day.getDate()}</span>
              {hasMarker ? <span className="mt-1 size-1.5 rounded-full bg-primary" /> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
