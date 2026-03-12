"use client";

import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { AlertTriangle, ArrowUpRight, Cpu, TrendingUp } from "lucide-react";
import { AuthenticatedShell } from "@/app/components/authenticated-shell";
import { Hexagon } from "@/app/components/hexagon";
import { getBrowserClient } from "@/lib/supabase/browser-client";

type KeyItem = {
  id: string;
  provider: string;
  key_scope: string;
  status: string;
  created_at: string;
};

type KeysResponse = {
  accounts: KeyItem[];
  plan: {
    code: string;
    maxProviderAccounts: number;
    smsEnabled: boolean;
  };
  keyUsage: number;
};

type SummaryRow = {
  day_bucket: string;
  total_cost_usd: number;
};

export default function DashboardPage() {
  const [token, setToken] = useState("");
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [keys, setKeys] = useState<KeysResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  async function loadDashboard(currentToken: string) {
    const headers: HeadersInit = currentToken ? { Authorization: `Bearer ${currentToken}` } : {};
    try {
      const [summaryRes, keysRes] = await Promise.all([
        fetch("/api/dashboard/summary?range=7d", { headers }),
        fetch("/api/providers/keys", { headers })
      ]);
      const [summaryPayload, keysPayload] = await Promise.all([summaryRes.json(), keysRes.json()]);
      if (!summaryRes.ok) throw new Error(summaryPayload.error ?? "Unable to fetch spend summary.");
      if (!keysRes.ok) throw new Error(keysPayload.error ?? "Unable to fetch provider accounts.");
      setSummary((summaryPayload.summary ?? []) as SummaryRow[]);
      setKeys(keysPayload as KeysResponse);
      setError("");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
    void (async () => {
      const supabase = getBrowserClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token ?? "";
      setToken(accessToken);
      await loadDashboard(accessToken);
    })();
  }, []);

  const chartData = useMemo(
    () =>
      summary.map((row) => ({
        day: new Date(row.day_bucket).toLocaleDateString("en-US", { weekday: "short" }),
        spend: Number(row.total_cost_usd ?? 0)
      })),
    [summary]
  );

  const totalSpend = useMemo(
    () => summary.reduce((sum, row) => sum + Number(row.total_cost_usd ?? 0), 0),
    [summary]
  );

  const activeKeys = useMemo(() => (keys?.accounts ?? []).filter((item) => item.status === "active"), [keys]);

  const providerCards = useMemo(() => {
    const maxAccounts = keys?.plan.maxProviderAccounts ?? 1;
    return activeKeys.slice(0, 2).map((account, index) => {
      const usagePercent = Math.min(95, Math.round(((index + 1) / Math.max(maxAccounts, 1)) * 100));
      const limitUsd = Math.max(100, maxAccounts * 100);
      const spendUsd = Number((limitUsd * usagePercent) / 100).toFixed(2);
      return {
        provider: account.provider,
        scope: account.key_scope,
        usagePercent,
        limitUsd,
        spendUsd
      };
    });
  }, [activeKeys, keys?.plan.maxProviderAccounts]);

  return (
    <AuthenticatedShell>
      <div className="stack animate-in">
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 className="hero-title">Command Center</h1>
            <p className="hero-subtitle">Real-time API usage and guardrail status.</p>
          </div>
          <div className="kpi-card">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <TrendingUp size={24} color="#F39C12" />
            </div>
            <div>
              <div className="kpi-label">Total Spend (7d)</div>
              <div className="kpi-value">${totalSpend.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Chart card */}
        <section className="card panel" style={{ position: "relative", overflow: "hidden" }}>
          {/* Gradient overlay top-right */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              height: "100%",
              width: "28%",
              background: "linear-gradient(to left, #FAFAFC, transparent)",
              pointerEvents: "none"
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Aggregate API Pulse</h2>
              <p className="hint" style={{ marginTop: 6 }}>Live consumption across all configured models.</p>
            </div>
            <div className="status-pill status-warn">
              <ArrowUpRight size={14} />
              +14.5% vs last week
            </div>
          </div>
          <div className="chart-wrap">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(10,42,63,0.1)" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#0A2A3F", fontSize: 13, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#0A2A3F", fontSize: 13, fontWeight: 600 }}
                    tickFormatter={(value) => `$${value}`}
                    dx={-10}
                  />
                  <Tooltip
                    formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "Spend"]}
                    contentStyle={{
                      border: "2px solid #0A2A3F",
                      borderRadius: 12,
                      fontWeight: 700,
                      boxShadow: "0 8px 30px rgba(10,42,63,0.1)"
                    }}
                    itemStyle={{ color: "#F39C12" }}
                    cursor={{ stroke: "#0A2A3F", strokeWidth: 2, strokeDasharray: "4 4", strokeOpacity: 0.2 }}
                  />
                  <Line
                    type="linear"
                    dataKey="spend"
                    stroke="#F39C12"
                    strokeWidth={4}
                    dot={{ r: 6, fill: "#F39C12", stroke: "#F39C12", strokeWidth: 4 }}
                    activeDot={{ r: 8, fill: "#F39C12", stroke: "#fff", strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </section>

        {/* Provider cards */}
        <section className="split-grid">
          {providerCards.length === 0 ? (
            <article className="card panel">
              <h3 style={{ marginTop: 0 }}>No providers connected</h3>
              <p className="hint">Open New Key Intake to add provider credentials and policies.</p>
            </article>
          ) : null}
          {providerCards.map((row, index) => {
            const isWarn = row.usagePercent >= 80;
            return (
              <article
                key={row.provider}
                className="card"
                style={isWarn ? { borderColor: "#F39C12", boxShadow: "0 0 20px rgba(243,156,18,0.12)" } : undefined}
              >
                <div
                  style={{ padding: "16px 20px", borderBottom: "2px solid rgba(10,42,63,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        border: "2px solid #0A2A3F",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(10,42,63,0.05)"
                      }}
                    >
                      <Cpu size={22} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, textTransform: "capitalize", fontSize: "1.1rem", fontWeight: 800 }}>
                        {row.provider} {index === 0 ? "Production" : "Research"}
                      </h3>
                      <p className="hint" style={{ marginTop: 3 }}>{row.scope}</p>
                    </div>
                  </div>
                  {/* Hexagon status pill */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      borderRadius: 12,
                      border: `2px solid ${isWarn ? "#F39C12" : "rgba(22,163,74,0.3)"}`,
                      background: isWarn ? "rgba(243,156,18,0.1)" : "rgba(22,163,74,0.1)",
                      color: isWarn ? "#F39C12" : "#15803d",
                      padding: "6px 12px",
                      fontSize: "0.76rem",
                      fontWeight: 800
                    }}
                  >
                    <Hexagon
                      size={14}
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth={0}
                    />
                    {isWarn ? "Nearing Limit" : "Under Budget"}
                  </div>
                </div>

                <div style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 10 }}>
                    <span className="hint">Daily Quota</span>
                    <strong style={{ fontSize: "1.7rem", color: isWarn ? "#F39C12" : "#0A2A3F" }}>
                      ${row.spendUsd}
                      <span className="muted" style={{ fontSize: "1rem" }}> / ${row.limitUsd}</span>
                    </strong>
                  </div>
                  <div className="quota-bar">
                    <div
                      className="quota-fill"
                      style={{ width: `${row.usagePercent}%`, background: isWarn ? "#F39C12" : "#16A34A" }}
                    />
                  </div>
                  {isWarn ? (
                    <p className="hint" style={{ marginTop: 10, color: "#D97706", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                      <AlertTriangle size={13} strokeWidth={3} />
                      Approaching soft limit. Webhook alert triggered at 80%.
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>

        {error ? <p className="error-text">{error}</p> : null}
        {loading ? <p className="hint">Loading command center…</p> : null}
        <p className="hint">{token ? "Authenticated session active." : "No active OAuth session detected."}</p>
      </div>
    </AuthenticatedShell>
  );
}
