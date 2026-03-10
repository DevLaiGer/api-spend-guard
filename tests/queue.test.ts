import { describe, it, expect, beforeEach } from "vitest";
import {
  enqueueJob,
  dequeueReadyJob,
  queueDepth,
  clearQueueForTesting,
} from "@/lib/queue/in-memory-queue";

describe("in-memory queue", () => {
  beforeEach(() => {
    clearQueueForTesting();
  });

  it("Q1: enqueue then dequeue returns job with id and payload", () => {
    const payload = {
      type: "INGEST_PROVIDER" as const,
      payload: {
        tenantId: "t1",
        provider: "openai" as const,
        windowStart: "2026-03-10T12:00:00.000Z",
        windowEnd: "2026-03-10T13:00:00.000Z",
        attempt: 0,
        idempotencyKey: "abc",
      },
      visibleAt: new Date(0).toISOString(),
      retries: 0,
    };
    const job = enqueueJob(payload);
    expect(job.id).toBeDefined();
    expect(job.payload).toEqual(payload.payload);
    const out = dequeueReadyJob();
    expect(out?.id).toBe(job.id);
    expect(out?.payload).toEqual(payload.payload);
  });

  it("Q2: empty dequeue returns undefined", () => {
    expect(dequeueReadyJob()).toBeUndefined();
  });

  it("Q3: visibleAt in future not dequeued yet", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    enqueueJob({
      type: "INGEST_PROVIDER",
      payload: {
        tenantId: "t1",
        provider: "openai",
        windowStart: "",
        windowEnd: "",
        attempt: 0,
        idempotencyKey: "x",
      },
      visibleAt: future,
      retries: 0,
    });
    expect(dequeueReadyJob()).toBeUndefined();
  });

  it("Q4: queueDepth increases on enqueue, decreases on dequeue", () => {
    expect(queueDepth()).toBe(0);
    enqueueJob({
      type: "INGEST_PROVIDER",
      payload: {
        tenantId: "t1",
        provider: "openai",
        windowStart: "",
        windowEnd: "",
        attempt: 0,
        idempotencyKey: "a",
      },
      visibleAt: new Date(0).toISOString(),
      retries: 0,
    });
    enqueueJob({
      type: "INGEST_PROVIDER",
      payload: {
        tenantId: "t1",
        provider: "openai",
        windowStart: "",
        windowEnd: "",
        attempt: 0,
        idempotencyKey: "b",
      },
      visibleAt: new Date(0).toISOString(),
      retries: 0,
    });
    expect(queueDepth()).toBe(2);
    dequeueReadyJob();
    expect(queueDepth()).toBe(1);
    dequeueReadyJob();
    expect(queueDepth()).toBe(0);
  });

  it("Q5: dequeue with type filter returns only that type", () => {
    const now = new Date(0).toISOString();
    enqueueJob({
      type: "DISPATCH_ALERT",
      payload: {
        alertId: "a1",
        tenantId: "t1",
        provider: "openai",
        channel: "discord",
        destination: "",
        message: "x",
        attempt: 0,
      },
      visibleAt: now,
      retries: 0,
    });
    expect(dequeueReadyJob("INGEST_PROVIDER")).toBeUndefined();
    expect(dequeueReadyJob("DISPATCH_ALERT")).toBeDefined();
  });

  it("Q6: FIFO order", () => {
    const now = new Date(0).toISOString();
    enqueueJob({
      type: "INGEST_PROVIDER",
      payload: { tenantId: "a", provider: "openai", windowStart: "", windowEnd: "", attempt: 0, idempotencyKey: "1" },
      visibleAt: now,
      retries: 0,
    });
    enqueueJob({
      type: "INGEST_PROVIDER",
      payload: { tenantId: "b", provider: "openai", windowStart: "", windowEnd: "", attempt: 0, idempotencyKey: "2" },
      visibleAt: now,
      retries: 0,
    });
    const first = dequeueReadyJob();
    const second = dequeueReadyJob();
    expect((first?.payload as { tenantId: string }).tenantId).toBe("a");
    expect((second?.payload as { tenantId: string }).tenantId).toBe("b");
  });
});
