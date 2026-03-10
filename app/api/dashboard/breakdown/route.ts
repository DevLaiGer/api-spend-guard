import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenantId");
  const day = request.nextUrl.searchParams.get("day");
  if (!tenantId || !day) {
    return NextResponse.json({ error: "tenantId and day are required" }, { status: 400 });
  }

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
