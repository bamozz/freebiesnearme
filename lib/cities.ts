import { NEIGHBOURHOODS as TORONTO_NEIGHBOURHOODS } from '@/lib/neighbourhoods';

// One entry per city the site runs in. The city slug is the first URL
// segment (/toronto, /new-york) and the value stored in listings.city_slug.
//
// Adding a city also means: a public/<slug>/ set of static pages, vercel.json
// rewrites for them, and an entry in ALLOWED_CITY_SLUGS in
// api/submit-listing.js. Timezone handling in lib/datetime.ts is Eastern time, which
// both current cities share - a city in another timezone needs that made
// per-city first.
export type Neighbourhood = { label: string; slug: string };

export type CityConfig = {
  slug: string;
  name: string;
  // Province/state abbreviation used in postal-style addresses ("Toronto, ON").
  region: string;
  neighbourhoods: Neighbourhood[];
  // Curated subset linked from every page footer, kept short on purpose.
  popularSlugs: string[];
};

// Curated New York place list. Same role as lib/neighbourhoods.ts for
// Toronto: lets a neighbourhood hub resolve (with an empty state) before any
// listing exists there, while still 404ing an arbitrary or mistyped slug.
// Slugs follow the same rule the listings trigger uses
// (lowercase, non-alphanumerics collapsed to "-").
const NEW_YORK_NEIGHBOURHOODS: Neighbourhood[] = [
  { label: 'Battery Park City', slug: 'battery-park-city' },
  { label: 'Brooklyn Bridge Park', slug: 'brooklyn-bridge-park' },
  { label: 'Bryant Park', slug: 'bryant-park' },
  { label: 'Central Park', slug: 'central-park' },
  { label: 'Chelsea', slug: 'chelsea' },
  { label: 'Chelsea Market', slug: 'chelsea-market' },
  { label: 'Chinatown', slug: 'chinatown' },
  { label: 'Columbus Circle', slug: 'columbus-circle' },
  { label: 'Downtown Brooklyn', slug: 'downtown-brooklyn' },
  { label: 'DUMBO', slug: 'dumbo' },
  { label: 'East Village', slug: 'east-village' },
  { label: 'Financial District', slug: 'financial-district' },
  { label: 'Flatiron', slug: 'flatiron' },
  { label: 'Grand Central', slug: 'grand-central' },
  { label: 'Gramercy', slug: 'gramercy' },
  { label: 'Greenpoint', slug: 'greenpoint' },
  { label: 'Greenwich Village', slug: 'greenwich-village' },
  { label: 'Harlem', slug: 'harlem' },
  { label: 'Hell’s Kitchen', slug: 'hell-s-kitchen' },
  { label: 'Herald Square', slug: 'herald-square' },
  { label: 'The High Line', slug: 'the-high-line' },
  { label: 'Hudson Yards', slug: 'hudson-yards' },
  { label: 'Koreatown', slug: 'koreatown' },
  { label: 'Little Italy', slug: 'little-italy' },
  { label: 'Long Island City', slug: 'long-island-city' },
  { label: 'Lower East Side', slug: 'lower-east-side' },
  { label: 'Madison Square Park', slug: 'madison-square-park' },
  { label: 'Meatpacking District', slug: 'meatpacking-district' },
  { label: 'Midtown', slug: 'midtown' },
  { label: 'Murray Hill', slug: 'murray-hill' },
  { label: 'NoHo', slug: 'noho' },
  { label: 'Nolita', slug: 'nolita' },
  { label: 'Park Slope', slug: 'park-slope' },
  { label: 'Rockefeller Center', slug: 'rockefeller-center' },
  { label: 'SoHo', slug: 'soho' },
  { label: 'Times Square', slug: 'times-square' },
  { label: 'Tribeca', slug: 'tribeca' },
  { label: 'Union Square', slug: 'union-square' },
  { label: 'Upper East Side', slug: 'upper-east-side' },
  { label: 'Upper West Side', slug: 'upper-west-side' },
  { label: 'Washington Square Park', slug: 'washington-square-park' },
  { label: 'West Village', slug: 'west-village' },
  { label: 'Williamsburg', slug: 'williamsburg' },
];

export const CITIES: Record<string, CityConfig> = {
  toronto: {
    slug: 'toronto',
    name: 'Toronto',
    region: 'ON',
    neighbourhoods: TORONTO_NEIGHBOURHOODS,
    popularSlugs: [
      'the-well',
      'yorkville',
      'liberty-village',
      'distillery-district',
      'kensington-market',
      'harbourfront',
      'king-west',
      'the-junction',
    ],
  },
  'new-york': {
    slug: 'new-york',
    name: 'New York',
    region: 'NY',
    neighbourhoods: NEW_YORK_NEIGHBOURHOODS,
    popularSlugs: [
      'times-square',
      'soho',
      'chelsea-market',
      'hudson-yards',
      'east-village',
      'williamsburg',
      'dumbo',
      'bryant-park',
    ],
  },
};

export const DEFAULT_CITY_SLUG = 'toronto';

export function getCity(slug: string | null | undefined): CityConfig | undefined {
  return slug ? CITIES[slug] : undefined;
}

// First path segment decides the city for city-scoped chrome (header, tab
// bar); anything that isn't a known city falls back to the default.
export function cityFromPathname(pathname: string | null | undefined): CityConfig {
  const first = (pathname || '').split('/').filter(Boolean)[0];
  return getCity(first) ?? CITIES[DEFAULT_CITY_SLUG];
}

export function cityForListing(listing: { city_slug?: string | null }): CityConfig {
  return getCity(listing.city_slug) ?? CITIES[DEFAULT_CITY_SLUG];
}

export function neighbourhoodLabels(city: CityConfig): Record<string, string> {
  return Object.fromEntries(city.neighbourhoods.map((n) => [n.slug, n.label]));
}

export function popularNeighbourhoods(city: CityConfig): Neighbourhood[] {
  return city.neighbourhoods.filter((n) => city.popularSlugs.includes(n.slug));
}
