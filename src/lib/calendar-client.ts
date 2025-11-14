// /lib/calendar-client.ts
// Client-side functions for fetching calendar events from the API

/**
 * Fetch calendar events for the current user
 */
export async function fetchCalendarEvents(
  idToken: string
): Promise<{ events: any[] } | null> {
  try {
    const response = await fetch("/api/calendar/events", {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null; // User not authorized
      }
      throw new Error(`Failed to fetch events: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return null;
  }
}
