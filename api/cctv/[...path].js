/**
 * CCTV camera proxy.
 * GET /api/cctv/sources          — camera catalog
 * GET /api/cctv/health           — camera health
 * GET /api/cctv/stream/{id}      — stream info
 * GET /api/cctv/media/{id}       — proxy media stream
 * GET /api/cctv/frame/{id}       — snapshot (upstream → Street View → SVG)
 */

function normalizeFeedType(raw) {
  const t = String(raw || '').toLowerCase();
  if (t === 'hls' || t === 'm3u8') return 'hls';
  if (t === 'rtsp') return 'rtsp';
  if (t === 'webrtc') return 'webrtc';
  return 'image';
}

function isVideoFeedType(feedType) { return feedType === 'hls' || feedType === 'rtsp' || feedType === 'webrtc'; }

function loadSources() {
  const fromEnv = process.env.CCTV_SOURCES_JSON;
  if (fromEnv) { try { const p = JSON.parse(fromEnv); if (Array.isArray(p)) return p; } catch { } }
  return [];
}

function buildSyntheticSvg({ cameraId, label, status }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#0d1117"/><text x="320" y="165" font-family="monospace" font-size="14" fill="#8b949e" text-anchor="middle">CCTV</text><text x="320" y="185" font-family="monospace" font-size="12" fill="#6e7681" text-anchor="middle">${String(label || cameraId).replace(/[<>&"]/g, '')}</text><text x="320" y="205" font-family="monospace" font-size="10" fill="#6e7681" text-anchor="middle">${String(status || 'NO SOURCE').replace(/[<>&"]/g, '')}</text></svg>`;
}

async function fetchUpstreamImage(url) {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'deqode-earth-cctv-proxy/1.0' } });
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    return { contentType: ct, buf: Buffer.from(await r.arrayBuffer()) };
  } catch { return null; }
}

async function fetchStreetView(lat, lon, heading, fov, pitch) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const params = new URLSearchParams({ size: '640x360', location: `${lat},${lon}`, key: apiKey, source: 'outdoor' });
  if (Number.isFinite(heading)) params.set('heading', String(Math.round(heading)));
  if (Number.isFinite(fov)) params.set('fov', String(Math.min(120, Math.max(10, Math.round(fov)))));
  if (Number.isFinite(pitch)) params.set('pitch', String(Math.round(pitch)));
  try {
    const r = await fetch(`https://maps.googleapis.com/maps/api/streetview?${params}`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    return { contentType: ct, buf: Buffer.from(await r.arrayBuffer()) };
  } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method Not Allowed' }); return; }

  const sources = loadSources();
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const pathParts = Array.isArray(req.query.path) ? req.query.path : [req.query.path].filter(Boolean);
  const route = pathParts[0] || '';
  const itemId = pathParts.slice(1).map(decodeURIComponent).join('/');

  if (route === 'sources') {
    res.status(200).setHeader('Content-Type', 'application/json').setHeader('Cache-Control', 'no-store').json({ sources: sources.map((s) => ({ id: s.id, name: s.name, city: s.city, cityId: s.cityId, provider: s.provider, lat: s.lat, lon: s.lon, headingDeg: s.headingDeg, pitchDeg: s.pitchDeg, fovDeg: s.fovDeg, rangeM: s.rangeM, feedType: normalizeFeedType(s.feedType), sourceKind: s.sourceKind || (s.url ? 'configured' : 'fallback'), license: s.license })) });
    return;
  }

  if (route === 'health') { res.status(200).setHeader('Content-Type', 'application/json').setHeader('Cache-Control', 'no-store').json({ cameras: [] }); return; }

  if (route === 'stream') {
    const source = sourceById.get(itemId);
    const feedType = normalizeFeedType(source?.feedType);
    res.status(200).setHeader('Content-Type', 'application/json').setHeader('Cache-Control', 'no-store').json(source ? { id: source.id, name: source.name, feedType, sourceKind: source.sourceKind || 'configured', url: source.url || null, lat: source.lat, lon: source.lon, headingDeg: source.headingDeg, status: source.url ? 'ready' : 'no_stream' } : { id: itemId, status: 'not_found', feedType: 'image', sourceKind: 'fallback' });
    return;
  }

  if (route === 'media') {
    const source = sourceById.get(itemId);
    const mediaUrl = source?.url || '';
    if (!mediaUrl || !/^https?:\/\//i.test(mediaUrl)) { res.status(404).json({ error: 'No media URL configured' }); return; }
    try {
      const r = await fetch(mediaUrl, { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'deqode-earth-cctv-proxy/1.0', ...(req.headers?.range ? { Range: req.headers.range } : {}) } });
      if (!r.ok) { res.status(r.status).json({ error: `Upstream returned ${r.status}` }); return; }
      res.status(r.status).setHeader('Content-Type', r.headers.get('content-type') || 'application/octet-stream').setHeader('Cache-Control', 'no-store').send(Buffer.from(await r.arrayBuffer()));
    } catch { res.status(502).json({ error: 'Media proxy failed' }); }
    return;
  }

  if (route === 'frame') {
    const source = sourceById.get(itemId);
    const feedType = normalizeFeedType(source?.feedType);
    const upstreamUrl = source?.snapshotUrl || (!isVideoFeedType(feedType) ? source?.url : '');
    const img = await fetchUpstreamImage(upstreamUrl);
    if (img) { res.status(200).setHeader('Content-Type', img.contentType).setHeader('Cache-Control', 'no-store').setHeader('X-CCTV-Source', 'upstream-image').send(img.buf); return; }

    const lat = Number(req.query.lat ?? source?.lat), lon = Number(req.query.lon ?? source?.lon);
    const heading = Number(req.query.heading ?? source?.headingDeg), fov = Number(req.query.fov ?? source?.fovDeg), pitch = Number(req.query.pitch ?? source?.pitchDeg);
    const sv = await fetchStreetView(lat, lon, heading, fov, pitch);
    if (sv) { res.status(200).setHeader('Content-Type', sv.contentType).setHeader('Cache-Control', 'no-store').setHeader('X-CCTV-Source', 'streetview').send(sv.buf); return; }

    const svg = buildSyntheticSvg({ cameraId: itemId, label: req.query.label || source?.name || itemId, status: source?.url ? 'UPSTREAM UNAVAILABLE' : 'NO UPSTREAM CONFIGURED' });
    res.status(200).setHeader('Content-Type', 'image/svg+xml').setHeader('Cache-Control', 'no-store').setHeader('X-CCTV-Source', 'synthetic').send(svg);
    return;
  }

  res.status(404).json({ error: 'Unknown CCTV route' });
}
