import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default async function OnboardingSuccessPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string; plan?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo-wrap">
          <CheckCircle2 size={52} color="#0F766E" />
        </div>
        <h1 className="auth-title">Setup Complete</h1>
        <p className="auth-subtitle">Your workspace is configured and ready to monitor API spend.</p>
        <p>Mode: {params.mode ?? "unknown"}</p>
        <p>Plan: {params.plan ?? "free"}</p>
        <p className="hint">Configure additional keys and policies from your command center.</p>
        <p>
          <Link className="button-link" href="/dashboard">
            Go to Dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
