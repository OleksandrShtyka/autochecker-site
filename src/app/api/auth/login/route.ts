import { NextResponse } from "next/server";
import { clearSessionCookie, setSessionCookie, verifyPassword } from "@/lib/auth";
import { database } from "@/lib/database";
import { jsonError, normalizeEmail } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = normalizeEmail(body.email ?? "");
    const password = body.password?.trim() ?? "";

    if (!email || !password) {
      return jsonError("Enter your email and password.");
    }

    const user = await database.findUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return jsonError("Wrong email or password. Check your credentials and try again.", 401);
    }

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    clearSessionCookie(response);
    setSessionCookie(response, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return response;
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unexpected server error during login.",
      500
    );
  }
}
