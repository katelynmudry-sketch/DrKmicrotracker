// Server-only Supabase client — service-role key, bypasses RLS.
// Used only for the read-only `food_reference` table (CNF data). Only import
// this from server functions or other *.server.ts modules, never from route
// files or *.functions.ts top-level scope (those ship to the client bundle).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function adminConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = [!url && "SUPABASE_URL", !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY"].filter(
    Boolean,
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing Supabase admin environment variable(s): ${missing.join(", ")}. Find these in your Supabase project's API settings.`,
    );
  }
  return { url, serviceRoleKey } as { url: string; serviceRoleKey: string };
}

let _client: SupabaseClient | undefined;
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop, receiver) {
    if (!_client) {
      const config = adminConfig();
      _client = createClient(config.url, config.serviceRoleKey, {
        auth: { persistSession: false },
      });
    }
    return Reflect.get(_client, prop, receiver);
  },
});

// True once SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are set. food_reference
// lookups are best-effort — callers should degrade gracefully when this is
// false rather than failing pantry/grocery flows that don't depend on it.
export const isSupabaseConfigured = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);
