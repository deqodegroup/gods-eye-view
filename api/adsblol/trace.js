/**
 * ADS-B LOL flight trace proxy.
 * GET /api/adsblol/trace?hex={icao24}
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const hex = String(req.query.hex || '').toLowerCase().trim();
  if (!/^[0-9a-f]{6}$/.test(hex)) {
    res.status(400).json({ error: 'Invalid hex — must be 6 hex characters' });
    return;
  }

  const url = `https://adsb.lol/data/traces/${hex.slice(-2)}/trace_full_${hex}.json`;

  try {
    const upstream = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { Accept: 'application/json', 'User-Agent': 'deqode-earth-adsblol-proxy/1.0' },
    });

    if (upstream.status === 404) {
      res.status(200).json({ found: false });
      return;
    }

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `adsb.lol returned HTTP ${upstream.status}` });
      return;
    }

    const data = await upstream.json();
    res.status(200)
      .setHeader('Content-Type', 'application/json')
      .setHeader('Cache-Control', 'public, max-age=60')
      .json(data);
  } catch (err) {
    const isTimeout = err?.name === 'AbortError' || err?.name === 'TimeoutError';
    res.status(isTimeout ? 504 : 502).json({ error: err?.message || 'adsb.lol trace proxy error' });
  }
}
