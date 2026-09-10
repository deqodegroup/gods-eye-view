/**
 * Regional brief proxy.
 * GET /api/regional-brief?latitude=&longitude=
 * Combines Nominatim reverse-geocode + Open-Meteo weather + Google News RSS.
 */

const NOMINATIM_DELAY_MS = 1100;
let lastNominatimCall = 0;

async function reverseGeocode(lat, lon) {
  const now = Date.now();
  const wait = NOMINATIM_DELAY_MS - (now - lastNominatimCall);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastNominatimCall = Date.now();

  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2`;
  const r = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'deqode-earth-regional-brief/1.0', Accept: 'application/json' } });
  if (!r.ok) throw new Error(`Nominatim HTTP ${r.status}`);
  return r.json();
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({ latitude: lat, longitude: lon, current: 'temperature_2m,wind_speed_10m,weather_code,precipitation', timezone: 'auto' });
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`Open-Meteo HTTP ${r.status}`);
  return r.json();
}

async function fetchNews(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en&gl=US&ceid=US:en`;
  const r = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'deqode-earth-regional-brief/1.0' } });
  if (!r.ok) return [];
  const xml = await r.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5);
  return items.map((m) => {
    const title = m[1].match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || m[1].match(/<title>(.*?)<\/title>/)?.[1] || '';
    const link = m[1].match(/<link>(.*?)<\/link>/)?.[1] || '';
    const pubDate = m[1].match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
    return { title: title.trim(), link: link.trim(), pubDate: pubDate.trim() };
  });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method Not Allowed' }); return; }

  const lat = Number(req.query.latitude);
  const lon = Number(req.query.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) { res.status(400).json({ error: 'Missing latitude/longitude' }); return; }

  const [geoResult, weatherResult] = await Promise.allSettled([reverseGeocode(lat, lon), fetchWeather(lat, lon)]);

  let place = null, placeStatus = 'error';
  if (geoResult.status === 'fulfilled') {
    const g = geoResult.value;
    place = { country: g.address?.country || '', countryCode: g.address?.country_code?.toUpperCase() || '', city: g.address?.city || g.address?.town || g.address?.village || '', displayName: g.display_name || '' };
    placeStatus = 'ok';
  }

  let weather = null, weatherStatus = 'error';
  if (weatherResult.status === 'fulfilled') {
    const w = weatherResult.value?.current || {};
    weather = { temperature: w.temperature_2m ?? null, windSpeed: w.wind_speed_10m ?? null, weatherCode: w.weather_code ?? null, precipitation: w.precipitation ?? null };
    weatherStatus = 'ok';
  }

  const newsQuery = place?.city ? `${place.city} ${place.country}` : (place?.country || 'climate news');
  let articles = [], newsStatus = 'error';
  try { articles = await fetchNews(newsQuery); newsStatus = 'ok'; } catch { /* skip */ }

  res.status(200).setHeader('Content-Type', 'application/json').setHeader('Cache-Control', 'public, max-age=600').json({ status: 'ok', retrievedAt: new Date().toISOString(), coordinates: { lat, lon }, place, placeStatus, weather, weatherStatus, newsStatus, articles });
}
