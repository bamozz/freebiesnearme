import type { Listing } from '@/types/pseo_types';
import { assumedEndIso, hasClockTime, torontoDateKey } from '@/lib/datetime';

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

function directionsUrlFor(address: string | null, neighbourhood: string, lat: number, lng: number): string {
  const query = address
    ? encodeURIComponent(`${address}, ${neighbourhood}, Toronto, ON`)
    : `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function directionsUrl(listing: Listing): string {
  return directionsUrlFor(listing.address, listing.neighbourhood, listing.lat, listing.lng);
}

// Same as directionsUrl(), but for one stop of a multi-location grouped
// listing (see lib/group-listings.ts) rather than a whole Listing row.
export function directionsUrlForStop(stop: { address: string | null; neighbourhood: string; lat: number; lng: number }): string {
  return directionsUrlFor(stop.address, stop.neighbourhood, stop.lat, stop.lng);
}

export function availInfo(listing: Listing): { cls: 'low' | 'ok'; text: string } | null {
  if (!listing.total_count) return null;
  const left = listing.total_count - listing.claimed_count;
  const pct = left / listing.total_count;
  const cls = pct <= 0.15 ? 'low' : 'ok';
  const text = left <= 0 ? 'All claimed' : `${left} left of ${listing.total_count}`;
  return { cls, text };
}

// A row's own last calendar date, Toronto-local - the half-open-midnight
// convention (a date-only end landing exactly at midnight represents the
// end of the previous day) is honoured the same way formatTimeRange() does.
function rowEndKey(startTime: string, endTime: string | null): string {
  const startKey = torontoDateKey(new Date(startTime));
  if (!endTime) return startKey;
  const end = new Date(endTime);
  const endKey = hasClockTime(end) ? torontoDateKey(end) : torontoDateKey(new Date(end.getTime() - 60000));
  return endKey < startKey ? startKey : endKey;
}

// Single-listing equivalent of statusFromWindows() in index.html/map.html -
// those group a brand's multiple time windows into one status, but pSEO
// listing rows are ungrouped, so this only ever looks at one start/end pair.
// "Live" means today's date falls somewhere in the listing's own date
// range, not that the current time is precisely between its start and end
// clock times - a class starting at 6pm today reads as live all day today.
export function computeListingStatus(startTime: string, endTime: string | null): 'live' | 'soon' | 'ended' {
  const todayKey = torontoDateKey(new Date());
  const startKey = torontoDateKey(new Date(startTime));
  if (todayKey >= startKey && todayKey <= rowEndKey(startTime, endTime)) return 'live';
  if (todayKey < startKey) return 'soon';
  return 'ended';
}

// Ported from statusBadge() in index.html: unlike live/ended, the "soon"
// label isn't a single fixed string - it narrows to how far out the start
// time is, so cards read the same way here as they do on the homepage.
// Never same-day here - computeListingStatus() already resolves any
// same-day listing to 'live', so 'soon' only ever means a future date.
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
  const stamp = toIcsUtc(new Date().toISOString());
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Freebies Near Me//EN',
    'CALSCALE:GREGORIAN',
    buildVevent(listing, stamp),
    'END:VCALENDAR',
  ].join('\r\n');
  return `data:text/calendar;charset=utf8,${encodeURIComponent(ics)}`;
}

// Google Calendar's own "quick add" URL - opens Google Calendar directly
// prefilled with the event, no file download involved at all (unlike the
// .ics link above). Used in place of buildCalendarUrl() specifically for
// Android, where Google Calendar is the default calendar app on nearly
// every device; there's no equivalent URL for Apple Calendar that works
// from an arbitrary website, so iOS/macOS/everything else keeps using the
// .ics link, which Safari already hands directly to Calendar.app anyway.
export function buildGoogleCalendarUrl(listing: Listing): string {
  const start = toIcsUtc(listing.start_time);
  const end = toIcsUtc(listing.end_time || assumedEndIso(listing.start_time));
  const what = stripFreeWord(listing.what);
  const location = listing.address
    ? `${listing.address}, ${listing.neighbourhood}, Toronto, ON`
    : `${listing.neighbourhood}, Toronto, ON`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${listing.brand} - ${what}`,
    dates: `${start}/${end}`,
    details: `${what} - free, hosted by ${listing.brand}, in ${listing.neighbourhood}.`,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function toIcsDate(d: Date): string {
  return torontoDateKey(d).replace(/-/g, '');
}

function addDaysToIcsDate(dateStr: string, days: number): string {
  const y = Number(dateStr.slice(0, 4));
  const m = Number(dateStr.slice(4, 6)) - 1;
  const d = Number(dateStr.slice(6, 8));
  return new Date(Date.UTC(y, m, d + days)).toISOString().slice(0, 10).replace(/-/g, '');
}

// One VEVENT block per listing, shared by both buildCalendarUrl() (single
// listing, data: URI) and buildFeedIcs() (the whole site, as a real file) -
// factored out so the two can't drift apart on field handling.
function buildVevent(listing: Listing, stamp: string): string {
  const what = stripFreeWord(listing.what);
  const summary = icsEscape(`${listing.brand} - ${what}`);
  const description = icsEscape(`${what} - free, hosted by ${listing.brand}, in ${listing.neighbourhood}.`);
  const location = icsEscape(
    listing.address ? `${listing.address}, ${listing.neighbourhood}, Toronto, ON` : `${listing.neighbourhood}, Toronto, ON`
  );

  // A listing with no known clock time (the site's date-only convention -
  // start_time at Toronto midnight) renders as a real all-day event here
  // rather than a misleading midnight-timed one.
  const startDate = new Date(listing.start_time);
  const lines: string[] = [];
  if (!hasClockTime(startDate)) {
    const startIcsDate = toIcsDate(startDate);
    const endIcsDate = listing.end_time ? toIcsDate(new Date(listing.end_time)) : addDaysToIcsDate(startIcsDate, 1);
    lines.push(`DTSTART;VALUE=DATE:${startIcsDate}`, `DTEND;VALUE=DATE:${endIcsDate}`);
  } else {
    lines.push(
      `DTSTART:${toIcsUtc(listing.start_time)}`,
      `DTEND:${toIcsUtc(listing.end_time || assumedEndIso(listing.start_time))}`
    );
  }

  return [
    'BEGIN:VEVENT',
    `UID:${listing.id}@freebiesnearme.app`,
    `DTSTAMP:${stamp}`,
    ...lines,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `URL:${directionsUrl(listing)}`,
    'END:VEVENT',
  ].join('\r\n');
}

// The full-site subscribable feed (app/toronto/calendar.ics/route.ts) -
// every currently active, not-yet-ended listing as one VEVENT each, so a
// calendar app can sync the whole site rather than one listing at a time.
export function buildFeedIcs(listings: Listing[]): string {
  const stamp = toIcsUtc(new Date().toISOString());
  const vevents = listings.map((listing) => buildVevent(listing, stamp));
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Freebies Near Me//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Freebies Near Me - Toronto',
    'X-WR-CALDESC:Free giveaways, samples, and pop up events happening in Toronto.',
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function icsFilename(listing: Listing): string {
  return `${listing.brand}-${listing.what}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + '.ics';
}
