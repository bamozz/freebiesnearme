import type { Listing } from '@/types/pseo_types';
import { assumedEndIso } from '@/lib/datetime';

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
