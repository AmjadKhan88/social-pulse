// src/app/api/comments/[id]/likes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromRequest, verifyAccessToken, unauthorizedResponse } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// POST — Like a comment
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: commentId } = await params;
    const token = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorizedResponse();

    const comment = await db.comment.findUnique({ where: { id: commentId }, select: { authorId: true } });
    if (!comment) return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 });

    await db.like.upsert({
      where:  { userId_commentId: { userId: payload.sub, commentId } },
      create: { userId: payload.sub, commentId },
      update: {},
    });

    // Notify comment author if not self
    if (comment.authorId !== payload.sub) {
      await db.notification.create({
        data: {
          recipientId: comment.authorId,
          triggerId:   payload.sub,
          type:        "COMMENT_LIKE",
          entityId:    commentId,
          entityType:  "comment",
          message:     "liked your comment",
        },
      }).catch(() => null);
    }

    const likeCount = await db.like.count({ where: { commentId } });
    return NextResponse.json({ success: true, data: { likeCount, liked: true } });
  } catch (error) {
    console.error("[LIKE_COMMENT_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — Unlike a comment
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id: commentId } = await params;
    const token = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorizedResponse();

    await db.like.deleteMany({ where: { userId: payload.sub, commentId } });
    const likeCount = await db.like.count({ where: { commentId } });

    return NextResponse.json({ success: true, data: { likeCount, liked: false } });
  } catch (error) {
    console.error("[UNLIKE_COMMENT_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
