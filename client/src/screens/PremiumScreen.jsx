import { useState } from "react";

// ─── Plan data ────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "free",
    name: "Free",
    icon: "🎮",
    tagline: "Agent vs Agent",
    monthlyPrice: 0,
    yearlyPrice: 0,
    accentColor: "#4ade80",
    glowColor: "rgba(74,222,128,0.18)",
    borderColor: "rgba(74,222,128,0.3)",
    features: [
      { label: "Ads", included: true },
      { label: "3 platform agents", included: true },
      { label: "1 custom agent", included: true },
      { label: "Tournament access", included: true },
      { label: "Basic stats & match history", included: true },
      { label: "Standard matchmaking queue", included: true },
      { label: "Basic table & chips", included: true },
    ],
    cta: "Current Plan",
    ctaDisabled: true,
  },
  {
    id: "lite",
    name: "Lite",
    icon: "🟡",
    tagline: "Remove the noise",
    monthlyPrice: 4.99,
    yearlyPrice: 39,
    accentColor: "#fbbf24",
    glowColor: "rgba(251,191,36,0.2)",
    borderColor: "rgba(251,191,36,0.35)",
    features: [
      { label: "No ads", included: true },
      { label: "5 platform agents", included: true },
      { label: "Up to 5 custom agents", included: true },
      { label: "Save agent presets", included: true },
      { label: "Extended match history", included: true },
      { label: "Basic customization (table, chips, cards)", included: true },
      { label: "Standard analytics (wins/losses)", included: true },
    ],
    cta: "Get Lite",
  },
  {
    id: "pro",
    name: "Pro",
    icon: "⭐",
    tagline: "The full experience",
    monthlyPrice: 11.99,
    yearlyPrice: 89,
    badge: "Most Popular",
    accentColor: "#3b82f6",
    glowColor: "rgba(59,130,246,0.28)",
    borderColor: "rgba(59,130,246,0.5)",
    features: [
      { label: "Everything in Lite", included: true, bold: true },
      { label: "Up to 25 custom agents", included: true },
      { label: "Ranked competitive mode", included: true },
      { label: "Advanced analytics & performance stats", included: true },
      { label: "Agent version tracking", included: true },
      { label: "Faster matchmaking / compute queue", included: true },
      { label: "Premium table & chip skins", included: true },
      { label: "Full match history", included: true },
    ],
    cta: "Get Pro",
  },
  {
    id: "elite",
    name: "Elite",
    icon: "👑",
    tagline: "Unfair advantage",
    monthlyPrice: 23.99,
    yearlyPrice: 179,
    accentColor: "#a855f7",
    glowColor: "rgba(168,85,247,0.22)",
    borderColor: "rgba(168,85,247,0.4)",
    features: [
      { label: "Everything in Pro", included: true, bold: true },
      { label: "Up to 100 custom agents", included: true },
      { label: "Priority compute & simulations", included: true },
      { label: "Advanced analytics dashboard", included: true },
      { label: "Private testing rooms", included: true },
      { label: "Early access to new agents/features", included: true },
      { label: "Exclusive cosmetics & elite profile badge", included: true },
    ],
    cta: "Get Elite",
  },
];

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, billing, onSelect }) {
  const [hovered, setHovered] = useState(false);

  const rawPrice = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  const isFree = plan.monthlyPrice === 0;
  const isPopular = !!plan.badge;

  // Per-month equivalent when billed yearly (paid plans only)
  const perMonth =
    !isFree && billing === "yearly"
      ? (plan.yearlyPrice / 12).toFixed(2)
      : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        background: hovered
          ? `linear-gradient(160deg, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0) 100%)`
          : isPopular
          ? "rgba(59,130,246,0.04)"
          : "rgba(255,255,255,0.025)",
        border: `1.5px solid ${
          hovered || isPopular ? plan.borderColor : "rgba(255,255,255,0.07)"
        }`,
        borderRadius: 22,
        padding: "32px 26px 28px",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
        boxShadow:
          hovered || isPopular ? `0 0 44px ${plan.glowColor}` : "none",
        flex: 1,
        minWidth: 240,
        maxWidth: 300,
      }}
    >
      {/* Popular badge */}
      {isPopular && (
        <div
          style={{
            position: "absolute",
            top: -13,
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(90deg,#2563eb,#1d4ed8)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            padding: "4px 16px",
            borderRadius: 20,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            boxShadow: "0 0 18px rgba(59,130,246,0.55)",
          }}
        >
          {plan.badge}
        </div>
      )}

      {/* Icon + Name */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: plan.glowColor,
            border: `1px solid ${plan.borderColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          {plan.icon}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: plan.accentColor }}>
            {plan.name}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: 1 }}>
            {plan.tagline}
          </div>
        </div>
      </div>

      {/* Price */}
      <div style={{ marginTop: 22, marginBottom: 4 }}>
        {isFree ? (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
            <span style={{ fontSize: 42, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
              $0
            </span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", marginBottom: 6 }}>
              / forever
            </span>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 5 }}>
                $
              </span>
              <span style={{ fontSize: 42, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                {rawPrice % 1 === 0 ? rawPrice : rawPrice.toFixed(2)}
              </span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", marginBottom: 6 }}>
                /{billing === "monthly" ? "mo" : "yr"}
              </span>
            </div>
            {perMonth && (
              <div style={{ fontSize: 12, color: plan.accentColor, marginTop: 4 }}>
                ${perMonth}/mo — billed annually
              </div>
            )}
            {billing === "monthly" && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.27)", marginTop: 4 }}>
                billed monthly
              </div>
            )}
          </>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "18px 0" }} />

      {/* Features */}
      <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
        {plan.features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
            <span
              style={{
                fontSize: 13,
                color: f.included ? plan.accentColor : "rgba(255,255,255,0.18)",
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              {f.included ? "✓" : "✗"}
            </span>
            <span
              style={{
                fontSize: 13,
                color: f.included ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.22)",
                lineHeight: 1.4,
                fontWeight: f.bold ? 600 : 400,
              }}
            >
              {f.label}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => !plan.ctaDisabled && onSelect(plan)}
        disabled={!!plan.ctaDisabled}
        style={{
          marginTop: 26,
          width: "100%",
          padding: "13px 0",
          borderRadius: 12,
          border: "none",
          background: plan.ctaDisabled
            ? "rgba(255,255,255,0.05)"
            : isPopular
            ? "linear-gradient(135deg,#2563eb,#1d4ed8)"
            : `linear-gradient(135deg, ${plan.accentColor}28, ${plan.accentColor}12)`,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: plan.ctaDisabled ? "rgba(255,255,255,0.08)" : plan.borderColor,
          color: plan.ctaDisabled
            ? "rgba(255,255,255,0.28)"
            : isPopular
            ? "#fff"
            : plan.accentColor,
          fontSize: 13,
          fontWeight: 700,
          cursor: plan.ctaDisabled ? "default" : "pointer",
          letterSpacing: "0.03em",
          transition: "opacity 0.15s",
          fontFamily: "'Inter', sans-serif",
          boxShadow:
            isPopular && !plan.ctaDisabled ? `0 0 22px ${plan.glowColor}` : "none",
        }}
        onMouseEnter={(e) => {
          if (!plan.ctaDisabled) e.currentTarget.style.opacity = "0.82";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
      >
        {plan.cta}
      </button>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PremiumScreen({ setScreen, user }) {
  const [billing, setBilling] = useState("monthly");
  const [toast, setToast] = useState(null);

  function handleSelect(plan) {
    setToast(`${plan.name} plan selected — payment coming soon!`);
    setTimeout(() => setToast(null), 3500);
  }

  // Max yearly savings across paid plans
  const paidPlans = PLANS.filter((p) => p.monthlyPrice > 0);
  const maxSaving = Math.max(
    ...paidPlans.map((p) => Math.round(p.monthlyPrice * 12 - p.yearlyPrice))
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.07) 0%, transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "14px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => setScreen("home")}
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.45)",
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "'Inter', sans-serif",
            padding: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
        >
          ← Back
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#3b82f6",
              boxShadow: "0 0 8px rgba(59,130,246,0.7)",
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "#3b82f6",
            }}
          >
            PREMIUM
          </span>
        </div>

        <div style={{ width: 60 }} />
      </div>

      {/* Body */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1240,
          margin: "0 auto",
          padding: "64px 24px 100px",
        }}
      >
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.25)",
              color: "#3b82f6",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              padding: "5px 14px",
              borderRadius: 20,
              marginBottom: 20,
            }}
          >
            AGENT VS AGENT — PLANS
          </div>
          <h1
            style={{
              fontSize: "clamp(30px, 5vw, 50px)",
              fontWeight: 800,
              margin: "0 0 16px",
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
            }}
          >
            Build smarter agents.
            <br />
            <span style={{ color: "#3b82f6" }}>Play harder.</span>
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.42)",
              maxWidth: 500,
              margin: "0 auto",
              lineHeight: 1.65,
            }}
          >
            Every plan includes tournament access — competitive play is never
            paywalled. Upgrade to unlock more agents, analytics, and power.
          </p>
        </div>

        {/* Billing toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 48 }}>
          <div
            style={{
              display: "inline-flex",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 40,
              padding: 4,
              gap: 4,
            }}
          >
            {["monthly", "yearly"].map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                style={{
                  padding: "9px 22px",
                  borderRadius: 36,
                  border: "none",
                  background: billing === b ? "#2563eb" : "transparent",
                  color: billing === b ? "#fff" : "rgba(255,255,255,0.42)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  transition: "background 0.15s, color 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {b.charAt(0).toUpperCase() + b.slice(1)}
                {b === "yearly" && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background:
                        billing === "yearly"
                          ? "rgba(255,255,255,0.18)"
                          : "rgba(74,222,128,0.15)",
                      color: billing === "yearly" ? "#fff" : "#4ade80",
                      padding: "2px 7px",
                      borderRadius: 20,
                      letterSpacing: "0.05em",
                    }}
                  >
                    SAVE UP TO ${maxSaving}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            flexWrap: "wrap",
            alignItems: "stretch",
          }}
        >
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billing={billing}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {/* All-plans note */}
        <div
          style={{
            textAlign: "center",
            marginTop: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: "rgba(255,255,255,0.35)",
            fontSize: 13,
          }}
        >
          <span style={{ color: "#4ade80" }}>✓</span>
          All plans include tournament access — competitive play is never paywalled.
        </div>

        {/* Fine print */}
        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            color: "rgba(255,255,255,0.18)",
            fontSize: 12,
            lineHeight: 1.7,
          }}
        >
          Cancel anytime. No hidden fees. All prices in USD.
          <br />
          Subscriptions auto-renew unless cancelled before the renewal date.
        </div>

        {/* FAQ */}
        <div
          style={{
            marginTop: 72,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 48,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 32,
          }}
        >
          {[
            {
              q: "Can I switch plans?",
              a: "Yes — upgrade or downgrade at any time and we'll prorate the difference automatically.",
            },
            {
              q: "What happens if I cancel?",
              a: "You keep your benefits until the end of the billing period. No surprises, no data loss.",
            },
            {
              q: "Is tournament access always free?",
              a: "Yes. Competitive tournaments are open to all players regardless of plan. We never paywall the core game.",
            },
            {
              q: "How does the custom agent limit work?",
              a: "You can save and run up to your plan's limit of custom AI agents simultaneously. Upgrade anytime to raise the cap.",
            },
          ].map((item, i) => (
            <div key={i}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: 8,
                }}
              >
                {item.q}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.38)",
                  lineHeight: 1.65,
                }}
              >
                {item.a}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 500,
            zIndex: 999,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

