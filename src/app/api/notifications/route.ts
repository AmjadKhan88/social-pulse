// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { getTokenFromRequest, verifyAccessToken, unauthorizedResponse } from "../../../lib/auth";
import { paginationSchema } from "../../../lib/validations";

// GET /api/notifications
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const { cursor, limit } = paginationSchema.parse({
      cursor: searchParams.get("cursor") ?? undefined,
      limit:  searchParams.get("limit")  ?? undefined,
    });
    const unreadOnly = searchParams.get("unread") === "true";

    const notifications = await db.notification.findMany({
      where: {
        recipientId: payload.sub,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      include: {
        trigger: {
          select: {
            id: true, username: true, displayName: true, avatarUrl: true, isVerified: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take:    limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore    = notifications.length > limit;
    const items      = hasMore ? notifications.slice(0, -1) : notifications;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const unreadCount = await db.notification.count({
      where: { recipientId: payload.sub, isRead: false },
    });

    return NextResponse.json({
      success: true,
      data: { items, nextCursor, hasMore, unreadCount },
    });
  } catch (error) {
    console.error("[GET_NOTIFICATIONS_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/notifications — Mark all as read
export async function PATCH(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorizedResponse();

    await db.notification.updateMany({
      where: { recipientId: payload.sub, isRead: false },
      data:  { isRead: true },
    });

    return NextResponse.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("[MARK_READ_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
