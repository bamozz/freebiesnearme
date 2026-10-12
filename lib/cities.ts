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
  // City accent colour (CSS variables --city-primary / -dark / -text). The
  // static pages in public/<slug>/ set the same three values in their own
  // :root block; Next-rendered pages get them from app/[city]/layout.tsx.
  primary: string;
  primaryDark: string;
  // Darker shade for small text on white, where the main colour is too light.
  primaryText: string;
};

// Curated New York place list. New York covers downtown Manhattan only: the
// conventional definition of Downtown, south of 14th Street (Lower Manhattan,
// the Villages, SoHo, Tribeca and the Financial District). Same role as
// lib/neighbourhoods.ts for Toronto: lets a neighbourhood hub resolve (with an
// empty state) before any listing exists there, while still 404ing an
// arbitrary or mistyped slug. Slugs follow the rule the listings trigger uses
// (lowercase, non-alphanumerics collapsed to "-").
const NEW_YORK_NEIGHBOURHOODS: Neighbourhood[] = [
  { label: 'Battery Park City', slug: 'battery-park-city' },
  { label: 'Chinatown', slug: 'chinatown' },
  { label: 'Civic Center', slug: 'civic-center' },
  { label: 'East Village', slug: 'east-village' },
  { label: 'Financial District', slug: 'financial-district' },
  { label: 'Greenwich Village', slug: 'greenwich-village' },
  { label: 'Hudson Square', slug: 'hudson-square' },
  { label: 'Little Italy', slug: 'little-italy' },
  { label: 'Lower East Side', slug: 'lower-east-side' },
  { label: 'Meatpacking District', slug: 'meatpacking-district' },
  { label: 'NoHo', slug: 'noho' },
  { label: 'Nolita', slug: 'nolita' },
  { label: 'SoHo', slug: 'soho' },
  { label: 'South Street Seaport', slug: 'south-street-seaport' },
  { label: 'Tribeca', slug: 'tribeca' },
  { label: 'Union Square', slug: 'union-square' },
  { label: 'Washington Square Park', slug: 'washington-square-park' },
  { label: 'West Village', slug: 'west-village' },
];

export const CITIES: Record<string, CityConfig> = {
  toronto: {
    slug: 'toronto',
    name: 'Toronto',
    region: 'ON',
    primary: '#274490',
    primaryDark: '#1C3270',
    primaryText: '#274490',
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
    // NYC flag orange.
    primary: '#FF6600',
    primaryDark: '#CC5200',
    primaryText: '#C24E00',
    neighbourhoods: NEW_YORK_NEIGHBOURHOODS,
    popularSlugs: [
      'soho',
      'east-village',
      'west-village',
      'greenwich-village',
      'lower-east-side',
      'tribeca',
      'financial-district',
      'washington-square-park',
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
