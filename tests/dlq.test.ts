import { describe, it, expect, beforeEach } from "vitest";
import { pushDlq, listDlq, popDlq } from "@/lib/queue/dlq";

const sampleJob = {
  id: "job-1",
  type: "INGEST_PROVIDER" as const,
  payload: {
    tenantId: "t1",
    provider: "openai" as const,
    windowStart: "",
    windowEnd: "",
    attempt: 1,
    idempotencyKey: "k1",
  },
  visibleAt: new Date().toISOString(),
  retries: 3,
};

describe("DLQ", () => {
  beforeEach(() => {
    const jobs = listDlq();
    jobs.forEach((j) => popDlq(j.id));
  });

  it("DLQ1: push then list shows job", () => {
    pushDlq(sampleJob);
    const list = listDlq();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(sampleJob.id);
  });

  it("DLQ2: pop by id removes and returns job", () => {
    pushDlq(sampleJob);
    const out = popDlq(sampleJob.id);
    expect(out).toEqual(sampleJob);
    expect(listDlq()).toHaveLength(0);
  });

  it("DLQ3: pop unknown id returns null", () => {
    expect(popDlq("unknown")).toBeNull();
  });

  it("DLQ4: pop same id twice: first returns job, second null", () => {
    pushDlq(sampleJob);
    expect(popDlq(sampleJob.id)).toEqual(sampleJob);
    expect(popDlq(sampleJob.id)).toBeNull();
  });
});
