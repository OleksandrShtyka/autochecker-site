import { type NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

// Routes that require an active Premium subscription
const PREMIUM_ROUTES = [
  "/api/ai/coach",
  "/api/fitness/muscle-balance",
  "/api/fitness/supplement-forecast",
  "/api/fitness/roi/advanced",
];

const SESSION_COOKIE_NAME = "autochecker_session";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-only-secret-change-me";

function sign(value: string) {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function decodeSession(token: string): { id: string; email: string; role: string } | null {
  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) return null;

  const expectedSignature = sign(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(providedSignature);

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as { id: string; email: string; role: string; exp: number };

    if (payload.exp < Date.now()) return null;
    return { id: payload.id, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

async function checkPremium(userId: string, role: string): Promise<boolean> {
  // Admins always have premium
  if (role === "ADMIN") return true;

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!SUPABASE_URL || !SUPABASE_KEY) return false;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(userId)}&select=status,expires_at&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) return false;
    const rows = (await res.json()) as Array<{ status: string; expires_at: string | null }>;
    const row = rows[0];
    if (!row) return false;

    return (
      row.status === "active" &&
      (row.expires_at === null || new Date(row.expires_at) > new Date())
    );
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only intercept premium routes
  if (!PREMIUM_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { message: "Authentication required.", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  const session = decodeSession(token);
  if (!session) {
    return NextResponse.json(
      { message: "Invalid session.", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  const hasPremium = await checkPremium(session.id, session.role);
  if (!hasPremium) {
    return NextResponse.json(
      {
        message: "Premium subscription required.",
        code: "PREMIUM_REQUIRED",
        upgradeUrl: "/pricing",
      },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/ai/coach/:path*",
    "/api/fitness/muscle-balance/:path*",
    "/api/fitness/supplement-forecast/:path*",
    "/api/fitness/roi/advanced/:path*",
  ],
};
