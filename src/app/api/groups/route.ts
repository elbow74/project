// /app/api/groups/route.ts
// API routes for group operations

import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUserIdFromSession,
  createGroup,
  getGroupsForUser,
} from "@/lib/db";

/**
 * GET - Get all groups for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserIdFromSession(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groups = await getGroupsForUser(userId);
    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Failed to get groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new group
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserIdFromSession(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    const group = await createGroup(userId, name.trim());
    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error("Failed to create group:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
