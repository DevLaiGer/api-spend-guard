import { NextRequest, NextResponse } from "next/server";
import { canAddProviderKey } from "@/lib/billing/entitlements";
import { resolveTenantContext } from "@/lib/auth/tenant-context";
import { encryptSecret } from "@/lib/encryption";
import { incrementPlanGateDenials } from "@/lib/metrics";
import { getServiceClient } from "@/lib/supabase/client";
import {
  getPlanEntitlements,
  getProviderAccountCount
} from "@/lib/supabase/repository";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const tenant = await resolveTenantContext(request, { allowAnonymous: true });
  if (!tenant) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const tenantId = tenant.tenantId;
  const provider = String(body.provider ?? "");
  const apiKey = String(body.apiKey ?? "");
  const keyScope = String(body.keyScope ?? "billing_read");

  if (!provider || !apiKey) {
    return NextResponse.json({ error: "provider and apiKey are required" }, { status: 400 });
  }

  const [plan, currentCount] = await Promise.all([
    getPlanEntitlements(tenantId),
    getProviderAccountCount(tenantId)
  ]);
  if (!canAddProviderKey(plan, currentCount)) {
    incrementPlanGateDenials();
    return NextResponse.json(
      {
        error: "provider_limit_reached",
        maxProviderAccounts: plan.maxProviderAccounts
      },
      { status: 403 }
    );
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
  return NextResponse.json({ status: "connected", tenantMode: tenant.mode });
}
