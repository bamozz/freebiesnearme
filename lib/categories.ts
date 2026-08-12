import type { ListingCategory } from '@/types/pseo_types';

// Ported from the `categories` array in public/toronto/index.html and
// map.html so category tags/colors on the pSEO hub pages match the static
// site exactly rather than drifting into a second palette over time.
export const CATEGORIES: { id: ListingCategory; label: string; color: string }[] = [
  { id: 'food', label: 'Food & Drink', color: '#EF5B4E' },
  { id: 'beauty', label: 'Beauty', color: '#D6579A' },
  { id: 'fashion', label: 'Fashion', color: '#3E6FA8' },
  { id: 'tech', label: 'Tech', color: '#0E9C82' },
  { id: 'wellness', label: 'Wellness', color: '#8467C9' },
  { id: 'class_workshop', label: 'Class & Workshop', color: '#2E8B57' },
  { id: 'concert_screening', label: 'Concert & Screening', color: '#C2703E' },
  { id: 'tour', label: 'Tour', color: '#C99A2E' },
  { id: 'misc', label: 'Misc.', color: '#8B6F47' },
];

export const CATEGORY_COLOR = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.color])
) as Record<ListingCategory, string>;

export const CATEGORY_LABEL = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label])
) as Record<ListingCategory, string>;
