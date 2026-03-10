import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("alerts")
    .select("id, provider, alert_type, severity, state, message, opened_at, closed_at")
    .eq("tenant_id", tenantId)
    .order("opened_at", { ascending: false })
    .limit(50);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ alerts: data ?? [] });
}
