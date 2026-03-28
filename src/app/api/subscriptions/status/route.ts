import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { database } from "@/lib/database";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, isPremium: false });
  }

  // Admin always has lifetime premium
  if (session.role === "ADMIN") {
    return NextResponse.json({
      authenticated: true,
      isPremium: true,
      plan: "lifetime",
      status: "active",
      expiresAt: null,
    });
  }

  const sub = await database.getSubscription(session.id);

  if (!sub) {
    return NextResponse.json({ authenticated: true, isPremium: false, plan: null });
  }

  // Check if expired
  const isActive =
    sub.status === "active" &&
    (sub.expiresAt === null || new Date(sub.expiresAt) > new Date());

  return NextResponse.json({
    authenticated: true,
    isPremium: isActive,
    plan: sub.plan,
    status: sub.status,
    expiresAt: sub.expiresAt,
  });
}
