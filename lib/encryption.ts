import crypto from "node:crypto";
import { env } from "@/lib/env";

const IV_SIZE = 12;
const TAG_SIZE = 16;

function getKey() {
  if (!env.encryptionSecret) {
    throw new Error("ENCRYPTION_SECRET is required.");
  }
  return crypto.createHash("sha256").update(env.encryptionSecret).digest();
}

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_SIZE);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptSecret(ciphertext: string): string {
  const key = getKey();
  const raw = Buffer.from(ciphertext, "base64");
  const iv = raw.subarray(0, IV_SIZE);
  const tag = raw.subarray(IV_SIZE, IV_SIZE + TAG_SIZE);
  const encrypted = raw.subarray(IV_SIZE + TAG_SIZE);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return plaintext.toString("utf8");
}
