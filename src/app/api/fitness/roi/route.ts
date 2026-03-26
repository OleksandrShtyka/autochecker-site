import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { database } from "@/lib/database";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  // month param: YYYY-MM-DD (any date within the target month). Defaults to current month.
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 10);

  const roi = await database.getGymRoi(session.id, month);
  return NextResponse.json({ roi });
}
