"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";
import { fetchCalendarEvents } from "@/lib/calendar-client";
import { CalendarView } from "@/components/calendar/CalendarView";

export default function CalendarPage() {
  const auth = useAuth() as { currentUser: any } | null;
  const currentUser = auth?.currentUser;
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const idToken = await currentUser.getIdToken();
        const data = await fetchCalendarEvents(idToken);

        if (data && data.events) {
          // Google Calendar API returns events in data.events.items
          const eventsData = data.events as any;
          const eventItems = eventsData.items || eventsData || [];
          setEvents(Array.isArray(eventItems) ? eventItems : []);
        } else {
          setEvents([]);
        }
        setError(null);
      } catch (err) {
        setError("Failed to load calendar events");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [currentUser]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Calendar</h1>
        <p className="mt-1 text-sm text-gray-400">
          View and manage your schedule
        </p>
      </div>
      <CalendarView events={events} isLoading={isLoading} error={error} />
    </div>
  );
}
