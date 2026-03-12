"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, Clock, XCircle } from "lucide-react";
import { AuthenticatedShell } from "@/app/components/authenticated-shell";
import { AuthGuard } from "@/app/components/auth-guard";
import { getBrowserClient } from "@/lib/supabase/browser-client";

type AlertRow = {
  id: string;
  provider: string;
  alert_type: string;
  severity: string;
  state: string;
  message: string;
  opened_at: string;
  closed_at: string | null;
};

const SEVERITY_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "#b91c1c", bg: "rgba(185,28,28,0.08)", border: "rgba(185,28,28,0.3)" },
  warning: { color: "#D97706", bg: "rgba(243,156,18,0.1)", border: "#F39C12" },
  info: { color: "#0A2A3F", bg: "rgba(10,42,63,0.06)", border: "rgba(10,42,63,0.2)" }
};

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "critical") return <XCircle size={15} strokeWidth={2.5} />;
  if (severity === "warning") return <AlertTriangle size={15} strokeWidth={2.5} />;
  return <Bell size={15} strokeWidth={2.5} />;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function AlertsPage() {
  const [token, setToken] = useState("");
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const supabase = getBrowserClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const t = session?.access_token ?? "";
      setToken(t);

      const headers: HeadersInit = t ? { Authorization: `Bearer ${t}` } : {};
      try {
        const res = await fetch("/api/alerts", { headers });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error ?? "Failed to load alerts.");
        setAlerts((payload.alerts ?? []) as AlertRow[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load alerts.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openCount = alerts.filter((a) => a.state === "open").length;
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  return (
    <AuthenticatedShell>
      <AuthGuard>
        <div className="stack animate-in">
          {/* Header */}
          <div>
            <h1 className="hero-title">Alert History</h1>
            <p className="hero-subtitle">Spend threshold triggers and escalation log.</p>
          </div>

          {/* Summary pills */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div className="card panel" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px" }}>
              <Bell size={18} color="#F39C12" />
              <div>
                <div className="hint" style={{ fontSize: "0.76rem", marginBottom: 2 }}>Total Alerts</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{alerts.length}</div>
              </div>
            </div>
            <div className="card panel" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px" }}>
              <AlertTriangle size={18} color="#D97706" />
              <div>
                <div className="hint" style={{ fontSize: "0.76rem", marginBottom: 2 }}>Open</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: openCount > 0 ? "#D97706" : undefined }}>
                  {openCount}
                </div>
              </div>
            </div>
            <div className="card panel" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px" }}>
              <XCircle size={18} color="#b91c1c" />
              <div>
                <div className="hint" style={{ fontSize: "0.76rem", marginBottom: 2 }}>Critical</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: criticalCount > 0 ? "#b91c1c" : undefined }}>
                  {criticalCount}
                </div>
              </div>
            </div>
          </div>

          {/* Alert list */}
          {loading ? (
            <p className="hint">Loading alerts…</p>
          ) : alerts.length === 0 ? (
            <div className="card panel empty-state">
              <CheckCircle2 size={40} strokeWidth={1.5} color="rgba(10,42,63,0.2)" />
              <p style={{ margin: 0, fontWeight: 700 }}>No alerts triggered yet.</p>
              <p className="hint" style={{ margin: 0 }}>Alerts fire when spend crosses your configured thresholds.</p>
            </div>
          ) : (
            <section className="card" style={{ overflow: "hidden" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Provider</th>
                    <th>Type</th>
                    <th>Message</th>
                    <th>Opened</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => {
                    const sev = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.info;
                    const isOpen = alert.state === "open";
                    return (
                      <tr key={alert.id}>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              borderRadius: 999,
                              border: `2px solid ${sev.border}`,
                              background: sev.bg,
                              color: sev.color,
                              fontSize: "0.74rem",
                              fontWeight: 800,
                              padding: "3px 9px",
                              textTransform: "capitalize"
                            }}
                          >
                            <SeverityIcon severity={alert.severity} />
                            {alert.severity}
                          </span>
                        </td>
                        <td style={{ textTransform: "capitalize", fontWeight: 700 }}>{alert.provider}</td>
                        <td style={{ color: "var(--ink-soft)", textTransform: "capitalize" }}>
                          {alert.alert_type.replace(/_/g, " ")}
                        </td>
                        <td style={{ maxWidth: 280, whiteSpace: "normal", lineHeight: 1.45 }}>{alert.message}</td>
                        <td style={{ color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 5 }}>
                          <Clock size={13} strokeWidth={2} />
                          {formatDate(alert.opened_at)}
                        </td>
                        <td>
                          <span className={`status-pill ${isOpen ? "status-warn" : "status-ok"}`}>
                            {isOpen ? "Open" : "Resolved"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}

          {error ? <p className="error-text">{error}</p> : null}
          {token ? null : (
            <p className="hint">Showing alerts for the current anonymous session.</p>
          )}
        </div>
      </AuthGuard>
    </AuthenticatedShell>
  );
}
