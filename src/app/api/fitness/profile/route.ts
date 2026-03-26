import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { database } from "@/lib/database";
import type { FitnessGoal } from "@/features/home/types";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const profile = await database.getFitnessProfile(session.id);
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json() as {
    monthlyGymCost?: number;
    fitnessGoal?: FitnessGoal;
    fitnessBadge?: string;
  };

  const allowed: FitnessGoal[] = ["strength", "hypertrophy", "endurance", "general"];
  if (body.fitnessGoal && !allowed.includes(body.fitnessGoal)) {
    return NextResponse.json({ message: "Invalid fitnessGoal." }, { status: 400 });
  }

  await database.upsertFitnessProfile(session.id, {
    monthlyGymCost: body.monthlyGymCost,
    fitnessGoal: body.fitnessGoal,
    fitnessBadge: body.fitnessBadge,
  });

  const profile = await database.getFitnessProfile(session.id);
  return NextResponse.json({ profile });
}
