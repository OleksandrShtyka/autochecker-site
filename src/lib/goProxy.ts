import { type NextRequest, NextResponse } from "next/server";

const GO_API = "https://autochecker-api.fly.dev";

/**
 * Proxies a request to the Go API, forwarding cookies and headers.
 * The response (including Set-Cookie) is forwarded back to the client.
 */
export async function proxyToGo(req: NextRequest, path: string): Promise<NextResponse> {
  const url = `${GO_API}${path}`;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  // Forward session/MFA cookies so Go can authenticate the request
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await req.text();
    } catch {
      body = undefined;
    }
  }

  const goRes = await fetch(url, {
    method: req.method,
    headers,
    body,
  });

  const resBody = await goRes.text();

  const res = new NextResponse(resBody, {
    status: goRes.status,
    headers: { "Content-Type": "application/json" },
  });

  // Forward Set-Cookie headers (session token, MFA cookie)
  goRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      res.headers.append("set-cookie", value);
    }
  });

  return res;
}
