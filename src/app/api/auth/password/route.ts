import { type NextRequest } from "next/server";
import { proxyToGo } from "@/lib/goProxy";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest) {
  return proxyToGo(req, "/api/auth/password");
}
