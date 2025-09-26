import { SUPABASE_URL, SUPABASE_ANON_KEY } from './sb-config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
