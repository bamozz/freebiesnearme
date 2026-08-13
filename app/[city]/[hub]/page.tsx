import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase';
import { buildHubItemList } from '@/lib/jsonld';
import { formatTimeRange, hasClockTime } from '@/lib/datetime';
import { CATEGORY_COLOR, CATEGORY_LABEL, CATEGORY_SLUG_LABEL } from '@/lib/categories';
import {
  stripFreeWord,
  buildImageAlt,
  directionsUrl,
  availInfo,
  computeListingStatus,
  statusLabel,
  buildCalendarUrl,
  buildGoogleCalendarUrl,
  icsFilename,
} from '@/lib/listing-display';
import type { Listing, PseoCategoryStats, PseoNeighbourhoodStats } from '@/types/pseo_types';

// Starter dynamic route for both category hubs (/toronto/free-coffee) and
// neighbourhood hubs (/toronto/kensington-market) under one [hub] segment.
// It resolves [hub] against pseo_category_stats first, then
// pseo_neighbourhood_stats, and 404s if it matches neither.

// This page is backed by a live, frequently-changing Supabase table, not
// content Next.js should cache - without this, the App Router's default
// fetch caching (which patches the global fetch() used internally by
// @supabase/supabase-js) permanently caches whatever the first request to
// each unique [city]/[hub] combination happened to return, including a
// false 404 if that first hit landed before the data existed.
export const dynamic = 'force-dynamic';

// Neighbourhood/city slugs have no CATEGORY_SLUG_LABEL-style lookup table,
// so they fall back to title-casing the slug's words directly.
function titleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function hubDisplayLabel(hub: string, type: 'category' | 'neighbourhood'): string {
  return type === 'category' ? CATEGORY_SLUG_LABEL[hub] ?? titleCase(hub) : titleCase(hub);
}

type Props = { params: Promise<{ city: string; hub: string }> };

async function getHub(city: string, hub: string) {
  const supabase = createServerClient();

  const { data: categoryStats } = await supabase
    .from('pseo_category_stats')
    .select('*')
    .eq('city_slug', city)
    .eq('category_slug', hub)
    .maybeSingle<PseoCategoryStats>();

  if (categoryStats) {
    return { type: 'category' as const, stats: categoryStats };
  }

  const { data: neighbourhoodStats } = await supabase
    .from('pseo_neighbourhood_stats')
    .select('*')
    .eq('city_slug', city)
    .eq('neighbourhood_slug', hub)
    .maybeSingle<PseoNeighbourhoodStats>();

  if (neighbourhoodStats) {
    return { type: 'neighbourhood' as const, stats: neighbourhoodStats };
  }

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, hub } = await params;
  const resolved = await getHub(city, hub);
  if (!resolved) return {};

  const label = hubDisplayLabel(hub, resolved.type);
  const cityLabel = titleCase(city);
  const title =
    resolved.type === 'category'
      ? `Free ${label} in ${cityLabel} | Freebies Near Me`
      : `Free things to do in ${label}, ${cityLabel} | Freebies Near Me`;

  // active_listing_count (from the stats view) counts every is_active row
  // regardless of whether its time window has already ended, so it can't be
  // reused here - this counts only listings that haven't wrapped up yet,
  // matching what the page itself actually shows.
  const supabase = createServerClient();
  const filterColumn = resolved.type === 'category' ? 'category_slug' : 'neighbourhood_slug';
  const { data: listings } = await supabase
    .from('listings')
    .select('start_time, end_time')
    .eq('city_slug', city)
    .eq(filterColumn, hub)
    .eq('is_active', true)
    .returns<Pick<Listing, 'start_time' | 'end_time'>[]>();
  const activeCount = (listings ?? []).filter(
    (l) => computeListingStatus(l.start_time, l.end_time) !== 'ended'
  ).length;

  return {
    title,
    description: `${activeCount} free listings happening now or coming up.`,
  };
}

