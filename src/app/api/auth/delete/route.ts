import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { database } from "@/lib/database";

export const runtime = "nodejs";

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  await database.deleteUser(session.id);

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
