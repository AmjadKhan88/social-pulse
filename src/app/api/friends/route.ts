// src/app/api/friends/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { getTokenFromRequest, verifyAccessToken, unauthorizedResponse } from "../../../lib/auth";
import { paginationSchema } from "../../../lib/validations";

const friendUserSelect = {
  id: true, username: true, displayName: true,
  avatarUrl: true, isVerified: true, isOnline: true, lastSeen: true,
};

// GET /api/friends — List friends or friend requests
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const type   = searchParams.get("type") ?? "friends"; // "friends" | "requests" | "suggestions"
    const userId = searchParams.get("userId") ?? payload.sub;
    const { cursor, limit } = paginationSchema.parse({
      cursor: searchParams.get("cursor") ?? undefined,
      limit:  searchParams.get("limit")  ?? undefined,
    });

    if (type === "requests") {
      // Incoming friend requests
      const requests = await db.friendRequest.findMany({
        where: { receiverId: payload.sub, status: "PENDING" },
        include: { sender: { select: friendUserSelect } },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      const hasMore    = requests.length > limit;
      const items      = hasMore ? requests.slice(0, -1) : requests;
      const nextCursor = hasMore ? items[items.length - 1].id : null;
      return NextResponse.json({ success: true, data: { items, nextCursor, hasMore } });
    }

    if (type === "suggestions") {
      // Friend suggestions: friends-of-friends not already connected
      const myFriendIds = await getMyFriendIds(userId);
      const fofIds: string[] = [];
      for (const fid of myFriendIds.slice(0, 10)) {
        const fofIds2 = await getMyFriendIds(fid);
        fofIds.push(...fofIds2);
      }
      const candidates = [...new Set(fofIds)].filter(
        (id) => id !== userId && !myFriendIds.includes(id)
      );

      const users = await db.user.findMany({
        where: { id: { in: candidates.slice(0, limit) } },
        select: friendUserSelect,
      });
      return NextResponse.json({ success: true, data: { items: users, nextCursor: null, hasMore: false } });
    }

    // Default: list friends
    const friendships = await db.friendship.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      select: {
        id: true,
        createdAt: true,
        userA: { select: friendUserSelect },
        userB: { select: friendUserSelect },
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore    = friendships.length > limit;
    const items      = hasMore ? friendships.slice(0, -1) : friendships;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const mapped = items.map((f) => ({
      id:        f.id,
      createdAt: f.createdAt,
      friend:    f.userAId === userId ? f.userB : f.userA,
    }));

    return NextResponse.json({ success: true, data: { items: mapped, nextCursor, hasMore } });
  } catch (error) {
    console.error("[GET_FRIENDS_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

async function getMyFriendIds(userId: string): Promise<string[]> {
  const fs = await db.friendship.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    select: { userAId: true, userBId: true },
  });
  return fs.map((f) => (f.userAId === userId ? f.userBId : f.userAId));
}
