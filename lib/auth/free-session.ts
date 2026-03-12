import crypto from "node:crypto";
import { env } from "@/lib/env";

const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type FreeSessionPayload = {
  sessionId: string;
  fingerprintHash: string;
  exp: number;
};

function signPayload(payload: string) {
  const secret = env.freeSessionSecret || "dev_free_session_secret";
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function issueFreeSessionToken(params: {
  sessionId: string;
  fingerprintHash: string;
  maxAgeSeconds?: number;
}) {
  const exp = Math.floor(Date.now() / 1000) + (params.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS);
  const payload = `${params.sessionId}.${params.fingerprintHash}.${exp}`;
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

export function verifyFreeSessionToken(token: string): FreeSessionPayload | null {
  const [sessionId, fingerprintHash, expRaw, signature] = token.split(".");
  if (!sessionId || !fingerprintHash || !expRaw || !signature) {
    return null;
  }

  const payload = `${sessionId}.${fingerprintHash}.${expRaw}`;
  const expected = signPayload(payload);
  if (expected.length !== signature.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return null;
  }

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return { sessionId, fingerprintHash, exp };
}
