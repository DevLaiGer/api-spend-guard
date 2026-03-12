import crypto from "node:crypto";
import { evaluatePolicy } from "@/lib/detection";
import { canUseDiscord, canUseSms, canUseTelegram } from "@/lib/billing/entitlements";
import { enqueueJob } from "@/lib/queue/in-memory-queue";
import { getProviderAdapter } from "@/lib/providers";
import {
  getDiscordWebhook,
  getPlanEntitlements,
  getSmsDestination,
  getProviderApiKey,
  getSpendSnapshot,
  getTelegramDestination,
  getTenantPolicy,
  insertAlert,
  insertUsageEvents,
  upsertDailyRollup,
  upsertSyncRun
} from "@/lib/supabase/repository";
import type { IngestJobPayload } from "@/lib/types";

export async function runIngestJob(job: IngestJobPayload) {
  await upsertSyncRun(job, "started");
  const adapter = getProviderAdapter(job.provider);
  if (!adapter) {
    await upsertSyncRun(job, "failed", 1);
    throw new Error(`No adapter for provider: ${job.provider}`);
  }

  const apiKey = await getProviderApiKey(job.tenantId, job.provider);
  const samples = await adapter.fetchSpend({
    apiKey,
    windowStart: job.windowStart,
    windowEnd: job.windowEnd
  });
  await insertUsageEvents(job.tenantId, samples);
  for (const sample of samples) {
    await upsertDailyRollup(job.tenantId, sample);
  }

  const policy = await getTenantPolicy(job.tenantId);
  const snapshot = await getSpendSnapshot(job.tenantId);
  const signals = evaluatePolicy({
    spendTodayUsd: snapshot.spend_today_usd,
    baselineDailyUsd: snapshot.baseline_daily_usd,
    burstSpendUsd: snapshot.burst_spend_usd,
    policy
  });
  const [entitlements, discordWebhook, telegramChatId, smsNumber] = await Promise.all([
    getPlanEntitlements(job.tenantId),
    getDiscordWebhook(job.tenantId),
    getTelegramDestination(job.tenantId),
    getSmsDestination(job.tenantId)
  ]);

  for (const signal of signals) {
    const fingerprint = crypto
      .createHash("sha256")
      .update(`${job.tenantId}:${job.provider}:${signal.type}:${job.windowEnd}`)
      .digest("hex");
    const alertId = await insertAlert({
      tenantId: job.tenantId,
      provider: job.provider,
      alertType: signal.type,
      severity: signal.severity,
      message: signal.message,
      fingerprint
    });

    if (discordWebhook && canUseDiscord(entitlements)) {
      enqueueJob({
        type: "DISPATCH_ALERT",
        payload: {
          alertId,
          tenantId: job.tenantId,
          provider: job.provider,
          channel: "discord",
          destination: discordWebhook,
          message: signal.message,
          attempt: 0
        },
        retries: 0,
        visibleAt: new Date().toISOString()
      });
    }
    if (telegramChatId && canUseTelegram(entitlements)) {
      enqueueJob({
        type: "DISPATCH_ALERT",
        payload: {
          alertId,
          tenantId: job.tenantId,
          provider: job.provider,
          channel: "telegram",
          destination: telegramChatId,
          message: signal.message,
          attempt: 0
        },
        retries: 0,
        visibleAt: new Date().toISOString()
      });
    }
    if (smsNumber && canUseSms(entitlements)) {
      enqueueJob({
        type: "DISPATCH_ALERT",
        payload: {
          alertId,
          tenantId: job.tenantId,
          provider: job.provider,
          channel: "sms",
          destination: smsNumber,
          message: signal.message,
          attempt: 0
        },
        retries: 0,
        visibleAt: new Date().toISOString()
      });
    }
  }

  await upsertSyncRun(job, "completed");
}
