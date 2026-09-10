/**
 * NASA FIRMS fire hotspots proxy.
 * GET /api/firms
 * Fetches from 3 VIIRS sources and merges results.
 */

const FIRMS_BASE = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';
const SOURCES = ['VIIRS_SNPP_NRT', 'VIIRS_NOAA20_NRT', 'VIIRS_NOAA21_NRT'];
const WORLD_BBOX = '-180,-90,180,90';
const DAY_RANGE = 1;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const key = process.env.FIRMS_MAP_KEY;
  if (!key) {
    res.status(503).json({ error: 'FIRMS_MAP_KEY not configured' });
    return;
  }

  try {
    const results = await Promise.allSettled(
      SOURCES.map((src) =>
        fetch(`${FIRMS_BASE}/${key}/${src}/${WORLD_BBOX}/${DAY_RANGE}`, {
          signal: AbortSignal.timeout(20000),
          headers: { 'User-Agent': 'deqode-earth-firms-proxy/1.0' },
        }).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      )
    );

    const csvBlocks = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value);

    if (!csvBlocks.length) {
      res.status(502).json({ error: 'All FIRMS sources failed' });
      return;
    }

    // Merge CSVs: keep header from first, strip headers from rest
    const merged = csvBlocks
      .map((csv, i) => (i === 0 ? csv : csv.split('\n').slice(1).join('\n')))
      .join('\n');

    res.status(200)
      .setHeader('Content-Type', 'text/csv')
      .setHeader('Cache-Control', 'public, max-age=3600')
      .send(merged);
  } catch (err) {
    res.status(502).json({ error: err?.message || 'FIRMS proxy error' });
  }
}
