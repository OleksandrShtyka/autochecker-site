import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { database } from "@/lib/database";
import { jsonError } from "@/lib/http";
import { generateOAuthState, OAUTH_STATE_COOKIE, OAUTH_STATE_TTL_SECONDS, siteUrl } from "@/lib/oauth";

export const runtime = "nodejs";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth is not configured." }, { status: 503 });
  }

  const state = generateOAuthState();
  const redirectUri = `${siteUrl()}/api/auth/oauth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );

  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: OAUTH_STATE_TTL_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Authorization required.", 401);
    }

    const user = await database.unlinkOAuthAccount(session.id, "google");
    if (!user) {
      return jsonError("Failed to unlink Google account.", 500);
    }

    return NextResponse.json({ ok: true, accountData: user.accountData });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Server error.", 500);
  }
}
