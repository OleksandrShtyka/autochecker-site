"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Plan {
  id: string;
  label: string;
  price: number;
  originalMonthly: number;
  period: string;
  days: number;
  badge?: string;
  color: string;
  glow: string;
  savings?: string;
}

const PLANS: Plan[] = [
  {
    id: "monthly",
    label: "1 Month",
    price: 7.99,
    originalMonthly: 7.99,
    period: "per month",
    days: 30,
    color: "#0D9488",
    glow: "rgba(13,148,136,0.35)",
  },
  {
    id: "6month",
    label: "6 Months",
    price: 34.99,
    originalMonthly: 5.83,
    period: "$5.83 / mo",
    days: 180,
    badge: "POPULAR",
    color: "#1B5BA0",
    glow: "rgba(27,91,160,0.35)",
    savings: "Save 27%",
  },
  {
    id: "12month",
    label: "12 Months",
    price: 49.99,
    originalMonthly: 4.17,
    period: "$4.17 / mo",
    days: 365,
    badge: "BEST VALUE",
    color: "#7C3AED",
    glow: "rgba(124,58,237,0.45)",
    savings: "Save 48%",
  },
  {
    id: "24month",
    label: "24 Months",
    price: 79.99,
    originalMonthly: 3.33,
    period: "$3.33 / mo",
    days: 730,
    color: "#0EA5E9",
    glow: "rgba(14,165,233,0.35)",
    savings: "Save 58%",
  },
];

const FREE_FEATURES = [
  "Dashboard & ROI tracking",
  "Manual session logging",
  "Supplement tracker",
  "Spotify player",
  "Google Health Connect",
  "Voice-to-Action (basic)",
  "BLE headphone battery",
  "Offline mode",
];

const PREMIUM_FEATURES = [
  { icon: "🧠", text: "Proactive AI Coach — real-time feedback" },
  { icon: "📈", text: "Progressive overload suggestions" },
  { icon: "⚖️", text: "Muscle balance audit + injury risk score" },
  { icon: "💊", text: "Supplement depletion forecasting" },
  { icon: "💰", text: "Advanced Gym ROI analytics & trends" },
  { icon: "🎧", text: "Auto-session detection via BLE" },
  { icon: "🔔", text: "Smart audio coaching cues" },
  { icon: "📊", text: "Export sessions PDF / CSV" },
  { icon: "∞", text: "Unlimited AI messages" },
];

