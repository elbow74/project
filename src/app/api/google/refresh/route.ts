// /app/api/google/refresh/route.ts
// API endpoint to refresh Google access tokens

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdFromSession, getRefreshTokenForUser } from "@/lib/db";
import { refreshAccessToken } from "@/lib/google-token-refresh";

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user's Firebase UID
    const userId = await getCurrentUserIdFromSession(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's stored refresh token
    const refreshToken = await getRefreshTokenForUser(userId);
    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token found" },
        { status: 404 }
      );
    }

    // Refresh the access token
    const tokens = await refreshAccessToken(refreshToken);

    return NextResponse.json({
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
}
