// Ported from the formatDay/formatClock/formatTimeRange/assumedEnd family in
// public/toronto/index.html and map.html - kept as an exact port (not a
// rewrite) so the Next.js pSEO pages display times identically to the rest
// of the site rather than introducing a second, subtly different format.

export const TORONTO_TZ = 'America/Toronto';

function getTimezoneOffsetMs(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value;
      return acc;
    }, {});

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asUtc - date.getTime();
}

// When a listing has no end time, assume it wraps up at 9pm Toronto time on
// its start date rather than treating it as live indefinitely.
export function assumedEndIso(startIso: string): string {
  const start = new Date(startIso);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TORONTO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(start)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value;
      return acc;
    }, {});

  const guessUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), 21, 0);
  const offset = getTimezoneOffsetMs(TORONTO_TZ, new Date(guessUtc));
  return new Date(guessUtc - offset).toISOString();
}

function torontoParts(d: Date): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TORONTO_TZ,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  })
    .formatToParts(d)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value;
      return acc;
    }, {});
  return { hour: Number(parts.hour), minute: Number(parts.minute) };
}

function hasClockTime(d: Date): boolean {
  const { hour, minute } = torontoParts(d);
  return hour !== 0 || minute !== 0;
}

function formatDay(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: TORONTO_TZ });
}

function formatClock(d: Date): string {
  return d
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TORONTO_TZ })
    .toLowerCase()
    .replace(' ', '');
}

function torontoDateKey(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: TORONTO_TZ });
}

// Standard format: "Day, Mon Date[ - Day, Mon Date], startTime - endTime" so
// every listing (single day or spanning several) reads the same way as the
// rest of the site.
export function formatTimeRange(start: string, end: string | null): string {
  const s = new Date(start);
  const sDay = formatDay(s);
  const sHasTime = hasClockTime(s);

  // No end time at all (distinct from a date-only end below) - show just
  // the start rather than filling in a fabricated end time.
  if (!end) return sHasTime ? sDay + ', from ' + formatClock(s) : sDay;

  const rawEnd = new Date(end);
  const eHasTime = hasClockTime(rawEnd);
  // A date-only end that lands exactly at midnight is a half-open boundary
  // (needed so the listing stays live through the whole last day) and
  // represents the end of the PREVIOUS day for display purposes, not the
  // start of a new one.
  const e = eHasTime ? rawEnd : new Date(rawEnd.getTime() - 60000);
  const sameDay = torontoDateKey(s) === torontoDateKey(e);
  const dayPart = sameDay ? sDay : sDay + ' - ' + formatDay(e);

  if (sHasTime && eHasTime) return dayPart + ', ' + formatClock(s) + ' - ' + formatClock(rawEnd);
  if (sHasTime) return dayPart + ', from ' + formatClock(s);
  if (eHasTime) return dayPart + ', until ' + formatClock(rawEnd);
  return dayPart;
}
