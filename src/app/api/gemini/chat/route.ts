// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdFromSession } from "@/lib/db";
import { GoogleGenAI } from "@google/genai";
import { getRefreshTokenForUser } from "@/lib/db";
import { refreshAccessToken } from "@/lib/google-token-refresh";
import { db } from "@/lib/firebase-admin";
import { adminAuth } from "@/lib/firebase-admin";
import { Group } from "@/types";

// Helper function to get access token for a user
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

// Helper function to fetch events for a user within a time range
async function getEventsForUser(
  userId: string,
  timeMin: string,
  timeMax: string
): Promise<any[]> {
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

// Helper function to get user name by ID
async function getUserName(userId: string): Promise<string> {
  try {
    const userRecord = await adminAuth.getUser(userId);
    return (
      userRecord.displayName ||
      userRecord.email?.split("@")[0] ||
      "Unknown User"
    );
  } catch (error) {
    console.error(`Failed to get user name for ${userId}:`, error);
    return "Unknown User";
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const userId = await getCurrentUserIdFromSession(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const { message, calendarData: clientCalendarData, groupId } = body;

    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // 3. Determine calendar data source and fetch if needed
    let calendarData = "";
    let isGroupContext = false;
    let groupName = "";

    if (groupId) {
      // Group context: fetch calendar events for all group members
      try {
        const groupDoc = await db.collection("groups").doc(groupId).get();
        if (!groupDoc.exists) {
          return NextResponse.json(
            { error: "Group not found" },
            { status: 404 }
          );
        }

        const group = groupDoc.data() as Group;
        groupName = group.name || "the group";
        isGroupContext = true;

        if (!group.memberIds || group.memberIds.length === 0) {
          calendarData = "No members in this group.";
        } else {
          // Calculate time range (next 30 days)
          const now = new Date();
          const timeMin = now.toISOString();
          const timeMax = new Date(
            now.getTime() + 30 * 24 * 60 * 60 * 1000
          ).toISOString();

          // Fetch events for all group members
          const memberEvents: Record<string, any[]> = {};
          const memberNames: Record<string, string> = {};

          await Promise.all(
            group.memberIds.map(async (memberId) => {
              const events = await getEventsForUser(memberId, timeMin, timeMax);
              memberEvents[memberId] = events;
              memberNames[memberId] = await getUserName(memberId);
            })
          );

          // Format calendar data with member information
          const formattedData: Record<string, any> = {};
          for (const [memberId, events] of Object.entries(memberEvents)) {
            formattedData[memberNames[memberId]] = events;
          }

          calendarData = JSON.stringify({
            groupName: groupName,
            members: formattedData,
          });
        }
      } catch (error) {
        console.error("Failed to fetch group calendar data:", error);
        return NextResponse.json(
          { error: "Failed to fetch group calendar data" },
          { status: 500 }
        );
      }
    } else if (clientCalendarData && Array.isArray(clientCalendarData)) {
      // Use client-provided calendar data
      calendarData = JSON.stringify(clientCalendarData);
    } else {
      // Fallback: Fetch current user's calendar events
      try {
        const refreshToken = await getRefreshTokenForUser(userId);
        if (refreshToken) {
          const { access_token } = await refreshAccessToken(refreshToken);
          const eventsResponse = await fetch(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            {
              headers: { Authorization: `Bearer ${access_token}` },
            }
          );
          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            calendarData = JSON.stringify(eventsData.items || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch calendar data:", error);
        // Continue without calendar data
      }
    }

    // 4. Initialize Gemini client
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const systemInstructionText = isGroupContext
      ? `You are a calendar assistant for a group named "${groupName}". You will receive calendar data for all members.

Rules:

Use only the provided calendar data for events, but you must calculate free time yourself.

You may not invent new events, but you must compute availability from the event times.

List only the events that occur on the date the user asks about.

Do not include explanations, reasoning, or commentary.

If no events exist for a member on the requested date, write: "Name: No scheduled events".

If the user asks about something not related to schedule or availability, reply: "This information is not available in the group's calendar data."

Formatting (strict):
Respond in minimal Markdown with these sections, in this order when relevant:

Events
Format each event as:
Name: "Event title" — HH:MM–HH:MM (time zone)

Converted Times (only if requested)

Common Free Time
List only the exact time ranges when all members have no events for that entire day, calculated from their schedules.

Output requirements:

No explanations, no descriptions, no reasoning text.

No extra sentences beyond the structured sections.

Keep all responses extremely concise.`
      : `You are a calendar assistant for an individual user. Use ONLY the provided calendar data to answer questions about the user's schedule. Respond concisely in minimal Markdown. If the user asks something not present in the calendar data, reply: "This information is not in your calendar."`;

    const config = {
      thinkingConfig: {
        thinkingBudget: 0,
      },
      tools: [
        {
          googleSearch: {},
        },
      ],
      systemInstruction: [
        {
          text: systemInstructionText,
        },
      ],
    };

    // 6. Build the prompt with calendar data
    const contextLabel = isGroupContext
      ? `Group Calendar Data for "${groupName}":`
      : "Calendar Data:";
    const userPrompt = calendarData
      ? `${contextLabel}\n${calendarData}\n\nUser Question: ${message}`
      : `User Question: ${message}`;

    // 7. Build conversation contents
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: userPrompt,
          },
        ],
      },
    ];

    // 8. Call Gemini API (streaming or non-streaming)
    const model = "gemini-flash-lite-latest";
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    // 9. Collect streamed response
    let fullResponse = "";
    for await (const chunk of response) {
      if (chunk.text) {
        fullResponse += chunk.text;
      }
    }

    // 10. Post-process and return response
    // - normalize bullets
    // - remove [Note: ...] annotations
    // - strip ALL '*' characters so no bold/italic stars show up
    // - collapse extra blank lines
    let cleaned = fullResponse
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => {
        // Normalize leading bullets (* or -) to "- "
        const bulletNormalized = line.replace(/^\s*[-*]\s+/, "- ");
        // Remove [Note: ...] annotations
        const noNote = bulletNormalized.replace(/\[Note:[^\]]*\]/g, "");
        return noNote.trimEnd();
      })
      .join("\n");

    // Remove all remaining asterisks (Markdown bold/italic markers)
    cleaned = cleaned.replace(/\*/g, "");

    // Collapse 3+ blank lines into 2 and trim
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

    return NextResponse.json({
      response: cleaned,
      message: message,
    });
  } catch (error) {
    console.error("Failed to process Gemini chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
