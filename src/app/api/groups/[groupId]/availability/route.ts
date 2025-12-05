import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdFromSession } from "@/lib/db";
import { getRefreshTokenForUser } from "@/lib/db";
import { refreshAccessToken } from "@/lib/google-token-refresh";
import { db } from "@/lib/firebase-admin";
import { Group } from "@/types";

async function getAccessTokenForUser(userId: string): Promise<string | null> {
  try {
    const refreshToken = await getRefreshTokenForUser(userId);
    if (refreshToken == null) {
      return null;
    }
    const { access_token } = await refreshAccessToken(refreshToken);
    return access_token;
  } catch (error) {
    console.error(`Failed to get access token for user ${userId}:`, error);
    return null;
  }
}

async function getEventsForUser(
  userId: string,
  timeMin: string,
  timeMax: string
) {
  const accessToken = await getAccessTokenForUser(userId);
  if (!accessToken) {
    return [];
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        `Failed to fetch events for user ${userId}:`,
        response.status
      );
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error(`Error fetching events for user ${userId}:`, error);
    return [];
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const requesterId = await getCurrentUserIdFromSession(req);
    if (!requesterId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;
    const url = new URL(req.url);
    const timeMin = url.searchParams.get("timeMin");
    const timeMax = url.searchParams.get("timeMax");

    if (!timeMin || !timeMax) {
      return NextResponse.json(
        { error: "timeMin and timeMax are required" },
        { status: 400 }
      );
    }

    // Get group
    const groupDoc = await db.collection("groups").doc(groupId).get();
    if (!groupDoc.exists) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const group = groupDoc.data() as Group;
    if (!group.memberIds || group.memberIds.length === 0) {
      return NextResponse.json({ events: {} });
    }

    // Fetch events for all members
    const memberEvents: Record<string, any[]> = {};
    await Promise.all(
      group.memberIds.map(async (memberId) => {
        const events = await getEventsForUser(memberId, timeMin, timeMax);
        memberEvents[memberId] = events;
      })
    );

    return NextResponse.json({ events: memberEvents });
  } catch (error) {
    console.error("Failed to get group availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch group availability" },
      { status: 500 }
    );
  }
}
