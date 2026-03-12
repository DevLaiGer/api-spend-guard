"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/app/components/logo";
import { Select } from "@/app/components/select";

export default function FreeOnboardingPage() {
  const router = useRouter();
  const [provider, setProvider] = useState("openai");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      tenantName: String(form.get("tenantName") ?? ""),
      provider,
      apiKey: String(form.get("apiKey") ?? ""),
      discordWebhookUrl: String(form.get("discordWebhookUrl") ?? ""),
      telegramChatId: String(form.get("telegramChatId") ?? ""),
      dailyLimitUsd: Number(form.get("dailyLimitUsd") ?? 0),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent
    };
    const response = await fetch("/api/onboarding/free", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Failed to create free workspace.");
      setSubmitting(false);
      return;
    }
    router.push("/onboarding/success?mode=free");
  }

  return (
    <main className="auth-wrap">
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="auth-logo-wrap">
          <Logo size={80} />
        </div>
        <h1 className="auth-title">Free Setup</h1>
        <p className="auth-subtitle">Use one API key and Discord/Telegram alerts in minutes.</p>
        <label className="label">
          Workspace Name
          <input name="tenantName" defaultValue="My Free Workspace" required />
        </label>
        <label className="label">
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
        <label className="label">
          API Key
          <input name="apiKey" type="password" required />
        </label>
        <label className="label">
          Discord Webhook URL (optional)
          <input name="discordWebhookUrl" />
        </label>
        <label className="label">
          Telegram Chat ID (optional)
          <input name="telegramChatId" />
        </label>
        <label className="label">
          Daily Limit USD
          <input name="dailyLimitUsd" type="number" min="0" defaultValue="50" />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create Free Workspace"}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
      </form>
    </main>
  );
}
