// src/app/api/posts/[id]/likes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { getTokenFromRequest, verifyAccessToken, unauthorizedResponse } from "../../../../../lib/auth";

type Params = { params: Promise<{ id: string }> };

// POST /api/posts/:id/likes — Toggle like or add reaction
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: postId } = await params;
    const token = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorizedResponse();

    const userId = payload.sub;
    let body: { reactionType?: string } = {};
    try { body = await req.json(); } catch { /* no body */ }

    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });

    // Upsert like
    await db.like.upsert({
      where: { userId_postId: { userId, postId } },
      create: { userId, postId },
      update: {},
    });

    // Upsert reaction if type provided
    if (body.reactionType) {
      const validTypes = ["LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY"];
      if (validTypes.includes(body.reactionType)) {
        await db.reaction.upsert({
          where: { userId_postId: { userId, postId } },
          create: { userId, postId, reactionType: body.reactionType as "LIKE" },
          update: { reactionType: body.reactionType as "LIKE" },
        });
      }
    }

    // Notify post author (if not self)
    if (post.authorId !== userId) {
      const existing = await db.notification.findFirst({
        where: {
          recipientId: post.authorId,
          triggerId:   userId,
          type:        "LIKE",
          entityId:    postId,
        },
      });
      if (!existing) {
        await db.notification.create({
          data: {
            recipientId: post.authorId,
            triggerId:   userId,
            type:        "LIKE",
            entityId:    postId,
            entityType:  "post",
            message:     "liked your post",
          },
        });
      }
    }

    const likeCount = await db.like.count({ where: { postId } });
    return NextResponse.json({ success: true, data: { likeCount, liked: true } });
  } catch (error) {
    console.error("[LIKE_POST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/posts/:id/likes — Remove like
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id: postId } = await params;
    const token = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorizedResponse();

    const userId = payload.sub;

    await Promise.all([
      db.like.deleteMany({ where: { userId, postId } }),
      db.reaction.deleteMany({ where: { userId, postId } }),
    ]);

    const likeCount = await db.like.count({ where: { postId } });
    return NextResponse.json({ success: true, data: { likeCount, liked: false } });
  } catch (error) {
    console.error("[UNLIKE_POST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
