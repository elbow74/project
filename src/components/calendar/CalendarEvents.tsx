// /components/calendar/CalendarEvents.tsx
// Reusable component for displaying calendar events

interface CalendarEventsProps {
  events: any[];
  isLoading?: boolean;
  error?: string | null;
}

export function CalendarEvents({
  events,
  isLoading = false,
  error = null,
}: CalendarEventsProps) {
  const eventColors = [
    "bg-pink-900/50 border-pink-700 text-pink-200",
    "bg-blue-900/50 border-blue-700 text-blue-200",
    "bg-emerald-900/50 border-emerald-700 text-emerald-200",
    "bg-amber-900/50 border-amber-700 text-amber-200",
    "bg-purple-900/50 border-purple-700 text-purple-200",
  ];

  const getEventColor = (index: number) => {
    return eventColors[index % eventColors.length];
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-gray-800 border border-gray-700 p-6 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-blue-400"></div>
        <p className="mt-3 text-sm text-gray-300">Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-900/30 border border-red-700 p-4">
        <p className="text-sm text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="rounded-xl bg-gray-800 border border-gray-700 p-6 text-center">
        <p className="text-sm text-gray-400 font-medium">No upcoming events</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event, index) => {
        const startDate = event.start
          ? new Date(event.start.dateTime || event.start.date)
          : null;
        return (
          <div
            key={event.id || index}
            className={`rounded-xl border-2 p-4 shadow-sm transition-all hover:shadow-md ${getEventColor(
              index
            )}`}
          >
            <h3 className="font-bold text-base mb-1">
              {event.summary || "Untitled Event"}
            </h3>
            {startDate && (
              <p className="text-xs font-medium opacity-75 mb-2">
                {startDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}{" "}
                at{" "}
                {startDate.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            )}
            {event.description && (
              <p className="text-xs opacity-70 line-clamp-2">
                {event.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
