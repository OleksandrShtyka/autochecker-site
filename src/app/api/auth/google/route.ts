/**
 * POST /api/auth/google
 * Mobile (Flutter) Google Sign-In endpoint.
 * Receives a Google ID token, verifies it, and creates/finds the user.
 */
import { type NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

type GoogleTokenInfo = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  aud: string;
  exp: string;
};

async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenInfo> {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!response.ok) {
    throw new Error("Google token verification failed.");
  }
  const data = await response.json() as GoogleTokenInfo;
  if (!data.email) {
    throw new Error("Google token missing email.");
  }
  // Verify the audience matches our client ID
  const expectedAud = process.env.GOOGLE_CLIENT_ID;
  if (expectedAud && data.aud !== expectedAud) {
    throw new Error("Google token audience mismatch.");
  }
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { idToken?: string };
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const googleUser = await verifyGoogleIdToken(idToken);

    let targetUser = await database.findUserByGoogleId(googleUser.sub);

    if (!targetUser) {
      const existingByEmail = await database.findUserByEmail(googleUser.email);
      if (existingByEmail) {
        targetUser = await database.linkOAuthAccount(
          existingByEmail.id,
          "google",
          googleUser.sub,
          { email: googleUser.email }
        );
      } else {
        const name = googleUser.name || googleUser.email.split("@")[0];
        targetUser = await database.createUser({
          email: googleUser.email,
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
        if (targetUser) {
          targetUser = await database.linkOAuthAccount(
            targetUser.id,
            "google",
            googleUser.sub,
            { email: googleUser.email }
          );
        }
        if (targetUser && googleUser.picture) {
          targetUser = await database.updateUserAvatar(targetUser.id, googleUser.picture);
        }
      }
    }

    if (!targetUser) {
      return NextResponse.json({ error: "Failed to sign in." }, { status: 500 });
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
