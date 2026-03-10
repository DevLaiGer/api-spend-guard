import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getServiceClient } from "@/lib/supabase/client";

function verifySignature(payload: string, signature: string, secret: string) {
  if (!secret) return true;
  const digest = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  if (!signature || signature.length !== digest.length) return false;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature, "utf8"));
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  if (!verifySignature(payload, signature, env.stripeWebhookSecret)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  const event = JSON.parse(payload);
  const tenantId = String(event?.data?.object?.metadata?.tenantId ?? "");
  if (!tenantId) {
    return NextResponse.json({ status: "ignored" });
  }

  const supabase = getServiceClient();
  const nextTier = event.type === "customer.subscription.deleted" ? "free" : "pro";
  const { error } = await supabase
    .from("tenants")
    .update({ plan_tier: nextTier })
    .eq("id", tenantId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ status: "ok" });
}
