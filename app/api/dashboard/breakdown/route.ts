import { NextRequest, NextResponse } from "next/server";
import { resolveTenantContext } from "@/lib/auth/tenant-context";
import { getServiceClient } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  const tenant = await resolveTenantContext(request, { allowAnonymous: true });
  const day = request.nextUrl.searchParams.get("day");
  if (!tenant || !day) {
    return NextResponse.json({ error: "authorization and day are required" }, { status: 400 });
  }
  const tenantId = tenant.tenantId;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("spend_rollups_daily")
    .select("provider, day_bucket, cost_usd, usage_units")
    .eq("tenant_id", tenantId)
    .eq("day_bucket", day);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ breakdown: data ?? [] });
}
