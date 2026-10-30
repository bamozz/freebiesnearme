// Row validation for api/screener-insert.js, the endpoint the scheduled
// screener routine posts verified listings to. Pure functions (no network),
// so the rules can be exercised without touching the database.
//
// Every check here exists because a past screener run got it wrong or
// because a listing rule was written down: times stored as local instead of
// UTC, hedging copy ("per the post", "not stated") reaching a public card,
// social handles, duplicates of a brand already on the calendar, venues
// outside the two cities' scope.

import { containsBlockedContent } from './content-filter.js';

export const ALLOWED_CITY_SLUGS = ['toronto', 'new-york'];

// category id -> category_slug (keep in sync with lib/categories.ts).
export const CATEGORY_SLUGS = {
  food: 'food-drink',
  beauty: 'beauty',
  fashion: 'fashion',
  tech: 'tech',
  wellness: 'wellness',
  class_workshop: 'class-workshop',
  concert_screening: 'concert-screening',
  tour: 'tour',
  festival: 'festival',
  misc: 'misc',
};

// Generous boxes around each city's scope (see CLAUDE.md "Geographic scope"):
// Toronto is old Toronto, York and East York; New York is the five boroughs.
const CITY_BOUNDS = {
  toronto: { lat: [43.58, 43.74], lng: [-79.5, -79.25] },
  'new-york': { lat: [40.49, 40.92], lng: [-74.27, -73.68] },
};

// Both cities are Eastern time.
const LOCAL_TZ = 'America/New_York';

const MAX_ROWS = 30;
const MAX_EVENT_HOURS = 36;
const MAX_DAYS_AHEAD = 75;

const HEDGING_PATTERN = new RegExp(
  '\\b(' +
    [
      'unconfirmed',
      'not confirmed',
      "couldn'?t confirm",
      'could not confirm',
      'not stated',
      "(?:doesn'?t|does not|did not|didn'?t) (?:state|say|list|mention)",
      'no (?:source|confirmation)',
      'according to',
      'per (?:the|a) (?:post|page|listing|source|article)',
      'from the (?:post|page|listing|article)',
      'the (?:post|page|listing|article) (?:says|states)',
      'may or may not',
      'possibly',
      'probably',
      'seems to',
      'appears to',
    ].join('|') +
    ')\\b',
  'i'
);

const OFFSET_PATTERN = /(Z|[+-]\d{2}(?::?\d{2})?)$/;

