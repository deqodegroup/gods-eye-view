/**
 * GBFS bikeshare proxy.
 * GET /api/gbfs/{encoded-upstream-url}
 * Allowlisted hosts, station_information/station_status only.
 */

const ALLOWED_HOSTS = new Set(['gbfs.lyft.com', 'gbfs.bluebikes.com', 'gbfs.bcycle.com', 'gbfs.biketownpdx.com', 'gbfs.cogobikeshare.com', 'austin.publicbikesystem.net', 'hon.publicbikesystem.net', 'chat.publicbikesystem.net']);
const PUBLICBIKE_RE = /^[a-z0-9-]+\.publicbikesystem\.net$/;

function isAllowedHost(hostname) { return ALLOWED_HOSTS.has(hostname) || PUBLICBIKE_RE.test(hostname); }
function isAllowedPath(pathname) { return pathname.includes('station_information') || pathname.includes('station_status'); }
function gbfsCacheControl(pathname) { return pathname.includes('station_status') ? 'public, max-age=30' : 'public, max-age=3600'; }

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method Not Allowed' }); return; }

  const pathParts = Array.isArray(req.query.path) ? req.query.path : [req.query.path].filter(Boolean);
  const encodedTarget = pathParts.join('/');
  if (!encodedTarget) { res.status(400).json({ error: 'Missing GBFS upstream target' }); return; }

  let decodedTarget;
  try { decodedTarget = decodeURIComponent(encodedTarget); } catch { res.status(400).json({ error: 'Invalid GBFS target encoding' }); return; }

  let upstreamUrl;
  try { upstreamUrl = new URL(decodedTarget); } catch { res.status(400).json({ error: 'Invalid GBFS upstream URL' }); return; }

  if (upstreamUrl.protocol !== 'https:') { res.status(400).json({ error: 'Only https GBFS targets are allowed' }); return; }
  if (!isAllowedHost(upstreamUrl.hostname)) { res.status(403).json({ error: 'GBFS host not allowed' }); return; }
  if (!isAllowedPath(upstreamUrl.pathname)) { res.status(400).json({ error: 'Only station_information/station_status endpoints are allowed' }); return; }

  try {
    const upstream = await fetch(upstreamUrl.toString(), { signal: AbortSignal.timeout(12000), headers: { Accept: 'application/json', 'User-Agent': 'deqode-earth-gbfs-proxy/1.0' } });
    const GBFS_MAX = 5 * 1024 * 1024;
    const cl = Number(upstream.headers.get('content-length'));
    if (Number.isFinite(cl) && cl > GBFS_MAX) { res.status(502).json({ error: 'GBFS response too large' }); return; }
    const body = await upstream.text();
    if (body.length > GBFS_MAX) { res.status(502).json({ error: 'GBFS response too large' }); return; }
    res.status(upstream.status).setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json').setHeader('Cache-Control', gbfsCacheControl(upstreamUrl.pathname)).send(body);
  } catch (err) {
    const isTimeout = err?.name === 'AbortError' || err?.name === 'TimeoutError';
    res.status(isTimeout ? 504 : 502).json({ error: err?.message || 'GBFS proxy error' });
  }
}
