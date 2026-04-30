// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import {
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
} from "../../../../lib/auth";
import { loginSchema } from "../../../../lib/validations";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { emailOrUsername, password } = loginSchema.parse(body);

    // Look up user by email or username
    const isEmail = emailOrUsername.includes("@");
    const user = await db.user.findFirst({
      where: isEmail
        ? { email: emailOrUsername }
        : { username: emailOrUsername },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isVerified: true,
        passwordHash: true,
      },
    });

    if (!user) {
      // Generic error to prevent user enumeration
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update last seen & online status
    await db.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() },
    });

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
    });
    const refreshToken = signRefreshToken(user.id);

    // Clean up old tokens + create new one
    await db.$transaction([
      db.refreshToken.deleteMany({
        where: { userId: user.id, expiresAt: { lt: new Date() } },
      }),
      db.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    await setAuthCookies(accessToken, refreshToken);

    const { passwordHash: _, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      message: "Logged in successfully",
      data: { user: safeUser, accessToken },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error("[LOGIN_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
