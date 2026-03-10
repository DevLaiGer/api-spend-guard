import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenantId");
  const range = request.nextUrl.searchParams.get("range") ?? "7d";
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }
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
