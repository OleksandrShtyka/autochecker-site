import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { database } from "@/lib/database";
import { verifyTotp } from "@/lib/totp";

export const runtime = "nodejs";

/** Verify the first TOTP code and mark 2FA as enabled */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as { code?: string };
  const code = (body.code ?? "").trim();

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ message: "Enter a 6-digit code." }, { status: 400 });
  }

  const user = await database.findUserById(session.id);
  if (!user?.totpSecret) {
    return NextResponse.json({ message: "Run setup first." }, { status: 400 });
  }

  if (!verifyTotp(user.totpSecret, code)) {
    return NextResponse.json({ message: "Incorrect code. Try again." }, { status: 400 });
  }

  await database.enableTotp(session.id);

  return NextResponse.json({ ok: true });
}

/** Disable 2FA — requires a valid current TOTP code */
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as { code?: string };
  const code = (body.code ?? "").trim();

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ message: "Enter the 6-digit code from your authenticator app." }, { status: 400 });
  }

  const user = await database.findUserById(session.id);
  if (!user?.totpSecret || !user.accountData.totpEnabled) {
    return NextResponse.json({ message: "2FA is not enabled on this account." }, { status: 400 });
  }

  if (!verifyTotp(user.totpSecret, code)) {
    return NextResponse.json({ message: "Incorrect code." }, { status: 400 });
  }

  await database.disableTotp(session.id);

  return NextResponse.json({ ok: true });
}
