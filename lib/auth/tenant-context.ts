import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase/client";
import { verifyFreeSessionToken } from "@/lib/auth/free-session";
import {
  getOrCreateTenantForUser,
  getTenantByAnonymousSession
} from "@/lib/supabase/repository";

export type TenantContext = {
  tenantId: string;
  mode: "authenticated" | "anonymous";
  userId?: string;
  email?: string;
  anonymousSessionId?: string;
};

export async function resolveTenantContext(
  request: NextRequest,
  options?: { allowAnonymous?: boolean }
): Promise<TenantContext | null> {
  const auth = request.headers.get("authorization") ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (!token) return null;
    const supabase = getServiceClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    const tenant = await getOrCreateTenantForUser({
      userId: data.user.id,
      email: data.user.email ?? ""
    });
    return {
      tenantId: tenant.id,
      mode: "authenticated",
      userId: data.user.id,
      email: data.user.email ?? ""
    };
  }

  if (!options?.allowAnonymous) {
    return null;
  }

  const token =
    request.cookies.get("asg_free_session")?.value ??
    request.headers.get("x-free-session-token") ??
    "";
  if (!token) {
    return null;
  }
  const payload = verifyFreeSessionToken(token);
  if (!payload) {
    return null;
  }
  const tenantId = await getTenantByAnonymousSession(payload.sessionId);
  if (!tenantId) {
    return null;
  }
  return {
    tenantId,
    mode: "anonymous",
    anonymousSessionId: payload.sessionId
  };
}
