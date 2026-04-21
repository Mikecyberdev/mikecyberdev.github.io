import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const SUPABASE_URL = "https://adcbmqyibhtchkujffyl.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_v0i-_Fs-vQfX2Fx4kusF4w_2FDk2Hjv";
export const SITE_CONTENT_SLUG = "primary";
export const SITE_ASSETS_BUCKET = "site-assets";

let supabaseClient;

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseClient;
}
