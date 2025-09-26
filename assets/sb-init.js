// assets/sb-init.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./sb-config.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// IMPORTANT: access-mode.js waits for window.$sb
window.__SB = sb;
window.$sb  = sb;

