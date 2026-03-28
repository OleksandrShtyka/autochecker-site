import { type NextRequest } from "next/server";
import { proxyToGo } from "@/lib/goProxy";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return proxyToGo(req, "/api/auth/totp/verify");
}
