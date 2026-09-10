/**
 * Open-Meteo weather effects proxy.
 * GET /api/weather-effects?latitude=&longitude=
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method Not Allowed' }); return; }

  const lat = Number(req.query.latitude);
  const lon = Number(req.query.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) { res.status(400).json({ error: 'Missing latitude/longitude' }); return; }

  const params = new URLSearchParams({ latitude: lat, longitude: lon, current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,precipitation,cloud_cover,visibility', timezone: 'auto' });

  try {
    const upstream = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: AbortSignal.timeout(10000) });
    if (!upstream.ok) { res.status(upstream.status).json({ error: `Open-Meteo returned HTTP ${upstream.status}` }); return; }
    const data = await upstream.json();
    const c = data.current || {};
    res.status(200).setHeader('Content-Type', 'application/json').setHeader('Cache-Control', 'public, max-age=600').json({ status: 'ok', retrievedAt: new Date().toISOString(), coordinates: { lat, lon }, weather: { temperature: c.temperature_2m ?? null, humidity: c.relative_humidity_2m ?? null, windSpeed: c.wind_speed_10m ?? null, windDirection: c.wind_direction_10m ?? null, weatherCode: c.weather_code ?? null, precipitation: c.precipitation ?? null, cloudCover: c.cloud_cover ?? null, visibility: c.visibility ?? null } });
  } catch (err) {
    const isTimeout = err?.name === 'AbortError' || err?.name === 'TimeoutError';
    res.status(isTimeout ? 504 : 502).json({ error: err?.message || 'Weather effects proxy error' });
  }
}
