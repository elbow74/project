"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAppState } from "@/state/AppStateContext";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/authContext";
import { fetchCalendarEvents } from "@/lib/calendar-client";
import { CalendarView } from "@/components/calendar/CalendarView";
import { CalendarEvents } from "@/components/calendar/CalendarEvents";

type CalendarStatus = {
  connected: boolean;
  canRefresh?: boolean;
  canAccessCalendar?: boolean;
  accessTokenExpiresInSec?: number;
  error?: string;
  message?: string;
} | null;

export default function DashboardPage() {
  const { users, events, groups } = useAppState();
  const { currentUser } = useAuth() as any;

  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Check Google Calendar link status
  useEffect(() => {
    (async () => {
      if (!currentUser) return;

      try {
        const idToken = await currentUser.getIdToken();
        const res = await fetch("/api/google/status", {
          headers: { Authorization: `Bearer ${idToken}` },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setCalendarStatus({
            connected: false,
            error: err.error ?? `Status check failed (${res.status})`,
          });
          return;
        }

        const data = await res.json();
        setCalendarStatus(data);
      } catch (e) {
        console.error("Failed to check calendar status", e);
        setCalendarStatus({
          connected: false,
          error: "Failed to check calendar status",
        });
      }
    })();
  }, [currentUser]);

  // Fetch calendar events when connected
  useEffect(() => {
    (async () => {
      if (!currentUser || !calendarStatus?.connected) {
        setCalendarEvents([]);
        return;
      }

      try {
        setEventsLoading(true);
        setEventsError(null);

        const idToken = await currentUser.getIdToken();
        const result = await fetchCalendarEvents(idToken);

        if (!result || !Array.isArray(result.events)) {
          setCalendarEvents([]);
          return;
        }

        setCalendarEvents(result.events);
      } catch (e) {
        console.error("Failed to fetch calendar events", e);
        setEventsError("Failed to load calendar events");
      } finally {
        setEventsLoading(false);
      }
    })();
  }, [currentUser, calendarStatus?.connected]);

  // Derived upcoming events list (sorted soonest-first, limited)
  const upcomingEvents = useMemo(() => {
    return calendarEvents
      .filter((event) => event?.start?.dateTime || event?.start?.date)
      .slice()
      .sort((a, b) => {
        const aDate = new Date(a.start.dateTime || a.start.date).getTime();
        const bDate = new Date(b.start.dateTime || b.start.date).getTime();
        return aDate - bDate;
      })
      .slice(0, 5);
  }, [calendarEvents]);

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

      // 2) Navigate (NOT fetch) to the connect endpoint (redirects to Google)
      window.location.href = "/api/google/connect";
    } catch (e) {
      console.error(e);
      alert("Failed to connect to Google Calendar");
    }
  };

  const dashboardTitle =
    (currentUser?.displayName ||
      currentUser?.email?.split("@")[0] ||
      "Your") + "'s Dashboard";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{dashboardTitle}</h1>

      {/* Summary stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Stat title="Users" value={users.length} />
        <Stat title="Events" value={events.length} />
        <Stat title="Groups" value={groups.length} />
      </div>

      {/* Calendar link status */}
      <div className="rounded border p-4">
        <div className="mb-2 font-medium">Calendar Link</div>
        {calendarStatus === null ? (
          <p className="text-sm text-muted-foreground">Checking status...</p>
        ) : calendarStatus.connected ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-green-600">✓ Connected</p>
            {calendarStatus.canAccessCalendar && (
              <p className="text-xs text-muted-foreground">
                Calendar access verified
              </p>
            )}
            {calendarStatus.accessTokenExpiresInSec && (
              <p className="text-xs text-muted-foreground">
                Access token expires in ~
                {Math.round(calendarStatus.accessTokenExpiresInSec / 60)} min
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-red-600">Not connected</p>
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

      {/* Calendar + Upcoming events */}
      {calendarStatus?.connected && (
        <div className="rounded border p-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="font-medium">Calendar</div>
            <Link href="/calendar">
              <Button size="sm">Add Event</Button>
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
            <div>
              <CalendarView
                events={calendarEvents}
                isLoading={eventsLoading}
                error={eventsError}
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Upcoming Events</div>
              <CalendarEvents
                events={upcomingEvents}
                isLoading={eventsLoading}
                error={eventsError}
              />
            </div>
          </div>
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
