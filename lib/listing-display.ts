import type { Listing } from '@/types/pseo_types';
import { assumedEndIso } from '@/lib/datetime';

// Ported from the stripFreeWord/buildImageAlt/directionsUrl/availInfo/
// statusFromWindows family in public/toronto/index.html so listing cards
// read identically wherever they're rendered.

// Saying "free" on a site called Freebies Near Me is always redundant, so
// it's stripped from the offer description wherever it's shown rather than
// relying on every submitter to leave it out themselves. Exception: "Free
// Flicks" is a proper name (the actual title of the screening series), not
// filler, so it's left alone via a negative lookahead.
export function stripFreeWord(text: string | null | undefined): string {
  const stripped = (text || '')
    .replace(/\bfree\b(?!\s+flicks\b)/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return stripped ? stripped.charAt(0).toUpperCase() + stripped.slice(1) : stripped;
}

export function buildImageAlt(listing: Listing): string {
  const what = stripFreeWord(listing.what);
  return `${listing.brand} - ${what} in ${listing.neighbourhood}, Toronto | Freebies Near Me`;
}

export function directionsUrl(listing: Listing): string {
  const query = listing.address
    ? encodeURIComponent(`${listing.address}, ${listing.neighbourhood}, Toronto, ON`)
    : `${listing.lat},${listing.lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function availInfo(listing: Listing): { cls: 'low' | 'ok'; text: string } | null {
  if (!listing.total_count) return null;
  const left = listing.total_count - listing.claimed_count;
  const pct = left / listing.total_count;
  const cls = pct <= 0.15 ? 'low' : 'ok';
  const text = left <= 0 ? 'All claimed' : `${left} left of ${listing.total_count}`;
  return { cls, text };
}

// Single-listing equivalent of statusFromWindows() in index.html/map.html -
// those group a brand's multiple time windows into one status, but pSEO
// listing rows are ungrouped, so this only ever looks at one start/end pair.
export function computeListingStatus(startTime: string, endTime: string | null): 'live' | 'soon' | 'ended' {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime || assumedEndIso(startTime)).getTime();
  if (now < start) return 'soon';
  if (now > end) return 'ended';
  return 'live';
}
