// /lib/pkce.ts
// PKCE = Proof Key for Code Exchange. These helpers generate the "verifier" and "challenge"
// that protect your OAuth code from interception attacks in public clients.

/** Convert binary to URL-safe base64 (no + / =) per RFC 4648 */
export function base64url(buffer: ArrayBuffer) {
  const bytes = Buffer.from(buffer);
  return bytes
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/** Create a cryptographically-strong random string (the PKCE code_verifier) */
export function randomString(bytes = 32) {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)).buffer);
}

/** Compute SHA-256 hash of the verifier, then base64url it (the PKCE code_challenge) */
export async function sha256(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64url(digest);
}

/** Make a PKCE pair: the private "verifier" and the public "challenge" */
export async function makePkcePair() {
  const verifier = randomString(32); // keep this server-side (secret)
  const challenge = await sha256(verifier); // send this to Google (public)
  return { verifier, challenge };
}
