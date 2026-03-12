import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let browserClient: ReturnType<typeof createClient<any>> | undefined;

export function getBrowserClient() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Supabase browser client is not configured.");
  }
  browserClient ??= createClient<any>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true, // auto-processes OAuth hash/PKCE code on page load
      autoRefreshToken: true,
      flowType: "pkce" // explicit: default in v2, but stating it avoids implicit race
    }
  });
  return browserClient;
}

