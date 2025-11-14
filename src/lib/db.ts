// /lib/db.ts
// Firestore operations for storing and retrieving Google Calendar tokens

import { db } from "./firebase-admin";
import { encrypt, decrypt } from "./encrypt";
import { adminAuth } from "./firebase-admin";

type GoogleCredential = {
  userId: string;
  provider: "google";
  scope: string;
  refreshToken: string; // ENCRYPTED
  accessToken?: string; // Optional, short-lived
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Save the user's Google refresh token (ENCRYPTED) to Firestore
 */
export async function saveRefreshTokenForUser(
  userId: string,
  refreshToken: string
): Promise<void> {
  const encryptedToken = encrypt(refreshToken);

  const credential: GoogleCredential = {
    userId,
    provider: "google",
    scope: "calendar.readonly",
    refreshToken: encryptedToken,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Upsert into Firestore
  await db
    .collection("user_credentials")
    .doc(userId)
    .set(credential, { merge: true });
}

/**
 * Get encrypted refresh token for a user
 */
export async function getRefreshTokenForUser(
  userId: string
): Promise<string | null> {
  const doc = await db.collection("user_credentials").doc(userId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data() as GoogleCredential;
  if (!data.refreshToken) {
    return null;
  }

  // Decrypt and return
  try {
    return decrypt(data.refreshToken);
  } catch (e) {
    console.error("Failed to decrypt refresh token:", e);
    return null;
  }
}

/**
 * Check if user has connected their Google Calendar
 */
export async function hasGoogleCalendarConnected(
  userId: string
): Promise<boolean> {
  const doc = await db.collection("user_credentials").doc(userId).get();
  return doc.exists && !!doc.data()?.refreshToken;
}

/**
 * Delete user's Google Calendar credentials
 */
export async function deleteCredentialsForUser(userId: string): Promise<void> {
  await db.collection("user_credentials").doc(userId).delete();
}

/**
 * Get the current user's Firebase UID from the Firebase ID token in request headers
 */
export async function getCurrentUserIdFromSession(
  req: Request
): Promise<string | null> {
  try {
    // Extract Firebase ID token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const idToken = authHeader.split("Bearer ")[1];

    // Verify the token and get the user's UID
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error("Failed to verify Firebase ID token:", error);
    return null;
  }
}
