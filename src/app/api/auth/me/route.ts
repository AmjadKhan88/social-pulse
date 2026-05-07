// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromRequest, verifyAccessToken, unauthorizedResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorizedResponse();

    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true, email: true, username: true, displayName: true,
        avatarUrl: true, isVerified: true, isOnline: true, bio: true,
        coverUrl: true, createdAt: true,
      },
    });

    if (!user) return unauthorizedResponse("User not found");

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("[ME_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
