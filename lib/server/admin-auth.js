import "server-only";

import { getToken } from "next-auth/jwt";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

const ADMIN_ROLES = new Set(["admin", "agent"]);

export async function authorizeAdminRequest(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token?.id || !ADMIN_ROLES.has(token.role)) return false;

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return false;

  const { data, error } = await getSupabaseAdmin()
    .from("users")
    .select("role")
    .eq("id", token.id)
    .single();

  return !error && ADMIN_ROLES.has(data?.role);
}
