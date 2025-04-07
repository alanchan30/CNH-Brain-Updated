import { createClient } from "@supabase/supabase-js";

// Use environment variables or constants for your Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create client with 1 month session duration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: "supabase.auth.token",
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
