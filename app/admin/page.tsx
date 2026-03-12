import { env } from "@/lib/env";
import { AuthenticatedShell } from "@/app/components/authenticated-shell";
import { getServiceClient } from "@/lib/supabase/client";

async function getAdminData() {
  try {
    const supabase = getServiceClient();
    const [{ data: errors }, { data: runs }] = await Promise.all([
      supabase
        .from("error_logs")
        .select("id, tenant_id, provider, error_code, message, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("sync_runs")
        .select("tenant_id, provider, status, started_at, finished_at, error_count")
        .order("started_at", { ascending: false })
        .limit(20)
    ]);
    return { errors: errors ?? [], runs: runs ?? [] };
  } catch {
    return { errors: [], runs: [] };
  }
}

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const query = await searchParams;
  if (!env.adminAuthToken || query.token !== env.adminAuthToken) {
    return (
      <main className="auth-wrap">
        <section className="auth-card">
          <h1 className="auth-title">Admin Diagnostics</h1>
          <p className="error-text">Unauthorized.</p>
        </section>
      </main>
    );
  }
  const { errors, runs } = await getAdminData();
  return (
    <AuthenticatedShell>
      <div className="stack">
        <div>
          <h1 className="hero-title">Admin Diagnostics</h1>
          <p className="hero-subtitle">Operational triage, sync health, and failure logs.</p>
        </div>
        <section className="card panel">
          <h2 style={{ marginTop: 0 }}>Fire Alarm: Recent Errors</h2>
          <pre>{JSON.stringify(errors, null, 2)}</pre>
        </section>
        <section className="card panel">
          <h2 style={{ marginTop: 0 }}>Sync Health</h2>
          <pre>{JSON.stringify(runs, null, 2)}</pre>
        </section>
      </div>
    </AuthenticatedShell>
  );
}
