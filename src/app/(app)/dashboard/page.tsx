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
  const { events, groups } = useAppState();
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

        if (result && result.events) {
          // Google Calendar API returns events in data.events.items
          const eventsData = result.events as any;
          const eventItems = eventsData.items || eventsData || [];
          setCalendarEvents(Array.isArray(eventItems) ? eventItems : []);
        } else {
          setCalendarEvents([]);
        }
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
      .filter((event) => {
        const start = event?.start?.dateTime || event?.start?.date;
        if (!start) return false;
        return new Date(start).getTime() > Date.now();
      })
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
    (currentUser?.displayName || currentUser?.email?.split("@")[0] || "Your") +
    "'s Dashboard";

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">{dashboardTitle}</h1>
        <p className="mt-1 text-sm text-gray-400">
          Overview of your calendar and activities
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Stat title="Events" value={events.length} />
        <Stat title="Groups" value={groups.length} />
      </div>

      {/* Calendar link status */}
      <div className="rounded-2xl bg-gray-800 p-6 shadow-lg border border-gray-700">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-blue-900/50 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Calendar Link</h3>
            <p className="text-xs text-gray-400">Google Calendar integration</p>
          </div>
        </div>
        {calendarStatus === null ? (
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-blue-400"></div>
            <span>Checking status...</span>
          </div>
        ) : calendarStatus.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400"></div>
              <p className="text-sm font-semibold text-green-400">Connected</p>
            </div>
            {calendarStatus.canAccessCalendar && (
              <p className="text-xs text-gray-400 pl-4">
                Calendar access verified
              </p>
            )}
            {calendarStatus.accessTokenExpiresInSec && (
              <p className="text-xs text-gray-400 pl-4">
                Token expires in ~
                {Math.round(calendarStatus.accessTokenExpiresInSec / 60)}{" "}
                minutes
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-400"></div>
              <p className="text-sm font-semibold text-red-400">
                Not connected
              </p>
            </div>
            {calendarStatus.message && (
              <p className="text-xs text-gray-400 pl-4">
                {calendarStatus.message}
              </p>
            )}
            {calendarStatus.error && (
              <p className="text-xs text-red-400 pl-4">
                {calendarStatus.error}
              </p>
            )}
            <Button
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleLinkCalendar}
            >
              Link Calendar
            </Button>
          </div>
        )}
      </div>

      {/* Calendar + Upcoming events */}
      {calendarStatus?.connected && (
        <div className="rounded-2xl bg-gray-800 p-6 shadow-lg border border-gray-700">
          <div className="mb-6 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-white">Calendar</h3>
            <Link href="/calendar">
              <Button className="bg-blue-600 hover:bg-blue-700 text-black">
                View Calendar
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div>
              <CalendarView
                events={calendarEvents}
                isLoading={eventsLoading}
                error={eventsError}
              />
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">
                Upcoming Events
              </h4>
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
    <div className="rounded-2xl bg-gray-800 p-6 shadow-lg border border-gray-700 transition-transform hover:scale-105">
      <div className="text-sm font-medium text-gray-400 mb-2">{title}</div>
      <div className="text-4xl font-bold text-white">{value}</div>
    </div>
  );
}
