import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { database } from "@/lib/database";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return jsonError("Authorization required.", 401);
  }

  if (session.role !== "ADMIN") {
    return jsonError("Admin access required.", 403);
  }

  return NextResponse.json({
    ok: true,
    viewer: session,
    counts: await database.getAdminCounts(),
    suggestions: await database.listAdminSuggestions(),
  });
}
