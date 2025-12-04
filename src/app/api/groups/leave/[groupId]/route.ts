import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdFromSession, leaveGroup } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const userId = await getCurrentUserIdFromSession(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;
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

    await leaveGroup(groupId, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to leave group:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to leave group";
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes("not found") ? 404 : 400 }
    );
  }
}
