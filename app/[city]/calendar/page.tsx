import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/categories';
import { getCity, popularNeighbourhoods } from '@/lib/cities';
import { groupListings } from '@/lib/group-listings';
import type { Listing } from '@/types/pseo_types';
import SiteFooter from '@/app/components/SiteFooter';
import CalendarGrid from './CalendarGrid';

// Same reasoning as app/[city]/[hub]/page.tsx: this is backed by a live,
// frequently-changing table, not content Next.js should cache.
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCity((await params).city);
  if (!city) return {};
  const title = `${city.name} Free Events Calendar | Freebies Near Me`;
  const description = `Plan your week with a calendar of free giveaways, samples, classes and pop up events in ${city.name}. Add any listing to your own calendar in one tap.`;
  const url = `https://www.freebiesnearme.app/${city.slug}/calendar`;
  const image = `https://www.freebiesnearme.app/${city.slug}/assets/og-image.png`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: 'Freebies Near Me',
      title,
      description,
      url,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

// Subscribe box (+ the paid-tier gating discussed for it) is tabled for now -
// the .ics feed route still exists, it's just not surfaced on the page.
const SUBSCRIBE_ENABLED = false;


export default async function CalendarPage({ params }: Props) {
  const city = getCity((await params).city);
  if (!city) notFound();
  const supabase = createServerClient();
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('city_slug', city.slug)
    .eq('is_active', true)
    .eq('moderation_status', 'approved')
    .order('start_time', { ascending: true })
    .returns<Listing[]>();

  const items = groupListings(listings ?? []).filter((listing) => listing.groupStatus !== 'ended');
  const liveCount = items.filter((listing) => listing.groupStatus === 'live').length;

  return (
    <>
    <div className="hub-wrap">
      <div className="hub-hero-row">
        <div>
          <h1 className="hub-title display">Free stuff and free things to do in <span className="city-name">{city.name}</span>, by date</h1>
          <p className="hub-sub">
            Browse what&apos;s on by date.
          </p>
        </div>
        <div className="hero-stat">
          <div className="num">{liveCount}</div>
          <div className="lbl">free events live in {city.name} today</div>
        </div>
      </div>

      {SUBSCRIBE_ENABLED && (
        <div className="cal-subscribe">
          <div className="cal-subscribe-text">
            <strong>Subscribe to this calendar</strong>
            <span>Stays synced automatically as listings are added - works with Google Calendar, Apple Calendar, and Outlook.</span>
          </div>
          <div className="cal-subscribe-links">
            <a className="btn-solid" href={`webcal://www.freebiesnearme.app/${city.slug}/calendar.ics`}>
              &#128197; Subscribe
            </a>
            <a className="cal-subscribe-secondary" href={`/${city.slug}/calendar.ics`}>
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
    <SiteFooter city={city.slug} categories={CATEGORIES} neighbourhoods={popularNeighbourhoods(city)} />
    </>
  );
}
