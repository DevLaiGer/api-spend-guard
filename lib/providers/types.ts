import type { ProviderName, SpendSample } from "@/lib/types";

export type ProviderAdapter = {
  name: ProviderName;
  fetchSpend: (params: {
    apiKey: string;
    windowStart: string;
    windowEnd: string;
  }) => Promise<SpendSample[]>;
};
