// /app/api/google/revoke/route.ts
// API endpoint to revoke Google Calendar permissions

import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUserIdFromSession,
  getRefreshTokenForUser,
  deleteCredentialsForUser,
} from "@/lib/db";
import { revokeToken } from "@/lib/google-token-refresh";

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user's Firebase UID
    const userId = await getCurrentUserIdFromSession(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's refresh token
    const refreshToken = await getRefreshTokenForUser(userId);
    if (refreshToken) {
      // Revoke the token with Google
      await revokeToken(refreshToken);
    }

    // Delete credentials from Firestore
    await deleteCredentialsForUser(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Token revocation error:", error);
    return NextResponse.json(
      { error: "Failed to revoke token" },
      { status: 500 }
    );
  }
}
