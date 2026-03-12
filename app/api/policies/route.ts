import { NextRequest, NextResponse } from "next/server";
import { canUseSms } from "@/lib/billing/entitlements";
import { resolveTenantContext } from "@/lib/auth/tenant-context";
import { incrementPlanGateDenials } from "@/lib/metrics";
import { getServiceClient } from "@/lib/supabase/client";
import { getPlanEntitlements } from "@/lib/supabase/repository";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const tenant = await resolveTenantContext(request, { allowAnonymous: true });
  if (!tenant) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const tenantId = tenant.tenantId;
  const entitlements = await getPlanEntitlements(tenantId);
  const smsToNumber = body.smsToNumber ?? null;
  if (smsToNumber && !canUseSms(entitlements)) {
    incrementPlanGateDenials();
    return NextResponse.json({ error: "sms_not_enabled_for_plan" }, { status: 403 });
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
      telegram_chat_id: body.telegramChatId ?? null,
      sms_to_number: smsToNumber
    },
    { onConflict: "tenant_id" }
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ status: "saved" });
}
