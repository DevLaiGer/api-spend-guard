import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    get encryptionSecret() {
      return process.env.ENCRYPTION_SECRET ?? "";
    },
  },
}));

import { encryptSecret, decryptSecret } from "@/lib/encryption";

const ORIGINAL_ENV = process.env;

describe("encryption", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, ENCRYPTION_SECRET: "test-secret-32-chars-long!!!!!!" };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("E1: round-trip", () => {
    const plain = "sk-abc123";
    const cipher = encryptSecret(plain);
    expect(decryptSecret(cipher)).toBe(plain);
  });

  it("E2: different plaintexts yield different ciphertexts", () => {
    const c1 = encryptSecret("a");
    const c2 = encryptSecret("b");
    expect(c1).not.toBe(c2);
  });

  it("E3: empty string round-trip", () => {
    const cipher = encryptSecret("");
    expect(decryptSecret(cipher)).toBe("");
  });

  it("E4: long string round-trip", () => {
    const long = "x".repeat(10_000);
    const cipher = encryptSecret(long);
    expect(decryptSecret(cipher)).toBe(long);
  });

  it("E5: missing ENCRYPTION_SECRET throws", () => {
    delete process.env.ENCRYPTION_SECRET;
    expect(() => encryptSecret("x")).toThrow(/ENCRYPTION_SECRET/);
  });

  it("E6: tampered ciphertext throws", () => {
    const cipher = encryptSecret("secret");
    const tampered = Buffer.from(cipher, "base64");
    tampered[tampered.length - 1] ^= 1;
    expect(() => decryptSecret(tampered.toString("base64"))).toThrow();
  });

  it("E7: wrong key throws", () => {
    process.env.ENCRYPTION_SECRET = "first-secret-32-chars-long!!!!!";
    const cipher = encryptSecret("x");
    process.env.ENCRYPTION_SECRET = "second-secret-32-chars-long!!!!";
    expect(() => decryptSecret(cipher)).toThrow();
  });
});
