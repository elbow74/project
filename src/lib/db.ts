// /lib/db.ts
// Firestore operations for storing and retrieving Google Calendar tokens

import { db } from "./firebase-admin";
import { encrypt, decrypt } from "./encrypt";
import { adminAuth } from "./firebase-admin";
import { Group } from "@/types";
import { FieldValue } from "firebase-admin/firestore";

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

export type group = {
  id: string;
  name: string;
  ownerId: string;
  membersIds: string[];
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

// Group helpers

function generateJoinCode(): string {
  return Math.random().toString(36).substring(2, 15).toUpperCase();
}

export async function createGroup(
  ownerId: string,
  name: string
): Promise<Group> {
  const now = new Date();
  const code = generateJoinCode();

  // Prepare Firestore doc reference (auto-generates a unique group ID)
  const groupsRef = db.collection("groups").doc();

  const group: Group = {
    id: groupsRef.id,
    name: name,
    ownerId: ownerId,
    code: code,
    memberIds: [ownerId],
    createdAt: now,
    updatedAt: now,
  };

  // Write the group object to Firestore
  await groupsRef.set(group);
  return group;
}

export async function joinByCode(
  code: string,
  userId: string
): Promise<Group | null> {
  const matchingDoc = await db
    .collection("groups")
    .where("code", "==", code)
    .get();

  if (matchingDoc.empty) {
    return null;
  }

  const doc = matchingDoc.docs[0];
  const groupId = doc.id;
  const now = new Date();
  const groupData = doc.data() as Group;

  if (groupData.memberIds && groupData.memberIds.includes(userId)) {
    throw new Error("You are already a member of this group");
  }

  if (groupData.ownerId === userId) {
    throw new Error("You cannot join your own group");
  }

  await doc.ref.update({
    memberIds: FieldValue.arrayUnion(userId),
    updatedAt: now,
  });

  const data = doc.data() as Group;
  return { ...data, id: groupId };
}

export async function getGroupsForUser(userId: string): Promise<Group[]> {
  const groupsRef = await db
    .collection("groups")
    .where("memberIds", "array-contains", userId)
    .get();

  // Map each document to a Group object, including the document ID
  return groupsRef.docs.map((doc) => {
    const data = doc.data() as Group;
    return { ...data, id: doc.id };
  });
}

export async function leaveGroup(
  groupId: string,
  userId: string
): Promise<void> {
  const groupRef = db.collection("groups").doc(groupId);
  const group = await groupRef.get();
  if (!group.exists) {
    throw new Error("Group not found");
  }
  const groupData = group.data() as Group;
  if (groupData.ownerId === userId) {
    throw new Error("You cannot leave your own group");
  }

  if (!groupData.memberIds || !groupData.memberIds.includes(userId)) {
    throw new Error("You are not a member of this group");
  }

  await groupRef.update({
    memberIds: FieldValue.arrayRemove(userId),
    updatedAt: new Date(),
  });
}

export async function deleteGroup(groupId: string): Promise<void> {
  await db.collection("groups").doc(groupId).delete();
}
