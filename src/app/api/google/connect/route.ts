// /app/api/google/connect/route.ts
// When the user clicks "Connect Google Calendar", they hit this endpoint.
// We generate PKCE + state, stash them in HttpOnly cookies, and redirect to Google.

import { NextRequest, NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/google-oauth";
import { makePkcePair } from "@/lib/pkce";
import { getCurrentUserIdFromSession } from "@/lib/db";

export async function GET(req: NextRequest) {
  const userId = req.cookies.get("gcal_oauth_userid")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } // Create CSRF state and PKCE pair for this OAuth attempt
  const state = crypto.randomUUID(); // CSRF token to tie the callback to this request
  const { verifier, challenge } = await makePkcePair(); // PKCE: secret verifier + public challenge

  // Build the Google authorization URL (includes PKCE and state)
  const url = buildAuthUrl({ state, codeChallenge: challenge });

  // Store state & verifier & userId in HttpOnly cookies so the callback route can read and verify them.
  // HttpOnly: not readable by JS; maxAge short since this is transient.
  // secure: only true in production (HTTPS)
  const isProduction = process.env.NODE_ENV === "production";
  const res = NextResponse.redirect(url);
  res.cookies.set("gcal_oauth_state", state, {
    httpOnly: true,
    secure: isProduction,
    path: "/",
    sameSite: "lax",
    maxAge: 300,
  });
  res.cookies.set("gcal_oauth_verifier", verifier, {
    httpOnly: true,
    secure: isProduction,
    path: "/",
    sameSite: "lax",
    maxAge: 300,
  });
  res.cookies.set("gcal_oauth_userid", userId, {
    httpOnly: true,
    secure: isProduction,
    path: "/",
    sameSite: "lax",
    maxAge: 300,
  });

  return res;
}
