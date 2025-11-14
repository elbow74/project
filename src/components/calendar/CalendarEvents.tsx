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
  if (isLoading) {
    return (
      <div className="rounded-xl border p-4">
        <p className="text-sm text-muted-foreground">Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="rounded-xl border p-4">
        <p className="text-sm text-muted-foreground">No events found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event, index) => (
        <div key={event.id || index} className="rounded border p-3">
          <h3 className="font-medium">{event.summary || "Untitled Event"}</h3>
          {event.start && (
            <p className="text-sm text-muted-foreground">
              {new Date(
                event.start.dateTime || event.start.date
              ).toLocaleString()}
            </p>
          )}
          {event.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {event.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
