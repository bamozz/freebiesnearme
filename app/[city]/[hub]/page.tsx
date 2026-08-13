import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase';
import { buildHubItemList } from '@/lib/jsonld';
import { formatTimeRange } from '@/lib/datetime';
import { CATEGORY_COLOR, CATEGORY_LABEL } from '@/lib/categories';
import { stripFreeWord, buildImageAlt, directionsUrl, availInfo, computeListingStatus, statusLabel } from '@/lib/listing-display';
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

  const label = hub.replace(/-/g, ' ');
  const title =
    resolved.type === 'category'
      ? `Free ${label} in ${city} | Freebies Near Me`
      : `Free things to do in ${label}, ${city} | Freebies Near Me`;

  return {
    title,
    description: `${resolved.stats.active_listing_count} free listings live right now.`,
  };
}

export default async function HubPage({ params }: Props) {
  const { city, hub } = await params;
  const resolved = await getHub(city, hub);
  if (!resolved) notFound();

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

  const items = listings ?? [];
  const hubLabel = hub.replace(/-/g, ' ');
  const jsonLd = buildHubItemList(items, hubLabel);

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="hub-wrap">
        <h1 className="hub-title display">
          {resolved.stats.active_listing_count} free listings in {hubLabel}
        </h1>
        <p className="hub-sub">Free giveaways, samples, and pop up events in {hubLabel}, Toronto.</p>

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
                    <div className="card-thumb">
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
                        Register &rarr;
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
