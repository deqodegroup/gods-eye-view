/**
 * Radio Browser API proxy.
 * GET  /api/radio/stations       — station catalog
 * POST /api/radio/click/{uuid}   — click counter (fire-and-forget)
 */

const MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://de2.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
];
const STATION_LIMIT = 2000;

function pickMirror() {
  return MIRRORS[Math.floor(Math.random() * MIRRORS.length)];
}

async function fetchStations() {
  const mirror = pickMirror();
  const params = new URLSearchParams({ limit: String(STATION_LIMIT), order: 'clickcount', reverse: 'true', hidebroken: 'true' });
  const upstream = await fetch(`${mirror}/json/stations/search?${params}`, {
    signal: AbortSignal.timeout(12000),
    headers: { Accept: 'application/json', 'User-Agent': 'deqode-earth-radio-proxy/1.0' },
  });
  if (!upstream.ok) throw new Error(`Radio Browser HTTP ${upstream.status}`);
  return upstream.json();
}

function publicStation(s) {
  return { id: s.stationuuid || s.id, name: s.name, url: s.url_resolved || s.url, homepage: s.homepage, favicon: s.favicon, country: s.country, countrycode: s.countrycode, language: s.language, tags: s.tags, codec: s.codec, bitrate: s.bitrate, clickCount: s.clickcount || 0 };
}

export default async function handler(req, res) {
  const pathParts = Array.isArray(req.query.path) ? req.query.path : [req.query.path].filter(Boolean);
  const pathname = pathParts.join('/');

  if (pathname === 'stations') {
    if (req.method !== 'GET') { res.status(405).end(); return; }
    try {
      const rows = await fetchStations();
      const stations = Array.isArray(rows) ? rows.map(publicStation) : [];
      res.status(200).setHeader('Content-Type', 'application/json').setHeader('Cache-Control', 'public, max-age=1800').json({ stations, updatedAt: new Date().toISOString(), stale: false, degraded: false });
    } catch (err) {
      res.status(503).json({ error: 'Radio directory temporarily unavailable', degraded: true, degradedReason: err?.message || 'fetch-failed' });
    }
    return;
  }

  if (pathname.startsWith('click/')) {
    if (req.method !== 'POST') { res.status(405).end(); return; }
    const id = pathParts[1]?.toLowerCase() || '';
    if (/^[0-9a-f-]+$/.test(id)) {
      fetch(`${pickMirror()}/json/url/${id}`, { headers: { 'User-Agent': 'deqode-earth-radio-proxy/1.0' } }).catch(() => {});
    }
    res.status(204).end();
    return;
  }

  res.status(404).json({ error: 'Unknown radio route' });
}
