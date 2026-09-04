import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Service-role client for server-only routes (Stripe webhook, checkout session creation)
 * that need to read/write orders outside the requesting user's session — never import
 * this into client code. */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
