'use client';

import { useMemo, useRef, useState } from 'react';
import type { Listing } from '@/types/pseo_types';
import { TORONTO_TZ, hasClockTime, torontoDateKey, formatTimeRange } from '@/lib/datetime';
import { CATEGORY_COLOR, CATEGORY_LABEL } from '@/lib/categories';
import { stripFreeWord, directionsUrl } from '@/lib/listing-display';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function dateKeysBetween(startKey: string, endKey: string): string[] {
  const [sy, sm, sd] = startKey.split('-').map(Number);
  const cursor = new Date(Date.UTC(sy, sm - 1, sd));
  const end = new Date(`${endKey}T00:00:00Z`);
  const keys: string[] = [];
  // Sanity cap so a corrupt/absurd date range can't hang the tab.
  for (let i = 0; i < 120 && cursor <= end; i++) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

// Every Toronto-local calendar date a listing occupies, so a multi-day
// listing gets a dot on each day it spans, not just its start day. Mirrors
// the half-open-midnight-end convention used everywhere else on the site
// (formatTimeRange, buildFeedIcs's all-day VEVENT end date).
function listingDateKeys(listing: Listing): string[] {
  const start = new Date(listing.start_time);
  const startKey = torontoDateKey(start);
  if (!listing.end_time) return [startKey];

  const end = new Date(listing.end_time);
  const effectiveEndKey = hasClockTime(end)
    ? torontoDateKey(end)
    : torontoDateKey(new Date(end.getTime() - 60000));

  if (effectiveEndKey <= startKey) return [startKey];
  return dateKeysBetween(startKey, effectiveEndKey);
}

function getMonthWeeks(year: number, month: number): (string | null)[][] {
  const startWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = Array(startWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function todayKey(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TORONTO_TZ });
}

// Arrow-into-line icon: as given, points right (away from the line) - used
// as-is for "expand" (panel grows rightward). Mirrored left-right for
// "collapse" so the arrow points back toward the line (panel shrinks
// leftward). A vertical flip is a no-op here since the glyph is already
// symmetric top-to-bottom.
function PanelToggleIcon({ direction }: { direction: 'expand' | 'collapse' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      style={{ transform: direction === 'collapse' ? 'scaleX(-1)' : undefined }}
    >
      <path d="M0 0h24v24H0z" fill="none" />
      <path
        fill="currentColor"
        d="m17.172 11l-4.657-4.657l1.414-1.414L21 12l-7.071 7.071l-1.414-1.414L17.172 13H8v-2zM4 19V5h2v14z"
      />
    </svg>
  );
}

export default function CalendarGrid({ listings }: { listings: Listing[] }) {
  const now = new Date();
  const nowParts = new Intl.DateTimeFormat('en-US', { timeZone: TORONTO_TZ, year: 'numeric', month: 'numeric' })
    .formatToParts(now)
    .reduce<Record<string, string>>((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  const [year, setYear] = useState(Number(nowParts.year));
  const [month, setMonth] = useState(Number(nowParts.month) - 1);
  const [selectedKey, setSelectedKey] = useState<string | null>(todayKey());
  const [collapsed, setCollapsed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const listingsByDate = useMemo(() => {
    const map = new Map<string, Listing[]>();
    for (const listing of listings) {
      for (const key of listingDateKeys(listing)) {
        const arr = map.get(key) ?? [];
        arr.push(listing);
        map.set(key, arr);
      }
    }
    return map;
  }, [listings]);

  const weeks = useMemo(() => getMonthWeeks(year, month), [year, month]);
  const today = todayKey();
  const selectedListings = selectedKey ? listingsByDate.get(selectedKey) ?? [] : [];

  function selectDay(key: string) {
    setSelectedKey((prev) => (prev === key ? null : key));
    setCollapsed(false);
    // On the mobile stacked layout the panel sits below the whole grid, so
    // bring it into view instead of leaving the user to scroll down past
    // every week row to see what they just picked.
    requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  function goToMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 0) { newMonth = 11; newYear -= 1; }
    if (newMonth > 11) { newMonth = 0; newYear += 1; }
    setYear(newYear);
    setMonth(newMonth);
    setSelectedKey(null);
  }

  return (
    <div className="cal-wrap">
      <div className="cal-layout">
        <div className={`cal-panel-col${collapsed ? ' cal-panel-collapsed' : ''}`}>
          <div className="cal-day-panel" ref={panelRef}>
            <div className="cal-day-panel-header">
              <h2 className="cal-day-panel-title">
                {selectedKey
                  ? new Date(`${selectedKey}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })
                  : 'Pick a day'}
              </h2>
              <button
                type="button"
                className="cal-panel-toggle"
                onClick={() => setCollapsed((c) => !c)}
                aria-expanded={!collapsed}
                aria-label={collapsed ? 'Expand event panel' : 'Collapse event panel'}
              >
                <PanelToggleIcon direction={collapsed ? 'expand' : 'collapse'} />
              </button>
            </div>

            <div className="cal-day-panel-body">
              {!selectedKey && (
                <p className="cal-day-panel-placeholder">Select a day on the calendar to see what&apos;s on.</p>
              )}

              {selectedKey && (
                selectedListings.length === 0 ? (
                  <p className="cal-day-empty-msg">No free listings on this day.</p>
                ) : (
                  <ul className="cal-day-list">
                    {selectedListings.map((listing) => (
                      <li className="cal-day-item" key={listing.id}>
                        <span className="tag cat" style={{ color: CATEGORY_COLOR[listing.category] }}>
                          {CATEGORY_LABEL[listing.category]}
                        </span>
                        <div className="cal-day-item-what">{stripFreeWord(listing.what)}</div>
                        <div className="cal-day-item-brand">{listing.brand}</div>
                        <div className="cal-day-item-meta">
                          {formatTimeRange(listing.start_time, listing.end_time)} &middot; {listing.neighbourhood}
                        </div>
                        <a href={directionsUrl(listing)} target="_blank" rel="noopener" className="directions-link">
                          &#128205; Get directions
                        </a>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>
        </div>

        <div className="cal-grid-col">
          <div className="cal-nav">
            <button type="button" className="cal-nav-btn" onClick={() => goToMonth(-1)} aria-label="Previous month">
              &#8592;
            </button>
            <div className="cal-nav-label">{MONTH_LABELS[month]} {year}</div>
            <button type="button" className="cal-nav-btn" onClick={() => goToMonth(1)} aria-label="Next month">
              &#8594;
            </button>
          </div>

          <div className="cal-grid">
            <div className="cal-weekdays">
              {WEEKDAY_LABELS.map((w) => <div key={w} className="cal-weekday">{w}</div>)}
            </div>
            {weeks.map((week, wi) => (
              <div className="cal-week" key={wi}>
                {week.map((key, di) => {
                  if (!key) return <div className="cal-day cal-day-empty" key={di} />;
                  const dayListings = listingsByDate.get(key) ?? [];
                  const dayNum = Number(key.slice(-2));
                  const isToday = key === today;
                  const isSelected = key === selectedKey;
                  return (
                    <button
                      type="button"
                      key={key}
                      className={`cal-day${isToday ? ' cal-day-today' : ''}${isSelected ? ' cal-day-selected' : ''}${dayListings.length ? ' cal-day-has-events' : ''}`}
                      onClick={() => selectDay(key)}
                    >
                      <span className="cal-day-num">{dayNum}</span>
                      {dayListings.length > 0 && (
                        <span className="cal-day-dots">
                          {dayListings.slice(0, 3).map((l) => (
                            <span key={l.id} className="cal-dot" style={{ background: CATEGORY_COLOR[l.category] }} />
                          ))}
                          {dayListings.length > 3 && <span className="cal-dot-more">+{dayListings.length - 3}</span>}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
