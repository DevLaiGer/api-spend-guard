import crypto from "node:crypto";
import { env } from "@/lib/env";

type FingerprintInput = {
  userAgent?: string;
  language?: string;
  platform?: string;
  timezone?: string;
};

function stable(input: FingerprintInput) {
  return JSON.stringify({
    userAgent: input.userAgent ?? "",
    language: input.language ?? "",
    platform: input.platform ?? "",
    timezone: input.timezone ?? ""
  });
}

export function buildFingerprintHash(input: FingerprintInput) {
  const h = crypto.createHash("sha256");
  h.update(stable(input));
  h.update(":");
  h.update(env.fingerprintSalt || "dev_fingerprint_salt");
  return h.digest("hex");
}

export function buildIpHash(ip: string) {
  return crypto.createHash("sha256").update(ip || "unknown").digest("hex");
}
