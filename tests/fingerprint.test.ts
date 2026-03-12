import { describe, expect, it } from "vitest";
import { buildFingerprintHash } from "@/lib/antiabuse/fingerprint";
import { issueFreeSessionToken, verifyFreeSessionToken } from "@/lib/auth/free-session";

describe("fingerprint and free session token", () => {
  it("FP1: same input yields same fingerprint hash", () => {
    const a = buildFingerprintHash({
      userAgent: "ua",
      language: "en-US",
      platform: "Win32",
      timezone: "UTC"
    });
    const b = buildFingerprintHash({
      userAgent: "ua",
      language: "en-US",
      platform: "Win32",
      timezone: "UTC"
    });
    expect(a).toBe(b);
  });

  it("FP2: issued token verifies", () => {
    const token = issueFreeSessionToken({
      sessionId: "session_1",
      fingerprintHash: "hash_1",
      maxAgeSeconds: 60
    });
    const payload = verifyFreeSessionToken(token);
    expect(payload?.sessionId).toBe("session_1");
    expect(payload?.fingerprintHash).toBe("hash_1");
  });
});
