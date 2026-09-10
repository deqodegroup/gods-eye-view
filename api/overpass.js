/**
 * Overpass QL proxy.
 * POST /api/overpass
 * Tries multiple mirrors. Sanitizes QL query.
 */

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
const MAX_BODY_BYTES = 64 * 1024;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

function sanitizeQL(query) {
  if (typeof query !== 'string') return null;
  if (query.length > MAX_BODY_BYTES) return null;
  // Must have a bbox or area filter
  if (!query.includes('bbox') && !query.includes('area') && !query.match(/\(\s*-?\d/)) return null;
  // Cap timeout
  return query.replace(/\[timeout:\d+\]/, '[timeout:20]');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) { res.status(413).json({ error: 'Request body too large' }); return; }
    chunks.push(chunk);
  }

  let query;
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString());
    query = body.query || body.data || '';
  } catch {
    query = Buffer.concat(chunks).toString();
  }

  const sanitized = sanitizeQL(query);
  if (!sanitized) {
    res.status(400).json({ error: 'Invalid or missing Overpass QL query' });
    return;
  }

  for (const mirror of MIRRORS) {
    try {
      const upstream = await fetch(mirror, {
        method: 'POST',
        signal: AbortSignal.timeout(25000),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'deqode-earth-overpass-proxy/1.0' },
        body: `data=${encodeURIComponent(sanitized)}`,
      });

      if (!upstream.ok) continue;

      const contentLength = Number(upstream.headers.get('content-length'));
      if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
        res.status(502).json({ error: 'Overpass response too large' });
        return;
      }

      const text = await upstream.text();
      if (text.length > MAX_RESPONSE_BYTES) {
        res.status(502).json({ error: 'Overpass response too large' });
        return;
      }

      res.status(200)
        .setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
        .setHeader('Cache-Control', 'public, max-age=300')
        .send(text);
      return;
    } catch { continue; }
  }

  res.status(502).json({ error: 'All Overpass mirrors failed' });
}
