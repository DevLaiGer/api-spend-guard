"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/app/components/logo";
import { getBrowserClient } from "@/lib/supabase/browser-client";

async function startGoogleOAuth(plan: string = "free") {
  const supabase = getBrowserClient();
  const redirectTo = `${window.location.origin}/onboarding/auth?plan=${encodeURIComponent(plan)}`;
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo }
  });
}

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    if (!email || !password) {
      setError("Email and password are required.");
      setLoading(false);
      return;
    }

    try {
      const supabase = getBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });
      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("already registered")) {
          setError("This email is already registered. Try signing in instead.");
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }
      if (!data.user) {
        setInfo("Check your email for a confirmation link, then sign in.");
        setLoading(false);
        return;
      }
      router.push("/auth/signin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error during signup.");
      setLoading(false);
    }
  }

  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <div className="auth-logo-wrap">
          <Logo size={92} />
        </div>
        <h1 className="auth-title">Create Admin Access</h1>
        <p className="auth-subtitle">Provision a secure account to configure API spend guardrails.</p>

        <div className="auth-switch">
          <Link href="/auth/signin">Sign in</Link>
          <Link href="/auth/signup" className="active">
            Sign up
          </Link>
        </div>

        <div className="auth-methods">
          <button className="button-link" onClick={() => startGoogleOAuth("free")}>
            Continue with Google
            <ArrowRight size={16} />
          </button>
          <Link className="button-link button-secondary" href="/onboarding/free">
            Start Free (No Auth)
          </Link>
        </div>

        <div className="divider">or create with email</div>

        <form onSubmit={onSubmit}>
          <label className="label">
            Administrator Email
            <input name="email" type="email" placeholder="admin@company.com" required />
          </label>
          <label className="label">
            Security Token
            <input name="password" type="password" minLength={8} placeholder="Minimum 8 characters" required />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Provisioning..." : "Provision Account"}
          </button>
          {error ? <p className="error-text">{error}</p> : null}
          {info ? <p className="success-text">{info}</p> : null}
        </form>

        <div className="divider" />
        <p className="hint" style={{ textAlign: "center", margin: 0 }}>
          Managed under enterprise-grade guardrail controls.
        </p>
      </section>
    </main>
  );
}

