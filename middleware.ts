import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// freebiesnearme.vercel.app (and any other non-production deployment) is
// used for testing/preview - it must never get indexed by search engines,
// only the real domain (freebiesnearme.app) should show up in results.
const isProduction = process.env.VERCEL_ENV === 'production';

// Ads are shown to visitors in Canada and the United States only. The site is
// behind Cloudflare, which adds the visitor's real country in the CF-IPCountry
// request header (Vercel's own country header would show the Cloudflare edge
// location instead). Every page carries a small inline snippet that adds
// /ad-loader.js (which loads AdSense) only when the fbnm_ads cookie is set, so
// other countries never get the AdSense address in their HTML. A missing or
// unknown country (header absent, "XX", "T1") sets no cookie and means no ads.
const AD_COUNTRIES = new Set(['CA', 'US']);
const AD_COOKIE = 'fbnm_ads';

export function middleware(request: NextRequest) {
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
    if (AD_COUNTRIES.has(country)) {
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
