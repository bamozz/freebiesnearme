// Handles "share an update" stock/status reports (and their optional
// photo) server-side. Previously this went straight from the browser to
// Supabase with the anon key - no Turnstile, no honeypot, no validation at
// all, live the instant someone submitted. This mirrors the pattern
// already used by submit-listing.js/submit-advertise.js: the corresponding
// RLS insert policy on `event_updates`, and the upload policy on the
// event-update-photos storage bucket, should both be locked down to
// service-role-only so this endpoint is the only write path.
//
// There's no user login on this site, so "ownership" for the undo feature
// (api/undo-update.js) is a random opaque token minted here and returned
// to the client, who stores it locally and must present it back to delete
// their own row - not cryptographically strong, but enough to stop a
// stranger from deleting an arbitrary row just by guessing/scraping a UUID.

import { containsBlockedContent } from './_lib/content-filter.js';

const REPORT_TYPE_IDS = new Set([
  'ran_out', 'cancelled', 'ended_early',
  'wait_under_30', 'wait_30_60', 'wait_1hr_plus', 'still_active',
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The client already downscales to <=1280px and re-encodes as JPEG at 72%
// quality (compressImage() in index.html) before this ever gets sent, so a
// legitimate photo should land well under this - this is a sanity ceiling
// against a crafted/oversized request, not the primary size control.
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ error: 'Invalid request body.' }); }
  }
  body = body || {};

  if (body.company) {
    return res.status(200).json({ success: true, id: null, client_token: null });
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
      response: token,
      ...(remoteip ? { remoteip } : {}),
    }),
  });
  const verifyJson = await verifyRes.json().catch(() => ({ success: false }));
  if (!verifyJson.success) {
    return res.status(400).json({ error: 'Verification failed. Please try again.' });
  }

  const listingId = String(body.listing_id || '').trim();
  const type = String(body.type || '').trim();
  if (!UUID_RE.test(listingId) || !REPORT_TYPE_IDS.has(type)) {
    return res.status(400).json({ error: 'Invalid report.' });
  }

  let quantity = null;
  if (type === 'ran_out' && body.quantity !== null && body.quantity !== undefined && body.quantity !== '') {
    const n = Number(body.quantity);
    if (!Number.isFinite(n) || n < 0 || n > 100000 || !Number.isInteger(n)) {
      return res.status(400).json({ error: 'Quantity must be a whole number.', field: 'quantity' });
    }
    quantity = n;
  }

  let instaUrl = null;
  if (body.insta_url) {
    instaUrl = String(body.insta_url).trim();
    if (instaUrl.length > 300 || !/^https?:\/\/\S+$/i.test(instaUrl)) {
      return res.status(400).json({ error: 'Please enter a valid link.', field: 'insta_url' });
    }
    if (containsBlockedContent(instaUrl)) {
      return res.status(400).json({ error: 'Link contains language we don\'t allow.', field: 'insta_url' });
    }
  }

  let imageUrl = null;
  if (body.photoBase64) {
    let buf;
    try {
      buf = Buffer.from(String(body.photoBase64), 'base64');
    } catch (e) {
      return res.status(400).json({ error: 'Invalid photo data.' });
    }
    if (!buf.length || buf.length > MAX_PHOTO_BYTES) {
      return res.status(400).json({ error: 'Photo is too large.' });
    }
    const path = `${listingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const uploadRes = await fetch(
      `${process.env.SUPABASE_URL}/storage/v1/object/event-update-photos/${path}`,
      {
        method: 'POST',
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'image/jpeg',
        },
        body: buf,
      }
    );
    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => '');
      console.error('Photo upload failed', { status: uploadRes.status, body: errText });
      return res.status(500).json({ error: "Couldn't upload your photo. Try again in a moment." });
    }
    imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/event-update-photos/${path}`;
  }

  const clientToken = crypto.randomUUID();
  const payload = {
    listing_id: listingId,
    type,
    client_token: clientToken,
    ...(quantity !== null ? { quantity } : {}),
    ...(imageUrl ? { image_url: imageUrl } : {}),
    ...(instaUrl ? { insta_url: instaUrl } : {}),
  };

  const insertRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/event_updates`, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!insertRes.ok) {
    const errText = await insertRes.text().catch(() => '');
    console.error('event_updates insert failed', { status: insertRes.status, body: errText });
    return res.status(500).json({ error: "Couldn't submit your update. Try again in a moment." });
  }

  const [row] = await insertRes.json();
  return res.status(200).json({ success: true, id: row.id, client_token: clientToken, image_url: imageUrl });
}
