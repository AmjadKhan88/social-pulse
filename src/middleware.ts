// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, verifyRefreshToken } from "@/lib/auth";

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/feed",
  "/profile",
  "/friends",
  "/notifications",
  "/settings",
  "/search",
];

// Routes only accessible when NOT authenticated
const AUTH_ROUTES = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Token extraction ──────────────────────
  const accessToken  = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  const isAccessValid  = accessToken  ? !!verifyAccessToken(accessToken)  : false;
  const isRefreshValid = refreshToken ? !!verifyRefreshToken(refreshToken) : false;
  const isAuthenticated = isAccessValid || isRefreshValid;

  // ── Guard protected routes ─────────────────
  const isProtectedRoute = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Redirect authenticated users away from auth pages
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/feed", req.url));
  }

  // ── Allow API routes to handle their own auth ──
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
