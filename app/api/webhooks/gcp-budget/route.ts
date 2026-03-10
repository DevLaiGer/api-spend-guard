import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getServiceClient } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const tenantId = String(body.tenantId ?? "");
  const provider = "gcp";
  const amountUsd = Number(body.amountUsd ?? 0);
  const eventId = String(body.eventId ?? crypto.randomUUID());
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("usage_events").insert({
    tenant_id: tenantId,
    provider,
    metric_time: now,
    usage_units: 0,
    cost_usd: amountUsd,
    source_type: "push",
    source_ref: `gcp_budget:${eventId}`
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ status: "accepted" });
}
