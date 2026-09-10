/**
 * Google Places nearby search proxy.
 * GET /api/google/nearby-places?lat=&lon=&radiusM=
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method Not Allowed' }); return; }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) { res.status(503).json({ error: 'GOOGLE_MAPS_API_KEY not configured', places: [] }); return; }

  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const radiusM = Math.min(Number(req.query.radiusM || 500), 50000);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    res.status(400).json({ error: 'Invalid lat/lon', places: [] });
    return;
  }

  try {
    const upstream = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      signal: AbortSignal.timeout(12000),
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.types,places.formattedAddress,places.rating' },
      body: JSON.stringify({ locationRestriction: { circle: { center: { latitude: lat, longitude: lon }, radius: radiusM } }, maxResultCount: 20 }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      res.status(upstream.status).json({ error: err, places: [] });
      return;
    }

    const data = await upstream.json();
    res.status(200).setHeader('Content-Type', 'application/json').setHeader('Cache-Control', 'public, max-age=300').json({ places: data.places || [] });
  } catch (err) {
    res.status(502).json({ error: err?.message || 'Google Places proxy error', places: [] });
  }
}
