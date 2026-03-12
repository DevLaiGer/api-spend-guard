import { NextRequest, NextResponse } from "next/server";
import { resolveTenantContext } from "@/lib/auth/tenant-context";
import { upsertSubscription } from "@/lib/supabase/repository";

export async function POST(request: NextRequest) {
  try {
    const tenant = await resolveTenantContext(request);
    if (!tenant) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const desiredPlan = String(body.planCode ?? "free");
    if (!["free", "pro"].includes(desiredPlan)) {
      return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
    }

    await upsertSubscription({
      tenantId: tenant.tenantId,
      planCode: desiredPlan,
      status: "active",
      provider: desiredPlan === "pro" ? "stripe_pending" : "manual"
    });

    return NextResponse.json({ status: "ok", tenantId: tenant.tenantId, planCode: desiredPlan });
  } catch (error) {
    const fallbackMessage =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message ?? "onboarding_auth_failed")
        : "onboarding_auth_failed";
    return NextResponse.json(
      { error: error instanceof Error ? error.message : fallbackMessage },
      { status: 500 }
    );
  }
}
