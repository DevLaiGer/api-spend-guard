import { decryptSecret } from "@/lib/encryption";
import { getServiceClient } from "@/lib/supabase/client";
import type { IngestJobPayload, PolicyConfig, ProviderName, SpendSample } from "@/lib/types";
import type { PlanEntitlements } from "@/lib/billing/entitlements";

export async function getDueTenantsByMinute(minute: number) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, check_minute")
    .eq("status", "active")
    .eq("check_minute", minute)
    .limit(100);
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; check_minute: number }>;
}

export async function createTenant(params: { name: string; planTier?: string }) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("tenants")
    .insert({
      name: params.name,
      plan_tier: params.planTier ?? "free",
      check_minute: Math.floor(Math.random() * 60),
      status: "active"
    })
    .select("id, name, plan_tier")
    .single();
  if (error) throw error;
  return data as { id: string; name: string; plan_tier: string };
}

export async function addTenantMember(params: { tenantId: string; userId: string; role?: string }) {
  const supabase = getServiceClient();
  const { error } = await supabase.from("tenant_members").upsert(
    {
      tenant_id: params.tenantId,
      user_id: params.userId,
      role: params.role ?? "owner"
    },
    { onConflict: "tenant_id,user_id" }
  );
  if (error) throw error;
}

export async function getOrCreateTenantForUser(params: { userId: string; email: string }) {
  const supabase = getServiceClient();
  const { data: existing, error: existingError } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", params.userId)
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.tenant_id) {
    return { id: existing.tenant_id as string };
  }

  const fallbackName = params.email ? `${params.email.split("@")[0]}'s Workspace` : "My Workspace";
  const tenant = await createTenant({ name: fallbackName, planTier: "free" });
  await addTenantMember({ tenantId: tenant.id, userId: params.userId, role: "owner" });
  return { id: tenant.id };
}

export async function assertTenantAccess(params: { tenantId: string; userId: string }) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("tenant_id", params.tenantId)
    .eq("user_id", params.userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.tenant_id);
}

export async function getTenantProviders(tenantId: string): Promise<ProviderName[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("provider_accounts")
    .select("provider")
    .eq("tenant_id", tenantId)
    .eq("status", "active");
  if (error) throw error;
  return ((data ?? []) as Array<{ provider: string }>).map(
    (row) => row.provider as ProviderName
  );
}

export async function getProviderAccountCount(tenantId: string) {
  const supabase = getServiceClient();
  const { count, error } = await supabase
    .from("provider_accounts")
    .select("*", { head: true, count: "exact" })
    .eq("tenant_id", tenantId)
    .eq("status", "active");
  if (error) throw error;
  return count ?? 0;
}

export async function getProviderApiKey(tenantId: string, provider: ProviderName): Promise<string> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("provider_accounts")
    .select("encrypted_key")
    .eq("tenant_id", tenantId)
    .eq("provider", provider)
    .single();
  if (error) throw error;
  return decryptSecret(data.encrypted_key as string);
}

export async function listProviderAccounts(tenantId: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("provider_accounts")
    .select("id, provider, key_scope, status, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function disconnectProviderAccount(tenantId: string, provider: string) {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("provider_accounts")
    .update({ status: "inactive" })
    .eq("tenant_id", tenantId)
    .eq("provider", provider);
  if (error) throw error;
}

export async function upsertSyncRun(payload: IngestJobPayload, status: string, errorCount = 0) {
  const supabase = getServiceClient();
  const body = {
    tenant_id: payload.tenantId,
    provider: payload.provider,
    idempotency_key: payload.idempotencyKey,
    window_start: payload.windowStart,
    window_end: payload.windowEnd,
    status,
    error_count: errorCount,
    attempt_count: payload.attempt
  };
  const { error } = await supabase.from("sync_runs").upsert(body, { onConflict: "idempotency_key" });
  if (error) throw error;
}

export async function insertUsageEvents(tenantId: string, samples: SpendSample[]) {
  if (!samples.length) return;
  const supabase = getServiceClient();
  const rows = samples.map((sample) => ({
    tenant_id: tenantId,
    provider: sample.provider,
    metric_time: sample.endTime,
    usage_units: sample.usageUnits,
    cost_usd: sample.costUsd,
    source_type: "pull",
    source_ref: sample.sourceRef
  }));
  const { error } = await supabase.from("usage_events").insert(rows);
  if (error) throw error;
}

export async function upsertDailyRollup(tenantId: string, sample: SpendSample) {
  const supabase = getServiceClient();
  const day = sample.endTime.slice(0, 10);
  const { error } = await supabase.rpc("upsert_daily_rollup", {
    p_tenant_id: tenantId,
    p_provider: sample.provider,
    p_day_bucket: day,
    p_cost_usd: sample.costUsd,
    p_usage_units: sample.usageUnits
  });
  if (error) throw error;
}

export async function getTenantPolicy(tenantId: string): Promise<PolicyConfig> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("policies")
    .select("daily_limit_usd, spike_pct, burst_window_min, cooldown_min")
    .eq("tenant_id", tenantId)
    .single();
  if (error) throw error;
  return {
    dailyLimitUsd: Number(data.daily_limit_usd ?? 0),
    spikePct: Number(data.spike_pct ?? 0),
    burstWindowMin: Number(data.burst_window_min ?? 60),
    cooldownMin: Number(data.cooldown_min ?? 30)
  };
}

