import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    build: 17,
    url: "https://autochecker-site.vercel.app/Files/app-release.apk",
  });
}
