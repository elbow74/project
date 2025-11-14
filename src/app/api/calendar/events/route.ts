import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCurrentUserIdFromSession, getRefreshTokenForUser } from "@/lib/db";
import { refreshAccessToken } from "@/lib/google-token-refresh";

async function getAccessToken(req: NextRequest): Promise<string | null> {
  try {
    const userId = await getCurrentUserIdFromSession(req);
    if (userId == null) {
      return null;
    }
    const refreshToken = await getRefreshTokenForUser(userId);
    if (refreshToken == null) {
      return null;
    }
    const { access_token } = await refreshAccessToken(refreshToken);
    return access_token;
  } catch (error) {
    console.error("Failed to get access token:", error);
    return null;
  }
}

async function getEvents(accessToken: string) {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Google Calendar API error: ${response.status}`);
  }
  return await response.json();
}

export async function GET(req: NextRequest) {
  try {
    const accessToken = await getAccessToken(req);
    if (accessToken == null) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const events = await getEvents(accessToken);
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Failed to get events:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}
