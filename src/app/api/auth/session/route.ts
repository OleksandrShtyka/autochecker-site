import { type NextRequest } from "next/server";
import { proxyToGo } from "@/lib/goProxy";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return proxyToGo(req, "/api/auth/session");
}
