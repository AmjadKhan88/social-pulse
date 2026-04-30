// src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { getTokenFromRequest, verifyAccessToken, unauthorizedResponse, forbiddenResponse } from "../../../../lib/auth";
import { updatePostSchema } from "../../../../lib/validations";
import { postSelect } from "../route";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string }> };

// GET /api/posts/:id
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const token   = getTokenFromRequest(req);
    const payload = token ? verifyAccessToken(token) : null;

    const post = await db.post.findUnique({ where: { id }, select: postSelect });
    if (!post) return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });

    // Audience check
    const viewerId = payload?.sub;
    if (post.audience === "ONLY_ME" && post.author.id !== viewerId) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    let userLiked = false;
    let userReaction = null;
    if (viewerId) {
      const [like, reaction] = await Promise.all([
        db.like.findUnique({ where: { userId_postId: { userId: viewerId, postId: id } }, select: { id: true } }),
        db.reaction.findUnique({ where: { userId_postId: { userId: viewerId, postId: id } }, select: { reactionType: true } }),
      ]);
      userLiked    = !!like;
      userReaction = reaction?.reactionType ?? null;
    }

    return NextResponse.json({ success: true, data: { ...post, userLiked, userReaction } });
  } catch (error) {
    console.error("[GET_POST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/posts/:id
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const token   = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorizedResponse();

    const post = await db.post.findUnique({ where: { id }, select: { authorId: true } });
    if (!post) return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    if (post.authorId !== payload.sub) return forbiddenResponse("You can only edit your own posts");

    const body = await req.json();
    const data = updatePostSchema.parse(body);

    const updated = await db.post.update({
      where: { id },
      data: { ...data, isEdited: true },
      select: postSelect,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: "Validation failed", details: error.flatten().fieldErrors }, { status: 400 });
    }
    console.error("[UPDATE_POST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/posts/:id
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const token   = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorizedResponse();

    const post = await db.post.findUnique({ where: { id }, select: { authorId: true, media: { include: { media: true } } } });
    if (!post) return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    if (post.authorId !== payload.sub) return forbiddenResponse("You can only delete your own posts");

    await db.post.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Post deleted" });
  } catch (error) {
    console.error("[DELETE_POST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
