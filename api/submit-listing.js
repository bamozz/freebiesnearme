// Handles listing submissions server-side so Turnstile verification and
// content filtering can't be bypassed by posting directly to Supabase with
// the public anon key. The corresponding RLS insert policy on `listings`
// should be locked down so this endpoint (using the service role key) is
// the only way a new pending listing gets created.

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
      secret: process.env.TURNSTILE_SECRET || '',
      response: token,
      ...(remoteip ? { remoteip } : {}),
    }),
  });
  const verifyJson = await verifyRes.json().catch(() => ({ success: false }));
  if (!verifyJson.success) {
    return res.status(400).json({ error: 'Verification failed. Please try again.' });
  }

  const payloads = Array.isArray(body.payloads) ? body.payloads : null;
  if (!payloads || !payloads.length) {
    return res.status(400).json({ error: 'Missing listing details.' });
  }

  for (const p of payloads) {
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
  }

  // Rebuild the payload from scratch server-side rather than trusting the
  // client for anything security- or moderation-relevant.
  const finalPayloads = payloads.map(p => ({
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
    sponsored: false,
    image_url: p.image_url || null,
    insta_url: p.insta_url || null,
    group_id: p.group_id || null,
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
    return res.status(500).json({ error: 'Something went wrong submitting your listing. Please try again.' });
  }

  return res.status(200).json({ success: true, count: finalPayloads.length });
}
