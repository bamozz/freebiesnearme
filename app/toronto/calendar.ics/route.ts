import { createServerClient } from '@/lib/supabase';
import { buildFeedIcs, computeListingStatus } from '@/lib/listing-display';
import type { Listing } from '@/types/pseo_types';

// Subscribable feed of every currently active, not-yet-ended listing
// site-wide - a calendar app polling this stays in sync automatically,
// unlike the per-listing "Add to calendar" links (buildCalendarUrl),
// which are a one-time snapshot at the moment you click them.
//
// Not cached at the platform level: calendar apps typically poll a
// subscribed feed every few hours on their own schedule regardless of any
// cache headers here, so there's little benefit to caching and a real cost
// to serving stale data if we did.
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServerClient();
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('city_slug', 'toronto')
    .eq('is_active', true)
    .order('start_time', { ascending: true })
    .returns<Listing[]>();

  const items = (listings ?? []).filter(
    (listing) => computeListingStatus(listing.start_time, listing.end_time) !== 'ended'
  );

  const ics = buildFeedIcs(items);

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="freebiesnearme-toronto.ics"',
      'Cache-Control': 'public, max-age=1800',
    },
  });
}
