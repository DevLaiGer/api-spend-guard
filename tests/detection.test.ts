import { describe, it, expect } from "vitest";
import { evaluatePolicy } from "@/lib/detection";

describe("evaluatePolicy", () => {
  const basePolicy = {
    dailyLimitUsd: 100,
    spikePct: 150,
    burstWindowMin: 60,
    cooldownMin: 30,
  };

  it("D1: no breach returns empty", () => {
    const out = evaluatePolicy({
      spendTodayUsd: 10,
      baselineDailyUsd: 5,
      burstSpendUsd: 0,
      policy: basePolicy,
    });
    expect(out).toEqual([]);
  });

  it("D2: daily limit breached emits DAILY_LIMIT high", () => {
    const out = evaluatePolicy({
      spendTodayUsd: 150,
      baselineDailyUsd: 0,
      burstSpendUsd: 0,
      policy: basePolicy,
    });
    expect(out.length).toBeGreaterThanOrEqual(1);
    expect(out[0].type).toBe("DAILY_LIMIT");
    expect(out[0].severity).toBe("high");
  });

  it("D3: velocity spike emits VELOCITY_SPIKE", () => {
    const out = evaluatePolicy({
      spendTodayUsd: 200,
      baselineDailyUsd: 100,
      burstSpendUsd: 0,
      policy: { ...basePolicy, spikePct: 50 },
    });
    const v = out.find((s) => s.type === "VELOCITY_SPIKE");
    expect(v).toBeDefined();
    expect(v!.severity).toBe("medium");
  });

  it("D4: burst only emits BURST", () => {
    const out = evaluatePolicy({
      spendTodayUsd: 0,
      baselineDailyUsd: 0,
      burstSpendUsd: 60,
      policy: basePolicy,
    });
    const b = out.find((s) => s.type === "BURST");
    expect(b).toBeDefined();
  });

  it("D5: multiple signals can fire", () => {
    const out = evaluatePolicy({
      spendTodayUsd: 200,
      baselineDailyUsd: 50,
      burstSpendUsd: 60,
      policy: basePolicy,
    });
    expect(out.length).toBeGreaterThanOrEqual(1);
    const types = out.map((s) => s.type);
    expect(types).toContain("DAILY_LIMIT");
  });

  it("D6: zero baseline does not emit velocity", () => {
    const out = evaluatePolicy({
      spendTodayUsd: 100,
      baselineDailyUsd: 0,
      burstSpendUsd: 0,
      policy: basePolicy,
    });
    expect(out.some((s) => s.type === "VELOCITY_SPIKE")).toBe(false);
  });

  it("D7: exactly at limit emits DAILY_LIMIT", () => {
    const out = evaluatePolicy({
      spendTodayUsd: 100,
      baselineDailyUsd: 0,
      burstSpendUsd: 0,
      policy: basePolicy,
    });
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe("DAILY_LIMIT");
  });

  it("D8: just below spike threshold no velocity", () => {
    const out = evaluatePolicy({
      spendTodayUsd: 149,
      baselineDailyUsd: 100,
      burstSpendUsd: 0,
      policy: { ...basePolicy, spikePct: 50 },
    });
    expect(out.some((s) => s.type === "VELOCITY_SPIKE")).toBe(false);
  });

  it("D9: burst below 50% of limit no burst signal", () => {
    const out = evaluatePolicy({
      spendTodayUsd: 0,
      baselineDailyUsd: 0,
      burstSpendUsd: 40,
      policy: basePolicy,
    });
    expect(out.some((s) => s.type === "BURST")).toBe(false);
  });

  it("D10: zero daily limit still evaluates (no crash)", () => {
    const out = evaluatePolicy({
      spendTodayUsd: 0,
      baselineDailyUsd: 0,
      burstSpendUsd: 0,
      policy: { ...basePolicy, dailyLimitUsd: 0 },
    });
    expect(Array.isArray(out)).toBe(true);
  });
});
