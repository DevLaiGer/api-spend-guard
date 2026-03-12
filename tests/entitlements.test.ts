import { describe, expect, it } from "vitest";
import {
  canAddProviderKey,
  canUseSms,
  maxKeysAllowed
} from "@/lib/billing/entitlements";

describe("entitlements", () => {
  it("EPM1: free plan limits keys to 1", () => {
    const plan = {
      code: "free",
      maxProviderAccounts: 1,
      smsEnabled: false,
      telegramEnabled: true,
      discordEnabled: true
    };
    expect(maxKeysAllowed(plan)).toBe(1);
    expect(canAddProviderKey(plan, 0)).toBe(true);
    expect(canAddProviderKey(plan, 1)).toBe(false);
  });

  it("EPM2: pro plan enables sms", () => {
    const plan = {
      code: "pro",
      maxProviderAccounts: 5,
      smsEnabled: true,
      telegramEnabled: true,
      discordEnabled: true
    };
    expect(canUseSms(plan)).toBe(true);
  });
});
