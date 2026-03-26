import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession, setSessionCookie } from "@/lib/auth";
import { database } from "@/lib/database";
import { OAUTH_STATE_COOKIE, siteUrl, verifyOAuthState } from "@/lib/oauth";

export const runtime = "nodejs";

type GoogleTokenResponse = {
  access_token: string;
  token_type: string;
  id_token?: string;
};

type GoogleUserInfo = {
  id: string;
  email: string;
  name: string;
  picture: string;
};

async function exchangeCode(code: string, redirectUri: string): Promise<GoogleTokenResponse> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${response.status}`);
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

async function getGoogleUser(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Google userinfo failed: ${response.status}`);
  }

  return response.json() as Promise<GoogleUserInfo>;
}

function errorRedirect(message: string) {
  const url = new URL("/cabinet", siteUrl());
  url.searchParams.set("oauth_error", message);
  return NextResponse.redirect(url.toString());
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return errorRedirect("Missing OAuth parameters.");
    }

    const cookieStore = await cookies();
    const storedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

    if (!storedState || storedState !== state || !verifyOAuthState(state)) {
      return errorRedirect("Invalid OAuth state. Please try again.");
    }

    const redirectUri = `${siteUrl()}/api/auth/oauth/google/callback`;
    const tokens = await exchangeCode(code, redirectUri);
    const googleUser = await getGoogleUser(tokens.access_token);

    const session = await getSession();

    let targetUser: Awaited<ReturnType<typeof database.findUserById>>;

    if (session) {
      // Linking to existing account
      const alreadyLinked = await database.findUserByGoogleId(googleUser.id);
      if (alreadyLinked && alreadyLinked.id !== session.id) {
        return errorRedirect("This Google account is already linked to another user.");
      }

      targetUser = await database.linkOAuthAccount(session.id, "google", googleUser.id, {
        email: googleUser.email,
      });

      if (!targetUser) {
        return errorRedirect("Failed to link Google account.");
      }

      // If user has no avatar yet, set it from Google
      if (!targetUser.accountData.avatarUrl && googleUser.picture) {
        targetUser = await database.updateUserAvatar(session.id, googleUser.picture);
      }

      const successUrl = new URL("/cabinet", siteUrl());
      successUrl.searchParams.set("oauth_success", "google");
      const response = NextResponse.redirect(successUrl.toString());
      // Clear state cookie
      response.cookies.set(OAUTH_STATE_COOKIE, "", { expires: new Date(0), path: "/" });
      return response;
    } else {
      // Not logged in — find or create account via Google
      targetUser = await database.findUserByGoogleId(googleUser.id);

      if (!targetUser) {
        // Check if email already exists — link Google to that account
        const existingByEmail = await database.findUserByEmail(googleUser.email);
        if (existingByEmail) {
          targetUser = await database.linkOAuthAccount(existingByEmail.id, "google", googleUser.id, {
            email: googleUser.email,
          });
        } else {
          // Create new account
          targetUser = await database.createUser({
            email: googleUser.email,
            name: googleUser.name || googleUser.email.split("@")[0],
            passwordHash: "oauth_only",
            authRole: "USER",
            profile: {
              name: googleUser.name || googleUser.email.split("@")[0],
              role: "Developer",
              usage: "Daily",
              favoriteFeature: "Sidebar Dashboard",
            },
          });
          if (targetUser) {
            targetUser = await database.linkOAuthAccount(targetUser.id, "google", googleUser.id, {
              email: googleUser.email,
            });
          }
          if (targetUser && googleUser.picture) {
            targetUser = await database.updateUserAvatar(targetUser.id, googleUser.picture);
          }
        }
      }

      if (!targetUser) {
        return errorRedirect("Failed to sign in with Google.");
      }

      const successUrl = new URL("/cabinet", siteUrl());
      const response = NextResponse.redirect(successUrl.toString());

      setSessionCookie(response, {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
      });

      response.cookies.set(OAUTH_STATE_COOKIE, "", { expires: new Date(0), path: "/" });
      return response;
    }
  } catch {
    return errorRedirect("An unexpected error occurred during Google login.");
  }
}
