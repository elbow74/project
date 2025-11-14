// /lib/google-oauth.ts
// Centralizes Google OAuth configuration and token exchange logic.

const OAUTH_ROOT = "https://accounts.google.com/o/oauth2/v2/auth"; // Google authorization endpoint (user sees this screen)
const TOKEN_URL = "https://oauth2.googleapis.com/token"; // Google token endpoint (server-to-server exchange)

const {
  GOOGLE_CLIENT_ID = "",
  GOOGLE_CLIENT_SECRET = "",
  NEXT_PUBLIC_BASE_URL = "", // e.g., http://localhost:3000 or https://your-domain.com
} = process.env;

// Validate required environment variables
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !NEXT_PUBLIC_BASE_URL) {
  console.warn(
    "Missing Google OAuth environment variables. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and NEXT_PUBLIC_BASE_URL in .env.local"
  );
}

// Minimal scope that allows reading calendars and calling FreeBusy.
// (There is no free/busy-only scope.)
export const CALENDAR_READONLY_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";

/**
 * Build the Google authorization URL that we will redirect the user to.
 * Includes PKCE (code_challenge), CSRF state, and requests a refresh_token (access_type=offline).
 */
export function buildAuthUrl(params: { state: string; codeChallenge: string }) {
  const qp = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID, // identifies YOUR OAuth client
    redirect_uri: `${NEXT_PUBLIC_BASE_URL}/api/google/callback`, // must match the allowed URI in Google Cloud
    response_type: "code", // we want an authorization code back
    scope: `openid email profile ${CALENDAR_READONLY_SCOPE}`, // basic identity + calendar.readonly
    access_type: "offline", // ask for a refresh_token
    include_granted_scopes: "true", // incremental auth (keep old scopes)
    prompt: "consent", // ensure consent appears for new scopes
    state: params.state, // CSRF protection (we’ll verify it on callback)
    code_challenge: params.codeChallenge, // PKCE public challenge
    code_challenge_method: "S256", // PKCE method: S256
  });
  return `${OAUTH_ROOT}?${qp.toString()}`;
}

/**
 * Exchange the authorization code (plus PKCE verifier) for tokens.
 * Returns an access_token (short-lived) and, the first time, a refresh_token (long-lived).
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
) {
  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID, // who is asking
    client_secret: GOOGLE_CLIENT_SECRET, // proves your server owns the client
    code, // the one-time code from Google
    code_verifier: codeVerifier, // PKCE secret that matches the challenge sent earlier
    grant_type: "authorization_code", // code -> tokens exchange
    redirect_uri: `${NEXT_PUBLIC_BASE_URL}/api/google/callback`, // must match exactly
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    // Surface details for debugging (do not leak in prod logs).
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  // access_token is short-lived; refresh_token is long-lived (save refresh_token server-side)
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string; // will be present the *first* time user grants offline access to this client
    expires_in: number; // seconds until access_token expires
    scope: string;
    id_token?: string; // OpenID Connect identity token (JWT with profile)
    token_type: "Bearer";
  };
}
