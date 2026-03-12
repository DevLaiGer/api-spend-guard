import { NextRequest, NextResponse } from "next/server";
import { resolveTenantContext } from "@/lib/auth/tenant-context";
import { getPlanEntitlements } from "@/lib/supabase/repository";

export async function GET(request: NextRequest) {
  const tenant = await resolveTenantContext(request);
  if (!tenant) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const plan = await getPlanEntitlements(tenant.tenantId);
  return NextResponse.json({
    tenantId: tenant.tenantId,
    mode: tenant.mode,
    userId: tenant.userId ?? null,
    email: tenant.email ?? null,
    plan
  });
}
