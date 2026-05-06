// src/app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromRequest, verifyAccessToken } from "@/lib/auth";
import { searchSchema } from "@/lib/validations";
import { ZodError } from "zod";

export async function GET(req: NextRequest) {
  try {
    const token   = getTokenFromRequest(req);
    const payload = token ? verifyAccessToken(token) : null;

    const { searchParams } = new URL(req.url);
    const { q, type, limit } = searchSchema.parse({
      q:    searchParams.get("q")     ?? "",
      type: searchParams.get("type")  ?? "all",
      limit: searchParams.get("limit") ?? undefined,
    });

    const query = q.trim();
    if (!query) {
      return NextResponse.json({ success: true, data: { users: [], posts: [] } });
    }

    const results: { users?: unknown[]; posts?: unknown[] } = {};

    // ── Search Users ──────────────────────────────
    if (type === "users" || type === "all") {
      const users = await db.user.findMany({
        where: {
          OR: [
            { username:    { contains: query, mode: "insensitive" } },
            { displayName: { contains: query, mode: "insensitive" } },
          ],
          // Respect blocked users
          ...(payload?.sub
            ? {
                blockedBy: { none: { blockingId: payload.sub } },
                blockedUsers: { none: { blockedId: payload.sub } },
              }
            : {}),
        },
        select: {
          id: true, username: true, displayName: true,
          avatarUrl: true, isVerified: true, isOnline: true,
          bio: true, _count: { select: { friendshipsA: true, friendshipsB: true } },
        },
        take: type === "all" ? Math.ceil(limit / 2) : limit,
        orderBy: [
          // Exact matches first
          { username: "asc" },
        ],
      });
      results.users = users;
    }

    // ── Search Posts ──────────────────────────────
    if (type === "posts" || type === "all") {
      const posts = await db.post.findMany({
        where: {
          content: { contains: query, mode: "insensitive" },
          audience: payload?.sub ? { in: ["PUBLIC", "FRIENDS"] } : "PUBLIC",
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          audience: true,
          author: {
            select: {
              id: true, username: true, displayName: true, avatarUrl: true, isVerified: true,
            },
          },
          _count: { select: { likes: true, comments: true } },
          media: { include: { media: true }, take: 1 },
        },
        take: type === "all" ? Math.floor(limit / 2) : limit,
        orderBy: { createdAt: "desc" },
      });
      results.posts = posts;
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid search parameters" },
        { status: 400 }
      );
    }
    console.error("[SEARCH_ERROR]", error);
    return NextResponse.json({ success: false, error: "Search failed" }, { status: 500 });
  }
}
