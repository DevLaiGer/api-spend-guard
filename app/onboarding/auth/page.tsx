"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Logo } from "@/app/components/logo";
import { getBrowserClient } from "@/lib/supabase/browser-client";

async function readJsonSafely(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as { error?: string };
  } catch {
    return { error: text.slice(0, 200) };
  }
}

async function initializeTenant(token: string, planCode: string) {
  const response = await fetch("/api/onboarding/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ planCode })
  });
  const data = await readJsonSafely(response);
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to initialize tenant.");
  }
  return data;
}

export default function AuthOnboardingPage() {
  const router = useRouter();
  const [planCode, setPlanCode] = useState("free");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const initializedRef = useRef(false);

  useEffect(() => {
    // Read plan from URL once
    const query = new URLSearchParams(window.location.search);
    const requestedPlan = query.get("plan");
    const activePlan =
      requestedPlan && ["free", "pro"].includes(requestedPlan) ? requestedPlan : "free";
    setPlanCode(activePlan);

    const supabase = getBrowserClient();

    /**
     * onAuthStateChange fires SIGNED_IN immediately after:
     *  1. OAuth redirect (Supabase auto-processes URL hash/PKCE code)
     *  2. An existing stored session is recovered from localStorage
     *
     * This is the correct pattern per Supabase docs — do NOT manually
     * parse window.location.hash, as the client clears it first.
     */
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
        session &&
        !initializedRef.current
      ) {
        initializedRef.current = true;
        setStatus("loading");
        try {
          await initializeTenant(session.access_token, activePlan);
          setStatus("success");
          setTimeout(() => {
            router.push(`/onboarding/success?mode=auth&plan=${activePlan}`);
          }, 800);
        } catch (err) {
          setStatus("error");
          setError(err instanceof Error ? err.message : "Failed to initialize workspace.");
        }
      }
    });

    // Also check if a session already exists (returning user or same-tab sign-in)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !initializedRef.current) {
        initializedRef.current = true;
        setStatus("loading");
        initializeTenant(session.access_token, activePlan)
          .then(() => {
            setStatus("success");
            setTimeout(() => {
              router.push(`/onboarding/success?mode=auth&plan=${activePlan}`);
            }, 800);
          })
          .catch((err: unknown) => {
            setStatus("error");
            setError(
              err instanceof Error ? err.message : "Failed to initialize workspace."
            );
          });
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  function handleGoogleOAuth() {
    window.location.href = `/api/auth/oauth/start?provider=google&plan=${encodeURIComponent(planCode)}`;
  }

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <div className="auth-logo-wrap">
          <Logo size={88} />
        </div>

        {isLoading || isSuccess ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            {isLoading ? (
              <>
                <Loader2
                  size={36}
                  color="#F39C12"
                  style={{ animation: "spin 1s linear infinite", margin: "0 auto 14px" }}
                />
                <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem" }}>
                  Finalizing your workspace…
                </p>
                <p className="hint" style={{ marginTop: 6 }}>
                  Setting up your tenant and plan.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 size={36} color="#16A34A" style={{ margin: "0 auto 14px" }} />
                <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem" }}>
                  Workspace ready! Redirecting…
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <h1 className="auth-title">Authenticated Setup</h1>
            <p className="auth-subtitle">
              Sign in with Google to set up your workspace with multi-key support.
            </p>

            <label className="label" style={{ marginBottom: 8 }}>
              Plan
              <select
                value={planCode}
                onChange={(e) => setPlanCode(e.target.value)}
                style={{ marginTop: 6 }}
              >
                <option value="free">Free — 1 key, Discord/Telegram alerts</option>
                <option value="pro">Pro — $10/mo, 5 keys + SMS alerts</option>
              </select>
            </label>
            <p className="hint" style={{ marginTop: 4, marginBottom: 16 }}>
              You can change your plan anytime from{" "}
              <Link href="/pricing" style={{ color: "var(--accent)", fontWeight: 700 }}>
                Pricing
              </Link>
              .
            </p>

            <button onClick={handleGoogleOAuth} disabled={isLoading}>
              Continue with Google
              <ArrowRight size={16} />
            </button>

            <div className="divider" style={{ margin: "16px 0" }}>
              or use email
            </div>

            <div className="inline-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={() => router.push("/auth/signup")}
              >
                Sign up
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() => router.push("/auth/signin")}
              >
                Sign in
              </button>
            </div>

            <p className="hint" style={{ textAlign: "center", marginTop: 14, marginBottom: 0 }}>
              <Link href="/">← Back to Home</Link>
            </p>

            {error ? <p className="error-text">{error}</p> : null}
          </>
        )}
      </section>

      {/* Inline spin animation (no Tailwind needed) */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
