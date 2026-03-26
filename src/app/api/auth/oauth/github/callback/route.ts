import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession, setSessionCookie } from "@/lib/auth";
import { database } from "@/lib/database";
import { OAUTH_STATE_COOKIE, siteUrl, verifyOAuthState } from "@/lib/oauth";

export const runtime = "nodejs";

type GitHubTokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
};

type GitHubUser = {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
};

type GitHubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

async function exchangeCode(code: string, redirectUri: string): Promise<GitHubTokenResponse> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GITHUB_CLIENT_ID ?? "",
      client_secret: process.env.GITHUB_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed: ${response.status}`);
  }

  return response.json() as Promise<GitHubTokenResponse>;
}

async function getGithubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub user fetch failed: ${response.status}`);
  }

  return response.json() as Promise<GitHubUser>;
}

async function getGithubPrimaryEmail(accessToken: string): Promise<string> {
  const response = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) return "";

  const emails = (await response.json()) as GitHubEmail[];
  const primary = emails.find((e) => e.primary && e.verified);
  return primary?.email ?? emails[0]?.email ?? "";
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

    const redirectUri = `${siteUrl()}/api/auth/oauth/github/callback`;
    const tokens = await exchangeCode(code, redirectUri);
    const [githubUser, githubEmail] = await Promise.all([
      getGithubUser(tokens.access_token),
      getGithubPrimaryEmail(tokens.access_token),
    ]);

    const githubId = String(githubUser.id);
    const session = await getSession();

    let targetUser: Awaited<ReturnType<typeof database.findUserById>>;

    if (session) {
      // Linking to existing account
      const alreadyLinked = await database.findUserByGithubId(githubId);
      if (alreadyLinked && alreadyLinked.id !== session.id) {
        return errorRedirect("This GitHub account is already linked to another user.");
      }

      targetUser = await database.linkOAuthAccount(session.id, "github", githubId, {
        username: githubUser.login,
      });

      if (!targetUser) {
        return errorRedirect("Failed to link GitHub account.");
      }

      // If user has no avatar yet, set it from GitHub
      if (!targetUser.accountData.avatarUrl && githubUser.avatar_url) {
        targetUser = await database.updateUserAvatar(session.id, githubUser.avatar_url);
      }

      const successUrl = new URL("/cabinet", siteUrl());
      successUrl.searchParams.set("oauth_success", session ? "github" : "github_login");
      const response = NextResponse.redirect(successUrl.toString());
      response.cookies.set(OAUTH_STATE_COOKIE, "", { expires: new Date(0), path: "/" });
      return response;
    } else {
      // Not logged in — find or create account via GitHub
      targetUser = await database.findUserByGithubId(githubId);

      if (!targetUser) {
        const email = githubEmail || `github_${githubId}@noreply.github.com`;
        const existingByEmail = email.includes("@noreply") ? null : await database.findUserByEmail(email);

        if (existingByEmail) {
          targetUser = await database.linkOAuthAccount(existingByEmail.id, "github", githubId, {
            username: githubUser.login,
          });
        } else {
          targetUser = await database.createUser({
            email,
            name: githubUser.name || githubUser.login,
            passwordHash: "oauth_only",
            authRole: "USER",
            profile: {
              name: githubUser.name || githubUser.login,
              role: "Developer",
              usage: "Daily",
              favoriteFeature: "Sidebar Dashboard",
            },
          });
          if (targetUser) {
            targetUser = await database.linkOAuthAccount(targetUser.id, "github", githubId, {
              username: githubUser.login,
            });
          }
          if (targetUser && githubUser.avatar_url) {
            targetUser = await database.updateUserAvatar(targetUser.id, githubUser.avatar_url);
          }
        }
      }

      if (!targetUser) {
        return errorRedirect("Failed to sign in with GitHub.");
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
    return errorRedirect("An unexpected error occurred during GitHub login.");
  }
}
