"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/app/components/logo";
import { getBrowserClient } from "@/lib/supabase/browser-client";

export default function SigninPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInError) {
        // Covers both unregistered users and wrong password cases from Supabase.
        if (signInError.message.toLowerCase().includes("invalid login")) {
          setError("Email or password is incorrect, or user is not registered.");
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }
      if (!data.session) {
        setError("No active session was created. Check your email confirmation.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error during sign-in.");
      setLoading(false);
    }
  }

  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <div className="auth-logo-wrap">
          <Logo size={92} />
        </div>
        <h1 className="auth-title">Intelligent Infrastructure</h1>
        <p className="auth-subtitle">Authenticate to manage API spend guardrails.</p>

        <div className="auth-switch">
          <Link href="/auth/signin" className="active">
            Sign in
          </Link>
          <Link href="/auth/signup">Sign up</Link>
        </div>

        <div className="auth-methods">
          <Link className="button-link" href="/api/auth/oauth/start?provider=google&plan=free">
            Continue with Google
            <ArrowRight size={16} />
          </Link>
          <Link className="button-link button-secondary" href="/onboarding/free">
            Start Free (No Auth)
          </Link>
        </div>

        <div className="divider">or continue with email</div>

        <form onSubmit={onSubmit}>
          <label className="label">
            Administrator Email
            <input name="email" type="email" placeholder="admin@company.com" required />
          </label>
          <label className="label">
            Security Token
            <input name="password" type="password" placeholder="••••••••" required />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Authenticating..." : "Authenticate Session"}
          </button>
          {error ? <p className="error-text">{error}</p> : null}
        </form>

        <div className="divider" />
        <p className="hint" style={{ textAlign: "center", margin: 0 }}>
          Secured by API Spend Guard v2.0
        </p>
      </section>
    </main>
  );
}

