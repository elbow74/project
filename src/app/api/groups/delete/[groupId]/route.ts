import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdFromSession, deleteGroup } from "@/lib/db";
import { db } from "@/lib/firebase-admin";
import { Group } from "@/types";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const userId = await getCurrentUserIdFromSession(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;

    // Validate groupId
    if (
      !groupId ||
      typeof groupId !== "string" ||
      groupId.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    // Verify group exists and user is owner
    const groupRef = db.collection("groups").doc(groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const groupData = groupDoc.data() as Group;
    if (groupData.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only the group owner can delete the group" },
        { status: 403 }
      );
    }

    await deleteGroup(groupId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete group:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete group";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
