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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Get events for a specific date
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
      <div className="mb-4 flex items-center justify-between">
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

      {/* Calendar Grid */}
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
          <div key={`empty-${index}`} className="min-h-[80px] rounded border" />
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
              className={`min-h-[80px] rounded border p-1 ${
                isToday ? "bg-blue-50 border-blue-300" : ""
              }`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
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
    </div>
  );
}
