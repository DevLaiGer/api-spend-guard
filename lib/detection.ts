import type { PolicyConfig } from "@/lib/types";

export type DetectionInput = {
  spendTodayUsd: number;
  baselineDailyUsd: number;
  burstSpendUsd: number;
  policy: PolicyConfig;
};

export type DetectionSignal = {
  type: "DAILY_LIMIT" | "VELOCITY_SPIKE" | "BURST";
  severity: "high" | "medium";
  message: string;
};

export function evaluatePolicy(input: DetectionInput): DetectionSignal[] {
  const signals: DetectionSignal[] = [];

  if (input.spendTodayUsd >= input.policy.dailyLimitUsd) {
    signals.push({
      type: "DAILY_LIMIT",
      severity: "high",
      message: `Daily limit breached (${input.spendTodayUsd.toFixed(2)} / ${input.policy.dailyLimitUsd.toFixed(2)}).`
    });
  }

  const velocityPct =
    input.baselineDailyUsd > 0
      ? ((input.spendTodayUsd - input.baselineDailyUsd) / input.baselineDailyUsd) * 100
      : 0;
  if (velocityPct >= input.policy.spikePct) {
    signals.push({
      type: "VELOCITY_SPIKE",
      severity: "medium",
      message: `Spend velocity spike detected (+${velocityPct.toFixed(1)}%).`
    });
  }

  if (input.burstSpendUsd >= input.policy.dailyLimitUsd * 0.5) {
    signals.push({
      type: "BURST",
      severity: "medium",
      message: `Burst spend detected (${input.burstSpendUsd.toFixed(2)} in short window).`
    });
  }

  return signals;
}
