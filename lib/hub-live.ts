import type { Listing } from '@/types/pseo_types';
import { groupListings, type GroupedListing } from '@/lib/group-listings';

// The one definition of "this hub has something to show": the hub's rows,
// grouped the way the page groups them, minus every group that has wrapped
// up. The hub page, its <meta robots> decision and the sitemap all use this
// function, so a hub is listed in the sitemap, indexable and non-empty for
// exactly the same reason.
export function liveHubListings(rows: Listing[]): GroupedListing[] {
  return groupListings(rows).filter((listing) => listing.groupStatus !== 'ended');
}

// A hub with fewer live listings than this is thin for search: its page asks
// search engines not to index it and the sitemap leaves it out, and both switch
// back by themselves once enough listings are live. Category and neighbourhood
// hubs follow the same rule (SEO check, Nov 27 2026, for the AdSense review).
export const MIN_INDEXABLE_LISTINGS = 2;

export function hubIndexable(rows: Listing[]): boolean {
  return liveHubListings(rows).length >= MIN_INDEXABLE_LISTINGS;
}
