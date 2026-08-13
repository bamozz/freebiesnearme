// Curated Toronto neighbourhood/venue list. Mirrors LOCATIONS in
// public/toronto/index.html (the homepage filter chips' source of truth),
// plus a few places crawled into listings this session that aren't in
// that list yet (Liberty Village, Trinity Bellwoods, Little Italy, The
// Beaches, West Queen West, Exhibition Place).
//
// Used so a pSEO neighbourhood hub for one of these places resolves (with
// an empty state) even before any listing exists there yet, instead of
// 404ing. Unlike categories, neighbourhood text is free-form - there's no
// enum to check against - so this allowlist is the only way to tell "a
// real place with no data yet" from an arbitrary or mistyped slug.
export const NEIGHBOURHOODS: { label: string; slug: string }[] = [
  { label: 'The Annex', slug: 'the-annex' },
  { label: 'Bell Manor Park', slug: 'bell-manor-park' },
  { label: 'Biidaasige Park', slug: 'biidaasige-park' },
  { label: 'Cherry Beach', slug: 'cherry-beach' },
  { label: 'Chinatown', slug: 'chinatown' },
  { label: 'Christie Pits', slug: 'christie-pits' },
  { label: 'Church-Wellesley Village', slug: 'church-wellesley-village' },
  { label: 'Corktown', slug: 'corktown' },
  { label: 'Danforth', slug: 'danforth' },
  { label: 'Distillery District', slug: 'distillery-district' },
  { label: 'CF Eaton Centre', slug: 'cf-eaton-centre' },
  { label: 'Entertainment District', slug: 'entertainment-district' },
  { label: 'Evergreen Brick Works', slug: 'evergreen-brick-works' },
  { label: 'Financial District', slug: 'financial-district' },
  { label: 'Harbord Village', slug: 'harbord-village' },
  { label: 'Harbourfront', slug: 'harbourfront' },
  { label: 'The Junction', slug: 'the-junction' },
  { label: 'Kensington Market', slug: 'kensington-market' },
  { label: 'King West', slug: 'king-west' },
  { label: 'Nathan Phillips Square', slug: 'nathan-phillips-square' },
  { label: 'Old Science Centre', slug: 'old-science-centre' },
  { label: 'Old Town', slug: 'old-town' },
  { label: 'Queen West', slug: 'queen-west' },
  { label: 'Regent Park', slug: 'regent-park' },
  { label: 'Sankofa Square', slug: 'sankofa-square' },
  { label: 'Sorauren Park', slug: 'sorauren-park' },
  { label: 'Stackt Market', slug: 'stackt-market' },
  { label: 'St. Lawrence Market', slug: 'st-lawrence-market' },
  { label: 'Trillium Park', slug: 'trillium-park' },
  { label: 'Union Station', slug: 'union-station' },
  { label: 'The Well', slug: 'the-well' },
  { label: 'Yonge and Eglinton', slug: 'yonge-and-eglinton' },
  { label: 'Yorkville', slug: 'yorkville' },
  { label: 'Liberty Village', slug: 'liberty-village' },
  { label: 'Trinity Bellwoods', slug: 'trinity-bellwoods' },
  { label: 'Little Italy', slug: 'little-italy' },
  { label: 'The Beaches', slug: 'the-beaches' },
  { label: 'West Queen West', slug: 'west-queen-west' },
  { label: 'Exhibition Place', slug: 'exhibition-place' },
];

export const NEIGHBOURHOOD_SLUG_LABEL: Record<string, string> = Object.fromEntries(
  NEIGHBOURHOODS.map((n) => [n.slug, n.label])
);
