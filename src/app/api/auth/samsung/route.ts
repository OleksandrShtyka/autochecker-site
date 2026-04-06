/**
 * POST /api/auth/samsung
 * Mobile (Flutter) Samsung Account sign-in endpoint.
 * Receives a Samsung OAuth 2.0 access token, verifies it via Samsung's OIDC
 * userinfo endpoint, and creates/finds the user session.
 *
 * Samsung Developer Portal: https://developer.samsung.com/samsung-account
 * Requires SAMSUNG_CLIENT_ID + SAMSUNG_CLIENT_SECRET env vars.
 */
import { type NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

type SamsungUserInfo = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
};

async function verifySamsungToken(accessToken: string): Promise<SamsungUserInfo> {
  const response = await fetch(
    "https://account.samsung.com/accounts/v1/oidc/userinfo",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    throw new Error(`Samsung token verification failed (${response.status}).`);
  }
  const data = (await response.json()) as SamsungUserInfo;
  if (!data.email) {
    throw new Error("Samsung token missing email claim.");
  }
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { accessToken?: string; email?: string };
    const { accessToken } = body;

    if (!accessToken) {
      return NextResponse.json({ error: "Missing accessToken" }, { status: 400 });
    }

    const samsungUser = await verifySamsungToken(accessToken);

    // Lookup strategy: find by email (Samsung OIDC sub is not stored separately)
    let targetUser = await database.findUserByEmail(samsungUser.email);

    if (!targetUser) {
      // Create new account linked to this Samsung Account
      const name = samsungUser.name ?? samsungUser.email.split("@")[0];
      targetUser = await database.createUser({
        email: samsungUser.email,
        name,
        passwordHash: "oauth_only",
        authRole: "USER",
        profile: {
          name,
          role: "Gym Member",
          usage: "Daily",
          favoriteFeature: "Workout Tracker",
        },
      });
    }

    if (!targetUser) {
      return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
    }

    const response = NextResponse.json({ ok: true, email: targetUser.email });
    setSessionCookie(response, {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
    });
    return response;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
