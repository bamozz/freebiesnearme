import type { Listing } from '@/types/pseo_types';
import { assumedEndIso } from '@/lib/datetime';

// Site-wide fallback so every Event still has an "image" field even when a
// listing has none - Google Search Console flags a fully-missing image
// field, and this is the same asset already used for og:image sitewide.
const DEFAULT_EVENT_IMAGE = 'https://freebiesnearme.app/toronto/assets/og-image.png';

export function buildHubItemList(listings: Listing[], hubLabel: string, hubUrl: string) {
  const itemListElement = listings.map((listing, index) => {
    const left = listing.total_count != null ? listing.total_count - listing.claimed_count : null;
    const availability = left !== null && left <= 0
      ? 'https://schema.org/SoldOut'
      : 'https://schema.org/InStock';

    return {
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Event',
        name: `${listing.brand} - ${listing.what}`,
        description: `${listing.what} - free, hosted by ${listing.brand}, in ${listing.neighbourhood}.`,
        image: listing.image_url || DEFAULT_EVENT_IMAGE,
        location: {
          '@type': 'Place',
          name: listing.neighbourhood,
          address: listing.address ?? undefined,
        },
        performer: {
          '@type': 'Organization',
          name: listing.brand,
        },
        startDate: listing.start_time,
        endDate: listing.end_time ?? assumedEndIso(listing.start_time),
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'CAD',
          availability,
          url: listing.signup_url || hubUrl,
          validFrom: listing.start_time,
        },
      },
    };
  });

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
