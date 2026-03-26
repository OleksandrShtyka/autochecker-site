import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { database } from "@/lib/database";
import { buildOtpAuthUri, generateTotpSecret } from "@/lib/totp";

export const runtime = "nodejs";

/** Generate a new TOTP secret and store it (not yet enabled) */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const secret = generateTotpSecret();
  await database.setTotpSecret(session.id, secret);

  const uri = buildOtpAuthUri(secret, session.email);

  return NextResponse.json({ secret, uri });
}
