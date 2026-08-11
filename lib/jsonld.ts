import type { Listing } from '@/types/pseo_types';

const TORONTO_TZ = 'America/Toronto';

function getTimezoneOffsetMs(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value;
      return acc;
    }, {});

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asUtc - date.getTime();
}

// Mirrors assumedEnd() in index.html/map.html: when a listing has no known
// end time (hunter submissions can omit it), assume ~9pm local time on the
// same calendar day as the start - same convention used everywhere else on
// the site, so this doesn't introduce a second, inconsistent fallback rule.
function assumedEndIso(startIso: string): string {
  const start = new Date(startIso);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TORONTO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(start)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value;
      return acc;
    }, {});

  const guessUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), 21, 0);
  const offset = getTimezoneOffsetMs(TORONTO_TZ, new Date(guessUtc));
  return new Date(guessUtc - offset).toISOString();
}

export function buildHubItemList(listings: Listing[], hubLabel: string) {
  const itemListElement = listings.map((listing, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'Event',
      name: `${listing.brand} - ${listing.what}`,
      description: `${listing.what} - free, hosted by ${listing.brand}, in ${listing.neighbourhood}.`,
      location: {
        '@type': 'Place',
        name: listing.neighbourhood,
        address: listing.address ?? undefined,
      },
      startDate: listing.start_time,
      endDate: listing.end_time ?? assumedEndIso(listing.start_time),
      offers: {
        '@type': 'Offer',
        price: '0.00',
        priceCurrency: 'CAD',
      },
    },
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Free listings in ${hubLabel}`,
    itemListElement,
  };

  // Guards against a listing's brand/what text containing a literal
  // "</script>" substring, which would otherwise prematurely close this
  // script tag when injected via dangerouslySetInnerHTML.
  return JSON.stringify(jsonLd).replace(/</g, '\\u003c');
}
