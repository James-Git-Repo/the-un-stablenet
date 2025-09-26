// /assets/sb-init.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './sb-config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Optional: also expose a global for any legacy code
if (typeof window !== 'undefined') {
  window.supabase = sb;                 // window.supabase
  window.sb = window.sb || {};
  window.sb.supabase = sb;              // window.sb.supabase
}
