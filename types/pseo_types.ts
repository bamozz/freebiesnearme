// TypeScript definitions for the `listings` table and pSEO views.
//
// The `Listing` fields below reflect the columns actually observed on the
// live table via the Supabase REST API this session (id, brand, category,
// neighbourhood, address, lat, lng, what, start_time, end_time,
// claimed_count, total_count, sponsored, submitted_by, submitter_contact,
// moderation_status, created_at, image_url, insta_url, group_id), plus the
// four columns this migration adds. This is not a schema introspection dump
// - if any column was added or changed outside this session's visibility,
// this type won't reflect it.

export type ListingCategory =
  | 'food'
  | 'beauty'
  | 'fashion'
  | 'tech'
  | 'wellness'
  | 'misc'
  | 'class_workshop'
  | 'concert_screening'
  | 'tour';

export type SubmittedBy = 'brand' | 'hunter';

export type ModerationStatus = 'pending' | 'approved';

export interface Listing {
  id: string;
  brand: string;
  category: ListingCategory;
  neighbourhood: string;
  address: string | null;
  lat: number;
  lng: number;
  what: string;
  start_time: string; // ISO timestamptz
  end_time: string | null; // ISO timestamptz
  claimed_count: number;
  total_count: number | null;
  sponsored: boolean;
  submitted_by: SubmittedBy;
  submitter_contact: string | null;
  moderation_status: ModerationStatus;
  created_at: string; // ISO timestamptz
  image_url: string | null;
  insta_url: string | null;
  group_id: string | null;
  signup_url: string | null;

  // Added by this migration
  city_slug: string;
  category_slug: string;
  neighbourhood_slug: string;
  is_active: boolean;
}

export interface PseoCategoryStats {
  city_slug: string;
  category_slug: string;
  active_listing_count: number;
  /** Keys are neighbourhood_slug, values are active listing count in that neighbourhood */
  neighbourhood_breakdown: Record<string, number>;
  latest_addition_at: string | null; // ISO timestamptz
}

export interface PseoNeighbourhoodStats {
  city_slug: string;
  neighbourhood_slug: string;
  active_listing_count: number;
  /** Keys are category_slug, values are active listing count in that category */
  category_breakdown: Record<string, number>;
  latest_addition_at: string | null; // ISO timestamptz
}
