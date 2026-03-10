import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const tenantId = String(body.tenantId ?? "");
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }
  const supabase = getServiceClient();
  const { error } = await supabase.from("policies").upsert(
    {
      tenant_id: tenantId,
      daily_limit_usd: Number(body.dailyLimitUsd ?? 0),
      spike_pct: Number(body.spikePct ?? 150),
      burst_window_min: Number(body.burstWindowMin ?? 60),
      cooldown_min: Number(body.cooldownMin ?? 30),
      discord_webhook_url: body.discordWebhookUrl ?? null,
      sms_to_number: body.smsToNumber ?? null
    },
    { onConflict: "tenant_id" }
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ status: "saved" });
}
