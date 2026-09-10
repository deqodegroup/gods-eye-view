/**
 * Re:Earth terrain heights proxy.
 * GET /api/terrain/heights?points=lon,lat;lon,lat;...
 * Max 256 points.
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const raw = String(req.query.points || '').trim();
  if (!raw) {
    res.status(400).json({ error: 'Missing points parameter' });
    return;
  }

  const pairs = raw.split(';').filter(Boolean);
  if (pairs.length > 256) {
    res.status(400).json({ error: 'Max 256 points per request' });
    return;
  }

  const locations = [];
  for (const pair of pairs) {
    const [lonStr, latStr] = pair.split(',');
    const lon = Number(lonStr);
    const lat = Number(latStr);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      res.status(400).json({ error: `Invalid coordinate pair: ${pair}` });
      return;
    }
    locations.push({ longitude: lon, latitude: lat });
  }

  try {
    const upstream = await fetch('https://terrain.reearth.land/heights.json', {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'deqode-earth-terrain-proxy/1.0' },
      body: JSON.stringify({ locations }),
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Terrain API returned HTTP ${upstream.status}` });
      return;
    }

    const data = await upstream.json();
    res.status(200)
      .setHeader('Content-Type', 'application/json')
      .setHeader('Cache-Control', 'public, max-age=86400')
      .json(data);
  } catch (err) {
    const isTimeout = err?.name === 'AbortError' || err?.name === 'TimeoutError';
    res.status(isTimeout ? 504 : 502).json({ error: err?.message || 'Terrain proxy error' });
  }
}
