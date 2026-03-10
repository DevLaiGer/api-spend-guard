import { NextRequest, NextResponse } from "next/server";
import { enqueueJob, dequeueReadyJob } from "@/lib/queue/in-memory-queue";
import { pushDlq } from "@/lib/queue/dlq";
import { insertErrorLog } from "@/lib/supabase/repository";
import { runAlertJob } from "@/workers/alert-worker";
import { runIngestJob } from "@/workers/ingest-worker";
import type { AlertJobPayload, IngestJobPayload } from "@/lib/types";

const MAX_RETRIES = 3;
const BACKOFF_SECONDS = [10, 30, 90];

function getBackoffSeconds(retries: number) {
  return BACKOFF_SECONDS[Math.min(retries, BACKOFF_SECONDS.length - 1)];
}

export async function POST(_request: NextRequest) {
  const job = dequeueReadyJob();
  if (!job) {
    return NextResponse.json({ status: "idle" });
  }

  try {
    if (job.type === "INGEST_PROVIDER") {
      await runIngestJob(job.payload as IngestJobPayload);
    } else {
      await runAlertJob(job.payload as AlertJobPayload);
    }
    return NextResponse.json({ status: "ok", jobId: job.id, type: job.type });
  } catch (error) {
    const retries = job.retries + 1;
    if (job.type === "INGEST_PROVIDER") {
      const payload = job.payload as IngestJobPayload;
      await insertErrorLog({
        tenantId: payload.tenantId,
        provider: payload.provider,
        errorCode: 500,
        message: error instanceof Error ? error.message : "unknown ingest error",
        jobId: job.id,
        attempt: retries
      });
    }

    if (retries >= MAX_RETRIES) {
      pushDlq({ ...job, retries });
      return NextResponse.json({ status: "dlq", jobId: job.id }, { status: 500 });
    }

    enqueueJob({
      ...job,
      retries,
      visibleAt: new Date(Date.now() + getBackoffSeconds(retries) * 1000).toISOString()
    });
    return NextResponse.json({ status: "retry", jobId: job.id, retries }, { status: 500 });
  }
}
