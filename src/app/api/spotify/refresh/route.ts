import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;

export async function POST(req: NextRequest) {
  const { refresh_token } = await req.json();
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
    }).toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { message: data.error_description ?? "Refresh failed" },
      { status: 400 }
    );
  }
  return NextResponse.json(data);
}
