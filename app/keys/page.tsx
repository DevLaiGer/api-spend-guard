"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Cpu, Plus, Trash2 } from "lucide-react";
import { AuthenticatedShell } from "@/app/components/authenticated-shell";
import { AuthGuard } from "@/app/components/auth-guard";
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

export default function KeysPage() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<KeysResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  async function loadKeys(t: string) {
    const headers: HeadersInit = t ? { Authorization: `Bearer ${t}` } : {};
    try {
      const res = await fetch("/api/providers/keys", { headers });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Failed to load keys.");
      setData(payload as KeysResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load keys.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      const supabase = getBrowserClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const t = session?.access_token ?? "";
      setToken(t);
      await loadKeys(t);
    })();
  }, []);

  async function handleDisconnect(provider: string) {
    setRemoving(provider);
    const headers: HeadersInit = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const res = await fetch(`/api/providers/keys?provider=${encodeURIComponent(provider)}`, {
        method: "DELETE",
        headers
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error ?? "Failed to disconnect.");
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              accounts: prev.accounts.filter((k) => k.provider !== provider),
              keyUsage: Math.max(0, prev.keyUsage - 1)
            }
          : null
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to disconnect key.");
    } finally {
      setRemoving(null);
    }
  }

  const accounts = data?.accounts ?? [];
  const maxKeys = data?.plan.maxProviderAccounts ?? 1;
  const usedKeys = accounts.length;
  const usagePct = maxKeys > 0 ? Math.round((usedKeys / maxKeys) * 100) : 0;

  return (
    <AuthenticatedShell>
      <AuthGuard>
        <div className="stack animate-in">
          {/* Page header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "end",
              flexWrap: "wrap",
              gap: 16
            }}
          >
            <div>
              <h1 className="hero-title">API Keys</h1>
              <p className="hero-subtitle">Manage connected provider accounts and secure keys.</p>
            </div>
            <Link href="/intake" className="button-glow" style={{ textDecoration: "none" }}>
              <Plus size={16} strokeWidth={2.5} />
              Connect New Key
            </Link>
          </div>

          {/* Quota card */}
          <section className="card panel">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                flexWrap: "wrap",
                gap: 10
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>
                  {usedKeys} / {maxKeys} Keys Used
                </h2>
                <p className="hint" style={{ marginTop: 4 }}>
                  Plan: <strong style={{ textTransform: "capitalize" }}>{data?.plan.code ?? "—"}</strong>
                  {data?.plan.smsEnabled ? " · SMS alerts enabled" : ""}
                </p>
              </div>
              <span
                className={`status-pill ${usagePct >= 80 ? "status-warn" : "status-ok"}`}
              >
                <Hexagon size={12} fill="currentColor" stroke="currentColor" strokeWidth={0} />
                {usagePct >= 80 ? "Near limit" : "Within quota"}
              </span>
            </div>
            <div className="quota-bar">
              <div
                className="quota-fill"
                style={{ width: `${usagePct}%`, background: usagePct >= 80 ? "#F39C12" : "#16A34A" }}
              />
            </div>
          </section>

          {/* Keys list */}
          {loading ? (
            <p className="hint">Loading keys…</p>
          ) : accounts.length === 0 ? (
            <div className="card panel empty-state">
              <Cpu size={36} strokeWidth={1.5} color="rgba(10,42,63,0.25)" />
              <p style={{ margin: 0, fontWeight: 700 }}>No provider keys connected yet.</p>
              <Link href="/intake" className="button-glow" style={{ textDecoration: "none", marginTop: 6 }}>
                <Plus size={15} />
                Connect First Key
              </Link>
            </div>
          ) : (
            <div className="stack" style={{ gap: 12 }}>
              {accounts.map((account) => {
                const isActive = account.status === "active";
                return (
                  <article
                    key={account.id}
                    className="card panel"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 16,
                      flexWrap: "wrap"
                    }}
                  >
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          border: "2px solid #0A2A3F",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(10,42,63,0.05)"
                        }}
                      >
                        <Cpu size={20} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, textTransform: "capitalize" }}>
                          {account.provider}
                        </h3>
                        <p className="hint" style={{ marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span>Scope: {account.key_scope}</span>
                          <span>·</span>
                          <span>Added {new Date(account.created_at).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span className={`status-pill ${isActive ? "status-ok" : "status-warn"}`}>
                        {isActive ? (
                          <CheckCircle2 size={12} strokeWidth={2.5} />
                        ) : (
                          <AlertCircle size={12} strokeWidth={2.5} />
                        )}
                        {isActive ? "Active" : account.status}
                      </span>

                      <button
                        type="button"
                        className="button-secondary"
                        style={{ color: "#b91c1c", borderColor: "rgba(185,28,28,0.35)", padding: "6px 12px", minHeight: 34 }}
                        disabled={removing === account.provider}
                        onClick={() => handleDisconnect(account.provider)}
                      >
                        <Trash2 size={14} strokeWidth={2.5} />
                        {removing === account.provider ? "Removing…" : "Disconnect"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {error ? <p className="error-text">{error}</p> : null}
        </div>
      </AuthGuard>
    </AuthenticatedShell>
  );
}
