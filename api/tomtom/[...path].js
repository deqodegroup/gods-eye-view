/**
 * TomTom traffic tiles proxy.
 * GET /api/tomtom/status              — key status + daily budget
 * GET /api/tomtom/flow/{z}/{x}/{y}.pbf — traffic vector tiles
 */

let dailyCount = 0;
let dailyDate = '';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function checkBudget() {
  const today = todayStr();
  if (dailyDate !== today) { dailyCount = 0; dailyDate = today; }
  const budget = Number(process.env.TOMTOM_DAILY_TILE_BUDGET || 40000);
  return { dailyCount, budget, date: today, ok: dailyCount < budget };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const pathParts = Array.isArray(req.query.path) ? req.query.path : [req.query.path].filter(Boolean);
  const apiKey = process.env.TOMTOM_API_KEY;

  // /status
  if (pathParts[0] === 'status') {
    const { dailyCount: dc, budget, date } = checkBudget();
    res.status(200).json({ hasKey: !!apiKey, dailyCount: dc, budget, date });
    return;
  }

  // /flow/{z}/{x}/{y}.pbf
  if (pathParts[0] === 'flow') {
    if (!apiKey) {
      res.status(503).json({ error: 'TOMTOM_API_KEY not configured' });
      return;
    }

    const { ok, dailyCount: dc, budget } = checkBudget();
    if (!ok) {
      res.status(429).json({ error: `TomTom daily tile budget exhausted (${dc}/${budget})` });
      return;
    }

    const [, z, x, yPbf] = pathParts;
    const y = String(yPbf || '').replace(/\.pbf$/i, '');
    if (!z || !x || !y) {
      res.status(400).json({ error: 'Missing z/x/y tile coordinates' });
      return;
    }

    const url = `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/${z}/${x}/${y}.pbf?key=${apiKey}&tileSize=512`;

    try {
      const upstream = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!upstream.ok) {
        res.status(upstream.status).json({ error: `TomTom returned HTTP ${upstream.status}` });
        return;
      }
      dailyCount++;
      const buf = await upstream.arrayBuffer();
      res.status(200)
        .setHeader('Content-Type', 'application/x-protobuf')
        .setHeader('Cache-Control', 'public, max-age=120')
        .send(Buffer.from(buf));
    } catch (err) {
      const isTimeout = err?.name === 'AbortError' || err?.name === 'TimeoutError';
      res.status(isTimeout ? 504 : 502).json({ error: err?.message || 'TomTom tile proxy error' });
    }
    return;
  }

  res.status(404).json({ error: 'Unknown TomTom route' });
}
