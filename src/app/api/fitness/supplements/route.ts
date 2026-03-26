import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { database } from "@/lib/database";
export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const [supplements, statuses] = await Promise.all([
    database.listSupplements(session.id),
    database.getSupplementStatuses(session.id),
  ]);

  return NextResponse.json({ supplements, statuses });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json() as {
    name?: string;
    totalWeightG?: number;
    servingSizeG?: number;
    servingsPerDay?: number;
    price?: number;
    purchaseDate?: string;
    notes?: string;
  };

  if (!body.name || !body.totalWeightG || !body.servingSizeG) {
    return NextResponse.json({ message: "name, totalWeightG, and servingSizeG are required." }, { status: 400 });
  }

  const supplement = await database.createSupplement(session.id, {
    name: body.name,
    totalWeightG: body.totalWeightG,
    servingSizeG: body.servingSizeG,
    servingsPerDay: body.servingsPerDay ?? 1,
    price: body.price ?? 0,
    purchaseDate: body.purchaseDate ?? new Date().toISOString().slice(0, 10),
    notes: body.notes ?? null,
  });

  return NextResponse.json({ supplement }, { status: 201 });
}
