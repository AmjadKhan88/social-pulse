// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = [
  "/feed",
  "/profile",
  "/friends",
  "/notifications",
  "/settings",
  "/search",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasAuthCookie =
    !!req.cookies.get("access_token")?.value ||
    !!req.cookies.get("refresh_token")?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !hasAuthCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
