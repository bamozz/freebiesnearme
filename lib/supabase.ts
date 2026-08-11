import { createClient } from '@supabase/supabase-js';

// Server-side only client for Server Components / Route Handlers. Reads the
// same SUPABASE_URL already set in Vercel for the existing /api functions.
// SUPABASE_ANON_KEY is new - the anon key isn't secret (it's already
// hardcoded client-side in public/toronto/*.html), so add it to Vercel env
// vars under this name to wire this up.
export function createServerClient() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars');
  }
  return createClient(url, anonKey);
}
