// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromRequest, verifyAccessToken, unauthorizedResponse } from "@/lib/auth";
import { createPostSchema, paginationSchema } from "@/lib/validations";
import { postSelect } from "@/lib/post-select";
import { ZodError } from "zod";

// ─────────────────────────────────────────
// GET /api/posts — Feed or user posts
// ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const token   = getTokenFromRequest(req);
    const payload = token ? verifyAccessToken(token) : null;
    const viewerId = payload?.sub ?? null;

    const { searchParams } = new URL(req.url);
    const { cursor, limit } = paginationSchema.parse({
      cursor: searchParams.get("cursor") ?? undefined,
      limit:  searchParams.get("limit")  ?? undefined,
    });
    const userId = searchParams.get("userId"); // Filter by author

    const friendIds = viewerId ? await getFriendIds(viewerId) : [];

    // Feed: public posts, friends-only posts from friends, and own posts.
    const where = userId
      ? {
          authorId: userId,
          OR:
            viewerId === userId
              ? [{ audience: { in: ["PUBLIC", "FRIENDS", "ONLY_ME"] as const } }]
              : [
                  { audience: "PUBLIC" as const },
                  ...(friendIds.includes(userId) ? [{ audience: "FRIENDS" as const }] : []),
                ],
        }
      : viewerId
      ? {
          OR: [
            { authorId: viewerId },
            { audience: "PUBLIC" as const },
            ...(friendIds.length
              ? [{ authorId: { in: friendIds }, audience: "FRIENDS" as const }]
              : []),
          ],
        }
      : { audience: "PUBLIC" as const };

    const posts = await db.post.findMany({
      where,
      select: postSelect,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore    = posts.length > limit;
    const items      = hasMore ? posts.slice(0, -1) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Attach per-post userLiked flag
    const enriched = viewerId
      ? await Promise.all(
          items.map(async (post) => {
            const like = await db.like.findUnique({
              where: { userId_postId: { userId: viewerId, postId: post.id } },
              select: { id: true },
            });
            const reaction = await db.reaction.findUnique({
              where: { userId_postId: { userId: viewerId, postId: post.id } },
              select: { reactionType: true },
            });
            return { ...post, userLiked: !!like, userReaction: reaction?.reactionType ?? null };
          })
        )
      : items.map((p) => ({ ...p, userLiked: false, userReaction: null }));

    return NextResponse.json({
      success: true,
      data: { items: enriched, nextCursor, hasMore },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid query params" },
        { status: 400 }
      );
    }
    console.error("[GET_POSTS_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

async function getFriendIds(userId: string): Promise<string[]> {
  const friendships = await db.friendship.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    select: { userAId: true, userBId: true },
  });

  return friendships.map((friendship) =>
    friendship.userAId === userId ? friendship.userBId : friendship.userAId
  );
}

// ─────────────────────────────────────────
// POST /api/posts — Create post
// ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorizedResponse();

    const body = await req.json();
    const data = createPostSchema.parse(body);

    const post = await db.$transaction(async (tx: typeof db) => {
      const newPost = await tx.post.create({
        data: {
          authorId: payload.sub,
          content:  data.content ?? null,
          audience: data.audience,
        },
        select: { id: true },
      });
      if (!newPost) throw new Error("Post was not created");

      // Attach media if provided
      if (data.mediaIds && data.mediaIds.length > 0) {
        await tx.postMedia.createMany({
          data: data.mediaIds.map((mediaId, order) => ({
            postId: newPost.id,
            mediaId,
            order,
          })),
        });
      }

      return tx.post.findUnique({ where: { id: newPost.id }, select: postSelect });
    });

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("[CREATE_POST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
