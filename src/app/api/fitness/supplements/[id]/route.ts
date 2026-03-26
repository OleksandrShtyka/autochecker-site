import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { database } from "@/lib/database";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json() as {
    name?: string;
    totalWeightG?: number;
    servingSizeG?: number;
    servingsPerDay?: number;
    price?: number;
    purchaseDate?: string;
    notes?: string | null;
  };

  const supplement = await database.updateSupplement(id, session.id, body);
  return NextResponse.json({ supplement });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  await database.deleteSupplement(id, session.id);
  return NextResponse.json({ ok: true });
}
