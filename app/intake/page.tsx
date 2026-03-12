"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, MessageSquareWarning, ShieldAlert, Zap } from "lucide-react";
import { AuthenticatedShell } from "@/app/components/authenticated-shell";
import { Select } from "@/app/components/select";
import { Hexagon } from "@/app/components/hexagon";
import { Logo } from "@/app/components/logo";
import { getBrowserClient } from "@/lib/supabase/browser-client";

const MODELS = [
  { id: "gpt4", label: "GPT-4 Turbo" },
  { id: "gpt35", label: "GPT-3.5 Turbo" },
  { id: "claude3-opus", label: "Claude 3 Opus" },
  { id: "claude3-sonnet", label: "Claude 3 Sonnet" },
];

export default function IntakePage() {
  const [token, setToken] = useState("");
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [workspace, setWorkspace] = useState("Production Web App");
  const [selectedModels, setSelectedModels] = useState<string[]>(["gpt4", "claude3-opus"]);
  const [dailyLimitUsd, setDailyLimitUsd] = useState("20.00");
  const [alertTab, setAlertTab] = useState<"discord" | "slack">("discord");
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [smsToNumber, setSmsToNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void (async () => {
      const supabase = getBrowserClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();
      setToken(session?.access_token ?? "");
    })();
  }, []);

  function toggleModel(id: string) {
    setSelectedModels((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  const previewSpend = useMemo(() => (Number(dailyLimitUsd || 0) * 0.8).toFixed(2), [dailyLimitUsd]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    if (!token) {
      setError("Sign in first so we can attach provider keys to your workspace.");
      setSaving(false);
      return;
    }
    if (!apiKey) {
      setError("Provider API key is required.");
      setSaving(false);
      return;
    }

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      };
      const connectRes = await fetch("/api/providers/connect", {
        method: "POST",
        headers,
        body: JSON.stringify({ provider, apiKey, keyScope: "billing_read" })
      });
      const connectPayload = await connectRes.json();
      if (!connectRes.ok) throw new Error(connectPayload.error ?? "Failed to connect provider.");

      const policyRes = await fetch("/api/policies", {
        method: "POST",
        headers,
        body: JSON.stringify({
          dailyLimitUsd: Number(dailyLimitUsd || 0),
          spikePct: 150,
          burstWindowMin: 60,
          cooldownMin: 30,
          discordWebhookUrl: discordWebhookUrl || null,
          telegramChatId: telegramChatId || null,
          smsToNumber: smsToNumber || null
        })
      });
      const policyPayload = await policyRes.json();
      if (!policyRes.ok) throw new Error(policyPayload.error ?? "Failed to save policy.");

      setSuccess("Secure key generated and guardrail policy saved.");
      setApiKey("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to configure integration.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthenticatedShell>
      <div className="page-relative animate-in" style={{ minHeight: "calc(100vh - 80px)" }}>
        {/* Hexagon background flourish */}
        <div className="hex-bg">
          <Hexagon
            size={800}
            stroke="#0A2A3F"
            strokeWidth={0.5}
            className="hexbg-svg"
            style={{ opacity: 0.04, transform: "rotate(12deg)" } as React.CSSProperties}
          />
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="stack">
            <div>
              <h1 className="hero-title">Configure Integration</h1>
              <p className="hero-subtitle">Deploy a new secure proxy key with embedded spend guardrails.</p>
            </div>

            <div className="split-grid" style={{ gridTemplateColumns: "1.35fr 1fr" }}>
              {/* Left: form */}
              <div className="stack">
                <form className="card" onSubmit={onSubmit}>
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom: "2px solid rgba(10,42,63,0.1)",
                      display: "flex",
                      alignItems: "center",
                      gap: 10
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "#0A2A3F",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Zap size={18} strokeWidth={2.5} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Core Settings</h2>
                  </div>

                  <div style={{ padding: "20px", display: "grid", gap: 16 }}>
                    <label className="label" style={{ marginBottom: 0 }}>
                      <span style={{ display: "flex", justifyContent: "space-between" }}>
                        Environment Label
                        <span className="hint" style={{ fontSize: "0.75rem" }}>Internal reference</span>
                      </span>
                      <input
                        value={workspace}
                        onChange={(e) => setWorkspace(e.target.value)}
                        placeholder="e.g. Production Web App"
                      />
                    </label>

                    <label className="label" style={{ marginBottom: 0 }}>
                      Provider
                      <Select
                        value={provider}
                        onChange={setProvider}
                        options={[
                          { value: "openai", label: "OpenAI" },
                          { value: "anthropic", label: "Anthropic" },
                          { value: "gcp", label: "GCP (Vertex AI)" }
                        ]}
                      />
                    </label>

                    <label className="label" style={{ marginBottom: 0 }}>
                      Provider API Key
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Paste billing-read key"
                      />
                    </label>

                    {/* Model selection */}
                    <div>
                      <span className="label" style={{ display: "block", marginBottom: 10 }}>Allowed Models</span>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {MODELS.map((model) => (
                          <label key={model.id} className="model-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedModels.includes(model.id)}
                              onChange={() => toggleModel(model.id)}
                            />
                            {model.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Daily limit */}
                    <div style={{ borderTop: "2px solid rgba(10,42,63,0.1)", paddingTop: 16 }}>
                      <label className="label" style={{ marginBottom: 0 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <ShieldAlert size={14} color="#F39C12" strokeWidth={2.5} />
                          Hard Limit (Daily USD)
                        </span>
                        <div style={{ position: "relative" }}>
                          <span
                            style={{
                              position: "absolute",
                              left: 12,
                              top: "50%",
                              transform: "translateY(-50%)",
                              fontWeight: 800
                            }}
                          >
                            $
                          </span>
                          <input
                            type="number"
                            min="0"
                            style={{ paddingLeft: 26 }}
                            value={dailyLimitUsd}
                            onChange={(e) => setDailyLimitUsd(e.target.value)}
                          />
                        </div>
                        <p className="hint" style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                          <AlertTriangle size={12} strokeWidth={3} />
                          Requests blocked immediately when threshold is crossed.
                        </p>
                      </label>
                    </div>

                    {/* Alert channels */}
                    <label className="label" style={{ marginBottom: 0 }}>
                      Discord Webhook URL
                      <input
                        value={discordWebhookUrl}
                        onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                        placeholder="Optional"
                      />
                    </label>

                    <label className="label" style={{ marginBottom: 0 }}>
                      Telegram Chat ID
                      <input
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        placeholder="Optional"
                      />
                    </label>

                    <label className="label" style={{ marginBottom: 0 }}>
                      SMS Destination
                      <input
                        value={smsToNumber}
                        onChange={(e) => setSmsToNumber(e.target.value)}
                        placeholder="Optional — Pro plan only"
                      />
                    </label>

                    <div className="inline-actions" style={{ justifyContent: "flex-end", marginTop: 4 }}>
                      <button type="button" className="button-secondary" onClick={() => setApiKey("")}>
                        Cancel
                      </button>
                      <button type="submit" className="button-glow" disabled={saving}>
                        <CheckCircle2 size={16} strokeWidth={2.5} />
                        {saving ? "Saving…" : "Generate Secure Key"}
                      </button>
                    </div>

                    {error ? <p className="error-text" style={{ margin: 0 }}>{error}</p> : null}
                    {success ? <p className="success-text" style={{ margin: 0 }}>{success}</p> : null}
                  </div>
                </form>
              </div>

              {/* Right: sidebar cards */}
              <div className="stack">
                {/* Alert simulation card */}
                <section className="card" style={{ background: "#FAFAFC", borderColor: "rgba(10,42,63,0.2)" }}>
                  <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Alert Simulation</h3>
                    <div className="tab-switcher" style={{ width: "auto" }}>
                      <button
                        type="button"
                        className={alertTab === "slack" ? "tab-active" : ""}
                        onClick={() => setAlertTab("slack")}
                      >
                        Slack
                      </button>
                      <button
                        type="button"
                        className={alertTab === "discord" ? "tab-active" : ""}
                        onClick={() => setAlertTab("discord")}
                      >
                        Discord
                      </button>
                    </div>
                  </div>
                  <p className="hint" style={{ padding: "0 16px 10px", margin: 0 }}>
                    Preview notification when spend hits 80% of ${dailyLimitUsd}.
                  </p>
                  <div style={{ padding: "0 16px 16px" }}>
                    <div
                      style={{
                        borderLeft: "6px solid #F39C12",
                        borderRadius: 12,
                        border: "2px solid rgba(10,42,63,0.15)",
                        borderLeftWidth: 6,
                        borderLeftColor: "#F39C12",
                        background: "#fff",
                        padding: 14
                      }}
                    >
                      <div style={{ display: "flex", gap: 10 }}>
                        <Logo size={36} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <strong style={{ fontSize: "0.88rem" }}>API Spend Guard</strong>
                            <span
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 800,
                                background: "rgba(10,42,63,0.15)",
                                color: "#0A2A3F",
                                borderRadius: 4,
                                padding: "1px 5px"
                              }}
                            >
                              APP
                            </span>
                            <span className="hint" style={{ marginLeft: "auto", fontSize: "0.72rem" }}>Just now</span>
                          </div>
                          <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: "0.84rem" }}>
                            ⚠️{" "}
                            <span style={{ color: "#F39C12", fontWeight: 800 }}>Approaching Quota:</span>{" "}
                            &quot;{workspace}&quot; reached 80% of daily budget.
                          </p>
                          <div
                            style={{
                              border: "2px solid rgba(10,42,63,0.1)",
                              borderRadius: 10,
                              padding: 10,
                              background: "#FAFAFC"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span className="hint" style={{ fontSize: "0.78rem" }}>Current Spend</span>
                              <strong style={{ fontSize: "0.84rem" }}>${previewSpend}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                              <span className="hint" style={{ fontSize: "0.78rem" }}>Hard Limit</span>
                              <strong style={{ fontSize: "0.84rem" }}>${Number(dailyLimitUsd || 0).toFixed(2)}</strong>
                            </div>
                            <div className="quota-bar">
                              <div className="quota-fill" style={{ width: "80%", background: "#F39C12" }} />
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                            {["View Dashboard", "Increase Limit"].map((label) => (
                              <button
                                key={label}
                                type="button"
                                className="button-secondary"
                                style={{ fontSize: "0.74rem", minHeight: 30, padding: "4px 10px" }}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Upgrade nudge */}
                <section
                  className="card panel"
                  style={{ background: "linear-gradient(135deg, #0A2A3F, rgba(10,42,63,0.88))", color: "#fff", borderColor: "#0A2A3F" }}
                >
                  <div style={{ display: "flex", gap: 12 }}>
                    <MessageSquareWarning color="#F39C12" size={22} strokeWidth={2.5} />
                    <div>
                      <h4 style={{ margin: "0 0 5px", fontSize: "0.9rem" }}>Need granular alerting?</h4>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: "0.82rem", fontWeight: 600 }}>
                        Upgrade to enable model-specific policies and multi-channel escalations.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedShell>
  );
}
