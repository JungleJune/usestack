import "server-only";

import { authenticateBearerRequest, normalizeEmail } from "@/lib/security.mjs";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export function authenticateAgentRequest(request) {
  return authenticateBearerRequest(request, process.env.AGENT_API_KEY);
}

export async function getAgentUserId() {
  const email = normalizeEmail(process.env.AGENT_EMAIL);
  if (!email) return null;

  const { data } = await getSupabaseAdmin()
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  return data?.id ?? null;
}
