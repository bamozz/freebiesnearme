import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase';
import type { Listing, PseoCategoryStats, PseoNeighbourhoodStats } from '@/types/pseo_types';

// Starter dynamic route for both category hubs (/toronto/free-coffee) and
// neighbourhood hubs (/toronto/kensington-market) under one [hub] segment.
// It resolves [hub] against pseo_category_stats first, then
// pseo_neighbourhood_stats, and 404s if it matches neither.

type Props = { params: Promise<{ city: string; hub: string }> };

async function getHub(city: string, hub: string) {
  const supabase = createServerClient();

  const { data: categoryStats, error: categoryError } = await supabase
    .from('pseo_category_stats')
    .select('*')
    .eq('city_slug', city)
    .eq('category_slug', hub)
    .maybeSingle<PseoCategoryStats>();

  if (categoryError) {
    console.error('pseo_category_stats query failed', { city, hub, categoryError });
  }

  if (categoryStats) {
    return { type: 'category' as const, stats: categoryStats };
  }

  const { data: neighbourhoodStats, error: neighbourhoodError } = await supabase
    .from('pseo_neighbourhood_stats')
    .select('*')
    .eq('city_slug', city)
    .eq('neighbourhood_slug', hub)
    .maybeSingle<PseoNeighbourhoodStats>();

  if (neighbourhoodError) {
    console.error('pseo_neighbourhood_stats query failed', { city, hub, neighbourhoodError });
  }

  if (neighbourhoodStats) {
    return { type: 'neighbourhood' as const, stats: neighbourhoodStats };
  }

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, hub } = await params;
  const resolved = await getHub(city, hub);
  if (!resolved) return {};

  const label = hub.replace(/-/g, ' ');
  const title =
    resolved.type === 'category'
      ? `Free ${label} in ${city} | Freebies Near Me`
      : `Free things to do in ${label}, ${city} | Freebies Near Me`;

  return {
    title,
    description: `${resolved.stats.active_listing_count} free listings live right now.`,
  };
}

export default async function HubPage({ params }: Props) {
  const { city, hub } = await params;
  const resolved = await getHub(city, hub);
  if (!resolved) notFound();

  const supabase = createServerClient();
  const filterColumn = resolved.type === 'category' ? 'category_slug' : 'neighbourhood_slug';
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('city_slug', city)
    .eq(filterColumn, hub)
    .eq('is_active', true)
    .order('start_time', { ascending: true })
    .returns<Listing[]>();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold">
        {resolved.stats.active_listing_count} free listings in {hub.replace(/-/g, ' ')}
      </h1>
      <ul className="mt-6 flex flex-col gap-4">
        {(listings ?? []).map((listing) => (
          <li key={listing.id} className="border rounded-lg p-4">
            <div className="font-semibold">{listing.brand}</div>
            <div className="text-sm text-gray-600">{listing.what}</div>
            <div className="text-sm text-gray-500">{listing.neighbourhood}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
