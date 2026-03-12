import { NextRequest, NextResponse } from "next/server";
import { buildIpHash, buildFingerprintHash } from "@/lib/antiabuse/fingerprint";
import { issueFreeSessionToken } from "@/lib/auth/free-session";
import { encryptSecret } from "@/lib/encryption";
import { incrementAnonymousBlocks } from "@/lib/metrics";
import { getServiceClient } from "@/lib/supabase/client";
import {
  countActiveAnonymousTenants,
  createAnonymousSession,
  createTenant,
  linkAnonymousTenant,
  upsertSubscription
} from "@/lib/supabase/repository";

const MAX_FREE_TENANTS_PER_FINGERPRINT = 1;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const tenantName = String(body.tenantName ?? "Free Workspace");
  const provider = String(body.provider ?? "");
  const apiKey = String(body.apiKey ?? "");
  const discordWebhookUrl = String(body.discordWebhookUrl ?? "");
  const telegramChatId = String(body.telegramChatId ?? "");

  if (!provider || !apiKey || (!discordWebhookUrl && !telegramChatId)) {
    return NextResponse.json(
      { error: "provider, apiKey and at least one alert destination are required" },
      { status: 400 }
    );
  }

  const fingerprintHash = buildFingerprintHash({
    userAgent: String(body.userAgent ?? request.headers.get("user-agent") ?? ""),
    language: String(body.language ?? ""),
    platform: String(body.platform ?? ""),
    timezone: String(body.timezone ?? "")
  });
  const ipHash = buildIpHash(request.headers.get("x-forwarded-for") ?? "");
  const existing = await countActiveAnonymousTenants(fingerprintHash);
  if (existing >= MAX_FREE_TENANTS_PER_FINGERPRINT) {
    incrementAnonymousBlocks();
    return NextResponse.json({ error: "free_limit_reached_for_device" }, { status: 429 });
  }

  const tenant = await createTenant({ name: tenantName, planTier: "free" });
  await upsertSubscription({
    tenantId: tenant.id,
    planCode: "free",
    status: "active",
    provider: "anonymous"
  });

  const supabase = getServiceClient();
  const [providerResult, policyResult] = await Promise.all([
    supabase.from("provider_accounts").upsert(
      {
        tenant_id: tenant.id,
        provider,
        encrypted_key: encryptSecret(apiKey),
        key_scope: "billing_read",
        status: "active"
      },
      { onConflict: "tenant_id,provider" }
    ),
    supabase.from("policies").upsert(
      {
        tenant_id: tenant.id,
        daily_limit_usd: Number(body.dailyLimitUsd ?? 0),
        spike_pct: Number(body.spikePct ?? 150),
        burst_window_min: Number(body.burstWindowMin ?? 60),
        cooldown_min: Number(body.cooldownMin ?? 30),
        discord_webhook_url: discordWebhookUrl || null,
        telegram_chat_id: telegramChatId || null
      },
      { onConflict: "tenant_id" }
    )
  ]);
  if (providerResult.error) {
    return NextResponse.json({ error: providerResult.error.message }, { status: 500 });
  }
  if (policyResult.error) {
    return NextResponse.json({ error: policyResult.error.message }, { status: 500 });
  }

  const sessionId = await createAnonymousSession({ fingerprintHash, ipHash });
  await linkAnonymousTenant({ sessionId, tenantId: tenant.id });

  const token = issueFreeSessionToken({ sessionId, fingerprintHash });
  const response = NextResponse.json({ status: "created", tenantId: tenant.id, mode: "anonymous" });
  response.cookies.set("asg_free_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}
