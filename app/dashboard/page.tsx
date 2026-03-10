import { getServiceClient } from "@/lib/supabase/client";

async function getLatestRollups() {
  try {
    const supabase = getServiceClient();
    const { data } = await supabase
      .from("spend_rollups_daily")
      .select("tenant_id, provider, day_bucket, cost_usd, usage_units")
      .order("day_bucket", { ascending: false })
      .limit(20);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const rows = await getLatestRollups();
  return (
    <main>
      <h1>Dashboard</h1>
      <div className="card">
        <h2>Latest Daily Rollups</h2>
        <pre>{JSON.stringify(rows, null, 2)}</pre>
      </div>
    </main>
  );
}
