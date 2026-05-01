// src/app/api/posts/[id]/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { getTokenFromRequest, verifyAccessToken, unauthorizedResponse } from "../../../../../lib/auth";
import { createCommentSchema, paginationSchema } from "../../../../..//lib/validations";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string }> };

const commentSelect = {
  id: true,
  postId: true,
  content: true,
  isEdited: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true, username: true, displayName: true,
      avatarUrl: true, isVerified: true, isOnline: true,
    },
  },
  _count: { select: { likes: true, replies: true } },
};

// GET /api/posts/:id/comments
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id: postId } = await params;
    const token   = getTokenFromRequest(req);
    const payload = token ? verifyAccessToken(token) : null;
    const viewerId = payload?.sub ?? null;

    const { searchParams } = new URL(req.url);
    const { cursor, limit } = paginationSchema.parse({
      cursor: searchParams.get("cursor") ?? undefined,
      limit:  searchParams.get("limit")  ?? undefined,
    });
    const parentId = searchParams.get("parentId"); // For nested replies

    const comments = await db.comment.findMany({
      where: {
        postId,
        parentId: parentId ?? null,
      },
      select: commentSelect,
      orderBy: { createdAt: "asc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore    = comments.length > limit;
    const items      = hasMore ? comments.slice(0, -1) : comments;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Attach userLiked
    const enriched = viewerId
      ? await Promise.all(
          items.map(async (c) => {
            const like = await db.like.findUnique({
              where: { userId_commentId: { userId: viewerId, commentId: c.id } },
              select: { id: true },
            });
            return { ...c, userLiked: !!like };
          })
        )
      : items.map((c) => ({ ...c, userLiked: false }));

    return NextResponse.json({ success: true, data: { items: enriched, nextCursor, hasMore } });
  } catch (error) {
    console.error("[GET_COMMENTS_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/posts/:id/comments
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: postId } = await params;
    const token = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorizedResponse();

    const body = await req.json();
    const data = createCommentSchema.parse(body);

    // Verify post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });

    const comment = await db.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          postId,
          authorId: payload.sub,
          content:  data.content,
          parentId: data.parentId ?? null,
        },
        select: commentSelect,
      });

      // Create notification for post author (if not own comment)
      if (post.authorId !== payload.sub) {
        await tx.notification.create({
          data: {
            recipientId: post.authorId,
            triggerId:   payload.sub,
            type:        "COMMENT",
            entityId:    postId,
            entityType:  "post",
            message:     `commented on your post`,
          },
        });
      }

      return newComment;
    });

    return NextResponse.json({ success: true, data: { ...comment, userLiked: false } }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("[CREATE_COMMENT_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
