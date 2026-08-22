import type { Listing } from '@/types/pseo_types';
import { assumedEndIso } from '@/lib/datetime';

export type ListingStop = {
  address: string | null;
  neighbourhood: string;
  neighbourhood_slug: string;
  lat: number;
  lng: number;
  start_time: string;
  end_time: string | null;
};

export type GroupedListing = Listing & {
  stops: ListingStop[];
  groupStatus: 'live' | 'soon' | 'ended';
};

// Mirrors groupRows()/transformGroup()/statusFromWindows() in
// public/toronto/index.html and map.html, so a multi-location promo
// (e.g. Krispy Kreme's downtown locations) reads as one card everywhere
// on the site instead of one card per row, and the map gets one pin per
// stop instead of the whole group collapsing onto a single point.
//
// Grouping key: rows sharing an explicit group_id always group together
// (the multi-stop-promo case). Rows without one only auto-group when
// brand, neighbourhood, AND offering (what) all match - the same brand
// at the same spot on different dates becomes one card with multiple
// time windows, but different locations stay split unless group_id ties
// them together on purpose.
export function groupListings(rows: Listing[]): GroupedListing[] {
  const groups = new Map<string, Listing[]>();
  const order: string[] = [];
  for (const row of rows) {
    const key = row.group_id || `brand-${row.brand}|loc-${row.neighbourhood}|what-${row.what}`;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(row);
  }

  return order.map((key) => {
    const group = groups
      .get(key)!
      .slice()
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    const primary = group[0];

    const stops: ListingStop[] = group.map((r) => ({
      address: r.address,
      neighbourhood: r.neighbourhood,
      neighbourhood_slug: r.neighbourhood_slug,
      lat: r.lat,
      lng: r.lng,
      start_time: r.start_time,
      end_time: r.end_time,
    }));

    // A row currently inside its own start/end window, if any - checked
    // per row rather than the group's overall min/max span, so a
    // recurring listing (e.g. weekly Tuesday evening classes) doesn't
    // read as "live" on the days between sessions just because it's
    // after the first session and before the last.
    const now = Date.now();
    const activeRow = group.find((r) => {
      const start = new Date(r.start_time).getTime();
      const end = new Date(r.end_time || assumedEndIso(r.start_time)).getTime();
      return now >= start && now <= end;
    });
    const upcomingRows = group.filter((r) => new Date(r.start_time).getTime() > now);
    const groupStatus: 'live' | 'soon' | 'ended' = activeRow ? 'live' : upcomingRows.length ? 'soon' : 'ended';

    // The occurrence relevant right now: today's, else the soonest
    // upcoming one, else the most recent past one (group is already
    // sorted ascending) - used as the base for start_time/end_time below
    // so statusLabel's day count, calendar-add, and the single "time"
    // display all reflect what's actually next, not always the group's
    // very first (likely already past) row.
    const referenceRow = activeRow ?? (upcomingRows.length ? upcomingRows[0] : group[group.length - 1]);

    return {
      ...primary,
      start_time: referenceRow.start_time,
      end_time: referenceRow.end_time,
      stops,
      groupStatus,
    };
  });
}