function normalizeBrand(brand) {
  return String(brand || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function localHour(date) {
  const hour = new Intl.DateTimeFormat('en-US', {
    timeZone: LOCAL_TZ,
    hour: 'numeric',
    hourCycle: 'h23',
  }).format(date);
  return Number(hour);
}

function parseTime(value) {
  if (typeof value !== 'string' || !OFFSET_PATTERN.test(value.trim())) return null;
  const date = new Date(value.trim());
  return Number.isNaN(date.getTime()) ? null : date;
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// Returns { row } with the exact object to insert, or { errors } listing every
// rule the row broke.
export function validateRow(input, now = new Date()) {
  const errors = [];
  const p = input && typeof input === 'object' ? input : {};

  const text = (value) => String(value == null ? '' : value).trim();
  const brand = text(p.brand);
  const what = text(p.what);
  const description = text(p.description);
  const neighbourhood = text(p.neighbourhood);
  const address = text(p.address);

  if (!ALLOWED_CITY_SLUGS.includes(p.city_slug)) {
    errors.push('city_slug must be toronto or new-york');
  }
  if (!Object.prototype.hasOwnProperty.call(CATEGORY_SLUGS, p.category)) {
    errors.push('category is not one of the allowed categories');
  }

  if (brand.length < 3 || brand.length > 40) errors.push('brand must be 3 to 40 characters (a short event name)');
  if (/[()]/.test(brand)) errors.push('brand must not contain parentheses');
  if (/https?:\/\/|www\./i.test(brand)) errors.push('brand must not contain a link');
  if (what.length < 3 || what.length > 80) errors.push('what must be 3 to 80 characters (a short line naming the draw)');
  if (description.length < 15 || description.length > 500) errors.push('description must be 15 to 500 characters');
  if (neighbourhood.length < 2 || neighbourhood.length > 60) errors.push('neighbourhood must be 2 to 60 characters');
  if (address.length < 8 || address.length > 200) errors.push('address must be a specific address of 8 to 200 characters');

  for (const [field, value] of [['brand', brand], ['what', what], ['description', description], ['neighbourhood', neighbourhood], ['address', address]]) {
    if (value.includes('@')) errors.push(`${field} must not contain "@" or a social handle`);
    if (containsBlockedContent(value)) errors.push(`${field} contains language we do not allow`);
  }
  if (HEDGING_PATTERN.test(what) || HEDGING_PATTERN.test(description)) {
    errors.push('what and description must state facts plainly, with no sourcing notes or uncertainty');
  }

  const bounds = CITY_BOUNDS[p.city_slug];
  const lat = Number(p.lat);
  const lng = Number(p.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    errors.push('lat and lng must be numbers');
  } else if (bounds && (lat < bounds.lat[0] || lat > bounds.lat[1] || lng < bounds.lng[0] || lng > bounds.lng[1])) {
    errors.push('lat/lng is outside the city scope');
  }

  const start = parseTime(p.start_time);
  const end = p.end_time == null || p.end_time === '' ? null : parseTime(p.end_time);
  if (!start) {
    errors.push('start_time must be an ISO timestamp with a UTC offset (for example 2026-11-03 12:00:00+00)');
  } else {
    if (p.end_time != null && p.end_time !== '' && !end) {
      errors.push('end_time must be an ISO timestamp with a UTC offset');
    }
    if (end && end <= start) errors.push('end_time must be after start_time');
    if (end && end - start > MAX_EVENT_HOURS * 3600 * 1000) {
      errors.push(`event spans more than ${MAX_EVENT_HOURS} hours; insert one row per day`);
    }
    const effectiveEnd = end || new Date(start.getTime() + 3 * 3600 * 1000);
    if (effectiveEnd <= now) errors.push('event has already ended');
    if (start.getTime() - now.getTime() > MAX_DAYS_AHEAD * 24 * 3600 * 1000) {
      errors.push(`event starts more than ${MAX_DAYS_AHEAD} days from now`);
    }
    if (localHour(start) < 6) {
      errors.push('start_time falls between midnight and 6 AM Eastern, which usually means local time was stored as UTC');
    }
  }

  if (p.signup_url != null && p.signup_url !== '' && (!isHttpsUrl(String(p.signup_url)) || String(p.signup_url).length > 500)) {
    errors.push('signup_url must be an https link of 500 characters or fewer');
  }
  let totalCount = null;
  if (p.total_count != null && p.total_count !== '') {
    totalCount = Number(p.total_count);
    if (!Number.isInteger(totalCount) || totalCount < 1 || totalCount > 100000) {
      errors.push('total_count must be a whole number from 1 to 100000');
    }
  }
  const slug = text(p.neighbourhood_slug);
  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.push('neighbourhood_slug must be lowercase letters, numbers and dashes');
  }

  if (errors.length) return { errors };

  return {
    row: {
      brand,
      category: p.category,
      neighbourhood,
      address,
      lat,
      lng,
      what,
      description,
      start_time: start.toISOString(),
      end_time: end ? end.toISOString() : null,
      claimed_count: 0,
      total_count: totalCount,
      sponsored: false,
      submitted_by: 'hunter',
      submitter_contact: null,
      moderation_status: 'approved',
      image_url: null,
      insta_url: null,
      signup_url: p.signup_url ? String(p.signup_url).trim() : null,
      city_slug: p.city_slug,
      category_slug: CATEGORY_SLUGS[p.category],
      neighbourhood_slug: slug || null,
      is_active: true,
    },
  };
}

// Splits a batch into rows that can be inserted and rows that cannot. A row
// is a duplicate when its brand is already on the city's calendar (any
// listing for that brand that has not ended more than a day ago), or when it
// repeats a (city, brand, start, address) already in this batch. Several rows
// with the same brand in one batch are fine: that is how one event at many
// locations, or one event over several days, is entered.
export function screenBatch(inputs, existing, now = new Date()) {
  const cutoff = now.getTime() - 24 * 3600 * 1000;
  const onCalendar = new Set(
    (existing || [])
      .filter((r) => new Date(r.start_time).getTime() >= cutoff)
      .map((r) => `${r.city_slug}|${normalizeBrand(r.brand)}`)
  );

  const accepted = [];
  const rejected = [];
  const seen = new Set();

  inputs.forEach((input, index) => {
    const result = validateRow(input, now);
    if (result.errors) {
      rejected.push({ index, brand: text(input && input.brand), reasons: result.errors });
      return;
    }
    const { row } = result;
    if (onCalendar.has(`${row.city_slug}|${normalizeBrand(row.brand)}`)) {
      rejected.push({ index, brand: row.brand, reasons: ['brand is already on the calendar for this city'] });
      return;
    }
    const key = `${row.city_slug}|${normalizeBrand(row.brand)}|${row.start_time}|${normalizeBrand(row.address)}`;
    if (seen.has(key)) {
      rejected.push({ index, brand: row.brand, reasons: ['same brand, start time and address appears twice in this batch'] });
      return;
    }
    seen.add(key);
    accepted.push({ index, row });
  });

  return { accepted, rejected };
}

function text(value) {
  return String(value == null ? '' : value).trim();
}

export { MAX_ROWS };
