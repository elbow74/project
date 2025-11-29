"use client";
import { useState } from "react";

interface CalendarEvent {
  id?: string;
  summary?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  description?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  isLoading?: boolean;
  error?: string | null;
}

export function CalendarView({
  events = [],
  isLoading = false,
  error = null,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Get events for a specific date (ignores time)
  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      if (!event.start) return false;
      const dateString = event.start.dateTime || event.start.date;
      if (!dateString) return false;
      const eventDate = new Date(dateString);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Get the start of the week (Sunday) for a given date
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday
    const diff = d.getDate() - day;
    return new Date(d.getFullYear(), d.getMonth(), diff);
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const formatEventTime = (event: CalendarEvent) => {
    const dateTime = event.start?.dateTime;
    if (!dateTime) return "All day";
    const d = new Date(dateTime);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border p-8 text-center">
        <p className="text-muted-foreground">Loading calendar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border p-8 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4">
      {/* Calendar Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="rounded px-3 py-1 hover:bg-accent"
          >
            ←
          </button>

          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">
              {monthNames[month]} {year}
            </h2>
            <button
              onClick={goToToday}
              className="rounded px-3 py-1 text-sm hover:bg-accent"
            >
              Today
            </button>
          </div>

          <button
            onClick={goToNextMonth}
            className="rounded px-3 py-1 hover:bg-accent"
          >
            →
          </button>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("month")}
            className={`rounded px-3 py-1 text-sm ${
              viewMode === "month"
                ? "bg-blue-600 text-white"
                : "hover:bg-accent"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`rounded px-3 py-1 text-sm ${
              viewMode === "week"
                ? "bg-blue-600 text-white"
                : "hover:bg-accent"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode("day")}
            className={`rounded px-3 py-1 text-sm ${
              viewMode === "day"
                ? "bg-blue-600 text-white"
                : "hover:bg-accent"
            }`}
          >
            Day
          </button>
        </div>
      </div>

      {/* ===================== MONTH VIEW ===================== */}
      {viewMode === "month" && (
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {dayNames.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="min-h-[80px] rounded border"
            />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const date = new Date(year, month, day);
            const dayEvents = getEventsForDate(date);
            const isToday =
              date.toDateString() === new Date().toDateString();

            return (
              <div
                key={day}
                className={`min-h-[80px] rounded border p-1 ${
                  isToday ? "bg-blue-50 border-blue-300" : ""
                }`}
              >
                <div
                  className={`mb-1 text-sm font-medium ${
                    isToday ? "text-blue-600" : ""
                  }`}
                >
                  {day}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={event.id || eventIndex}
                      className="truncate rounded bg-blue-100 px-1 text-xs text-blue-800"
                      title={event.summary || "Event"}
                    >
                      {event.summary || "Event"}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================== WEEK VIEW ===================== */}
      {viewMode === "week" && (() => {
        const startOfWeek = getStartOfWeek(currentDate);
        const weekDays = Array.from({ length: 7 }).map((_, index) => {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + index);
          return d;
        });

        return (
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers with date */}
            {weekDays.map((date) => {
              const isToday =
                date.toDateString() === new Date().toDateString();
              return (
                <div
                  key={date.toISOString()}
                  className="border-b p-2 text-center text-xs font-medium text-muted-foreground"
                >
                  <div>{dayNames[date.getDay()]}</div>
                  <div className={isToday ? "text-blue-600" : ""}>
                    {date.getMonth() + 1}/{date.getDate()}
                  </div>
                </div>
              );
            })}

            {/* Events per day */}
            {weekDays.map((date) => {
              const dayEvents = getEventsForDate(date);
              const isToday =
                date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={date.toISOString() + "-events"}
                  className={`min-h-[120px] rounded border p-1 ${
                    isToday ? "bg-blue-50 border-blue-300" : ""
                  }`}
                >
                  <div className="space-y-1">
                    {dayEvents.length === 0 && (
                      <div className="text-xs text-muted-foreground">
                        No events
                      </div>
                    )}
                    {dayEvents.map((event, index) => (
                      <div
                        key={event.id || index}
                        className="rounded bg-blue-100 px-1 py-0.5 text-[11px] text-blue-800"
                      >
                        <div className="truncate font-medium">
                          {event.summary || "Event"}
                        </div>
                        <div className="truncate text-[10px]">
                          {formatEventTime(event)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ===================== DAY VIEW ===================== */}
      {viewMode === "day" && (() => {
        const dayEvents = getEventsForDate(currentDate).sort((a, b) => {
          const aTime =
            new Date(a.start?.dateTime || a.start?.date || "").getTime() ||
            0;
          const bTime =
            new Date(b.start?.dateTime || b.start?.date || "").getTime() ||
            0;
          return aTime - bTime;
        });

        return (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {currentDate.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>

            {dayEvents.length === 0 && (
              <div className="rounded border p-4 text-sm text-muted-foreground">
                No events for this day.
              </div>
            )}

            {dayEvents.map((event, index) => (
              <div
                key={event.id || index}
                className="rounded border p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">
                    {event.summary || "Event"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatEventTime(event)}
                  </div>
                </div>
                {event.description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
