// /app/api/google/status/route.ts
// Returns a health/status report for the current user's Google Calendar link

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUserIdFromSession,
  hasGoogleCalendarConnected,
  getRefreshTokenForUser,
} from "@/lib/db";
import { refreshAccessToken } from "@/lib/google-token-refresh";

export async function GET(req: NextRequest) {
  try {
    // 1) Identify the caller
    const userId = await getCurrentUserIdFromSession(req);
    if (!userId)
      return NextResponse.json(
        { connected: false, error: "Unauthorized" },
        { status: 401 }
      );

    // 2) Check if we have a stored credential doc / refresh token
    const hasCred = await hasGoogleCalendarConnected(userId);
    if (!hasCred) {
      return NextResponse.json({
        connected: false,
        step: "missing_refresh_token",
        message: "No refresh token on file. User must connect Google Calendar.",
      });
    }

    // 3) Try to mint an access token
    const refreshToken = await getRefreshTokenForUser(userId);
    if (!refreshToken) {
      return NextResponse.json({
        connected: false,
        step: "missing_refresh_token_value",
        message:
          "Credential doc exists but refresh token could not be read/decrypted.",
      });
    }

    let accessToken: string | null = null;
    let expiresIn: number | null = null;
    try {
      const { access_token, expires_in } = await refreshAccessToken(
        refreshToken
      );
      accessToken = access_token;
      expiresIn = expires_in;
    } catch (e) {
      return NextResponse.json({
        connected: false,
        step: "refresh_failed",
        message: "Refresh token invalid or revoked. User must reconnect.",
      });
    }

    // 4) Make a minimal Google API probe (freeBusy for 'primary' in a tiny window)
    let canAccess = false;
    try {
      const now = new Date();
      const in5min = new Date(now.getTime() + 5 * 60 * 1000);
      const probe = await fetch(
        "https://www.googleapis.com/calendar/v3/freeBusy",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            timeMin: now.toISOString(),
            timeMax: in5min.toISOString(),
            items: [{ id: "primary" }],
          }),
        }
      );
      canAccess = probe.ok;
    } catch {
      canAccess = false;
    }

    return NextResponse.json({
      connected: true,
      canRefresh: !!accessToken,
      canAccessCalendar: canAccess,
      accessTokenExpiresInSec: expiresIn,
    });
  } catch (err) {
    console.error("status route error:", err);
    return NextResponse.json(
      { connected: false, error: "Unknown error" },
      { status: 500 }
    );
  }
}
