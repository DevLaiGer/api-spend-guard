import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let serviceClient: ReturnType<typeof createClient<any>> | undefined;
let anonClient: ReturnType<typeof createClient<any>> | undefined;

export function getServiceClient() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error("Supabase service client is not configured.");
  }
  serviceClient ??= createClient<any>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false }
  });
  return serviceClient;
}

export function getAnonClient() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Supabase anon client is not configured.");
  }
  anonClient ??= createClient<any>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false }
  });
  return anonClient;
}