declare global {
  interface Window {
    paypal?: {
      Buttons: (opts: object) => { render: (el: HTMLElement) => void; close: () => void };
    };
  }
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paypalReady, setPaypalReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [trialUsed, setTrialUsed] = useState(false);
  const [subStatus, setSubStatus] = useState<{ isPremium: boolean; plan?: string; expiresAt?: string | null } | null>(null);
  const paypalContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const paypalInstances = useRef<Record<string, ReturnType<NonNullable<Window["paypal"]>["Buttons"]>>>({});

  // ── Load subscription status ────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/subscriptions/status")
      .then((r) => r.json())
      .then((d) => {
        setSubStatus(d);
        if (d.plan === "trial" || (d.plan && d.isPremium)) setTrialUsed(true);
      })
      .catch(() => {});
  }, []);

  // ── Check URL params for payment result ────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const plan = params.get("plan");
    if (payment === "success" && plan) {
      setStatus("success");
      setMessage(`✅ Payment confirmed! Your ${PLANS.find(p => p.id === plan)?.label ?? plan} plan is now active.`);
    } else if (payment === "cancelled") {
      setMessage("Payment cancelled. No charge was made.");
    }
  }, []);

  // ── Render PayPal button for a plan ────────────────────────────────────────
  const renderPayPalButton = useCallback((plan: Plan) => {
    if (!window.paypal || !paypalContainerRefs.current[plan.id]) return;
    if (paypalInstances.current[plan.id]) {
      try { paypalInstances.current[plan.id].close(); } catch {}
    }

    const container = paypalContainerRefs.current[plan.id]!;
    container.innerHTML = "";

    const btn = window.paypal.Buttons({
      style: {
        layout: "vertical",
        color: "gold",
        shape: "pill",
        label: "pay",
        height: 44,
      },
      createOrder: async () => {
        const res = await fetch("/api/payments/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: plan.id }),
        });
        const data = await res.json() as { orderId?: string; message?: string };
        if (!data.orderId) throw new Error(data.message ?? "Failed to create order");
        return data.orderId;
      },
      onApprove: async (data: { orderID: string }) => {
        setStatus("loading");
        setSelectedPlan(plan.id);
        const res = await fetch("/api/payments/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.orderID, plan: plan.id }),
        });
        const result = await res.json() as { success?: boolean; message?: string };
        if (result.success) {
          setStatus("success");
          setMessage(`✅ Welcome to Premium! Your ${plan.label} plan is active.`);
          setSubStatus({ isPremium: true, plan: plan.id });
        } else {
          setStatus("error");
          setMessage(result.message ?? "Something went wrong.");
        }
      },
      onError: () => {
        setStatus("error");
        setMessage("PayPal error. Please try again.");
      },
    });

    btn.render(container);
    paypalInstances.current[plan.id] = btn;
  }, []);

  // ── Re-render buttons when PayPal loads ────────────────────────────────────
  useEffect(() => {
    if (!paypalReady) return;
    PLANS.forEach((plan) => renderPayPalButton(plan));
  }, [paypalReady, renderPayPalButton]);

  // ── Trial handler ──────────────────────────────────────────────────────────
  const startTrial = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/subscriptions/trial", { method: "POST" });
      const data = await res.json() as { success?: boolean; message?: string };
      if (res.ok) {
        setStatus("success");
        setMessage("🎉 Your 15-day free trial is now active!");
        setTrialUsed(true);
        setSubStatus({ isPremium: true, plan: "trial" });
      } else {
        setStatus("error");
        setMessage(data.message ?? "Could not activate trial.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "sb";

  return (
    <>
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`}
        onLoad={() => setPaypalReady(true)}
        strategy="afterInteractive"
      />

      <div style={styles.page}>
        {/* Animated background */}
        <div style={styles.bg}>
          <div style={{ ...styles.blob, ...styles.blob1 }} />
          <div style={{ ...styles.blob, ...styles.blob2 }} />
          <div style={{ ...styles.blob, ...styles.blob3 }} />
          <div style={styles.grid} />
        </div>

        <div style={styles.content}>

          {/* ── Active subscription banner ─────────────────────────────── */}
          {subStatus?.isPremium && (
            <div style={styles.activeBanner}>
              <span style={styles.activeDot} />
              <span>
                <strong>Premium Active</strong>
                {" — "}
                {subStatus.plan === "lifetime"
                  ? "Lifetime access"
                  : subStatus.plan === "trial"
                  ? "Free trial"
                  : PLANS.find((p) => p.id === subStatus.plan)?.label}{" "}
                {subStatus.expiresAt
                  ? `· Expires ${new Date(subStatus.expiresAt).toLocaleDateString()}`
                  : ""}
              </span>
            </div>
          )}

          {/* ── Hero ──────────────────────────────────────────────────────── */}
          <div style={styles.hero}>
            <div style={styles.heroBadge}>
              <span style={styles.heroBadgeDot} />
              GYM TRACKER PREMIUM
            </div>
            <h1 style={styles.heroTitle}>
              Unlock Your{" "}
              <span style={styles.heroGradient}>Full Potential</span>
            </h1>
            <p style={styles.heroSub}>
              AI coaching, advanced analytics, and BLE-powered features —
              everything your training deserves.
            </p>
          </div>

          {/* ── Toast message ──────────────────────────────────────────────── */}
          {message && (
            <div
              style={{
                ...styles.toast,
                background: status === "success"
                  ? "rgba(34,197,94,0.15)"
                  : "rgba(239,68,68,0.15)",
                borderColor: status === "success"
                  ? "rgba(34,197,94,0.4)"
                  : "rgba(239,68,68,0.4)",
              }}
            >
              {message}
            </div>
          )}

          {/* ── Free trial CTA ────────────────────────────────────────────── */}
          {!trialUsed && !subStatus?.isPremium && (
            <button
              style={styles.trialBtn}
              onClick={startTrial}
              disabled={status === "loading"}
            >
              {status === "loading" && selectedPlan === null
                ? "Activating…"
                : "🎁 Start 15-Day Free Trial — No Credit Card"}
            </button>
          )}

          {/* ── Feature comparison ────────────────────────────────────────── */}
          <div style={styles.compRow}>
            {/* Free */}
            <div style={styles.compCard}>
              <div style={styles.compHeader}>
                <span style={styles.compTierFree}>FREE</span>
                <span style={styles.compPrice}>$0</span>
              </div>
              <ul style={styles.featureList}>
                {FREE_FEATURES.map((f) => (
                  <li key={f} style={styles.featureItem}>
                    <span style={{ color: "#64748B" }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium */}
            <div style={{ ...styles.compCard, ...styles.compCardPremium }}>
              <div style={styles.compHeader}>
                <span style={styles.compTierPremium}>PREMIUM</span>
                <span style={{ ...styles.compPrice, color: "#0D9488" }}>Everything +</span>
              </div>
              <ul style={styles.featureList}>
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f.text} style={styles.featureItem}>
                    <span>{f.icon}</span> {f.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Plans ─────────────────────────────────────────────────────── */}
          <h2 style={styles.sectionTitle}>Choose Your Plan</h2>
          <div style={styles.plansGrid}>
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const isBest = plan.badge === "BEST VALUE";
              return (
                <div
                  key={plan.id}
                  style={{
                    ...styles.planCard,
                    borderColor: isSelected ? plan.color : isBest
                      ? `${plan.color}66`
                      : "rgba(255,255,255,0.10)",
                    boxShadow: isSelected
                      ? `0 0 40px ${plan.glow}, 0 8px 32px rgba(0,0,0,0.4)`
                      : isBest
                      ? `0 0 24px ${plan.glow}88, 0 4px 16px rgba(0,0,0,0.3)`
                      : "0 4px 16px rgba(0,0,0,0.25)",
                    transform: isSelected ? "translateY(-6px) scale(1.02)" : isBest ? "translateY(-3px)" : "none",
                  }}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.badge && (
                    <div
                      style={{
                        ...styles.planBadge,
                        background: isBest
                          ? `linear-gradient(135deg, ${plan.color}, #0D9488)`
                          : plan.color,
                      }}
                    >
                      {plan.badge}
                    </div>
                  )}

                  <div style={styles.planLabel}>{plan.label}</div>

                  <div style={styles.planPriceRow}>
                    <span style={styles.planCurrency}>$</span>
                    <span style={{ ...styles.planPrice, color: plan.color }}>
                      {plan.price.toFixed(2).split(".")[0]}
                    </span>
                    <span style={styles.planCents}>.{plan.price.toFixed(2).split(".")[1]}</span>
                  </div>
                  <div style={styles.planPeriod}>{plan.period}</div>

                  {plan.savings && (
                    <div style={{ ...styles.savingsBadge, borderColor: `${plan.color}55`, color: plan.color }}>
                      {plan.savings}
                    </div>
                  )}

                  <div
                    style={styles.paypalWrap}
                    ref={(el) => {
                      paypalContainerRefs.current[plan.id] = el;
                    }}
                  />

                  {!paypalReady && (
                    <div style={styles.paypalLoading}>Loading payment…</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Metrics showcase ──────────────────────────────────────────── */}
          <h2 style={styles.sectionTitle}>Premium Intelligence</h2>
          <div style={styles.metricsGrid}>
            <MetricCard
              icon="💰"
              title="Gym ROI Engine"
              desc="Break-even calculator, cost-per-session trend, monthly efficiency score vs average user."
              color="#0D9488"
            />
            <MetricCard
              icon="💊"
              title="Supplement Forecast"
              desc="Depletion date prediction, smart restock alerts, cost-per-gram optimization."
              color="#7C3AED"
            />
            <MetricCard
              icon="⚖️"
              title="Muscle Balance Audit"
              desc="Push/pull ratio, left–right symmetry index, injury risk score based on training history."
              color="#1B5BA0"
            />
          </div>

          {/* ── BLE Premium features ──────────────────────────────────────── */}
          <h2 style={styles.sectionTitle}>BLE Exclusive Features</h2>
          <div style={styles.bleGrid}>
            <BleCard
              icon="🎧"
              title="Auto Session Detection"
              desc="Put your Gelius GP-TWS011 on — the app starts the workout timer automatically."
              color="#0EA5E9"
            />
            <BleCard
              icon="🔔"
              title="Audio Coaching Cues"
              desc="AI milestones (set PR, volume target hit) delivered as spoken alerts through your earphones."
              color="#F59E0B"
            />
            <BleCard
              icon="📡"
              title="Live BLE Metrics"
              desc="Battery guard automation, real-time HR zone display, adaptive rest timer via connection state."
              color="#22C55E"
            />
          </div>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <div style={styles.footer}>
            <p style={styles.footerText}>
              Secure payments via PayPal · Cancel anytime · All prices in USD
            </p>
            <div style={styles.footerLogo}>GYM Tracker</div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes blobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(40px, -30px) scale(1.08); }
          66%       { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.04; }
          50%       { opacity: 0.08; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060F1A; color: #E2E8F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0D1B2A; }
        ::-webkit-scrollbar-thumb { background: #0D9488; border-radius: 3px; }
      `}</style>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function MetricCard({ icon, title, desc, color }: { icon: string; title: string; desc: string; color: string }) {
  return (
    <div style={{ ...styles.metricCard, borderColor: `${color}33` }}>
      <div style={{ ...styles.metricIcon, background: `${color}1A`, border: `1px solid ${color}44` }}>
        {icon}
      </div>
      <div style={{ ...styles.metricTitle, color }}>{title}</div>
      <div style={styles.metricDesc}>{desc}</div>
    </div>
  );
}

function BleCard({ icon, title, desc, color }: { icon: string; title: string; desc: string; color: string }) {
  return (
    <div style={{ ...styles.bleCard, borderColor: `${color}33` }}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <div>
        <div style={{ ...styles.bleTitle, color }}>{title}</div>
        <div style={styles.bleDesc}>{desc}</div>
      </div>
    </div>
  );
}

// ── Styles (object) ────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#060F1A",
    overflowX: "hidden",
    position: "relative",
  },
  bg: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 0,
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: "50%",
    filter: "blur(80px)",
    animation: "blobFloat 12s ease-in-out infinite",
  },
  blob1: {
    width: 500, height: 500,
    background: "radial-gradient(circle, rgba(13,148,136,0.18) 0%, transparent 70%)",
    top: "-100px", left: "-100px",
    animationDelay: "0s",
  },
  blob2: {
    width: 400, height: 400,
    background: "radial-gradient(circle, rgba(27,91,160,0.15) 0%, transparent 70%)",
    top: "40%", right: "-80px",
    animationDelay: "-4s",
  },
  blob3: {
    width: 350, height: 350,
    background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
    bottom: "10%", left: "30%",
    animationDelay: "-8s",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
    `,
    backgroundSize: "60px 60px",
    animation: "gridPulse 6s ease-in-out infinite",
  },
  content: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1100,
    margin: "0 auto",
    padding: "40px 20px 80px",
    display: "flex",
    flexDirection: "column",
    gap: 60,
  },
  activeBanner: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "rgba(34,197,94,0.1)",
    border: "1px solid rgba(34,197,94,0.3)",
    borderRadius: 12,
    padding: "12px 18px",
    color: "#22C55E",
    fontSize: 14,
    animation: "fadeUp 0.4s ease",
  },
  activeDot: {
    width: 8, height: 8,
    borderRadius: "50%",
    background: "#22C55E",
    boxShadow: "0 0 8px #22C55E",
    flexShrink: 0,
  },
  hero: {
    textAlign: "center",
    animation: "fadeUp 0.6s ease",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(13,148,136,0.12)",
    border: "1px solid rgba(13,148,136,0.3)",
    borderRadius: 20,
    padding: "6px 16px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: "#0D9488",
    marginBottom: 20,
  },
  heroBadgeDot: {
    width: 6, height: 6,
    borderRadius: "50%",
    background: "#0D9488",
    boxShadow: "0 0 6px #0D9488",
  },
  heroTitle: {
    fontSize: "clamp(36px, 6vw, 68px)",
    fontWeight: 900,
    lineHeight: 1.1,
    letterSpacing: -2,
    color: "#E2E8F0",
    marginBottom: 16,
  },
  heroGradient: {
    background: "linear-gradient(135deg, #0D9488, #1B5BA0, #7C3AED)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundSize: "200% auto",
    animation: "shimmer 3s linear infinite",
  },
  heroSub: {
    fontSize: 18,
    color: "#64748B",
    maxWidth: 560,
    margin: "0 auto",
    lineHeight: 1.6,
  },
  toast: {
    padding: "14px 20px",
    borderRadius: 14,
    border: "1px solid",
    fontSize: 14,
    fontWeight: 600,
    textAlign: "center",
    animation: "fadeUp 0.4s ease",
  },
  trialBtn: {
    alignSelf: "center",
    background: "linear-gradient(135deg, rgba(13,148,136,0.2), rgba(27,91,160,0.2))",
    border: "1.5px solid rgba(13,148,136,0.5)",
    borderRadius: 50,
    padding: "16px 36px",
    color: "#0D9488",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.25s ease",
    letterSpacing: 0.3,
  },
  compRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    animation: "fadeUp 0.7s ease",
  },
  compCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 24,
    padding: "28px 24px",
    backdropFilter: "blur(16px)",
  },
  compCardPremium: {
    background: "linear-gradient(135deg, rgba(13,148,136,0.08), rgba(124,58,237,0.06))",
    border: "1px solid rgba(13,148,136,0.25)",
    boxShadow: "0 0 40px rgba(13,148,136,0.08)",
  },
  compHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 14,
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  compTierFree: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: "#64748B",
  },
  compTierPremium: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: "#0D9488",
  },
  compPrice: {
    fontSize: 18,
    fontWeight: 800,
    color: "#E2E8F0",
  },
  featureList: {
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    fontSize: 13.5,
    color: "#94A3B8",
    lineHeight: 1.4,
  },
  sectionTitle: {
    fontSize: "clamp(22px, 4vw, 32px)",
    fontWeight: 800,
    letterSpacing: -0.8,
    color: "#E2E8F0",
    textAlign: "center",
  },
  plansGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 20,
    animation: "fadeUp 0.8s ease",
  },
  planCard: {
    position: "relative",
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(20px)",
    border: "1.5px solid",
    borderRadius: 24,
    padding: "28px 20px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
  },
  planBadge: {
    position: "absolute",
    top: -12,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "4px 14px",
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.2,
    color: "#fff",
    whiteSpace: "nowrap",
  },
  planLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: 600,
    letterSpacing: 0.5,
    marginTop: 8,
  },
  planPriceRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 2,
    lineHeight: 1,
  },
  planCurrency: {
    fontSize: 18,
    fontWeight: 700,
    color: "#94A3B8",
    paddingTop: 6,
  },
  planPrice: {
    fontSize: 52,
    fontWeight: 900,
    letterSpacing: -2,
    lineHeight: 1,
  },
  planCents: {
    fontSize: 20,
    fontWeight: 700,
    color: "#94A3B8",
    paddingTop: 10,
  },
  planPeriod: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: 500,
    marginBottom: 4,
  },
  savingsBadge: {
    display: "inline-block",
    alignSelf: "flex-start",
    border: "1px solid",
    borderRadius: 20,
    padding: "3px 10px",
    fontSize: 11,
    fontWeight: 700,
  },
  paypalWrap: {
    marginTop: 12,
    minHeight: 44,
  },
  paypalLoading: {
    textAlign: "center",
    fontSize: 12,
    color: "#64748B",
    padding: "12px 0",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
    animation: "fadeUp 0.9s ease",
  },
  metricCard: {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(16px)",
    border: "1px solid",
    borderRadius: 20,
    padding: "24px 22px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: 700,
  },
  metricDesc: {
    fontSize: 13.5,
    color: "#64748B",
    lineHeight: 1.6,
  },
  bleGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    animation: "fadeUp 1s ease",
  },
  bleCard: {
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(12px)",
    border: "1px solid",
    borderRadius: 18,
    padding: "20px 22px",
    display: "flex",
    alignItems: "flex-start",
    gap: 18,
  },
  bleTitle: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 4,
  },
  bleDesc: {
    fontSize: 13.5,
    color: "#64748B",
    lineHeight: 1.5,
  },
  footer: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    paddingTop: 20,
    borderTop: "1px solid rgba(255,255,255,0.07)",
  },
  footerText: {
    fontSize: 13,
    color: "#475569",
  },
  footerLogo: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0D9488",
    letterSpacing: 0.5,
  },
};
