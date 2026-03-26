import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { database } from "@/lib/database";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Authorization required.", 401);
    }

    const contentType = request.headers.get("content-type") ?? "";
    const mimeType = contentType.split(";")[0]?.trim() ?? "";

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return jsonError("Only JPEG, PNG, WebP, and GIF images are allowed.", 400);
    }

    const buffer = await request.arrayBuffer();
    if (buffer.byteLength > MAX_SIZE_BYTES) {
      return jsonError("Image must be smaller than 2 MB.", 400);
    }

    const avatarUrl = await database.uploadAvatar(session.id, buffer, mimeType);
    const user = await database.updateUserAvatar(session.id, avatarUrl);

    if (!user) {
      return jsonError("Failed to save avatar.", 500);
    }

    return NextResponse.json({ ok: true, avatarUrl: user.accountData.avatarUrl });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Server error.", 500);
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Authorization required.", 401);
    }

    const user = await database.updateUserAvatar(session.id, "");
    if (!user) {
      return jsonError("Failed to remove avatar.", 500);
    }

    return NextResponse.json({ ok: true, avatarUrl: "" });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Server error.", 500);
  }
}
