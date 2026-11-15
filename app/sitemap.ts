import type { MetadataRoute } from 'next';
import { createServerClient } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/categories';
import { CITIES } from '@/lib/cities';
import { liveHubListings } from '@/lib/hub-live';
import type { Listing } from '@/types/pseo_types';

const BASE_URL = 'https://www.freebiesnearme.app';

// Built on every request, never from Next's route or data cache. The listings
// read below used to sit in the data cache with the route's one hour
// revalidate, and production kept serving the hub list from the last deploy
// (Oct 30) instead of today's data. The sitemap is fetched a few times a day,
// so one small query per request is cheap.
export const dynamic = 'force-dynamic';

// Core static pages use their real live paths (/toronto, /toronto/map,
// /toronto/submit). The front page at / is the city picker and a real page in
// its own right, so it is listed alongside each city's home. None of these
// carry a lastModified: their content changes all the time but nothing records
// when, and the time of generation is not a real change date. Only the hubs
// below get one, from a real timestamp.
function staticRoutes(): MetadataRoute.Sitemap {
  const root = { url: `${BASE_URL}/`, changeFrequency: 'daily' as const, priority: 1.0 };
  const cities = Object.keys(CITIES).flatMap((slug) => [
    { url: `${BASE_URL}/${slug}`, changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${BASE_URL}/${slug}/map`, changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${BASE_URL}/${slug}/calendar`, changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${BASE_URL}/${slug}/submit`, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE_URL}/${slug}/advertise`, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${BASE_URL}/${slug}/changelog`, changeFrequency: 'weekly' as const, priority: 0.3 },
  ]);
  // Sitewide pages have one address for every city.
  const sitewide = [
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE_URL}/feedback`, changeFrequency: 'yearly' as const, priority: 0.2 },
    { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly' as const, priority: 0.2 },
    { url: `${BASE_URL}/terms`, changeFrequency: 'yearly' as const, priority: 0.2 },
  ];
  return [root, ...cities, ...sitewide];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = staticRoutes();

  try {
    const supabase = createServerClient();

    // The rows the hub pages themselves read: approved and active, every city.
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('is_active', true)
      .eq('moderation_status', 'approved')
      .returns<Listing[]>();
    if (error) throw error;

    // One bucket per hub (category or neighbourhood), keyed by its URL path.
    const hubs = new Map<string, Listing[]>();
    const addToHub = (city: string, slug: string | null, row: Listing) => {
      if (!slug) return;
      const key = `${city}/${slug}`;
      const rows = hubs.get(key);
      if (rows) rows.push(row);
      else hubs.set(key, [row]);
    };
    for (const row of data ?? []) {
      if (!CITIES[row.city_slug]) continue;
      addToHub(row.city_slug, row.category_slug, row);
      if (row.neighbourhood_slug !== row.category_slug) addToHub(row.city_slug, row.neighbourhood_slug, row);
    }

    // Category hubs (food-drink, wellness and so on) are evergreen search
    // targets, so every category of every city is always listed and stays
    // indexable, even with nothing live. A neighbourhood or venue hub goes in
    // only when its page would list at least one listing that has not wrapped
    // up, using the same rule the page uses (lib/hub-live.ts); with nothing
    // live it renders the empty state, is noindex and stays out.
    // lastModified is the time the newest listing was added to that hub
    // (listings.created_at), a real timestamp; there is no listing update time
    // in the database. A category with no rows at all gets none.
    const newestCreated = (rows: Listing[]) =>
      rows.reduce((max, row) => (row.created_at > max ? row.created_at : max), rows[0].created_at);
    const hubRoutes: MetadataRoute.Sitemap = [];
    const categoryPaths = new Set<string>();
    for (const city of Object.keys(CITIES)) {
      for (const category of CATEGORIES) {
        const path = `${city}/${category.slug}`;
        categoryPaths.add(path);
        const rows = hubs.get(path) ?? [];
        hubRoutes.push({
          url: `${BASE_URL}/${path}`,
          lastModified: rows.length ? new Date(newestCreated(rows)) : undefined,
          changeFrequency: 'daily',
          priority: 0.8,
        });
      }
    }
    for (const [path, rows] of hubs.entries()) {
      if (categoryPaths.has(path)) continue;
      if (liveHubListings(rows).length === 0) continue;
      hubRoutes.push({
        url: `${BASE_URL}/${path}`,
        lastModified: new Date(newestCreated(rows)),
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }
    hubRoutes.sort((a, b) => a.url.localeCompare(b.url));
    routes.push(...hubRoutes);
  } catch (err) {
    // Database unreachable, env vars missing, etc. - never let sitemap
    // generation fail the build or the route; fall back to static-only.
    console.error('sitemap: falling back to static routes only', err);
  }

  return routes;
}
