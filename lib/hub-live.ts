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
