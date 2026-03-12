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

export async function sendTelegramAlert(chatId: string, message: string) {
  if (!chatId) return { ok: false, error: "missing_telegram_chat_id" };
  if (!env.telegramBotToken) return { ok: false, error: "telegram_not_configured" };
  const response = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message
    })
  });
  return { ok: response.ok, status: response.status };
}

export async function sendSmsAlert(to: string, message: string) {
  if (!to) {
    return { ok: false, error: "missing_destination" };
  }
  if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioFromNumber) {
    return { ok: false, error: "twilio_not_configured" };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${env.twilioAccountSid}/Messages.json`;
  const formBody = new URLSearchParams({
    To: to,
    From: env.twilioFromNumber,
    Body: message
  });
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.twilioAccountSid}:${env.twilioAuthToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formBody.toString()
  });
  return { ok: response.ok, status: response.status };
}
