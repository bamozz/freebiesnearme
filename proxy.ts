import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// freebiesnearme.vercel.app (and any other non-production deployment) is
// used for testing/preview - it must never get indexed by search engines,
// only the real domain (freebiesnearme.app) should show up in results.
const isProduction = process.env.VERCEL_ENV === 'production';

// Ads are shown to visitors in Canada (outside Quebec) and the United States
// only. The site is behind Cloudflare, which adds the visitor's real country in
// the CF-IPCountry request header (Vercel's own country header would show the
// Cloudflare edge location instead) and, once its "Add visitor location
// headers" managed transform is on, the region in CF-Region-Code. Every page
// carries a small inline snippet that adds /ad-loader.js (which loads AdSense
// and shows the ad notice with its opt out) only when the fbnm_ads cookie is
// set, so other countries never get the AdSense address in their HTML. A
// missing or unknown country (header absent, "XX", "T1") sets no cookie and
// means no ads; so does a Canadian visit whose region is missing or Quebec.
const AD_COUNTRIES = new Set(['CA', 'US']);
const AD_COOKIE = 'fbnm_ads';

export function proxy(request: NextRequest) {
  if (!isProduction && request.nextUrl.pathname === '/robots.txt') {
    return new NextResponse('User-agent: *\nDisallow: /\n', {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const response = NextResponse.next();
  if (!isProduction) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  // Only page requests carry the cookie (not images, scripts or the manifest).
  if ((request.headers.get('accept') || '').includes('text/html')) {
    const country = (request.headers.get('cf-ipcountry') || '').toUpperCase();
    // Quebec is left out of the ad script. In Canada the region has to be
    // known to be somewhere else: a missing region (the Cloudflare visitor
    // location headers are not switched on) takes the safe side and sets no
    // cookie, so no ads. The United States needs no region.
    const regionCode = (request.headers.get('cf-region-code') || '').toUpperCase();
    const regionName = (request.headers.get('cf-region') || '').toLowerCase();
    const inQuebec = regionCode === 'QC' || regionName === 'quebec' || regionName === 'québec';
    const adsAllowed =
      country === 'US' || (country === 'CA' && regionCode !== '' && !inQuebec);
    if (AD_COUNTRIES.has(country) && adsAllowed) {
      // One hour, so a visitor who leaves the two countries stops getting ads soon.
      response.cookies.set(AD_COOKIE, '1', { path: '/', maxAge: 3600, sameSite: 'lax', secure: true });
    } else if (request.cookies.has(AD_COOKIE)) {
      response.cookies.delete(AD_COOKIE);
    }
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
