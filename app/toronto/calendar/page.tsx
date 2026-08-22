import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/categories';
import { NEIGHBOURHOODS } from '@/lib/neighbourhoods';
import { groupListings } from '@/lib/group-listings';
import type { Listing } from '@/types/pseo_types';
import SiteFooter from '@/app/components/SiteFooter';
import CalendarGrid from './CalendarGrid';

// Same reasoning as app/[city]/[hub]/page.tsx: this is backed by a live,
// frequently-changing table, not content Next.js should cache.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Free Events Calendar | Freebies Near Me',
  description: 'Browse Toronto free giveaways and pop up events by date.',
};

// Subscribe box (+ the paid-tier gating discussed for it) is tabled for now -
// the .ics feed route still exists, it's just not surfaced on the page.
const SUBSCRIBE_ENABLED = false;

// Same curated subset used by the pSEO hub pages' cross-link footer - kept
// in sync manually since this page isn't tied to one category/neighbourhood
// (so, unlike hub pages, nothing here needs to be excluded from the list).
const POPULAR_NEIGHBOURHOOD_SLUGS = [
  'the-well',
  'yorkville',
  'liberty-village',
  'distillery-district',
  'kensington-market',
  'harbourfront',
  'king-west',
  'the-junction',
];
const POPULAR_NEIGHBOURHOODS = NEIGHBOURHOODS.filter((n) => POPULAR_NEIGHBOURHOOD_SLUGS.includes(n.slug));

export default async function CalendarPage() {
  const supabase = createServerClient();
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('city_slug', 'toronto')
    .eq('is_active', true)
    .order('start_time', { ascending: true })
    .returns<Listing[]>();

  const items = groupListings(listings ?? []).filter((listing) => listing.groupStatus !== 'ended');

  return (
    <>
    <div className="hub-wrap">
      <h1 className="hub-title display">Free stuff and free things to do in Toronto, by date</h1>
      <p className="hub-sub">
        Browse what&apos;s on by date.
      </p>

      {SUBSCRIBE_ENABLED && (
        <div className="cal-subscribe">
          <div className="cal-subscribe-text">
            <strong>Subscribe to this calendar</strong>
            <span>Stays synced automatically as listings are added - works with Google Calendar, Apple Calendar, and Outlook.</span>
          </div>
          <div className="cal-subscribe-links">
            <a className="btn-solid" href="webcal://www.freebiesnearme.app/toronto/calendar.ics">
              &#128197; Subscribe
            </a>
            <a className="cal-subscribe-secondary" href="/toronto/calendar.ics">
              Or copy the feed URL
            </a>
          </div>
        </div>
      )}

      <CalendarGrid listings={items} />
    </div>

    {/* Same internal linking mesh as the pSEO hub pages - see
        app/[city]/[hub]/page.tsx. Nothing here needs excluding since this
        page isn't tied to one category/neighbourhood. */}
    <SiteFooter city="toronto" categories={CATEGORIES} neighbourhoods={POPULAR_NEIGHBOURHOODS} />
    </>
  );
}
