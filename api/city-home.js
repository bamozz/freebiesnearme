// Serves a city's home page (/toronto, /new-york) with its listings already in
// the HTML, so search engines and the AdSense review see real listings without
// running scripts. The page itself is still public/<city>/index.html: this reads
// that file, fills the listing column (#list) and the "live today" number from
// the database, and returns it. Once the page's own script loads it redraws the
// same column with its full cards, filters and map, as before.
//
// Any failure (database down, file missing) falls back to the plain file, so
// the page never breaks because of this step.
import fs from 'fs';
import path from 'path';

const CITIES = {
  toronto: { tz: 'America/Toronto' },
  'new-york': { tz: 'America/New_York' },
};
const COLUMNS = 'id,brand,what,address,neighbourhood,category,start_time,end_time';
const MAX_ITEMS = 60;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function when(row, tz) {
  const opts = { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
  const fmt = (v) => new Date(v).toLocaleString('en-US', opts);
  if (row.start_time && row.end_time) return `${fmt(row.start_time)} to ${fmt(row.end_time)}`;
  if (row.start_time) return `From ${fmt(row.start_time)}`;
  if (row.end_time) return `Until ${fmt(row.end_time)}`;
  return '';
}

function renderList(rows, tz) {
  if (!rows.length) {
    return '<div style="font-size:13.5px;color:#6B7280;padding:20px 4px;">No free events are listed right now. New listings are added every day.</div>';
  }
  const items = rows.slice(0, MAX_ITEMS).map((r) => {
    const meta = esc(r.neighbourhood || r.address || '');
    return (
      '<article class="ssr-item" style="padding:12px 4px;border-bottom:1px solid #e5e1d4;">' +
      `<h3 style="margin:0 0 4px;font-size:16px;">${esc(r.brand)}</h3>` +
      (r.what ? `<p style="margin:0 0 4px;font-size:14px;">${esc(r.what)}</p>` : '') +
      `<p style="margin:0;font-size:13px;color:#4b4b4b;">${esc(when(r, tz))}${meta ? ' · ' + meta : ''}</p>` +
      '</article>'
    );
  });
  return items.join('');
}

export default async function handler(req, res) {
  const city = String((req.query && req.query.city) || '');
  const cfg = CITIES[city];
  if (!cfg) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }

  let html;
  try {
    html = fs.readFileSync(path.join(process.cwd(), 'public', city, 'index.html'), 'utf8');
  } catch (e) {
    res.statusCode = 500;
    res.end('Page unavailable');
    return;
  }

  try {
    const now = new Date().toISOString();
    const url =
      `${process.env.SUPABASE_URL}/rest/v1/listings?select=${COLUMNS}` +
      `&city_slug=eq.${city}&is_active=eq.true&moderation_status=eq.approved` +
      `&or=(end_time.is.null,end_time.gte.${now})&order=start_time.asc.nullslast&limit=200`;
    const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const r = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!r.ok) throw new Error(`listings ${r.status}`);
    const rows = await r.json();
    const nowMs = Date.now();
    const live = rows.filter(
      (row) => (!row.start_time || Date.parse(row.start_time) <= nowMs) && (!row.end_time || Date.parse(row.end_time) >= nowMs),
    ).length;

    html = html
      .replace('<div class="list-scroll" id="list"></div>', `<div class="list-scroll" id="list">${renderList(rows, cfg.tz)}</div>`)
      .replace('<div class="num" id="liveCount">0</div>', `<div class="num" id="liveCount">${live}</div>`);
  } catch (e) {
    console.error('city-home: serving the page without listings', e);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Five minutes at the edge, then refreshed in the background.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
  res.statusCode = 200;
  res.end(html);
}
