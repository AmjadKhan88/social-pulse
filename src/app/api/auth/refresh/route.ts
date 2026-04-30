// src/app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  getRefreshTokenFromRequest,
} from "../../../../lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = getRefreshTokenFromRequest(req);

    if (!token) {
      return NextResponse.json(
        { success: false, error: "No refresh token" },
        { status: 401 }
      );
    }

    const payload = verifyRefreshToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Verify token exists in DB (rotation check)
    const stored = await db.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });

    if (!stored || stored.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: "Refresh token expired or revoked" },
        { status: 401 }
      );
    }

    const { user } = stored;

    // Rotate tokens (revoke old, issue new)
    const newAccessToken  = signAccessToken({
      sub: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
    });
    const newRefreshToken = signRefreshToken(user.id);

    await db.$transaction([
      db.refreshToken.delete({ where: { token } }),
      db.refreshToken.create({
        data: {
          userId: user.id,
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    await setAuthCookies(newAccessToken, newRefreshToken);

    return NextResponse.json({
      success: true,
      data: { user, accessToken: newAccessToken },
    });
  } catch (error) {
    console.error("[REFRESH_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
