import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { database } from "@/lib/database";

const PLAN_DAYS: Record<string, number | null> = {
  monthly:   30,
  "6month":  180,
  "12month": 365,
  "24month": 730,
};

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getPayPalToken(): Promise<string> {
  const creds = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error("Failed to get PayPal token");
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { orderId, plan } = (await req.json()) as {
    orderId?: string;
    plan?: string;
  };

  if (!orderId || !plan || !(plan in PLAN_DAYS)) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  try {
    const token = await getPayPalToken();

    // Capture the order
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("PayPal capture error:", err);
      return NextResponse.json({ message: "Payment capture failed" }, { status: 502 });
    }

    const captured = (await res.json()) as { status: string; id: string };

    if (captured.status !== "COMPLETED") {
      return NextResponse.json({ message: "Payment not completed" }, { status: 400 });
    }

    // Calculate expiry
    const days = PLAN_DAYS[plan];
    const expiresAt = days
      ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Persist subscription
    await database.upsertSubscription(session.id, plan, expiresAt, captured.id);

    return NextResponse.json({
      success: true,
      plan,
      expiresAt,
      orderId: captured.id,
    });
  } catch (err) {
    console.error("capture-order:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
