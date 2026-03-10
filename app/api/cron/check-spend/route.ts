import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { buildIngestIdempotencyKey } from "@/lib/queue/idempotency";
import { enqueueJob } from "@/lib/queue/in-memory-queue";
import { getDueTenantsByMinute, getTenantProviders } from "@/lib/supabase/repository";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-cron-token");
  if (!env.cronAuthToken || token !== env.cronAuthToken) {
    return unauthorized();
  }

  const now = new Date();
  const minute = now.getUTCMinutes();
  const windowEnd = now.toISOString();
  const windowStart = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  const tenants = await getDueTenantsByMinute(minute);
  let enqueued = 0;
  for (const tenant of tenants) {
    const providers = await getTenantProviders(tenant.id);
    for (const provider of providers) {
      enqueueJob({
        type: "INGEST_PROVIDER",
        payload: {
          tenantId: tenant.id,
          provider,
          windowStart,
          windowEnd,
          attempt: 0,
          idempotencyKey: buildIngestIdempotencyKey({
            tenantId: tenant.id,
            provider,
            windowStart,
            windowEnd
          })
        },
        visibleAt: now.toISOString(),
        retries: 0
      });
      enqueued += 1;
    }
  }

  return NextResponse.json({ enqueued, minute, tenants: tenants.length });
}
