"use client";

import { useState, useEffect } from "react";

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
  // State
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

  // Set currentDate on client only
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // --- Loading & error states (safe — no hooks below) ---
  if (isLoading) {
    return (
      <div className="rounded-xl border-2 border-gray-600 bg-gray-800 p-8 text-center">
        <p className="text-white">Loading calendar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border-2 border-gray-600 bg-gray-800 p-8 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  // Wait until we’ve initialized currentDate on the client
  if (!currentDate) {
    return (
      <div className="rounded-xl border-2 border-gray-600 bg-gray-800 p-4">
        Loading...
      </div>
    );
  }

  // ---------- Helper data & functions (no hooks below this line) ----------

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

  // Navigation
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
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // ---------- Render ----------

  return (
    <div className="rounded-xl border-2 border-gray-600 bg-gray-800 p-4">
      {/* Calendar Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="rounded px-3 py-1 text-white hover:bg-gray-700"
          >
            ←
          </button>

          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">
              {monthNames[month]} {year}
            </h2>
            <button
              onClick={goToToday}
              className="rounded px-3 py-1 text-sm text-white hover:bg-gray-700"
            >
              Today
            </button>
          </div>

          <button
            onClick={goToNextMonth}
            className="rounded px-3 py-1 text-white hover:bg-gray-700"
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
                : "text-white hover:bg-gray-700"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`rounded px-3 py-1 text-sm ${
              viewMode === "week"
                ? "bg-blue-600 text-white"
                : "text-white hover:bg-gray-700"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode("day")}
            className={`rounded px-3 py-1 text-sm ${
              viewMode === "day"
                ? "bg-blue-600 text-white"
                : "text-white hover:bg-gray-700"
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
              className="p-2 text-center text-sm font-semibold text-gray-300"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="min-h-[80px] rounded border-2 border-gray-600 bg-gray-700/30"
            />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const date = new Date(year, month, day);
            const dayEvents = getEventsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={day}
                className={`min-h-[80px] rounded border-2 border-gray-600 bg-gray-700/30 p-1 ${
                  isToday ? "bg-blue-900/50 border-blue-500" : ""
                }`}
              >
                <div
                  className={`mb-1 text-sm font-semibold ${
                    isToday ? "text-blue-300" : "text-white"
                  }`}
                >
                  {day}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={event.id || eventIndex}
                      className="truncate rounded bg-blue-800/70 px-1 text-xs font-medium text-blue-200"
                      title={event.summary || "Event"}
                    >
                      {event.summary || "Event"}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs font-medium text-gray-400">
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
      {viewMode === "week" &&
        (() => {
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
                    className="border-b-2 border-gray-600 p-2 text-center text-xs font-semibold"
                  >
                    <div className="text-gray-300">
                      {dayNames[date.getDay()]}
                    </div>
                    <div
                      className={
                        isToday ? "text-blue-300 font-bold" : "text-white"
                      }
                    >
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
                    className={`min-h-[120px] rounded border-2 border-gray-600 bg-gray-700/30 p-1 ${
                      isToday ? "bg-blue-900/50 border-blue-500" : ""
                    }`}
                  >
                    <div className="space-y-1">
                      {dayEvents.length === 0 && (
                        <div className="text-xs font-medium text-gray-400">
                          No events
                        </div>
                      )}
                      {dayEvents.map((event, index) => (
                        <div
                          key={event.id || index}
                          className="rounded bg-blue-800/70 px-1 py-0.5 text-[11px] font-medium text-blue-200"
                        >
                          <div className="truncate font-semibold">
                            {event.summary || "Event"}
                          </div>
                          <div className="truncate text-[10px] font-medium">
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
      {viewMode === "day" &&
        (() => {
          const dayEvents = getEventsForDate(currentDate).sort((a, b) => {
            const aTime =
              new Date(a.start?.dateTime || a.start?.date || "").getTime() || 0;
            const bTime =
              new Date(b.start?.dateTime || b.start?.date || "").getTime() || 0;
            return aTime - bTime;
          });

          return (
            <div className="space-y-3">
              <div className="text-base font-semibold text-white">
                {currentDate.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>

              {dayEvents.length === 0 && (
                <div className="rounded border-2 border-gray-600 bg-gray-700/30 p-4 text-sm font-medium text-gray-400">
                  No events for this day.
                </div>
              )}

              {dayEvents.map((event, index) => (
                <div
                  key={event.id || index}
                  className="rounded border-2 border-gray-600 bg-gray-700/30 p-4 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-white">
                      {event.summary || "Event"}
                    </div>
                    <div className="text-xs font-semibold text-gray-300">
                      {formatEventTime(event)}
                    </div>
                  </div>
                  {event.description && (
                    <p className="mt-2 text-xs font-medium text-gray-400">
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
