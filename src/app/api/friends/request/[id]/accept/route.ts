// src/app/api/friends/request/[id]/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromRequest, verifyAccessToken, unauthorizedResponse } from "@/lib/auth";
import { emitRealtimeNotification } from "@/lib/realtime";

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

    const notification = await db.$transaction(async (tx: typeof db) => {
      await tx.friendRequest.update({ where: { id: request.id }, data: { status: "ACCEPTED" } });
      await tx.friendship.create({ data: { userAId: senderId, userBId: receiverId } });
      const createdNotification = await tx.notification.create({
        data: {
          recipientId: senderId,
          triggerId:   receiverId,
          type:        "FRIEND_ACCEPT",
          entityId:    receiverId,
          entityType:  "user",
          message:     "accepted your friend request",
        },
      });

      return createdNotification
        ? tx.notification.findUnique({
            where: { id: createdNotification.id },
            include: {
              trigger: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  isVerified: true,
                },
              },
            },
          })
        : null;
    });

    if (notification) {
      await emitRealtimeNotification(senderId, notification);
    }

    return NextResponse.json({ success: true, message: "Friend request accepted" });
  } catch (error) {
    console.error("[ACCEPT_REQUEST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
