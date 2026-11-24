// Handles listing submissions server-side so Turnstile verification and
// content filtering can't be bypassed by posting directly to Supabase with
// the public anon key. The corresponding RLS insert policy on `listings`
// should be locked down so this endpoint (using the service role key) is
// the only way a new pending listing gets created.

import { containsBlockedContent } from './_lib/content-filter.js';

function countUrls(text) {
  const urlPattern = /(https?:\/\/|www\.)\S+/gi;
  return ((text || '').match(urlPattern) || []).length;
}

// Cities the site runs in (keep in sync with lib/cities.ts).
const ALLOWED_CITY_SLUGS = ['toronto', 'new-york'];

// Whatever a visitor types is shown on every city page. The pages escape it
// when they draw it, and this is the second lock: angle brackets are never part
// of a real event name or address, so they are refused, and links must be
// http(s) (a bare "example.com" gets https:// added) so a stored link can never
// be a script address.
const TEXT_LIMITS = [
  ['brand', 100, 'Brand or business name'],
  ['what', 300, 'Description'],
  ['address', 200, 'Address'],
  ['neighbourhood', 100, 'Neighbourhood'],
  ['submitter_contact', 200, 'Contact'],
];

// Returns null when empty, the cleaned link, or false when it is not usable.
function normalizeWebUrl(value) {
  const s = String(value == null ? '' : value).trim();
  if (!s) return null;
  if (s.length > 500 || /[\s<>"`]/.test(s)) return false;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return false;
  if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(\/\S*)?$/i.test(s)) return 'https://' + s;
  return false;
}

// Instagram can be a link or a bare @handle.
function normalizeInstaUrl(value) {
  const s = String(value == null ? '' : value).trim();
  if (!s) return null;
  if (/^@?[A-Za-z0-9._]{1,30}$/.test(s)) return s;
  return normalizeWebUrl(s);
}

// Photos. Nobody can write to the listing-photos bucket directly any more
// (its insert policy is gone), so this endpoint, holding the service key, is
// the only way a photo gets stored. The form compresses to a JPEG under
// about 400 KB; 3 MB is a ceiling against a crafted request, and it matches
// the bucket's own limit. The body is base64, so 3 MB of file is about 4 MB
// of request, under the platform's 4.5 MB request cap.
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

// Versions of the photo permission wording a visitor can have seen next to
// the photo field. The version is stored with the listing as the consent
// record, so only wording that was actually shown is accepted. Only the
// current wording is accepted for a new upload: v2 says the photo is kept
// with the listing after it ends, which is what the site really does. (v1
// said "while the listing is live" and was never recorded on any listing.)
const PHOTO_LICENCE_VERSIONS = ['v2'];

// What the file really is, from its first bytes, never from the name or the
// type the browser claims.
function sniffImage(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) {
    return { type: 'image/jpeg', ext: 'jpg' };
  }
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) {
    return { type: 'image/png', ext: 'png' };
  }
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return { type: 'image/webp', ext: 'webp' };
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ error: 'Invalid request body.' }); }
  }
  body = body || {};

  // Honeypot: bots that fill this hidden field get a fake success and never
  // learn the field was a trap.
  if (body.company) {
    return res.status(200).json({ success: true });
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
    console.error('Turnstile verification failed', {
      hasSecret: Boolean(process.env.TURNSTILE_SECRET_KEY),
      errorCodes: verifyJson['error-codes'],
    });
    return res.status(400).json({ error: 'Verification failed. Please try again.' });
  }

  const payloads = Array.isArray(body.payloads) ? body.payloads : null;
  if (!payloads || !payloads.length) {
    return res.status(400).json({ error: 'Missing listing details.' });
  }

  const links = [];
  for (const p of payloads) {
    if (!p || typeof p !== 'object') {
      return res.status(400).json({ error: 'Missing required listing fields.' });
    }
    const brand = String(p.brand || '').trim();
    const what = String(p.what || '').trim();
    if (!brand || !what || !p.category || !p.neighbourhood || p.lat == null || p.lng == null || !p.start_time) {
      return res.status(400).json({ error: 'Missing required listing fields.' });
    }
    if (countUrls(brand) > 0) {
      return res.status(400).json({ error: 'Brand or business name cannot contain a link.', field: 'brand' });
    }
    if (countUrls(what) > 1) {
      return res.status(400).json({ error: 'Please limit the description to one link.', field: 'what' });
    }
    if (containsBlockedContent(brand)) {
      return res.status(400).json({ error: 'Brand or business name contains language we don\'t allow.', field: 'brand' });
    }
    if (containsBlockedContent(what)) {
      return res.status(400).json({ error: 'Description contains language we don\'t allow.', field: 'what' });
    }
    for (const [field, max, label] of TEXT_LIMITS) {
      const value = String(p[field] == null ? '' : p[field]);
      if (value.length > max) {
        return res.status(400).json({ error: `${label} is too long.`, field });
      }
      if (/[<>]/.test(value)) {
        return res.status(400).json({ error: `${label} can't contain < or > characters.`, field });
      }
    }
    const signup = normalizeWebUrl(p.signup_url);
    if (signup === false) {
      return res.status(400).json({ error: 'Please enter a valid web link, starting with https://', field: 'signup_url' });
    }
    const insta = normalizeInstaUrl(p.insta_url);
    if (insta === false) {
      return res.status(400).json({ error: 'Please enter a valid Instagram link or @handle.', field: 'insta_url' });
    }
    links.push({ signup, insta });
  }

  // Photo (optional). Checked before anything is stored: the visitor must
  // have seen the permission wording, the file must decode, stay under the
  // size cap and really be a JPEG, PNG or WebP.
  let photo = null;
  if (body.photoBase64) {
    if (body.photoLicenceConfirmed !== true) {
      return res.status(400).json({ error: 'Please confirm you have the right to share your photo.', field: 'photo' });
    }
    if (!PHOTO_LICENCE_VERSIONS.includes(body.photoLicenceVersion)) {
      // A page left open from before the wording changed: the visitor has not
      // seen the current text, so ask for a reload instead of recording consent
      // to wording they did not read.
      return res.status(400).json({ error: 'The photo permission text has changed. Please reload the page and try again.', field: 'photo' });
    }
    const b64 = String(body.photoBase64);
    if (b64.length > Math.ceil(MAX_PHOTO_BYTES / 3) * 4 + 4) {
      return res.status(400).json({ error: 'That photo is too large. Try a smaller one.', field: 'photo' });
    }
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) {
      return res.status(400).json({ error: 'We could not read that photo. Try a different one.', field: 'photo' });
    }
    const buf = Buffer.from(b64, 'base64');
    if (!buf.length || buf.length > MAX_PHOTO_BYTES) {
      return res.status(400).json({ error: 'That photo is too large. Try a smaller one.', field: 'photo' });
    }
    const kind = sniffImage(buf);
    if (!kind) {
      return res.status(400).json({ error: 'Please add a JPEG, PNG or WebP photo.', field: 'photo' });
    }
    photo = { buf, kind, licenceVersion: body.photoLicenceVersion };
  }

  let imageUrl = null;
  let photoPath = null;
  if (photo) {
    photoPath = `${crypto.randomUUID()}.${photo.kind.ext}`;
    const uploadRes = await fetch(
      `${process.env.SUPABASE_URL}/storage/v1/object/listing-photos/${photoPath}`,
      {
        method: 'POST',
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': photo.kind.type,
        },
        body: photo.buf,
      }
    );
    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => '');
      console.error('Listing photo upload failed', { status: uploadRes.status, body: errText });
      return res.status(500).json({ error: "Couldn't upload your photo. Try again in a moment." });
    }
    imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/listing-photos/${photoPath}`;
  }

  // Rebuild the payload from scratch server-side rather than trusting the
  // client for anything security- or moderation-relevant.
  const finalPayloads = payloads.map((p, i) => ({
    brand: String(p.brand).trim(),
    category: p.category,
    neighbourhood: p.neighbourhood,
    address: p.address || null,
    lat: p.lat,
    lng: p.lng,
    what: String(p.what).trim(),
    start_time: p.start_time,
    end_time: p.end_time || null,
    total_count: p.total_count || null,
    claimed_count: 0,
    submitted_by: p.submitted_by === 'hunter' ? 'hunter' : 'brand',
    submitter_contact: p.submitter_contact || null,
    moderation_status: 'pending',
    // The pSEO hub pages (app/[city]/[hub]/page.tsx) filter listings on
    // is_active rather than moderation_status, so that a listing can be
    // taken off those pages the moment it expires (via the
    // deactivate-expired cron) without waiting on a human. That only works
    // if new listings start out active - nothing else in the app ever set
    // this column, so every listing was defaulting to inactive and
    // silently never appearing on any pSEO page regardless of approval.
    is_active: true,
    sponsored: false,
    // Only a photo this endpoint stored itself. Any image_url the browser
    // sends is ignored, so a listing can never point at someone else's
    // picture or an arbitrary address.
    image_url: imageUrl,
    ...(imageUrl
      ? {
          image_licence_confirmed_at: new Date().toISOString(),
          image_licence_text_version: photo.licenceVersion,
        }
      : {}),
    insta_url: links[i].insta,
    signup_url: links[i].signup,
    group_id: p.group_id || null,
    // Which city's pages the listing belongs to. Anything not on the
    // allowlist falls back to the column default (toronto) rather than
    // trusting free text from the client.
    city_slug: ALLOWED_CITY_SLUGS.includes(p.city_slug) ? p.city_slug : 'toronto',
  }));

  const insertRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/listings`, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(finalPayloads),
  });

  if (!insertRes.ok) {
    const insertErrText = await insertRes.text().catch(() => '');
    console.error('Supabase insert failed', { status: insertRes.status, body: insertErrText });
    // Don't leave a stored photo behind for a listing that was not saved.
    if (photoPath) {
      await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/listing-photos/${photoPath}`, {
        method: 'DELETE',
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }).catch(() => {});
    }
    return res.status(500).json({ error: 'Something went wrong submitting your listing. Please try again.' });
  }

  return res.status(200).json({ success: true, count: finalPayloads.length });
}
