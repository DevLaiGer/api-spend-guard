import { describe, it, expect, beforeEach, vi } from "vitest";
import { sendDiscordAlert, sendSmsAlert } from "@/lib/alerting";

describe("alerting", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("A1: Discord with valid URL calls fetch and returns ok when 2xx", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({ ok: true, status: 204 } as Response);
    const result = await sendDiscordAlert("https://discord.com/api/webhooks/xxx", "msg");
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://discord.com/api/webhooks/xxx",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ content: "msg" }),
      })
    );
  });

  it("A2: Discord empty webhook returns error", async () => {
    const result = await sendDiscordAlert("", "msg");
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ error: "missing_discord_webhook" });
  });

  it("A3: SMS when Twilio not configured returns error", async () => {
    const orig = process.env;
    process.env.TWILIO_ACCOUNT_SID = "";
    process.env.TWILIO_AUTH_TOKEN = "";
    process.env.TWILIO_FROM_NUMBER = "";
    const result = await sendSmsAlert("+1234567890", "msg");
    process.env = orig;
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ error: "twilio_not_configured" });
  });

  it("A4: SMS empty destination returns error", async () => {
    const result = await sendSmsAlert("", "msg");
    expect(result.ok).toBe(false);
    expect(["missing_destination", "twilio_not_configured"]).toContain(
      (result as { error?: string }).error
    );
  });
});
