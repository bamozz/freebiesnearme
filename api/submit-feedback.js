// Handles feedback and idea submissions server-side so Turnstile and the
// length limits cannot be skipped by posting straight to Supabase with the
// public anon key. Once this is live, the browser keys can no longer write to
// the feedback table at all (its insert policy is dropped), so this endpoint,
// holding the service role key, is the only way a row gets there.
//
// POST /api/submit-feedback
//   { type: 'issue' | 'idea', message, listing_ref?, correction?, city_slug,
//     turnstileToken, company (honeypot, must be empty) }

const ALLOWED_TYPES = ['issue', 'idea'];
// The feedback form asks which city the note is about; 'other' is for ideas
// about a city the site does not run in yet.
const ALLOWED_CITY_SLUGS = ['toronto', 'new-york', 'other'];

// The photo report link adds the picture's address (up to 300 characters) to
// the message, so the message limit leaves room for it.
const LIMITS = { message: 3000, listing_ref: 200, correction: 1000 };
const MAX_LINKS = 4;

function countUrls(text) {
  const urlPattern = /(https?:\/\/|www\.)\S+/gi;
  return ((text || '').match(urlPattern) || []).length;
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

  // Honeypot: bots that fill this hidden field get a fake success.
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
      response: String(token),
      ...(remoteip ? { remoteip } : {}),
    }),
  });
  const verifyJson = await verifyRes.json().catch(() => ({ success: false }));
  if (!verifyJson.success) {
    return res.status(400).json({ error: 'Verification failed. Please try again.' });
  }

  const type = String(body.type || '').trim();
  if (!ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Invalid feedback.' });
  }

  const message = String(body.message == null ? '' : body.message).trim();
  const listingRef = String(body.listing_ref == null ? '' : body.listing_ref).trim();
  const correction = String(body.correction == null ? '' : body.correction).trim();

  if (!message) {
    return res.status(400).json({ error: 'Please add a message.', field: 'message' });
  }
  for (const [field, value] of [['message', message], ['listing_ref', listingRef], ['correction', correction]]) {
    if (value.length > LIMITS[field]) {
      return res.status(400).json({ error: 'That is too long. Please shorten it.', field });
    }
  }
  if (countUrls(message) + countUrls(listingRef) + countUrls(correction) > MAX_LINKS) {
    return res.status(400).json({ error: 'Please limit the number of links.', field: 'message' });
  }

  const payload = {
    type,
    listing_ref: type === 'issue' && listingRef ? listingRef : null,
    message,
    correction: type === 'issue' && correction ? correction : null,
    // The form never asks for contact details.
    contact: null,
    city_slug: ALLOWED_CITY_SLUGS.includes(body.city_slug) ? body.city_slug : 'other',
  };

  const insertRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/feedback`, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (!insertRes.ok) {
    const errText = await insertRes.text().catch(() => '');
    console.error('feedback insert failed', { status: insertRes.status, body: errText });
    return res.status(500).json({ error: 'Something went wrong sending your note. Please try again.' });
  }

  return res.status(200).json({ success: true });
}
