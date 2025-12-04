import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdFromSession } from "@/lib/db";
import { adminAuth } from "@/lib/firebase-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify requester is authenticated
    const requesterId = await getCurrentUserIdFromSession(req);
    if (!requesterId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    // Get user info from Firebase Auth
    const userRecord = await adminAuth.getUser(userId);

    return NextResponse.json({
      id: userRecord.uid,
      name:
        userRecord.displayName || userRecord.email?.split("@")[0] || "Unknown",
      email: userRecord.email || "",
    });
  } catch (error) {
    console.error("Failed to get user:", error);
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}
