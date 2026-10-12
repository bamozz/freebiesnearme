import type { Metadata } from 'next';
import { DEFAULT_CITY_SLUG, getCity } from '@/lib/cities';

// Sets the city's accent colour for every page under /<city>/..., including
// the shared header and tab bar (CSS variables on :root apply page-wide, and
// this is rendered on the server so there is no flash of another city's
// colour). globals.css holds the Toronto defaults.
// Installing the site as an app uses this manifest, so each city gets its own:
// a New York install must open /new-york, not Toronto. Toronto keeps the
// original /manifest.json so existing installs keep working.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const city = getCity((await params).city);
  if (!city) return {};
  return {
    manifest: city.slug === DEFAULT_CITY_SLUG ? '/manifest.json' : `/${city.slug}/manifest.json`,
  };
}

export default async function CityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ city: string }>;
}) {
  const city = getCity((await params).city);
  return (
    <>
      {city && (
        <style
          // Values come from the static CITIES config, not from user input.
          dangerouslySetInnerHTML={{
            __html: `:root{--city-primary:${city.primary};--city-primary-dark:${city.primaryDark};--city-primary-text:${city.primaryText};}`,
          }}
        />
      )}
      {children}
    </>
  );
}
