// src/app/api/friends/request/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { getTokenFromRequest, verifyAccessToken, unauthorizedResponse } from "../../../../../lib/auth";

type Params = { params: Promise<{ id: string }> };

// POST — Send friend request
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: receiverId } = await params;
    const token = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorizedResponse();

    const senderId = payload.sub;

    if (senderId === receiverId) {
      return NextResponse.json({ success: false, error: "Cannot friend yourself" }, { status: 400 });
    }

    // Check if blocked
    const blocked = await db.block.findFirst({
      where: {
        OR: [
          { blockingId: senderId, blockedId: receiverId },
          { blockingId: receiverId, blockedId: senderId },
        ],
      },
    });
    if (blocked) return NextResponse.json({ success: false, error: "Action not allowed" }, { status: 403 });

    // Check already friends
    const existing = await db.friendship.findFirst({
      where: {
        OR: [
          { userAId: senderId, userBId: receiverId },
          { userAId: receiverId, userBId: senderId },
        ],
      },
    });
    if (existing) return NextResponse.json({ success: false, error: "Already friends" }, { status: 409 });

    // Check existing request
    const pendingRequest = await db.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } },
    });
    if (pendingRequest) return NextResponse.json({ success: false, error: "Request already sent" }, { status: 409 });

    // If they already sent us one, auto-accept
    const reverseRequest = await db.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId: receiverId, receiverId: senderId } },
    });

    if (reverseRequest) {
      // Auto-accept
      await db.$transaction([
        db.friendRequest.update({ where: { id: reverseRequest.id }, data: { status: "ACCEPTED" } }),
        db.friendship.create({ data: { userAId: senderId, userBId: receiverId } }),
      ]);
      return NextResponse.json({ success: true, message: "Friend request accepted automatically" });
    }

    const request = await db.$transaction(async (tx) => {
      const req = await tx.friendRequest.create({ data: { senderId, receiverId, status: "PENDING" } });
      await tx.notification.create({
        data: {
          recipientId: receiverId,
          triggerId:   senderId,
          type:        "FRIEND_REQUEST",
          entityId:    req.id,
          entityType:  "friend_request",
          message:     "sent you a friend request",
        },
      });
      return req;
    });

    return NextResponse.json({ success: true, message: "Friend request sent", data: request }, { status: 201 });
  } catch (error) {
    console.error("[FRIEND_REQUEST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — Cancel sent friend request
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id: receiverId } = await params;
    const token = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorizedResponse();

    await db.friendRequest.deleteMany({
      where: { senderId: payload.sub, receiverId, status: "PENDING" },
    });

    return NextResponse.json({ success: true, message: "Request cancelled" });
  } catch (error) {
    console.error("[CANCEL_REQUEST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
