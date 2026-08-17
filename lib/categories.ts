import type { ListingCategory } from '@/types/pseo_types';

// Ported from the `categories` array in public/toronto/index.html and
// map.html so category tags/colors on the pSEO hub pages match the static
// site exactly rather than drifting into a second palette over time.
// `slug` matches the `category_slug` column the [hub] route resolves
// against (underscore -> dash, except food -> food-drink per product
// decision), separate from the `category` enum value on individual rows.
export const CATEGORIES: { id: ListingCategory; slug: string; label: string; color: string }[] = [
  { id: 'food', slug: 'food-drink', label: 'Food & Drink', color: '#EF5B4E' },
  { id: 'beauty', slug: 'beauty', label: 'Beauty', color: '#D6579A' },
  { id: 'fashion', slug: 'fashion', label: 'Fashion', color: '#3E6FA8' },
  { id: 'tech', slug: 'tech', label: 'Tech', color: '#0E9C82' },
  { id: 'wellness', slug: 'wellness', label: 'Wellness', color: '#8467C9' },
  { id: 'class_workshop', slug: 'class-workshop', label: 'Class & Workshop', color: '#2E8B57' },
  { id: 'concert_screening', slug: 'concert-screening', label: 'Concert & Screening', color: '#C2703E' },
  { id: 'tour', slug: 'tour', label: 'Tour', color: '#C99A2E' },
  { id: 'festival', slug: 'festival', label: 'Festival', color: '#B23A9E' },
  { id: 'misc', slug: 'misc', label: 'Misc.', color: '#8B6F47' },
];

export const CATEGORY_COLOR = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.color])
) as Record<ListingCategory, string>;

export const CATEGORY_LABEL = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label])
) as Record<ListingCategory, string>;

export const CATEGORY_SLUG_LABEL = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.label])
) as Record<string, string>;
