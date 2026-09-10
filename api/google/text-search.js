/**
 * Google Places text search proxy.
 * GET /api/google/text-search?q=&lat=&lon=&radiusM=
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method Not Allowed' }); return; }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) { res.status(503).json({ error: 'GOOGLE_MAPS_API_KEY not configured', places: [] }); return; }

  const q = String(req.query.q || '').trim();
  if (!q) { res.status(400).json({ error: 'Missing query parameter q', places: [] }); return; }

  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const radiusM = Math.min(Number(req.query.radiusM || 5000), 50000);

  const body = { textQuery: q, maxResultCount: 20 };
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    body.locationBias = { circle: { center: { latitude: lat, longitude: lon }, radius: radiusM } };
  }

  try {
    const upstream = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      signal: AbortSignal.timeout(12000),
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.types,places.formattedAddress,places.rating,places.viewport' },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      res.status(upstream.status).json({ error: err, places: [] });
      return;
    }

    const data = await upstream.json();
    res.status(200).setHeader('Content-Type', 'application/json').setHeader('Cache-Control', 'public, max-age=300').json({ places: data.places || [], viewport: data.contextualContents?.[0]?.viewport || null });
  } catch (err) {
    res.status(502).json({ error: err?.message || 'Google Places text search error', places: [] });
  }
}
