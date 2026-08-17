// Deletes a stock/status update the same visitor just submitted via
// submit-update.js. No Turnstile here on purpose - undoing your own recent
// action should stay instant/frictionless; the client_token is what
// actually stops a stranger from deleting an arbitrary row just by
// guessing/scraping a UUID, which is what mattered once event_updates'
// RLS insert/delete policies got locked down to service-role-only.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ error: 'Invalid request body.' }); }
  }
  body = body || {};

  // event_updates.id is a bigint/serial primary key (unlike listings.id,
  // which is a UUID) - the client_token, not the id's format, is what
  // actually gates this.
  const id = Number(body.id);
  const clientToken = String(body.client_token || '').trim();
  if (!Number.isInteger(id) || id <= 0 || !clientToken) {
    return res.status(400).json({ error: 'Invalid request.' });
  }

  const headers = {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  const lookupRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/event_updates?id=eq.${id}&select=id,client_token,image_url`,
    { headers }
  );
  if (!lookupRes.ok) {
    return res.status(500).json({ error: "Couldn't undo your report. Try again in a moment." });
  }
  const [row] = await lookupRes.json();
  if (!row || row.client_token !== clientToken) {
    return res.status(403).json({ error: "That update can't be undone." });
  }

  const deleteRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/event_updates?id=eq.${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!deleteRes.ok) {
    return res.status(500).json({ error: "Couldn't undo your report. Try again in a moment." });
  }

  if (row.image_url) {
    const marker = '/event-update-photos/';
    const idx = row.image_url.indexOf(marker);
    if (idx !== -1) {
      const path = row.image_url.slice(idx + marker.length);
      await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/event-update-photos/${path}`, {
        method: 'DELETE',
        headers,
      }).catch(() => {});
    }
  }

  return res.status(200).json({ success: true });
}
