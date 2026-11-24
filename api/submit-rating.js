// Handles "Worthy?" star ratings server-side. Ratings used to be written from
// the browser with the public anon key and an anonymous sign-in, which anyone
// could script. Now each rating needs a Turnstile check, and once this is live
// the browser keys can no longer write to the ratings table (its insert and
// delete policies are dropped), so this endpoint, holding the service role key,
// is the only way a row is added or removed.
//
// There is no login on this site, so "this is my rating" for the Undo link is a
// token the server derives from the row id with a secret only it knows (an
// HMAC of the service key), returned to the browser that rated and presented
// back to undo. Nothing extra is stored in the database.
//
// POST /api/submit-rating
//   { action: 'rate', listing_id, stars (1-5), turnstileToken }  -> { success, id, token }
//   { action: 'undo', id, token }                                -> { success }

import { createHmac, timingSafeEqual } from 'node:crypto';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function serviceHeaders() {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  };
}

function tokenFor(id) {
  return createHmac('sha256', `${process.env.SUPABASE_SERVICE_ROLE_KEY}:rating-undo`)
    .update(String(id))
    .digest('hex');
}

function tokenMatches(id, given) {
  const a = Buffer.from(tokenFor(id));
  const b = Buffer.from(String(given || ''));
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ error: 'Invalid request body.' }); }
  }
  body = body && typeof body === 'object' ? body : {};

  if (body.action === 'undo') {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0 || !body.token) {
      return res.status(400).json({ error: 'Invalid request.' });
    }
    if (!tokenMatches(id, body.token)) {
      return res.status(403).json({ error: "That rating can't be undone." });
    }
    const delRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/ratings?id=eq.${id}`, {
      method: 'DELETE',
      headers: serviceHeaders(),
    });
    if (!delRes.ok) {
      console.error('rating delete failed', { status: delRes.status });
      return res.status(500).json({ error: "Couldn't undo your rating. Try again in a moment." });
    }
    return res.status(200).json({ success: true });
  }

  if (body.action !== 'rate') {
    return res.status(400).json({ error: 'Invalid request.' });
  }

  const token = body.turnstileToken;
  if (!token) {
    return res.status(400).json({ error: 'Please complete the verification challenge.' });
  }
  const remoteip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY || '',
      response: String(token),
      ...(remoteip ? { remoteip } : {}),
    }),
  });
  const verifyJson = await verifyRes.json().catch(() => ({ success: false }));
  if (!verifyJson.success) {
    return res.status(400).json({ error: 'Verification failed. Please try again.' });
  }

  const listingId = String(body.listing_id || '').trim();
  const stars = Number(body.stars);
  if (!UUID_RE.test(listingId) || !Number.isInteger(stars) || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'Invalid rating.' });
  }

  // Only a listing the public can see can be rated.
  const lookupRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/listings?id=eq.${listingId}&moderation_status=eq.approved&select=id&limit=1`,
    { headers: serviceHeaders() }
  );
  const found = lookupRes.ok ? await lookupRes.json().catch(() => []) : null;
  if (!found) {
    return res.status(500).json({ error: "Couldn't submit your rating. Try again in a moment." });
  }
  if (!found.length) {
    return res.status(404).json({ error: 'That listing is not available.' });
  }

  const insertRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/ratings`, {
    method: 'POST',
    headers: { ...serviceHeaders(), 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ listing_id: listingId, stars }),
  });
  if (!insertRes.ok) {
    const errText = await insertRes.text().catch(() => '');
    console.error('rating insert failed', { status: insertRes.status, body: errText });
    return res.status(500).json({ error: "Couldn't submit your rating. Try again in a moment." });
  }
  const [row] = await insertRes.json();
  return res.status(200).json({ success: true, id: row.id, token: tokenFor(row.id) });
}
