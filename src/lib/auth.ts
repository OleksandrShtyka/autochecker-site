import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { SessionUser } from "@/features/home/types";

const SESSION_COOKIE_NAME = "autochecker_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const SESSION_SECRET = process.env.SESSION_SECRET ?? (() => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET environment variable is not set.");
  }
  return "dev-only-secret-change-me";
})();

type SessionPayload = SessionUser & {
  exp: number;
};

function sign(value: string) {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function encodePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(token: string) {
  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) {
    return null;
  }

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
    ) as SessionPayload;

    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) {
    return false;
  }

  const derived = scryptSync(password, salt, 64).toString("hex");
  const derivedBuffer = Buffer.from(derived, "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");

  return (
    derivedBuffer.length === storedBuffer.length &&
    timingSafeEqual(derivedBuffer, storedBuffer)
  );
}

export function createSessionToken(user: SessionUser) {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  const encodedPayload = encodePayload(payload);
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const payload = decodePayload(token);
  if (!payload) {
    return null;
  }

  return {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  } satisfies SessionUser;
}

export function setSessionCookie(response: NextResponse, user: SessionUser) {
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(user), {
    httpOnly: true,
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

// ── Pending MFA cookie ────────────────────────────────────────────────────────
// Issued after password verification when the account has TOTP enabled.
// Stores the user ID + expiry, HMAC-signed. Valid for 5 minutes.

const MFA_COOKIE_NAME = "autochecker_mfa_pending";
const MFA_TTL_SECONDS = 60 * 5;

export function setPendingMfaCookie(response: NextResponse, userId: string) {
  const payload = Buffer.from(JSON.stringify({ id: userId, exp: Date.now() + MFA_TTL_SECONDS * 1000 })).toString("base64url");
  const sig = sign(payload);
  response.cookies.set(MFA_COOKIE_NAME, `${payload}.${sig}`, {
    httpOnly: true,
    maxAge: MFA_TTL_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getPendingMfa(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(MFA_COOKIE_NAME)?.value;
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (sign(payload) !== sig) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { id: string; exp: number };
    if (parsed.exp < Date.now()) return null;
    return parsed.id;
  } catch {
    return null;
  }
}

export function clearPendingMfaCookie(response: NextResponse) {
  response.cookies.set(MFA_COOKIE_NAME, "", { httpOnly: true, expires: new Date(0), path: "/" });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
