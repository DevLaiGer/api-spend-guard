import { NextRequest, NextResponse } from "next/server";
import { resolveTenantContext } from "@/lib/auth/tenant-context";
import {
  disconnectProviderAccount,
  getPlanEntitlements,
  listProviderAccounts
} from "@/lib/supabase/repository";

export async function GET(request: NextRequest) {
  const tenant = await resolveTenantContext(request, { allowAnonymous: true });
  if (!tenant) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [accounts, plan] = await Promise.all([
    listProviderAccounts(tenant.tenantId),
    getPlanEntitlements(tenant.tenantId)
  ]);
  return NextResponse.json({
    accounts,
    plan,
    keyUsage: accounts.filter((a) => a.status === "active").length
  });
}

export async function DELETE(request: NextRequest) {
  const tenant = await resolveTenantContext(request, { allowAnonymous: true });
  if (!tenant) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const provider = String(request.nextUrl.searchParams.get("provider") ?? "");
  if (!provider) {
    return NextResponse.json({ error: "provider is required" }, { status: 400 });
  }
  await disconnectProviderAccount(tenant.tenantId, provider);
  return NextResponse.json({ status: "disconnected", provider });
}
