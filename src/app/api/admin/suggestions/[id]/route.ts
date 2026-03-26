import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { database } from "@/lib/database";
import { jsonError } from "@/lib/http";
import type { SuggestionStatus } from "@/features/home/types";

export const runtime = "nodejs";

const ALLOWED_STATUSES: SuggestionStatus[] = [
  "NEW",
  "REVIEWING",
  "PLANNED",
  "SHIPPED",
  "REJECTED",
];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return jsonError("Authorization required.", 401);
  }

  if (session.role !== "ADMIN") {
    return jsonError("Admin access required.", 403);
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    status?: SuggestionStatus;
    adminNote?: string;
  };

  const status = body.status;
  const adminNote = body.adminNote?.trim() ?? "";

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return jsonError("Invalid suggestion status.");
  }

  await database.updateSuggestionStatus({
    suggestionId: id,
    status,
    adminNote,
  });

  return NextResponse.json({
    ok: true,
    counts: await database.getAdminCounts(),
    suggestions: await database.listAdminSuggestions(),
  });
}
