// Handles advertise inquiry submissions server-side so Turnstile
// verification and content filtering can't be bypassed by posting directly
// to Supabase with the public anon key. The corresponding RLS insert policy
// on `feedback` should be locked down so this endpoint (using the service
// role key) is the only way a new pending inquiry gets created.

// Small curated list of common disposable/temporary email providers.
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.info', 'guerrillamail.biz',
  'guerrillamail.de', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com',
  '10minutemail.com', '10minutemail.net', '20minutemail.com', 'temp-mail.org', 'temp-mail.io',
  'tempmail.com', 'tempmail.net', 'tempmailo.com', 'tempmail.dev', 'tempail.com', 'tempemail.co',
  'throwawaymail.com', 'yopmail.com', 'yopmail.net', 'yopmail.fr', 'trashmail.com', 'trashmail.net',
  'trash-mail.com', 'dispostable.com', 'getnada.com', 'nada.email', 'sharklasers.com', 'grr.la',
  'maildrop.cc', 'mintemail.com', 'emailondeck.com', 'fakeinbox.com', 'fakemailgenerator.com',
  'mailnesia.com', 'mailcatch.com', 'mytemp.email', 'moakt.com', 'mohmal.com', 'spamgourmet.com',
  'spam4.me', 'discard.email', 'discardmail.com', 'tempinbox.com', 'emailfake.com', 'crazymailing.com',
  'burnermail.io', 'inboxbear.com', 'mail-temp.com', 'mailtemp.info', 'anonaddy.com', 'armyspy.com',
  'cuvox.de', 'dayrep.com', 'einrot.com', 'fleckens.hu', 'gustr.com', 'jourrapide.com', 'rhyta.com',
  'superrito.com', 'teleworm.us', 'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org',
]);

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
      secret: process.env.TURNSTILE_SECRET_KEY || '',
      response: token,
      ...(remoteip ? { remoteip } : {}),
    }),
  });
  const verifyJson = await verifyRes.json().catch(() => ({ success: false }));
  if (!verifyJson.success) {
    return res.status(400).json({ error: 'Verification failed. Please try again.' });
  }

  const brand = String(body.brand || '').trim();
  const message = String(body.message || '').trim();
  const contact = String(body.contact || '').trim();
  const placement = String(body.placement || '').trim();

  if (!brand || !message || !contact) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  if (countUrls(brand) > 0) {
    return res.status(400).json({ error: 'Brand or business name cannot contain a link.', field: 'brand' });
  }
  if (countUrls(message) > 1) {
    return res.status(400).json({ error: 'Please limit your message to one link.', field: 'message' });
  }
  if (countUrls(contact) > 1) {
    return res.status(400).json({ error: 'Please limit your email to one link.', field: 'contact' });
  }

  const emailMatch = contact.match(/^[^\s@]+@([^\s@]+\.[^\s@]+)$/);
  if (!emailMatch) {
    return res.status(400).json({ error: 'Please enter a valid email address.', field: 'contact' });
  }
  const domain = emailMatch[1].toLowerCase();
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return res.status(400).json({ error: 'Please use a permanent email address.', field: 'contact' });
  }

  const payload = {
    type: 'advertise',
    listing_ref: brand,
    message: `Placement interest: ${placement || 'Not specified'}\n\n${message}`,
    correction: null,
    contact,
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
    return res.status(500).json({ error: 'Something went wrong sending your inquiry. Please try again.' });
  }

  return res.status(200).json({ success: true });
}
