import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { database } from "@/lib/database";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  const user = await database.findUserById(session.id);
  if (!user) {
    const response = NextResponse.json({ authenticated: false });
    clearSessionCookie(response);
    return response;
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}
