// src/app/api/comments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromRequest, verifyAccessToken, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";
import { updateCommentSchema } from "@/lib/validations";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/comments/:id
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const token   = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorizedResponse();

    const comment = await db.comment.findUnique({ where: { id }, select: { authorId: true } });
    if (!comment) return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 });
    if (comment.authorId !== payload.sub) return forbiddenResponse("You can only edit your own comments");

    const body = await req.json();
    const data = updateCommentSchema.parse(body);

    const updated = await db.comment.update({
      where: { id },
      data:  { content: data.content, isEdited: true },
      select: {
        id: true, content: true, isEdited: true, createdAt: true, updatedAt: true,
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
        _count: { select: { likes: true, replies: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, error: "Validation failed" }, { status: 400 });
    }
    console.error("[UPDATE_COMMENT_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/comments/:id
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const token   = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorizedResponse();

    const comment = await db.comment.findUnique({ where: { id }, select: { authorId: true } });
    if (!comment) return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 });
    if (comment.authorId !== payload.sub) return forbiddenResponse("You can only delete your own comments");

    await db.comment.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Comment deleted" });
  } catch (error) {
    console.error("[DELETE_COMMENT_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
