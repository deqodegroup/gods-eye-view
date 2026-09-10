/**
 * ADS-B LOL military aircraft proxy.
 * GET /api/adsblol/mil
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const upstream = await fetch('https://api.adsb.lol/v2/mil', {
      signal: AbortSignal.timeout(12000),
      headers: { Accept: 'application/json', 'User-Agent': 'deqode-earth-adsblol-proxy/1.0' },
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `adsb.lol returned HTTP ${upstream.status}` });
      return;
    }

    const data = await upstream.json();
    res.status(200)
      .setHeader('Content-Type', 'application/json')
      .setHeader('Cache-Control', 'no-store')
      .json(data);
  } catch (err) {
    const isTimeout = err?.name === 'AbortError' || err?.name === 'TimeoutError';
    res.status(isTimeout ? 504 : 502).json({ error: err?.message || 'adsb.lol mil proxy error' });
  }
}
