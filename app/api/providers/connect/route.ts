import { NextRequest, NextResponse } from "next/server";
import { encryptSecret } from "@/lib/encryption";
import { getServiceClient } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const tenantId = String(body.tenantId ?? "");
  const provider = String(body.provider ?? "");
  const apiKey = String(body.apiKey ?? "");
  const keyScope = String(body.keyScope ?? "billing_read");

  if (!tenantId || !provider || !apiKey) {
    return NextResponse.json({ error: "tenantId, provider, apiKey are required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase.from("provider_accounts").upsert(
    {
      tenant_id: tenantId,
      provider,
      encrypted_key: encryptSecret(apiKey),
      key_scope: keyScope,
      status: "active"
    },
    { onConflict: "tenant_id,provider" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ status: "connected" });
}
