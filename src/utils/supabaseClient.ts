import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.warn("Внимание: VITE_SUPABASE_ANON_KEY пустой!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
