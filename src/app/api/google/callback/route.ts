// /app/api/google/callback/route.ts
// Google redirects here with ?code=...&state=...
// We verify state, exchange the code for tokens (with the PKCE verifier), and save the refresh token.

import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google-oauth";
import { saveRefreshTokenForUser } from "@/lib/db";

export async function GET(req: NextRequest) {
  // Parse query params Google sent back
  const url = new URL(req.url);
  const code = url.searchParams.get("code"); // one-time code we’ll exchange for tokens
  const state = url.searchParams.get("state"); // must match what we set before redirect

  // Read the server-set cookies for CSRF validation and PKCE secret
  const cookieState = req.cookies.get("gcal_oauth_state")?.value;
  const verifier = req.cookies.get("gcal_oauth_verifier")?.value;
  const userId = req.cookies.get("gcal_oauth_userid")?.value;

  // Basic defense: missing or mismatched state/verifier → abort
  if (
    !code ||
    !state ||
    !cookieState ||
    !verifier ||
    !userId ||
    state !== cookieState
  ) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=oauth_state`
    );
  }

  try {
    // Exchange the code + PKCE verifier for tokens
    const tokens = await exchangeCodeForTokens(code, verifier);

    // We care about the refresh_token (long-lived). The access_token is short-lived.
    const refreshToken = tokens.refresh_token;
    if (!refreshToken) {
      // If you don't get a refresh_token, the user may have already granted access once.
      // For dev, revoke at https://myaccount.google.com/permissions then try again.
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=norefresh`
      );
    }

    // Associate the refresh token with the current signed-in user in YOUR system

    // Persist the (encrypted) refresh token server-side so you can call Calendar later
    await saveRefreshTokenForUser(userId, refreshToken);

    // Clear transient cookies now that the handshake is complete
    const res = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?connected=google-calendar`
    );
    res.cookies.set("gcal_oauth_state", "", { path: "/", maxAge: 0 });
    res.cookies.set("gcal_oauth_verifier", "", { path: "/", maxAge: 0 });
    res.cookies.set("gcal_oauth_userid", "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    console.error("Callback error:", e);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=token`
    );
  }
}
