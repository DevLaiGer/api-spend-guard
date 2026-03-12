export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  encryptionSecret: process.env.ENCRYPTION_SECRET ?? "",
  cronAuthToken: process.env.CRON_AUTH_TOKEN ?? "",
  adminAuthToken: process.env.ADMIN_AUTH_TOKEN ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  appBaseUrl: process.env.NEXT_PUBLIC_APP_BASE_URL ?? "http://localhost:3000",
  freeSessionSecret: process.env.FREE_SESSION_SECRET ?? "",
  fingerprintSalt: process.env.FINGERPRINT_SALT ?? "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioFromNumber: process.env.TWILIO_FROM_NUMBER ?? ""
};
