// Receives Content-Security-Policy violation reports. The site's policy is in
// report-only mode (vercel.json), so nothing is blocked: browsers just post a
// short report here whenever a page uses something the policy does not list.
// This endpoint only writes one trimmed log line per report (visible in the
// Vercel function logs) and stores nothing. It reads no cookies and no
// database.
//
// Browsers send either {"csp-report": {...}} (report-uri) or an array of
// {"type": "csp-violation", "body": {...}} (Reporting API).

const KEEP = [
  'effective-directive', 'violated-directive', 'blocked-uri', 'blockedURL',
  'document-uri', 'documentURL', 'source-file', 'sourceFile',
  'line-number', 'lineNumber', 'disposition',
];

function clip(value) {
  return typeof value === 'string' ? value.slice(0, 300) : value;
}

function trim(report) {
  const out = {};
  for (const key of KEEP) {
    if (report && report[key] != null) out[key] = clip(report[key]);
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }

  const reports = [];
  if (body && body['csp-report']) reports.push(body['csp-report']);
  else if (Array.isArray(body)) body.forEach((r) => { if (r && r.body) reports.push(r.body); });

  // At most five lines per request, so one noisy page cannot flood the logs.
  reports.slice(0, 5).forEach((r) => console.log('csp-violation', JSON.stringify(trim(r))));

  return res.status(204).end();
}