export default async function HubPage({ params }: Props) {
  const { city, hub } = await params;
  const resolved = await getHub(city, hub);
  if (!resolved) notFound();

  // Google Calendar is the default app on nearly every Android device, so
  // Android gets its zero-download "quick add" URL instead of the .ics
  // link everyone else gets - see buildGoogleCalendarUrl()'s comment.
  const userAgent = (await headers()).get('user-agent') || '';
  const isAndroid = /android/i.test(userAgent);

  const supabase = createServerClient();
  const filterColumn = resolved.type === 'category' ? 'category_slug' : 'neighbourhood_slug';
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('city_slug', city)
    .eq(filterColumn, hub)
    .eq('is_active', true)
    .order('start_time', { ascending: true })
    .returns<Listing[]>();

  // Wrapped-up listings stay is_active until the deactivation cron sweeps
  // them, so they'd otherwise still show up here (and inflate the visible
  // count) for however long that gap lasts.
  const items = (listings ?? []).filter(
    (listing) => computeListingStatus(listing.start_time, listing.end_time) !== 'ended'
  );
  const hubLabel = hubDisplayLabel(hub, resolved.type);
  const cityLabel = titleCase(city);
  const hubUrl = `https://freebiesnearme.app/${city}/${hub}`;
  const jsonLd = buildHubItemList(items, hubLabel, hubUrl);

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="hub-wrap">
        <h1 className="hub-title display">
          {resolved.type === 'category'
            ? `Free ${hubLabel} Events & Giveaways in ${cityLabel}`
            : `Free Giveaways & Events in ${hubLabel}, ${cityLabel}`}
        </h1>
        <p className="hub-sub">
          {items.length} free listings happening now or coming up in {hubLabel}, {cityLabel}.
        </p>

        {items.length === 0 ? (
          <div className="hub-empty">No free listings here right now. Check back soon, or explore the full map.</div>
        ) : (
          <ul className="hub-list">
            {items.map((listing) => {
              const status = computeListingStatus(listing.start_time, listing.end_time);
              const avail = availInfo(listing);
              return (
                <li
                  key={listing.id}
                  className={`card${listing.sponsored ? ' sponsored' : ''}${listing.image_url ? ' has-thumb' : ''}`}
                  style={listing.sponsored ? undefined : { borderLeftColor: CATEGORY_COLOR[listing.category] }}
                >
                  {listing.sponsored && <div className="sponsored-flag">Sponsored</div>}
                  <div className="card-top">
                    <div className="tag-row">
                      <span className="tag cat" style={{ color: CATEGORY_COLOR[listing.category] }}>
                        {CATEGORY_LABEL[listing.category]}
                      </span>
                    </div>
                    <span className={`status-badge ${status}`}>
                      {status !== 'ended' && <span className="dot" />}
                      {statusLabel(status, listing.start_time)}
                    </span>
                  </div>
                  {listing.image_url && (
                    <div className="card-thumb" data-image={listing.image_url} data-insta={listing.insta_url ?? ''}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={listing.image_url} alt={buildImageAlt(listing)} loading="lazy" />
                    </div>
                  )}
                  <div className="card-text">
                    <div className="card-what">{stripFreeWord(listing.what)}</div>
                    <div className="card-brand">{listing.brand}</div>
                  </div>
                  <div className="card-meta">
                    <span>
                      {formatTimeRange(listing.start_time, listing.end_time)} &middot; {listing.neighbourhood}
                    </span>
                    {avail && <span className={`avail ${avail.cls}`}>{avail.text}</span>}
                    {listing.signup_url && (
                      <a
                        href={listing.signup_url}
                        target="_blank"
                        rel="noopener"
                        className="signup-link"
                      >
                        &#128221; Register
                      </a>
                    )}
                    <a
                      href={directionsUrl(listing)}
                      target="_blank"
                      rel="noopener"
                      className="directions-link"
                    >
                      &#128205; Get directions
                    </a>
                    {hasClockTime(new Date(listing.start_time)) && (
                      isAndroid ? (
                        <a
                          href={buildGoogleCalendarUrl(listing)}
                          target="_blank"
                          rel="noopener"
                          className="calendar-link"
                        >
                          &#128197; Add to calendar
                        </a>
                      ) : (
                        <a
                          href={buildCalendarUrl(listing)}
                          download={icsFilename(listing)}
                          className="calendar-link"
                        >
                          &#128197; Add to calendar
                        </a>
                      )
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
