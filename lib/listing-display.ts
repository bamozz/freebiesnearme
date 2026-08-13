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

// Ported from statusBadge() in index.html: unlike live/ended, the "soon"
// label isn't a single fixed string - it narrows to how far out the start
// time is, so cards read the same way here as they do on the homepage.
export function statusLabel(status: 'live' | 'soon' | 'ended', startTime: string): string {
  if (status === 'live') return 'Live now';
  if (status === 'soon') {
    const daysUntil = (new Date(startTime).getTime() - Date.now()) / 86400000;
    return daysUntil <= 3 ? 'Next 3 days' : daysUntil <= 7 ? 'Next week' : daysUntil <= 30 ? 'Next 30 days' : 'Next month+';
  }
  return 'Wrapped up';
}

function icsEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function toIcsUtc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Ported from buildCalendarUrl() in index.html - builds a data: URI .ics
// file for a listing so "Add to calendar" works as a plain downloadable
// link with no server round trip or client JS needed, since this can be
// computed once server-side. Every major calendar app (Apple, Google,
// Outlook, Android) opens or imports .ics files directly.
export function buildCalendarUrl(listing: Listing): string {
  const start = toIcsUtc(listing.start_time);
  const end = toIcsUtc(listing.end_time || assumedEndIso(listing.start_time));
  const stamp = toIcsUtc(new Date().toISOString());
  const what = stripFreeWord(listing.what);
  const summary = icsEscape(`${listing.brand} - ${what}`);
  const description = icsEscape(`${what} - free, hosted by ${listing.brand}, in ${listing.neighbourhood}.`);
  const location = icsEscape(
    listing.address ? `${listing.address}, ${listing.neighbourhood}, Toronto, ON` : `${listing.neighbourhood}, Toronto, ON`
  );
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Freebies Near Me//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${listing.id}@freebiesnearme.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `URL:${directionsUrl(listing)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  return `data:text/calendar;charset=utf8,${encodeURIComponent(ics)}`;
}

export function icsFilename(listing: Listing): string {
  return `${listing.brand}-${listing.what}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + '.ics';
}
