import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getAnonClient } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  const provider = String(request.nextUrl.searchParams.get("provider") ?? "google");
  const plan = String(request.nextUrl.searchParams.get("plan") ?? "free");
  const safePlan = ["free", "pro"].includes(plan) ? plan : "free";
  const redirectTo = `${env.appBaseUrl}/onboarding/auth?plan=${encodeURIComponent(safePlan)}`;
  const supabase = getAnonClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as "google",
    options: { redirectTo }
  });
  if (error || !data.url) {
    return NextResponse.json({ error: error?.message ?? "oauth_start_failed" }, { status: 500 });
  }
  return NextResponse.redirect(data.url);
}
