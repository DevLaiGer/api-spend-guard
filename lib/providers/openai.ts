import type { ProviderAdapter } from "@/lib/providers/types";

export const openAIAdapter: ProviderAdapter = {
  name: "openai",
  async fetchSpend({ windowStart, windowEnd }) {
    // Placeholder adapter for MVP scaffolding.
    // Real implementation should call OpenAI usage/billing endpoints.
    return [
      {
        provider: "openai",
        startTime: windowStart,
        endTime: windowEnd,
        usageUnits: 0,
        costUsd: 0,
        sourceRef: "openai:synthetic"
      }
    ];
  }
};
