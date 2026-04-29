// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { db } from "@/lib/db";
import { getTokenFromRequest, verifyAccessToken, unauthorizedResponse } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

const MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE_MB ?? "10") * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "video/mp4", "video/webm",
];

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return unauthorizedResponse();

    const payload = verifyAccessToken(token);
    if (!payload) return unauthorizedResponse();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const purpose = (formData.get("purpose") as string) ?? "post"; // "post" | "avatar" | "cover"

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `File type ${file.type} not allowed` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File exceeds ${process.env.MAX_UPLOAD_SIZE_MB ?? 10}MB limit`,
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const folder  = `socialsphere/${purpose}s`;
    const isVideo = file.type.startsWith("video/");

    const uploadResult = await new Promise<{
      public_id: string;
      secure_url: string;
      width?: number;
      height?: number;
      duration?: number;
      bytes: number;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: isVideo ? "video" : "image",
          transformation:
            purpose === "avatar"
              ? [{ width: 400, height: 400, crop: "fill", gravity: "face" }]
              : purpose === "cover"
              ? [{ width: 1200, height: 400, crop: "fill" }]
              : undefined,
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error("Upload failed"));
          else resolve(result as typeof resolve extends (v: infer V) => void ? V : never);
        }
      );
      stream.end(buffer);
    });

    // Save media record
    const mediaType = isVideo ? "VIDEO" : file.type === "image/gif" ? "GIF" : "IMAGE";
    const media = await db.media.create({
      data: {
        uploaderId: payload.sub,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        mediaType,
        width:     uploadResult.width  ?? null,
        height:    uploadResult.height ?? null,
        duration:  uploadResult.duration ?? null,
        sizeBytes: uploadResult.bytes,
      },
    });

    // If avatar or cover, update user directly
    if (purpose === "avatar") {
      await db.user.update({
        where: { id: payload.sub },
        data: { avatarUrl: uploadResult.secure_url },
      });
    } else if (purpose === "cover") {
      await db.user.update({
        where: { id: payload.sub },
        data: { coverUrl: uploadResult.secure_url },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        mediaId:  media.id,
        url:      media.url,
        publicId: media.publicId,
        mediaType,
      },
    });
  } catch (error) {
    console.error("[UPLOAD_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}
