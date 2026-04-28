// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  clearAuthCookies,
  getRefreshTokenFromRequest,
  getTokenFromRequest,
  verifyAccessToken,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);
    const accessToken  = getTokenFromRequest(req);

    // Mark user offline
    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      if (payload) {
        await db.user.update({
          where: { id: payload.sub },
          data: { isOnline: false, lastSeen: new Date() },
        }).catch(() => null);
      }
    }

    // Invalidate refresh token from DB
    if (refreshToken) {
      await db.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => null);
    }

    await clearAuthCookies();

    return NextResponse.json({ success: true, message: "Logged out" });
  } catch (error) {
    console.error("[LOGOUT_ERROR]", error);
    // Always clear cookies regardless of errors
    await clearAuthCookies();
    return NextResponse.json({ success: true, message: "Logged out" });
  }
}
