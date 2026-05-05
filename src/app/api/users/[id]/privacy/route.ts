// src/app/api/users/[id]/privacy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromRequest, verifyAccessToken, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";
import { privacySettingsSchema } from "@/lib/validations";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string }> };

// GET /api/users/:id/privacy
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const token  = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload || payload.sub !== id) return forbiddenResponse();

    const settings = await db.privacySettings.findUnique({
      where: { userId: id },
    });

    if (!settings) {
      // Create defaults if none exist
      const defaults = await db.privacySettings.create({ data: { userId: id } });
      return NextResponse.json({ success: true, data: defaults });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("[GET_PRIVACY_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/users/:id/privacy
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const token  = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload || payload.sub !== id) return forbiddenResponse();

    const body = await req.json();
    const data = privacySettingsSchema.parse(body);

    const updated = await db.privacySettings.upsert({
      where:  { userId: id },
      create: { userId: id, ...data },
      update: data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("[UPDATE_PRIVACY_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
