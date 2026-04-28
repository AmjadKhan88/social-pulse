// src/lib/auth.ts
// Authentication utilities — JWT signing, verification, cookie management

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { JWTPayload, AuthUser } from "../types/index";

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";

// ─────────────────────────────────────────
// PASSWORD HASHING
// ─────────────────────────────────────────
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

// ─────────────────────────────────────────
// JWT TOKENS
// ─────────────────────────────────────────
export function signAccessToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions);
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as { sub: string };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────
// COOKIE MANAGEMENT
// ─────────────────────────────────────────
const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === "true",
  sameSite: (process.env.COOKIE_SAME_SITE ?? "lax") as "lax" | "strict" | "none",
  path: "/",
};

export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set("access_token", accessToken, {
    ...COOKIE_CONFIG,
    maxAge: 60 * 15,             // 15 minutes
  });

  cookieStore.set("refresh_token", refreshToken, {
    ...COOKIE_CONFIG,
    maxAge: 60 * 60 * 24 * 7,   // 7 days
  });
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
}

// ─────────────────────────────────────────
// REQUEST AUTH EXTRACTION
// ─────────────────────────────────────────
export function getTokenFromRequest(req: NextRequest): string | null {
  // 1. Try HTTP-only cookie
  const cookie = req.cookies.get("access_token")?.value;
  if (cookie) return cookie;

  // 2. Try Authorization header (for mobile/API clients)
  const bearer = req.headers.get("Authorization");
  if (bearer?.startsWith("Bearer ")) return bearer.slice(7);

  return null;
}

export function getRefreshTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get("refresh_token")?.value ?? null;
}

// ─────────────────────────────────────────
// SERVER-SIDE AUTH CHECK
// ─────────────────────────────────────────
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return null;

    const payload = verifyAccessToken(token);
    if (!payload) return null;

    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      displayName: payload.displayName ?? payload.username,
      avatarUrl: payload.avatarUrl ?? null,
      isVerified: payload.isVerified ?? false,
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────
// MIDDLEWARE AUTH GUARD (for API routes)
// ─────────────────────────────────────────
export function unauthorizedResponse(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden"): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

// Extend JWTPayload to include user fields we embed in the token
declare module "../types" {
  interface JWTPayload {
    displayName?: string;
    avatarUrl?: string | null;
    isVerified?: boolean;
  }
}
