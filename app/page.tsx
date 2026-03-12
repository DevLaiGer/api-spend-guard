"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Bell, Lock, Plus, ShieldAlert, Webhook } from "lucide-react";
import { Logo } from "@/app/components/logo";
import { Select } from "@/app/components/select";

export default function HomePage() {
  const router = useRouter();
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [alertType, setAlertType] = useState<"discord" | "telegram">("discord");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [dailyLimit, setDailyLimit] = useState("50");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onDeploy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!apiKey) {
      setError("Provider API key is required.");
      return;
    }
    setSubmitting(true);
    setError("");

    const payload = {
      tenantName: "My Free Workspace",
      provider,
      apiKey,
      discordWebhookUrl: alertType === "discord" ? webhookUrl : "",
      telegramChatId: alertType === "telegram" ? webhookUrl : "",
      dailyLimitUsd: Number(dailyLimit || 50),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent
    };

    try {
      const res = await fetch("/api/onboarding/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create free workspace.");
        setSubmitting(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="animate-in"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        background: "radial-gradient(circle at center, rgba(10,42,63,0.03) 0%, transparent 100%) #FAFAFC"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0
        }}
      >
        <Logo size={96} />

        <div style={{ textAlign: "center", margin: "20px 0 28px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "1.9rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#0A2A3F"
            }}
          >
            API Spend Guard
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: "0.97rem",
              fontWeight: 600,
              color: "rgba(10,42,63,0.65)"
            }}
          >
            Initialize your free guardrail in seconds. No account required for a single key.
          </p>
        </div>

        <div className="card" style={{ width: "100%", padding: 0, overflow: "hidden" }}>
          {/* Card header */}
          <div
            style={{
              padding: "20px 24px 18px",
              borderBottom: "2px solid rgba(10,42,63,0.1)",
              display: "flex",
              alignItems: "center",
              gap: 10
            }}
          >
            <Webhook size={20} color="#F39C12" strokeWidth={2.5} />
            <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800 }}>Quick Setup</h2>
          </div>

          <form onSubmit={onDeploy} style={{ padding: "20px 24px", display: "grid", gap: 18 }}>
            {/* Provider + API key */}
            <div style={{ display: "grid", gap: 14 }}>
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
                  placeholder="sk-…"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
              </label>

              <button
                type="button"
                className="button-secondary"
                style={{
                  borderStyle: "dashed",
                  color: "rgba(10,42,63,0.55)",
                  justifyContent: "center",
                  gap: 7
                }}
                onClick={() => router.push("/auth/signin")}
              >
                <Plus size={15} strokeWidth={2.5} />
                Add more API keys
                <Lock size={13} style={{ opacity: 0.45 }} strokeWidth={2.5} />
              </button>
            </div>

            {/* Alert method */}
            <div style={{ borderTop: "2px solid rgba(10,42,63,0.1)", paddingTop: 18, display: "grid", gap: 12 }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: "0.86rem",
                  fontWeight: 700
                }}
              >
                <Bell size={15} strokeWidth={2.5} />
                Alert Channel
              </span>

              <div className="tab-switcher">
                <button
                  type="button"
                  className={alertType === "discord" ? "tab-active" : ""}
                  onClick={() => setAlertType("discord")}
                >
                  Discord
                </button>
                <button
                  type="button"
                  className={alertType === "telegram" ? "tab-active" : ""}
                  onClick={() => setAlertType("telegram")}
                >
                  Telegram
                </button>
              </div>

              <label className="label" style={{ marginBottom: 0 }}>
                {alertType === "discord" ? "Discord Webhook URL" : "Telegram Chat ID"}
                <input
                  type={alertType === "discord" ? "url" : "text"}
                  placeholder={alertType === "discord" ? "https://discord.com/api/webhooks/…" : "@username or chat_id"}
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </label>
            </div>

            {/* Daily limit */}
            <label className="label" style={{ marginBottom: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldAlert size={14} color="#F39C12" strokeWidth={2.5} />
                Daily Hard Limit (USD)
              </span>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontWeight: 800,
                    fontSize: "0.95rem"
                  }}
                >
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  style={{ paddingLeft: 26 }}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                />
              </div>
            </label>

            <button type="submit" className="button-glow" disabled={submitting} style={{ width: "100%" }}>
              {submitting ? "Deploying…" : "Deploy Guardrail"}
              {!submitting && <ArrowRight size={16} strokeWidth={2.5} />}
            </button>

            {error ? <p className="error-text" style={{ margin: 0 }}>{error}</p> : null}
          </form>

          {/* Card footer */}
          <div
            style={{
              padding: "14px 24px",
              borderTop: "2px solid rgba(10,42,63,0.1)",
              background: "#FAFAFC",
              display: "flex",
              justifyContent: "center"
            }}
          >
            <p
              className="hint"
              style={{ margin: 0, display: "flex", alignItems: "center", gap: 5, fontSize: "0.78rem" }}
            >
              <Lock size={12} strokeWidth={2.5} />
              Keys are encrypted at rest and never stored in plain text.
            </p>
          </div>
        </div>

        {/* Auth links */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 16
          }}
        >
          <div className="divider" style={{ margin: "4px 0" }}>
            already have an account?
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Link className="button-link" href="/api/auth/oauth/start?provider=google&plan=free">
              Continue with Google
              <ArrowRight size={15} />
            </Link>
            <Link className="button-link button-secondary" href="/auth/signin">
              Sign in with Email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
