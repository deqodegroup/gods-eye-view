/**
 * CelesTrak TLE proxy.
 * GET /api/celestrak/{group}
 * e.g. /api/celestrak/active, /api/celestrak/stations
 */

export default async function handler(req, res) {
  const { group } = req.query;

  if (!group || !/^[a-z0-9-]+$/i.test(group)) {
    res.status(400).json({ error: 'Invalid group name' });
    return;
  }

  const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${encodeURIComponent(group)}&FORMAT=tle`;

  try {
    const upstream = await fetch(url, {
      signal: AbortSignal.timeout(20000),
      headers: { 'User-Agent': 'deqode-earth-celestrak-proxy/1.0' },
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `CelesTrak returned HTTP ${upstream.status}` });
      return;
    }

    const body = await upstream.text();
    res.status(200)
      .setHeader('Content-Type', 'text/plain')
      .setHeader('Cache-Control', 'public, max-age=3600')
      .send(body);
  } catch (err) {
    const isTimeout = err?.name === 'AbortError' || err?.name === 'TimeoutError';
    res.status(isTimeout ? 504 : 502).json({ error: err?.message || 'CelesTrak proxy error' });
  }
}
