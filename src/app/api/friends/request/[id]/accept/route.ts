// src/app/api/friends/request/[id]/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { getTokenFromRequest, verifyAccessToken, unauthorizedResponse } from "../../../../../../lib/auth";

type Params = { params: Promise<{ id: string }> };

// POST — Accept friend request (id = sender's userId)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: senderId } = await params;
    const token = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorizedResponse();

    const receiverId = payload.sub;

    const request = await db.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } },
    });

    if (!request || request.status !== "PENDING") {
      return NextResponse.json({ success: false, error: "No pending request found" }, { status: 404 });
    }

    await db.$transaction([
      db.friendRequest.update({ where: { id: request.id }, data: { status: "ACCEPTED" } }),
      db.friendship.create({ data: { userAId: senderId, userBId: receiverId } }),
      db.notification.create({
        data: {
          recipientId: senderId,
          triggerId:   receiverId,
          type:        "FRIEND_ACCEPT",
          entityId:    receiverId,
          entityType:  "user",
          message:     "accepted your friend request",
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Friend request accepted" });
  } catch (error) {
    console.error("[ACCEPT_REQUEST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
