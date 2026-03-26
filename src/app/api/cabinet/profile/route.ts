import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { database } from "@/lib/database";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Authorization required.", 401);
    }

    const user = await database.findUserById(session.id);
    if (!user) {
      return jsonError("User not found.", 404);
    }

    return NextResponse.json({
      ok: true,
      profile: user.profile,
      accountData: user.accountData,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Server error.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Authorization required.", 401);
    }

    const body = (await request.json()) as {
      name?: string;
      role?: string;
      usage?: string;
      favoriteFeature?: string;
    };

    const profile = {
      name: body.name?.trim() ?? "",
      role: body.role?.trim() ?? "",
      usage: body.usage?.trim() ?? "",
      favoriteFeature: body.favoriteFeature?.trim() ?? "",
    };

    if (!profile.name || !profile.role || !profile.usage || !profile.favoriteFeature) {
      return jsonError("All profile fields are required.");
    }

    const user = await database.updateUserProfile(session.id, profile);
    if (!user) {
      return jsonError("Profile update failed.", 500);
    }

    return NextResponse.json({ ok: true, profile: user.profile, accountData: user.accountData });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Server error.", 500);
  }
}
