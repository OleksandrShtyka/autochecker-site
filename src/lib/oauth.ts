import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-only-secret-change-me";
export const OAUTH_STATE_COOKIE = "autochecker_oauth_state";
export const OAUTH_STATE_TTL_SECONDS = 60 * 15; // 15 minutes

function sign(value: string) {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

export function generateOAuthState() {
  const random = randomBytes(16).toString("base64url");
  const signature = sign(random);
  return `${random}.${signature}`;
}

export function verifyOAuthState(state: string) {
  const dotIndex = state.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const random = state.slice(0, dotIndex);
  const signature = state.slice(dotIndex + 1);
  if (!random || !signature) return false;

  const expected = sign(random);
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(signature);

  return (
    expectedBuf.length === providedBuf.length &&
    timingSafeEqual(expectedBuf, providedBuf)
  );
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
