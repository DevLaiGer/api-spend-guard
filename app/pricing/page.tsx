"use client";

import { Check, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthenticatedShell } from "@/app/components/authenticated-shell";
import { Hexagon } from "@/app/components/hexagon";

const tiers = [
  {
    name: "Developer",
    price: "$0",
    description: "For hobbyists and local testing.",
    features: ["1 Environment Key", "$50 Monthly Spend Limit", "Community Support", "Basic Analytics (7d)"],
    button: "Current Plan",
    variant: "secondary" as const,
    recommended: false
  },
  {
    name: "Founder",
    price: "$10",
    period: "/mo",
    description: "For early stage startups scaling usage.",
    features: [
      "10 Environment Keys",
      "Unlimited Spend Guardrails",
      "Slack & Discord Alerts",
      "Advanced Analytics (30d)",
      "Priority Support"
    ],
    button: "Upgrade to Founder",
    variant: "glow" as const,
    recommended: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large teams needing compliance.",
    features: [
      "Unlimited Keys & Envs",
      "SSO & SAML Login",
      "Custom Data Retention",
      "Dedicated Account Manager",
      "On-premise deployment options"
    ],
    button: "Contact Sales",
    variant: "default" as const,
    recommended: false
  }
];

export default function PricingPage() {
  const router = useRouter();

  function handleCta(tier: (typeof tiers)[number]) {
    if (tier.name === "Founder") {
      router.push("/api/webhooks/stripe");
    } else if (tier.name === "Enterprise") {
      window.location.href = "mailto:sales@apispendguard.io";
    }
  }

  return (
    <AuthenticatedShell>
      <div className="stack animate-in" style={{ paddingTop: 8 }}>
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto" }}>
          <h1 className="hero-title">Scale Intelligent Infrastructure</h1>
          <p className="hero-subtitle">
            Transparent pricing to protect your bottom line from runaway API costs.
          </p>
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 24,
            alignItems: "end",
            maxWidth: 980,
            margin: "0 auto",
            width: "100%"
          }}
        >
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className="card"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                ...(tier.recommended
                  ? { borderColor: "#F39C12", boxShadow: "0 0 30px rgba(243,156,18,0.15)", transform: "scale(1.03)" }
                  : undefined)
              }}
            >
              {tier.recommended && (
                <div
                  style={{
                    position: "absolute",
                    top: -20,
                    left: 0,
                    right: 0,
                    display: "flex",
                    justifyContent: "center"
                  }}
                >
                  <div
                    className="badge badge-accent"
                    style={{ boxShadow: "0 4px 14px rgba(243,156,18,0.4)" }}
                  >
                    <Hexagon size={14} fill="#fff" stroke="#F39C12" strokeWidth={1} />
                    Recommended
                  </div>
                </div>
              )}

              {/* Header */}
              <div style={{ padding: "28px 24px 16px", textAlign: "center" }}>
                <h2 style={{ margin: "0 0 12px", fontSize: "1.4rem", fontWeight: 800 }}>{tier.name}</h2>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
                  <span style={{ fontSize: "2.8rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{tier.price}</span>
                  {tier.period ? <span className="muted" style={{ fontSize: "1.1rem" }}>{tier.period}</span> : null}
                </div>
                <p className="hint" style={{ marginTop: 10 }}>{tier.description}</p>
              </div>

              {/* Features */}
              <div style={{ padding: "0 24px", flex: 1 }}>
                <ul className="cta-list" style={{ marginTop: 8 }}>
                  {tier.features.map((feature) => (
                    <li key={feature} style={{ display: "flex", alignItems: "start", gap: 10 }}>
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 999,
                          border: "2px solid rgba(10,42,63,0.25)",
                          background: "rgba(10,42,63,0.05)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: 1,
                          flexShrink: 0
                        }}
                      >
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span style={{ fontSize: "0.88rem", fontWeight: 700 }}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div style={{ padding: "24px" }}>
                <button
                  className={tier.variant === "glow" ? "button-glow" : tier.variant === "secondary" ? "button-secondary" : ""}
                  style={{ width: "100%" }}
                  onClick={() => handleCta(tier)}
                >
                  {tier.button}
                </button>
              </div>
            </article>
          ))}
        </section>

        <section
          className="card panel"
          style={{ maxWidth: 860, margin: "0 auto", width: "100%", display: "flex", gap: 12, alignItems: "center" }}
        >
          <Info size={20} style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700 }}>
            All plans include 100% data privacy guarantees. Payload bodies are never logged — only metadata
            strictly necessary for budget enforcement and alert routing.
          </p>
        </section>
      </div>
    </AuthenticatedShell>
  );
}
