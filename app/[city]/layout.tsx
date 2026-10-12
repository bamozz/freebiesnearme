import { getCity } from '@/lib/cities';

// Sets the city's accent colour for every page under /<city>/..., including
// the shared header and tab bar (CSS variables on :root apply page-wide, and
// this is rendered on the server so there is no flash of another city's
// colour). globals.css holds the Toronto defaults.
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
