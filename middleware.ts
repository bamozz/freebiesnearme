import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// freebiesnearme.vercel.app (and any other non-production deployment) is
// used for testing/preview - it must never get indexed by search engines,
// only the real domain (freebiesnearme.app) should show up in results.
const isProduction = process.env.VERCEL_ENV === 'production';

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
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
