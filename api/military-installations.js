/**
 * Military installations proxy (Overpass).
 * GET /api/military-installations?minLon=&minLat=&maxLon=&maxLat=
 * Max 10° span per axis.
 */

const MIRRORS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const MAX_SPAN = 10;

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method Not Allowed' }); return; }

  const minLon = Number(req.query.minLon), minLat = Number(req.query.minLat);
  const maxLon = Number(req.query.maxLon), maxLat = Number(req.query.maxLat);

  if ([minLon, minLat, maxLon, maxLat].some((v) => !Number.isFinite(v))) {
    res.status(400).json({ error: 'Missing or invalid bbox parameters' });
    return;
  }
  if (maxLon - minLon > MAX_SPAN || maxLat - minLat > MAX_SPAN) {
    res.status(400).json({ error: `Bounding box too large — max ${MAX_SPAN}° per axis` });
    return;
  }

  const bbox = `${minLat},${minLon},${maxLat},${maxLon}`;
  const ql = `[out:json][timeout:20];(node["landuse"="military"](${bbox});way["landuse"="military"](${bbox});relation["landuse"="military"](${bbox});node["military"](${bbox});way["military"](${bbox}););out center tags;`;

  for (const mirror of MIRRORS) {
    try {
      const upstream = await fetch(mirror, {
        method: 'POST',
        signal: AbortSignal.timeout(25000),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'deqode-earth-military-proxy/1.0' },
        body: `data=${encodeURIComponent(ql)}`,
      });
      if (!upstream.ok) continue;

      const data = await upstream.json();
      const features = (data.elements || []).map((el) => {
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        return { id: el.id, type: el.type, lat, lon, tags: el.tags || {}, name: el.tags?.name || '', military: el.tags?.military || el.tags?.landuse || '' };
      }).filter((f) => f.lat !== undefined && f.lon !== undefined);

      res.status(200).setHeader('Content-Type', 'application/json').setHeader('Cache-Control', 'public, max-age=3600').json({ status: 'ok', bbox: { minLon, minLat, maxLon, maxLat }, count: features.length, features });
      return;
    } catch { continue; }
  }

  res.status(502).json({ error: 'Military installations query failed' });
}
