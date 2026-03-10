import { sendDiscordAlert, sendSmsAlert } from "@/lib/alerting";
import {
  getDiscordWebhook,
  getSmsDestination,
  insertAlertDelivery
} from "@/lib/supabase/repository";
import type { AlertJobPayload } from "@/lib/types";

export async function runAlertJob(job: AlertJobPayload) {
  if (job.channel === "discord") {
    const webhookUrl = await getDiscordWebhook(job.tenantId);
    const result = await sendDiscordAlert(webhookUrl, job.message);
    await insertAlertDelivery({
      alertId: job.alertId,
      channel: "discord",
      destination: webhookUrl,
      status: result.ok ? "sent" : "failed",
      attempt: job.attempt,
      error: result.ok ? undefined : JSON.stringify(result)
    });
    return;
  }

  const destination = await getSmsDestination(job.tenantId);
  const result = await sendSmsAlert(destination, job.message);
  await insertAlertDelivery({
    alertId: job.alertId,
    channel: "sms",
    destination,
    status: result.ok ? "sent" : "failed",
    attempt: job.attempt,
    error: result.ok ? undefined : JSON.stringify(result)
  });
}
