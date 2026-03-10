import { NextRequest, NextResponse } from "next/server";
import { popDlq, listDlq } from "@/lib/queue/dlq";
import { enqueueJob } from "@/lib/queue/in-memory-queue";

export async function GET() {
  return NextResponse.json({ jobs: listDlq() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const jobId = String(body.jobId ?? "");
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }
  const job = popDlq(jobId);
  if (!job) {
    return NextResponse.json({ error: "job not found" }, { status: 404 });
  }
  enqueueJob({ ...job, retries: 0, visibleAt: new Date().toISOString() });
  return NextResponse.json({ status: "requeued", jobId });
}
