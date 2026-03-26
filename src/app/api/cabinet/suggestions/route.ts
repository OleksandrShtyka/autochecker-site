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

  return NextResponse.json({
    ok: true,
    suggestions: await database.listUserSuggestions(session.id),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return jsonError("Authorization required.", 401);
  }

  const body = (await request.json()) as {
    title?: string;
    area?: string;
    summary?: string;
    impact?: string;
  };

  const suggestion = {
    title: body.title?.trim() ?? "",
    area: body.area?.trim() ?? "",
    summary: body.summary?.trim() ?? "",
    impact: body.impact?.trim() ?? "",
  };

  if (!suggestion.title || !suggestion.area || !suggestion.summary || !suggestion.impact) {
    return jsonError("Fill in title, description and impact before sending.");
  }

  await database.createSuggestion(session.id, suggestion);

  return NextResponse.json({
    ok: true,
    suggestions: await database.listUserSuggestions(session.id),
  });
}
