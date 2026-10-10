'use client';

import { usePathname } from 'next/navigation';
import { cityFromPathname } from '@/lib/cities';

// Top nav for Next.js-rendered pages. The city comes from the first URL
// segment so /new-york/... pages link within New York rather than Toronto.
export default function SiteHeader() {
  const city = cityFromPathname(usePathname());
  const base = `/${city.slug}`;

  return (
    <nav>
      <div className="nav-inner">
        <a className="logo" href={base}>Freebies Near Me <span className="logo-city">{city.name}</span></a>
        <div className="nav-links">
          <a href={base}>Explore</a>
          <a href={`${base}/map`}>Map</a>
          <a href={`${base}/calendar`}>Calendar</a>
        </div>
        <div className="nav-right">
          <a className="btn-solid" href={`${base}/submit`}>Submit an event</a>
        </div>
      </div>
    </nav>
  );
}
