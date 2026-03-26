import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { database } from "@/lib/database";
import type { WorkoutType, Exercise } from "@/features/home/types";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const sessions = await database.listGymSessions(session.id);
  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json() as {
    date?: string;
    durationMin?: number;
    workoutType?: WorkoutType;
    volumeKg?: number;
    exercises?: Exercise[];
    notes?: string;
  };

  const validTypes: WorkoutType[] = [
    "push", "pull", "legs", "upper", "lower", "full_body", "cardio", "other",
  ];
  if (body.workoutType && !validTypes.includes(body.workoutType)) {
    return NextResponse.json({ message: "Invalid workoutType." }, { status: 400 });
  }

  const session_data = await database.createGymSession(session.id, {
    date: body.date ?? new Date().toISOString().slice(0, 10),
    durationMin: body.durationMin ?? 60,
    workoutType: body.workoutType ?? "full_body",
    volumeKg: body.volumeKg ?? 0,
    exercises: body.exercises ?? [],
    notes: body.notes ?? null,
  });

  return NextResponse.json({ session: session_data }, { status: 201 });
}
