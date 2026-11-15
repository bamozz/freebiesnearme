import type { Listing } from '@/types/pseo_types';
import { assumedEndIso } from '@/lib/datetime';

// "image" is output only for a listing whose picture is cleared for display
// (lib/image-hosts.ts; the caller passes rows already run through
// withClearedImages). Every other Event omits the field. The sitewide
// og-image fallback that used to fill it was removed with the image rights
// change: it also went on listings that never had a picture.
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
        image: listing.image_url || undefined,
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
    name: `Free Giveaways and Pop-ups in ${hubLabel}`,
    numberOfItems: itemListElement.length,
    itemListElement,
  };

  // Guards against a listing's brand/what text containing a literal
  // "</script>" substring, which would otherwise prematurely close this
  // script tag when injected via dangerouslySetInnerHTML.
  return JSON.stringify(jsonLd).replace(/</g, '\\u003c');
}
