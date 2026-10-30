// Write path for the scheduled screener routine. The routine finds and
// verifies free Toronto and New York listings, then posts them here instead
// of a person pasting SQL. It never gets database access of its own: this
// endpoint holds the service role key, accepts only a bearer token, and can
// only insert rows that pass the checks in _lib/screener-rows.js. It cannot
// update or delete anything.
//
// POST /api/screener-insert
//   Authorization: Bearer <SCREENER_INSERT_TOKEN>
//   { "rows": [ {brand, category, neighbourhood, address, lat, lng, what,
//                description, start_time, end_time, total_count, signup_url,
//                city_slug, neighbourhood_slug}, ... ],
//     "dryRun": true }   // optional: validate and de-duplicate, insert nothing
//
// Responds { dryRun, inserted: [...], rejected: [{ index, brand, reasons }] }.

import { createHash, timingSafeEqual } from 'node:crypto';
import { MAX_ROWS, screenBatch } from './_lib/screener-rows.js';

function tokenMatches(header, expected) {
  const given = String(header || '').replace(/^Bearer\s+/i, '');
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expected = process.env.SCREENER_INSERT_TOKEN;
  if (!expected) {
    console.error('screener-insert: SCREENER_INSERT_TOKEN is not set');
    return res.status(500).json({ error: 'Endpoint is not configured.' });
  }
  if (!tokenMatches(req.headers.authorization, expected)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ error: 'Invalid request body.' }); }
  }
  const rows = body && Array.isArray(body.rows) ? body.rows : null;
  if (!rows || !rows.length) {
    return res.status(400).json({ error: 'Send {"rows": [...]} with at least one row.' });
  }
  if (rows.length > MAX_ROWS) {
    return res.status(400).json({ error: `Send at most ${MAX_ROWS} rows per request.` });
  }
  const dryRun = body.dryRun === true;

  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  // Everything starting within the last two days or later, every city, any
  // moderation status, so a pending or hidden listing still blocks a repeat.
  const since = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
  const existingRes = await fetch(
    `${base}/rest/v1/listings?select=brand,city_slug,start_time&start_time=gte.${encodeURIComponent(since)}&limit=5000`,
    { headers }
  );
  if (!existingRes.ok) {
    console.error('screener-insert: could not read existing listings', { status: existingRes.status });
    return res.status(502).json({ error: 'Could not check for duplicates.' });
  }
  const existing = await existingRes.json();

  const { accepted, rejected } = screenBatch(rows, existing);

  if (dryRun || !accepted.length) {
    console.log('screener-insert', { dryRun, accepted: accepted.length, rejected: rejected.length });
    return res.status(200).json({
      dryRun,
      inserted: dryRun
        ? accepted.map(({ index, row }) => ({ index, brand: row.brand, city_slug: row.city_slug, start_time: row.start_time }))
        : [],
      rejected,
    });
  }

  const insertRes = await fetch(`${base}/rest/v1/listings`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(accepted.map(({ row }) => row)),
  });
  if (!insertRes.ok) {
    const errText = await insertRes.text().catch(() => '');
    console.error('screener-insert: insert failed', { status: insertRes.status, body: errText });
    return res.status(502).json({ error: 'Insert failed.', rejected });
  }
  const inserted = await insertRes.json();

  console.log('screener-insert', { dryRun: false, inserted: inserted.length, rejected: rejected.length });
  return res.status(200).json({
    dryRun: false,
    inserted: inserted.map((r) => ({
      id: r.id,
      brand: r.brand,
      city_slug: r.city_slug,
      neighbourhood_slug: r.neighbourhood_slug,
      start_time: r.start_time,
      end_time: r.end_time,
      moderation_status: r.moderation_status,
    })),
    rejected,
  });
}
