"use client";
import { useAppState } from "@/state/AppStateContext";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/authContext";
import { useEffect, useState } from "react";
import { fetchCalendarEvents } from "@/lib/calendar-client";
import { CalendarView } from "@/components/calendar/CalendarView";

export default function DashboardPage() {
  const { users, events, groups, linkStatus } = useAppState();
  const { currentUser } = useAuth();
  const [calendarStatus, setCalendarStatus] = useState<{
    connected: boolean;
    canRefresh?: boolean;
    canAccessCalendar?: boolean;
    accessTokenExpiresInSec?: number;
    error?: string;
    message?: string;
  } | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/google/status", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      setCalendarStatus(data);
    })();
  }, [currentUser]);

  // Fetch calendar events when calendar is connected
  useEffect(() => {
    (async () => {
      if (!currentUser || !calendarStatus?.connected) {
        setCalendarEvents([]);
        return;
      }

      try {
        setEventsLoading(true);
        const idToken = await currentUser.getIdToken();
        const data = await fetchCalendarEvents(idToken);

        if (data && data.events) {
          const eventsData = data.events as any;
          const eventItems = eventsData.items || eventsData || [];
          setCalendarEvents(Array.isArray(eventItems) ? eventItems : []);
        } else {
          setCalendarEvents([]);
        }
        setEventsError(null);
      } catch (err) {
        setEventsError("Failed to load calendar events");
        console.error(err);
      } finally {
        setEventsLoading(false);
      }
    })();
  }, [currentUser, calendarStatus?.connected]);

  const handleLinkCalendar = async () => {
    if (!currentUser) {
      alert("Please log in first");
      return;
    }

    try {
      const idToken = await currentUser.getIdToken();

      // 1) Preflight: set UID cookie on the server
      const pre = await fetch("/api/google/prefetch", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!pre.ok) {
        const err = await pre.json().catch(() => ({}));
        alert(`Failed to start connect: ${err.error ?? pre.status}`);
        return;
      }

      // 2) Navigate (NOT fetch) to the connect endpoint (it will redirect you to Google)
      window.location.href = "/api/google/connect";
    } catch (e) {
      console.error(e);
      alert("Failed to connect to Google Calendar");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        {(currentUser?.displayName ||
          currentUser?.email?.split("@")[0] ||
          "Your") + "'s Dashboard"}
      </h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat title="Users" value={users.length} />
        <Stat title="Events" value={events.length} />
        <Stat title="Groups" value={groups.length} />
      </div>
      <div className="rounded border p-4">
        <div className="mb-2 font-medium">Calendar Link</div>
        {calendarStatus === null ? (
          <p className="text-sm text-muted-foreground">Checking status...</p>
        ) : calendarStatus.connected ? (
          <div className="space-y-2">
            <p className="text-sm text-green-600 font-medium">✓ Connected</p>
            {calendarStatus.canAccessCalendar && (
              <p className="text-xs text-muted-foreground">
                Calendar access verified
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-red-600 font-medium">Not connected</p>
            {calendarStatus.message && (
              <p className="text-xs text-muted-foreground">
                {calendarStatus.message}
              </p>
            )}
            {calendarStatus.error && (
              <p className="text-xs text-red-500">{calendarStatus.error}</p>
            )}
            <Button className="mt-3" onClick={handleLinkCalendar}>
              Link Calendar
            </Button>
          </div>
        )}
      </div>
      {calendarStatus?.connected && (
        <div className="rounded border p-4">
          <div className="mb-4 font-medium">Upcoming Events</div>
          <CalendarView
            events={calendarEvents}
            isLoading={eventsLoading}
            error={eventsError}
          />
        </div>
      )}
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-1 text-3xl font-semibold">{value}</div>
    </div>
  );
}
