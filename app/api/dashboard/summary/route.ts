import { NextRequest, NextResponse } from "next/server";
import { resolveTenantContext } from "@/lib/auth/tenant-context";
import { getServiceClient } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  const tenant = await resolveTenantContext(request, { allowAnonymous: true });
  const range = request.nextUrl.searchParams.get("range") ?? "7d";
  if (!tenant) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const tenantId = tenant.tenantId;
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("get_dashboard_summary", {
    p_tenant_id: tenantId,
    p_range: range
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ summary: data ?? [] });
}
