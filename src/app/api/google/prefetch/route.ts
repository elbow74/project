import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdFromSession } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const uid = await getCurrentUserIdFromSession(req);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isProd = process.env.NODE_ENV === "production";
    const res = NextResponse.json({ ok: true });

    // Stash uid for the very next redirect-only step
    res.cookies.set("gcal_oauth_userid", uid, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 300,
    });

    return res;
  } catch (error) {
    console.error("Prefetch error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
