"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bell, CreditCard, Mail, Shield, User } from "lucide-react";
import { AuthenticatedShell } from "@/app/components/authenticated-shell";
import { AuthGuard } from "@/app/components/auth-guard";
import { Hexagon } from "@/app/components/hexagon";
import { getBrowserClient } from "@/lib/supabase/browser-client";

type MeResponse = {
  tenantId: string;
  mode: "authenticated" | "anonymous";
  userId?: string;
  email?: string;
  plan?: {
    code: string;
    maxProviderAccounts: number;
    smsEnabled: boolean;
    telegramEnabled: boolean;
    discordEnabled: boolean;
  };
};

export default function SettingsPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const supabase = getBrowserClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const t = session?.access_token ?? "";
      const headers: HeadersInit = t ? { Authorization: `Bearer ${t}` } : {};

      try {
        const res = await fetch("/api/auth/me", { headers });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error ?? "Failed to load profile.");
        setMe(payload as MeResponse);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const plan = me?.plan;

  return (
    <AuthenticatedShell>
      <AuthGuard>
        <div className="stack animate-in">
          {/* Header */}
          <div>
            <h1 className="hero-title">Settings</h1>
            <p className="hero-subtitle">Manage your account, plan, and notification preferences.</p>
          </div>

          {loading ? (
            <p className="hint">Loading settings…</p>
          ) : (
            <div className="split-grid" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
              {/* Left: profile + plan */}
              <div className="stack">
                {/* Profile card */}
                <section className="card panel">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "#0A2A3F",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <User size={20} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Account</h2>
                  </div>

                  <div style={{ display: "grid", gap: 12 }}>
                    <div>
                      <p className="hint" style={{ margin: "0 0 4px" }}>Email</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Mail size={15} strokeWidth={2} />
                        <strong>{me?.email ?? "—"}</strong>
                      </div>
                    </div>

                    <div>
                      <p className="hint" style={{ margin: "0 0 4px" }}>Account Mode</p>
                      <span
                        className={`status-pill ${me?.mode === "authenticated" ? "status-ok" : "status-warn"}`}
                        style={{ display: "inline-flex" }}
                      >
                        <Shield size={12} strokeWidth={2.5} />
                        {me?.mode === "authenticated" ? "Authenticated" : "Anonymous"}
                      </span>
                    </div>

                    <div>
                      <p className="hint" style={{ margin: "0 0 4px" }}>Tenant ID</p>
                      <code
                        style={{
                          fontSize: "0.78rem",
                          background: "rgba(10,42,63,0.06)",
                          border: "1.5px solid rgba(10,42,63,0.12)",
                          borderRadius: 8,
                          padding: "4px 8px",
                          display: "block",
                          wordBreak: "break-all"
                        }}
                      >
                        {me?.tenantId ?? "—"}
                      </code>
                    </div>
                  </div>
                </section>

                {/* Plan card */}
                <section className="card panel">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "#0A2A3F",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Subscription</h2>
                    </div>
                    <div
                      style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}
                      className={`status-pill ${plan?.code === "pro" ? "status-ok" : "status-warn"}`}
                    >
                      <Hexagon size={12} fill="currentColor" stroke="currentColor" strokeWidth={0} />
                      {plan?.code ?? "free"}
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="hint">Max API Keys</span>
                      <strong>{plan?.maxProviderAccounts ?? 1}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="hint">SMS Alerts</span>
                      <span className={`status-pill ${plan?.smsEnabled ? "status-ok" : ""}`} style={{ border: "none", background: "none", padding: 0, fontWeight: 700, fontSize: "0.84rem" }}>
                        {plan?.smsEnabled ? "✓ Enabled" : "✗ Upgrade required"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="hint">Telegram Alerts</span>
                      <span style={{ fontWeight: 700, fontSize: "0.84rem" }}>
                        {plan?.telegramEnabled ? "✓ Enabled" : "✗ Upgrade required"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="hint">Discord Alerts</span>
                      <span style={{ fontWeight: 700, fontSize: "0.84rem" }}>
                        {plan?.discordEnabled ? "✓ Enabled" : "✗ Upgrade required"}
                      </span>
                    </div>
                  </div>

                  {plan?.code !== "pro" && (
                    <Link
                      href="/pricing"
                      className="button-glow"
                      style={{ textDecoration: "none", width: "100%", marginTop: 18, justifyContent: "center" }}
                    >
                      Upgrade Plan
                      <ArrowRight size={15} strokeWidth={2.5} />
                    </Link>
                  )}
                </section>
              </div>

              {/* Right: notification channels + quick links */}
              <div className="stack">
                {/* Notification channels */}
                <section className="card panel">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "#0A2A3F",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Bell size={20} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Alert Channels</h2>
                  </div>

                  {[
                    {
                      name: "Discord",
                      enabled: plan?.discordEnabled ?? true,
                      note: "Configure webhook in Intake"
                    },
                    {
                      name: "Telegram",
                      enabled: plan?.telegramEnabled ?? false,
                      note: "Configure Chat ID in Intake"
                    },
                    {
                      name: "SMS (Twilio)",
                      enabled: plan?.smsEnabled ?? false,
                      note: "Pro plan required"
                    }
                  ].map((ch) => (
                    <div
                      key={ch.name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 0",
                        borderBottom: "1.5px solid rgba(10,42,63,0.08)"
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "0.9rem" }}>{ch.name}</strong>
                        <p className="hint" style={{ margin: "2px 0 0", fontSize: "0.78rem" }}>{ch.note}</p>
                      </div>
                      <span className={`status-pill ${ch.enabled ? "status-ok" : ""}`} style={!ch.enabled ? { borderColor: "rgba(10,42,63,0.2)", color: "var(--ink-faint)" } : undefined}>
                        {ch.enabled ? "Available" : "Locked"}
                      </span>
                    </div>
                  ))}
                </section>

                {/* Quick links */}
                <section className="card panel" style={{ display: "grid", gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>Quick Actions</h3>
                  <Link href="/keys" style={{ textDecoration: "none" }} className="button-secondary">
                    Manage API Keys
                    <ArrowRight size={14} />
                  </Link>
                  <Link href="/alerts" style={{ textDecoration: "none" }} className="button-secondary">
                    View Alert History
                    <ArrowRight size={14} />
                  </Link>
                  <Link href="/intake" style={{ textDecoration: "none" }} className="button-secondary">
                    Configure New Integration
                    <ArrowRight size={14} />
                  </Link>
                </section>
              </div>
            </div>
          )}

          {error ? <p className="error-text">{error}</p> : null}
        </div>
      </AuthGuard>
    </AuthenticatedShell>
  );
}
