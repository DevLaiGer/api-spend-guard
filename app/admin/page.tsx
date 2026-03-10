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

export default async function AdminPage() {
  const { errors, runs } = await getAdminData();
  return (
    <main>
      <h1>Admin Diagnostics</h1>
      <div className="card">
        <h2>Fire Alarm: Recent Errors</h2>
        <pre>{JSON.stringify(errors, null, 2)}</pre>
      </div>
      <div className="card">
        <h2>Sync Health</h2>
        <pre>{JSON.stringify(runs, null, 2)}</pre>
      </div>
    </main>
  );
}
