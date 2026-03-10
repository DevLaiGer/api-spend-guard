import { env } from "@/lib/env";

export async function sendDiscordAlert(webhookUrl: string, message: string) {
  if (!webhookUrl) return { ok: false, error: "missing_discord_webhook" };
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message })
  });
  return { ok: response.ok, status: response.status };
}

export async function sendSmsAlert(to: string, message: string) {
  // Placeholder for Twilio integration in MVP.
  if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioFromNumber) {
    return { ok: false, error: "twilio_not_configured" };
  }
  if (!to) {
    return { ok: false, error: "missing_destination" };
  }
  return { ok: true, status: "queued_stub" };
}
