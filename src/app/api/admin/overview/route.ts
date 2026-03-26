import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { database } from "@/lib/database";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Authorization required.", 401);
    }

    if (session.role !== "ADMIN") {
      return jsonError("Admin access required.", 403);
    }

    const suggestions = await database.listAdminSuggestions();
    const counts = {
      total: suggestions.length,
      new: suggestions.filter((s) => s.status === "NEW").length,
      reviewing: suggestions.filter((s) => s.status === "REVIEWING").length,
      planned: suggestions.filter((s) => s.status === "PLANNED").length,
      shipped: suggestions.filter((s) => s.status === "SHIPPED").length,
      rejected: suggestions.filter((s) => s.status === "REJECTED").length,
    };

    return NextResponse.json({ ok: true, viewer: session, counts, suggestions });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Server error.", 500);
  }
}
