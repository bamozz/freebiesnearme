import type { MetadataRoute } from 'next';
import { createServerClient } from '@/lib/supabase';
import type { PseoCategoryStats, PseoNeighbourhoodStats } from '@/types/pseo_types';

const BASE_URL = 'https://www.freebiesnearme.app';

// Regenerated at most hourly rather than per-request - sitemaps don't need
// per-request freshness, and this avoids hitting Supabase on every crawl.
export const revalidate = 3600;

// Core static pages use their real live paths (/toronto, /toronto/map,
// /toronto/submit) - bare /map and /submit 404 on this site, and / only
// 302-redirects to /toronto, so listing it directly is the correct
// canonical entry for a sitemap rather than the redirecting root.
function staticRoutes(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/toronto`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/toronto/map`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/toronto/calendar`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/toronto/submit`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/toronto/advertise`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/toronto/about`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/toronto/changelog`, changeFrequency: 'weekly', priority: 0.3 },
    { url: `${BASE_URL}/toronto/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/toronto/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = staticRoutes();

  try {
    const supabase = createServerClient();

    const [{ data: categoryStats, error: categoryError }, { data: neighbourhoodStats, error: neighbourhoodError }] =
      await Promise.all([
        supabase.from('pseo_category_stats').select('city_slug, category_slug, active_listing_count, latest_addition_at').returns<PseoCategoryStats[]>(),
        supabase.from('pseo_neighbourhood_stats').select('city_slug, neighbourhood_slug, active_listing_count, latest_addition_at').returns<PseoNeighbourhoodStats[]>(),
      ]);

    if (categoryError) console.error('sitemap: pseo_category_stats fetch failed', categoryError);
    if (neighbourhoodError) console.error('sitemap: pseo_neighbourhood_stats fetch failed', neighbourhoodError);

    // A hub with zero currently-active listings renders as a bare empty
    // state (see app/[city]/[hub]/page.tsx) - nothing there for a crawler
    // to index, so it's left out of the sitemap rather than hardcoding
    // which slugs to skip.
    for (const row of categoryStats ?? []) {
      if (!row.active_listing_count) continue;
      routes.push({
        url: `${BASE_URL}/${row.city_slug}/${row.category_slug}`,
        lastModified: row.latest_addition_at ? new Date(row.latest_addition_at) : undefined,
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }

    for (const row of neighbourhoodStats ?? []) {
      if (!row.active_listing_count) continue;
      routes.push({
        url: `${BASE_URL}/${row.city_slug}/${row.neighbourhood_slug}`,
        lastModified: row.latest_addition_at ? new Date(row.latest_addition_at) : undefined,
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }
  } catch (err) {
    // Database unreachable, env vars missing, etc. - never let sitemap
    // generation fail the build or the route; fall back to static-only.
    console.error('sitemap: falling back to static routes only', err);
  }

  return routes;
}
