import type { ProviderAdapter } from "@/lib/providers/types";

export const anthropicAdapter: ProviderAdapter = {
  name: "anthropic",
  async fetchSpend({ windowStart, windowEnd }) {
    // Placeholder adapter for MVP+1 scaffolding.
    return [
      {
        provider: "anthropic",
        startTime: windowStart,
        endTime: windowEnd,
        usageUnits: 0,
        costUsd: 0,
        sourceRef: "anthropic:synthetic"
      }
    ];
  }
};
