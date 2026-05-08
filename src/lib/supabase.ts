import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set."
  );
}

// Clean stale OAuth hash BEFORE gotrue-js tries to parse it — prevents hang
const hash = window.location.hash;
if (hash && hash.includes("access_token")) {
  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (accessToken && refreshToken) {
    sessionStorage.setItem("supabase_oauth_recovery", JSON.stringify({ accessToken, refreshToken }));
  }
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const MEDIA_BUCKET = "media";
