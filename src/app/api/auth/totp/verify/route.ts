import { NextResponse } from "next/server";
import { clearPendingMfaCookie, getPendingMfa, setSessionCookie } from "@/lib/auth";
import { database } from "@/lib/database";
import { verifyTotp } from "@/lib/totp";

export const runtime = "nodejs";

/** Exchange a pending-MFA cookie + TOTP code for a real session */
export async function POST(request: Request) {
  const userId = await getPendingMfa();
  if (!userId) {
    return NextResponse.json({ message: "MFA session expired. Please log in again." }, { status: 401 });
  }

  const body = (await request.json()) as { code?: string };
  const code = (body.code ?? "").trim();

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ message: "Enter a 6-digit code." }, { status: 400 });
  }

  const user = await database.findUserById(userId);
  if (!user?.totpSecret) {
    return NextResponse.json({ message: "Account not found or 2FA not configured." }, { status: 400 });
  }

  if (!verifyTotp(user.totpSecret, code)) {
    return NextResponse.json({ message: "Incorrect code. Try again." }, { status: 400 });
  }

  const response = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });

  clearPendingMfaCookie(response);
  setSessionCookie(response, { id: user.id, email: user.email, name: user.name, role: user.role });

  return response;
}
