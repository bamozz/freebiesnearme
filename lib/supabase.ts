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

// Bypasses RLS entirely - only for trusted server-side mutations (cron jobs,
// moderation actions), never anything reachable from client input. Mirrors
// the service role client api/submit-listing.js already uses for its own
// writes, since the listings RLS policy blocks anon-key writes/updates
// (confirmed directly this session - an anon-key UPDATE returns 200 with
// zero rows affected, not an error, so using createServerClient() here
// would silently do nothing rather than fail loudly).
export function createServiceRoleClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  }
  return createClient(url, serviceRoleKey);
}
