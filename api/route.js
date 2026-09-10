/**
 * OSRM routing proxy.
 * GET /api/route?profile=foot|car|bike&coords=lon1,lat1;lon2,lat2;...
 * 2-12 coordinates, max leg 500km, max total 2000km.
 */

const PROFILES = { foot: 'foot', car: 'car', bike: 'bike' };
const OSRM_PROFILES = { foot: 'foot', car: 'car', bike: 'bike' };
const MAX_COORDS = 12;
const MAX_LEG_KM = 500;
const MAX_TOTAL_KM = 2000;
const R = 6371;

function haversineKm(a, b) {
  const dLat = (b[1] - a[1]) * Math.PI / 180;
  const dLon = (b[0] - a[0]) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method Not Allowed' }); return; }

  const profile = PROFILES[String(req.query.profile || 'foot').toLowerCase()] || 'foot';
  const osrmProfile = OSRM_PROFILES[profile];
  const rawCoords = String(req.query.coords || '').trim();

  if (!rawCoords) { res.status(400).json({ error: 'Missing coords parameter' }); return; }

  const pairs = rawCoords.split(';').filter(Boolean);
  if (pairs.length < 2 || pairs.length > MAX_COORDS) {
    res.status(400).json({ error: `coords must have 2-${MAX_COORDS} points` });
    return;
  }

  const coords = [];
  for (const pair of pairs) {
    const [lonStr, latStr] = pair.split(',');
    const lon = Number(lonStr), lat = Number(latStr);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) { res.status(400).json({ error: `Invalid coordinate: ${pair}` }); return; }
    coords.push([lon, lat]);
  }

  let totalKm = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const legKm = haversineKm(coords[i], coords[i + 1]);
    if (legKm > MAX_LEG_KM) { res.status(400).json({ error: `Leg ${i + 1} exceeds ${MAX_LEG_KM}km limit` }); return; }
    totalKm += legKm;
  }
  if (totalKm > MAX_TOTAL_KM) { res.status(400).json({ error: `Total route exceeds ${MAX_TOTAL_KM}km limit` }); return; }

  const coordStr = coords.map(([lon, lat]) => `${lon},${lat}`).join(';');
  const url = `https://routing.openstreetmap.de/routed-${osrmProfile}/route/v1/${osrmProfile}/${coordStr}?overview=full&geometries=geojson`;

  try {
    const upstream = await fetch(url, {
      signal: AbortSignal.timeout(20000),
      headers: { Accept: 'application/json', 'User-Agent': 'deqode-earth-route-proxy/1.0' },
    });

    if (!upstream.ok) { res.status(upstream.status).json({ error: `OSRM returned HTTP ${upstream.status}` }); return; }

    const data = await upstream.json();
    const route = data?.routes?.[0];
    res.status(200)
      .setHeader('Content-Type', 'application/json')
      .setHeader('Cache-Control', 'public, max-age=3600')
      .json({ ok: !!route, profile, distanceM: route?.distance || 0, durationS: route?.duration || 0, geometry: route?.geometry || null });
  } catch (err) {
    const isTimeout = err?.name === 'AbortError' || err?.name === 'TimeoutError';
    res.status(isTimeout ? 504 : 502).json({ error: err?.message || 'OSRM routing proxy error' });
  }
}