export async function getPlanEntitlements(tenantId: string): Promise<PlanEntitlements> {
  const supabase = getServiceClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_code, status")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const planCode =
    subscription?.status === "active" && subscription?.plan_code
      ? String(subscription.plan_code)
      : "free";

  const { data: plan, error } = await supabase
    .from("plans")
    .select("code, max_provider_accounts, sms_enabled, telegram_enabled, discord_enabled")
    .eq("code", planCode)
    .single();
  if (error) throw error;
  return {
    code: String(plan.code),
    maxProviderAccounts: Number(plan.max_provider_accounts ?? 1),
    smsEnabled: Boolean(plan.sms_enabled),
    telegramEnabled: Boolean(plan.telegram_enabled),
    discordEnabled: Boolean(plan.discord_enabled)
  };
}

export async function upsertSubscription(params: {
  tenantId: string;
  planCode: string;
  status: string;
  provider: string;
  providerSubscriptionId?: string;
  currentPeriodEnd?: string;
}) {
  const supabase = getServiceClient();
  const { error } = await supabase.from("subscriptions").upsert(
    {
      tenant_id: params.tenantId,
      plan_code: params.planCode,
      status: params.status,
      provider: params.provider,
      provider_subscription_id: params.providerSubscriptionId ?? null,
      current_period_end: params.currentPeriodEnd ?? null,
      updated_at: new Date().toISOString()
    },
    { onConflict: "tenant_id" }
  );
  if (error) throw error;

  const { error: tenantError } = await supabase
    .from("tenants")
    .update({ plan_tier: params.planCode })
    .eq("id", params.tenantId);
  if (tenantError) throw tenantError;
}

export async function getSpendSnapshot(tenantId: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("get_spend_snapshot", {
    p_tenant_id: tenantId
  });
  if (error) throw error;
  return (data?.[0] ?? {
    spend_today_usd: 0,
    baseline_daily_usd: 0,
    burst_spend_usd: 0
  }) as {
    spend_today_usd: number;
    baseline_daily_usd: number;
    burst_spend_usd: number;
  };
}

export async function insertAlert(params: {
  tenantId: string;
  provider: ProviderName;
  alertType: string;
  severity: string;
  message: string;
  fingerprint: string;
}) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("alerts")
    .insert({
      tenant_id: params.tenantId,
      provider: params.provider,
      alert_type: params.alertType,
      severity: params.severity,
      state: "open",
      message: params.message,
      fingerprint: params.fingerprint
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function getDiscordWebhook(tenantId: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("policies")
    .select("discord_webhook_url")
    .eq("tenant_id", tenantId)
    .single();
  if (error) throw error;
  return (data.discord_webhook_url as string) ?? "";
}

export async function getTelegramDestination(tenantId: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("policies")
    .select("telegram_chat_id")
    .eq("tenant_id", tenantId)
    .single();
  if (error) throw error;
  return (data.telegram_chat_id as string) ?? "";
}

export async function getSmsDestination(tenantId: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("policies")
    .select("sms_to_number")
    .eq("tenant_id", tenantId)
    .single();
  if (error) throw error;
  return (data.sms_to_number as string) ?? "";
}

export async function createAnonymousSession(params: { fingerprintHash: string; ipHash: string }) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("anonymous_sessions")
    .insert({
      fingerprint_hash: params.fingerprintHash,
      ip_hash: params.ipHash,
      status: "active"
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function countActiveAnonymousTenants(fingerprintHash: string) {
  const supabase = getServiceClient();
  const { count, error } = await supabase
    .from("anonymous_sessions")
    .select("*", { count: "exact", head: true })
    .eq("fingerprint_hash", fingerprintHash)
    .eq("status", "active");
  if (error) throw error;
  return count ?? 0;
}

export async function linkAnonymousTenant(params: { sessionId: string; tenantId: string }) {
  const supabase = getServiceClient();
  const { error } = await supabase.from("anonymous_tenants").insert({
    anonymous_session_id: params.sessionId,
    tenant_id: params.tenantId
  });
  if (error) throw error;
}

export async function getTenantByAnonymousSession(sessionId: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("anonymous_tenants")
    .select("tenant_id")
    .eq("anonymous_session_id", sessionId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data?.tenant_id as string | undefined) ?? null;
}

export async function insertAlertDelivery(params: {
  alertId: string;
  channel: string;
  destination: string;
  status: string;
  attempt: number;
  error?: string;
}) {
  const supabase = getServiceClient();
  const { error } = await supabase.from("alert_deliveries").insert({
    alert_id: params.alertId,
    channel: params.channel,
    destination: params.destination,
    status: params.status,
    attempt: params.attempt,
    error: params.error ?? null
  });
  if (error) throw error;
}

export async function insertErrorLog(params: {
  tenantId: string;
  provider: ProviderName;
  errorCode: number;
  message: string;
  jobId: string;
  attempt: number;
}) {
  const supabase = getServiceClient();
  const { error } = await supabase.from("error_logs").insert({
    tenant_id: params.tenantId,
    provider: params.provider,
    error_code: params.errorCode,
    message: params.message,
    job_id: params.jobId,
    attempt: params.attempt
  });
  if (error) throw error;
}
