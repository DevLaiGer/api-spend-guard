import { NextResponse } from "next/server";
import { getRuntimeCounters } from "@/lib/metrics";
import { queueDepth } from "@/lib/queue/in-memory-queue";
import { listDlq } from "@/lib/queue/dlq";
import { getServiceClient } from "@/lib/supabase/client";

export async function GET() {
  try {
    const supabase = getServiceClient();
    const [{ count: openAlerts }, { count: failedDeliveries }, { count: failedRuns }] = await Promise.all([
      supabase.from("alerts").select("*", { count: "exact", head: true }).eq("state", "open"),
      supabase.from("alert_deliveries").select("*", { count: "exact", head: true }).eq("status", "failed"),
      supabase.from("sync_runs").select("*", { count: "exact", head: true }).eq("status", "failed")
    ]);

    return NextResponse.json({
      queueLag: queueDepth(),
      dlqDepth: listDlq().length,
      openAlerts: openAlerts ?? 0,
      failedDeliveries: failedDeliveries ?? 0,
      failedRuns: failedRuns ?? 0,
      ...getRuntimeCounters()
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "metrics_error" },
      { status: 500 }
    );
  }
}
