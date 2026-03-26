import { NextResponse } from "next/server";
import { clearSessionCookie, hashPassword, setSessionCookie } from "@/lib/auth";
import { database } from "@/lib/database";
import { isValidEmail, jsonError, normalizeEmail } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = normalizeEmail(body.email ?? "");
    const password = body.password?.trim() ?? "";

    if (!name || !email || !password) {
      return jsonError("Fill in all required fields before continuing.");
    }

    if (!isValidEmail(email)) {
      return jsonError("Enter a valid email address.");
    }

    if (password.length < 12) {
      return jsonError("Password must be at least 12 characters long.");
    }

    if (await database.findUserByEmail(email)) {
      return jsonError("This email is already registered. Try logging in instead.", 409);
    }

    const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL ?? "");
    const authRole = adminEmail && adminEmail === email ? "ADMIN" : "USER";

    const user = await database.createUser({
      email,
      name,
      passwordHash: hashPassword(password),
      authRole,
      profile: {
        name,
        role: "Full-stack Developer",
        usage: "Daily",
        favoriteFeature: "Sidebar Dashboard",
      },
    });

    if (!user) {
      const response = jsonError("Could not create account right now.", 500);
      clearSessionCookie(response);
      return response;
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

    setSessionCookie(response, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return response;
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unexpected server error during registration.",
      500
    );
  }
}
