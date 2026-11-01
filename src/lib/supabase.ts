import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { communityFetch } from "./community-resilience";
let client: SupabaseClient | null = null;
export function getCommunityClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  if (!client)
    client = createClient(url, key, {
      global: { fetch: communityFetch },
      auth: {
        flowType: "pkce",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  return client;
}
