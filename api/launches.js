/**
 * Launch Library 2 rocket launches proxy.
 * GET /api/launches
 * 30-day window, optional LL2_API_TOKEN.
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const end = new Date();
  const start = new Date(end.getTime() - 30 * 86400000);

  const url = new URL('https://ll.thespacedevs.com/2.3.0/launches/');
  url.searchParams.set('net__gte', start.toISOString());
  url.searchParams.set('net__lte', end.toISOString());
  url.searchParams.set('limit', '100');
  url.searchParams.set('mode', 'detailed');

  const headers = { Accept: 'application/json', 'User-Agent': 'deqode-earth-launches-proxy/1.0' };
  const token = process.env.LL2_API_TOKEN;
  if (token) headers['Authorization'] = `Token ${token}`;

  try {
    const upstream = await fetch(url.toString(), {
      signal: AbortSignal.timeout(20000),
      headers,
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `LL2 returned HTTP ${upstream.status}` });
      return;
    }

    const data = await upstream.json();
    res.status(200)
      .setHeader('Content-Type', 'application/json')
      .setHeader('Cache-Control', 'public, max-age=1800')
      .json(data);
  } catch (err) {
    const isTimeout = err?.name === 'AbortError' || err?.name === 'TimeoutError';
    res.status(isTimeout ? 504 : 502).json({ error: err?.message || 'Launches proxy error' });
  }
}
