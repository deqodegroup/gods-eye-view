/**
 * OpenSky Network flights proxy.
 * GET /api/opensky
 * Supports OPENSKY_AUTH_MODE: anon (default) | basic | auto
 * Falls back to adsb.lol regional if rate-limited and lat/lon provided.
 */

function normalizeAuthMode(raw) {
  const mode = String(raw || '').toLowerCase().trim();
  if (mode === 'basic' || mode === 'auto') return mode;
  return 'anon';
}

function buildAuthHeader(mode) {
  if (mode === 'anon') return {};
  const user = process.env.OPENSKY_USERNAME || '';
  const pass = process.env.OPENSKY_PASSWORD || '';
  if (!user || !pass) return {};
  const b64 = Buffer.from(`${user}:${pass}`).toString('base64');
  return { Authorization: `Basic ${b64}` };
}

async function fetchAdsbLolFallback(lat, lon) {
  const url = `https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/250`;
  const upstream = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    headers: { Accept: 'application/json', 'User-Agent': 'deqode-earth-opensky-proxy/1.0' },
  });
  if (!upstream.ok) throw new Error(`adsb.lol fallback HTTP ${upstream.status}`);
  return upstream.json();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const mode = normalizeAuthMode(process.env.OPENSKY_AUTH_MODE);
  const authHeaders = buildAuthHeader(mode);
  const lat = req.query.lat ? Number(req.query.lat) : null;
  const lon = req.query.lon ? Number(req.query.lon) : null;

  const openSkyUrl = new URL('https://opensky-network.org/api/states/all');
  openSkyUrl.searchParams.set('extended', '1');

  try {
    const upstream = await fetch(openSkyUrl.toString(), {
      signal: AbortSignal.timeout(15000),
      headers: { Accept: 'application/json', 'User-Agent': 'deqode-earth-opensky-proxy/1.0', ...authHeaders },
    });

    if (upstream.status === 429 || upstream.status === 403) {
      // Rate limited — try adsb.lol fallback if coords provided
      if (lat !== null && lon !== null && Number.isFinite(lat) && Number.isFinite(lon)) {
        const fallback = await fetchAdsbLolFallback(lat, lon);
        res.status(200)
          .setHeader('Content-Type', 'application/json')
          .setHeader('Cache-Control', 'no-store')
          .setHeader('X-Data-Source', 'adsb-lol-fallback')
          .json(fallback);
        return;
      }
      res.status(429).json({ error: 'OpenSky rate limited, no fallback coordinates provided' });
      return;
    }

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `OpenSky returned HTTP ${upstream.status}` });
      return;
    }

    const data = await upstream.json();
    res.status(200)
      .setHeader('Content-Type', 'application/json')
      .setHeader('Cache-Control', 'no-store')
      .setHeader('X-Data-Source', 'opensky')
      .json(data);
  } catch (err) {
    const isTimeout = err?.name === 'AbortError' || err?.name === 'TimeoutError';
    res.status(isTimeout ? 504 : 502).json({ error: err?.message || 'OpenSky proxy error' });
  }
}
