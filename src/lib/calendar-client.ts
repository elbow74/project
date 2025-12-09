// src/lib/calendar-client.ts
// Client-side functions for fetching calendar events from the API

export type CalendarEventsResponse = {
  events: any[];
};

/**
 * Fetch calendar events for the current user (client-side helper).
 */
export async function fetchCalendarEvents(
  idToken: string
): Promise<CalendarEventsResponse | null> {
  try {
    const response = await fetch("/api/calendar/events", {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      // Treat auth failures as "no events" rather than crashing the UI
      if (response.status === 401 || response.status === 403) {
        console.warn("User not authorized to fetch calendar events");
        return null;
      }

      console.error("Failed to fetch events:", response.status);
      return null;
    }

    const data = (await response.json()) as CalendarEventsResponse;
    return data;
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return null;
  }
}
