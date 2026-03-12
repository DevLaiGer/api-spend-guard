export type ProviderName = "openai" | "anthropic" | "gcp";

export type JobType = "INGEST_PROVIDER" | "DISPATCH_ALERT";

export type SyncWindow = {
  windowStart: string;
  windowEnd: string;
};

export type IngestJobPayload = SyncWindow & {
  tenantId: string;
  provider: ProviderName;
  idempotencyKey: string;
  attempt: number;
};

export type AlertJobPayload = {
  alertId: string;
  tenantId: string;
  provider: ProviderName;
  channel: "discord" | "telegram" | "sms";
  destination: string;
  message: string;
  attempt: number;
};

export type QueueJob = {
  id: string;
  type: JobType;
  payload: IngestJobPayload | AlertJobPayload;
  visibleAt: string;
  retries: number;
};

export type SpendSample = {
  provider: ProviderName;
  startTime: string;
  endTime: string;
  usageUnits: number;
  costUsd: number;
  sourceRef: string;
};

export type PolicyConfig = {
  dailyLimitUsd: number;
  spikePct: number;
  burstWindowMin: number;
  cooldownMin: number;
};
