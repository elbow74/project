// /lib/google-token-refresh.ts
// Google OAuth token refresh utilities

const TOKEN_URL = "https://oauth2.googleapis.com/token";

const { GOOGLE_CLIENT_ID = "", GOOGLE_CLIENT_SECRET = "" } = process.env;

/**
 * Refresh an expired Google access token using the refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: "Bearer";
}> {
  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${text}`);
  }

  return (await res.json()) as {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: "Bearer";
  };
}

/**
 * Revoke a Google refresh token
 */
export async function revokeToken(token: string): Promise<void> {
  const body = new URLSearchParams({
    token,
  });

  const res = await fetch("https://oauth2.googleapis.com/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token revocation failed: ${res.status} ${text}`);
  }
}
