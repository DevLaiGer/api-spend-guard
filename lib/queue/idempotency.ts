import crypto from "node:crypto";
import type { ProviderName } from "@/lib/types";

export function buildIngestIdempotencyKey(params: {
  tenantId: string;
  provider: ProviderName;
  windowStart: string;
  windowEnd: string;
}) {
  const raw = `${params.tenantId}:${params.provider}:${params.windowStart}:${params.windowEnd}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}
