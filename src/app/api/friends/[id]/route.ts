// src/app/api/friends/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { getTokenFromRequest, verifyAccessToken, unauthorizedResponse } from "../../../../lib/auth";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/friends/:id — Unfriend
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id: friendId } = await params;
    const token = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorizedResponse();

    const userId = payload.sub;

    // Delete friendship (either direction)
    await db.friendship.deleteMany({
      where: {
        OR: [
          { userAId: userId, userBId: friendId },
          { userAId: friendId, userBId: userId },
        ],
      },
    });

    // Clean up any resolved friend requests
    await db.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
        status: "ACCEPTED",
      },
    });

    return NextResponse.json({ success: true, message: "Unfriended successfully" });
  } catch (error) {
    console.error("[UNFRIEND_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
