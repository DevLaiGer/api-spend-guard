import { describe, it, expect } from "vitest";
import { buildIngestIdempotencyKey } from "@/lib/queue/idempotency";

describe("buildIngestIdempotencyKey", () => {
  const params = {
    tenantId: "t1",
    provider: "openai" as const,
    windowStart: "2026-03-10T12:00:00.000Z",
    windowEnd: "2026-03-10T13:00:00.000Z",
  };

  it("I1: same input yields same key", () => {
    const a = buildIngestIdempotencyKey(params);
    const b = buildIngestIdempotencyKey(params);
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("I2: different window yields different key", () => {
    const a = buildIngestIdempotencyKey(params);
    const b = buildIngestIdempotencyKey({
      ...params,
      windowEnd: "2026-03-10T14:00:00.000Z",
    });
    expect(a).not.toBe(b);
  });

  it("I3: different tenant yields different key", () => {
    const a = buildIngestIdempotencyKey(params);
    const b = buildIngestIdempotencyKey({ ...params, tenantId: "t2" });
    expect(a).not.toBe(b);
  });
});
