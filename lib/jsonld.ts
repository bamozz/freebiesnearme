import type { Listing } from '@/types/pseo_types';
import { cityForListing } from '@/lib/cities';

// "image" is output only for a listing whose picture is cleared for display
// (lib/image-hosts.ts; the caller passes rows already run through
// withClearedImages). Every other Event omits the field. The sitewide
// og-image fallback that used to fill it was removed with the image rights
// change: it also went on listings that never had a picture.
//
// Fields left out when the listing does not have the data (JSON.stringify
// drops undefined): endDate (never invented), image, offers.url (no pointing
// at the hub page) and the street address.
// hubUrl stays in the signature for the caller; offers.url no longer uses it.
export function buildHubItemList(listings: Listing[], hubLabel: string, hubUrl: string) {
  void hubUrl;
  const itemListElement = listings.map((listing, index) => {
    const city = cityForListing(listing);
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
        description: listing.description || `${listing.what} - free, hosted by ${listing.brand}, in ${listing.neighbourhood}.`,
        image: listing.image_url || undefined,
        eventStatus: 'https://schema.org/EventScheduled',
        location: {
          '@type': 'Place',
          name: listing.neighbourhood,
          address: {
            '@type': 'PostalAddress',
            streetAddress: listing.address || undefined,
            addressLocality: city.name,
            addressRegion: city.region,
            addressCountry: city.country,
          },
        },
        organizer: {
          '@type': 'Organization',
          name: listing.brand,
        },
        performer: {
          '@type': 'Organization',
          name: listing.brand,
        },
        startDate: listing.start_time,
        endDate: listing.end_time || undefined,
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: city.currency,
          availability,
          url: listing.signup_url || undefined,
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
