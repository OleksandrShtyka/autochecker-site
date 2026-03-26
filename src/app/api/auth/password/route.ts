import { NextResponse } from "next/server";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { database } from "@/lib/database";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };

  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { message: "Current and new password are required." },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { message: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const user = await database.findUserById(session.id);
  if (!user) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  // OAuth-only accounts don't have a real password
  if (user.passwordHash === "oauth_only") {
    return NextResponse.json(
      { message: "Password change is not available for OAuth-only accounts." },
      { status: 400 }
    );
  }

  const valid = verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { message: "Current password is incorrect." },
      { status: 400 }
    );
  }

  await database.updatePassword(session.id, hashPassword(newPassword));

  return NextResponse.json({ ok: true });
}
