import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const PLAN_PRICES: Record<string, { amount: string; days: number; label: string }> = {
  monthly:  { amount: "7.99",  days: 30,  label: "GYM Tracker Premium — 1 Month" },
  "6month": { amount: "34.99", days: 180, label: "GYM Tracker Premium — 6 Months" },
  "12month":{ amount: "49.99", days: 365, label: "GYM Tracker Premium — 12 Months" },
  "24month":{ amount: "79.99", days: 730, label: "GYM Tracker Premium — 24 Months" },
};

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getPayPalToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const secret   = process.env.PAYPAL_CLIENT_SECRET!;
  const creds    = Buffer.from(`${clientId}:${secret}`).toString("base64");

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

  const { plan } = (await req.json()) as { plan?: string };
  const planInfo = plan ? PLAN_PRICES[plan] : null;
  if (!planInfo) {
    return NextResponse.json({ message: "Invalid plan" }, { status: 400 });
  }

  try {
    const token  = await getPayPalToken();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autochecker-site.vercel.app";

    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: `${session.id}:${plan}`,
            description: planInfo.label,
            amount: {
              currency_code: "USD",
              value: planInfo.amount,
            },
          },
        ],
        application_context: {
          brand_name: "GYM Tracker",
          return_url: `${siteUrl}/pricing?payment=success&plan=${plan}`,
          cancel_url: `${siteUrl}/pricing?payment=cancelled`,
          user_action: "PAY_NOW",
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("PayPal create-order error:", err);
      return NextResponse.json({ message: "PayPal error" }, { status: 502 });
    }

    const order = (await res.json()) as {
      id: string;
      links: { rel: string; href: string }[];
    };
    const approveUrl = order.links.find((l) => l.rel === "approve")?.href ?? null;
    return NextResponse.json({ orderId: order.id, approveUrl });
  } catch (err) {
    console.error("create-order:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
