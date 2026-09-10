/**
 * OpenSky flight track history proxy.
 * GET /api/opensky-track?icao24={hex}
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const icao24 = String(req.query.icao24 || '').toLowerCase().trim();
  if (!/^[0-9a-f]{6}$/.test(icao24)) {
    res.status(400).json({ error: 'Invalid icao24 — must be 6 hex characters' });
    return;
  }

  const url = `https://opensky-network.org/api/tracks/all?icao24=${icao24}&time=0`;

  try {
    const upstream = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { Accept: 'application/json', 'User-Agent': 'deqode-earth-opensky-track-proxy/1.0' },
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `OpenSky returned HTTP ${upstream.status}` });
      return;
    }

    const data = await upstream.json();
    res.status(200)
      .setHeader('Content-Type', 'application/json')
      .setHeader('Cache-Control', 'public, max-age=60')
      .json(data);
  } catch (err) {
    const isTimeout = err?.name === 'AbortError' || err?.name === 'TimeoutError';
    res.status(isTimeout ? 504 : 502).json({ error: err?.message || 'OpenSky track proxy error' });
  }
}
