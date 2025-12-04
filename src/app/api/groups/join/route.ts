// /app/api/groups/join/route.ts
// API route for joining a group by code

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdFromSession, joinByCode } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserIdFromSession(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json(
        { error: "Join code is required" },
        { status: 400 }
      );
    }

    const group = await joinByCode(code.trim().toUpperCase(), userId);

    if (!group) {
      return NextResponse.json(
        { error: "Group not found with that code" },
        { status: 404 }
      );
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error("Failed to join group:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to join group";
    return NextResponse.json({ error: errorMessage, status: 500 });
  }
}
