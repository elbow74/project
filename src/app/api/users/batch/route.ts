import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdFromSession } from "@/lib/db";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const requesterId = await getCurrentUserIdFromSession(req);
    if (!requesterId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userIds } = await req.json();

    if (!Array.isArray(userIds)) {
      return NextResponse.json(
        { error: "userIds must be an array" },
        { status: 400 }
      );
    }

    // Fetch all users in parallel
    const users = await Promise.all(
      userIds.map(async (userId: string) => {
        try {
          const userRecord = await adminAuth.getUser(userId);
          return {
            id: userRecord.uid,
            name:
              userRecord.displayName ||
              userRecord.email?.split("@")[0] ||
              "Unknown",
            email: userRecord.email || "",
          };
        } catch {
          return {
            id: userId,
            name: "Unknown User",
            email: "",
          };
        }
      })
    );

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Failed to get users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
