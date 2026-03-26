import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { mediaService } from "@/server/services/media.service";

const SUPPORTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
];
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!SUPPORTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Supported: ${SUPPORTED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum: ${MAX_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Generate unique key
    const ext = file.name.split(".").pop() || "bin";
    const key = `uploads/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Upload to S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await mediaService.upload(buffer, key, file.type);

    // Determine media type
    const mediaType = file.type.startsWith("video/")
      ? "VIDEO"
      : file.type === "image/gif"
        ? "GIF"
        : "IMAGE";

    // Create media record
    const media = await db.mediaAsset.create({
      data: {
        url,
        key,
        type: mediaType,
        mimeType: file.type,
        size: file.size,
      },
    });

    return NextResponse.json({
      id: media.id,
      url: media.url,
      type: media.type,
      mimeType: media.mimeType,
      size: media.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
