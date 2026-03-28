import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { database } from "@/lib/database";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Check if user already has any subscription
  const existing = await database.getSubscription(session.id);
  if (existing) {
    return NextResponse.json(
      { message: "Trial already used or subscription exists." },
      { status: 409 }
    );
  }

  await database.activateTrial(session.id);

  const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
  return NextResponse.json({ success: true, plan: "trial", expiresAt });
}
