// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromRequest, verifyAccessToken, unauthorizedResponse } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validations";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────
// GET /api/users/:id — Public profile
// ─────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Get requesting user (optional — affects privacy/friendship status)
    const token = getTokenFromRequest(req);
    const viewer = token ? verifyAccessToken(token) : null;
    const viewerId = viewer?.sub ?? null;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        coverUrl: true,
        isVerified: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        privacySettings: true,
        _count: {
          select: {
            posts: true,
            friendshipsA: true,
            friendshipsB: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Determine friendship status
    let friendshipStatus: string = "NOT_FRIENDS";
    if (viewerId) {
      if (viewerId === id) {
        friendshipStatus = "SELF";
      } else {
        // Check for existing friendship
        const friendship = await db.friendship.findFirst({
          where: {
            OR: [
              { userAId: viewerId, userBId: id },
              { userAId: id, userBId: viewerId },
            ],
          },
        });

        if (friendship) {
          friendshipStatus = "FRIENDS";
        } else {
          // Check pending requests
          const sentRequest = await db.friendRequest.findUnique({
            where: { senderId_receiverId: { senderId: viewerId, receiverId: id } },
          });
          const receivedRequest = await db.friendRequest.findUnique({
            where: { senderId_receiverId: { senderId: id, receiverId: viewerId } },
          });

          if (sentRequest?.status === "PENDING") friendshipStatus = "PENDING_SENT";
          else if (receivedRequest?.status === "PENDING") friendshipStatus = "PENDING_RECEIVED";
        }
      }
    }

    // Privacy: hide online status if settings say so
    if (!user.privacySettings?.showOnlineStatus && viewerId !== id) {
      user.isOnline = false;
    }

    // Total friend count (A + B sides)
    const friendCount = user._count.friendshipsA + user._count.friendshipsB;

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        _count: { ...user._count, friends: friendCount },
        friendshipStatus,
      },
    });
  } catch (error) {
    console.error("[GET_USER_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────
// PATCH /api/users/:id — Update profile
// ─────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload || payload.sub !== id) return unauthorizedResponse();

    const body = await req.json();
    const data = updateProfileSchema.parse(body);

    // Check username uniqueness if changing
    if (data.username) {
      const taken = await db.user.findFirst({
        where: { username: data.username, NOT: { id } },
        select: { id: true },
      });
      if (taken) {
        return NextResponse.json(
          { success: false, error: "Username already taken" },
          { status: 409 }
        );
      }
    }

    const updated = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        coverUrl: true,
        isVerified: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("[UPDATE_USER_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
