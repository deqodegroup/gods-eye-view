/**
 * ADS-B database enrichment proxy.
 * GET /api/adsbdb/route/{callsign} — route lookup
 * GET /api/adsbdb/type/{hex}       — aircraft type lookup
 */

function parseRoute(json) {
  const fr = json?.response?.flightroute;
  if (!fr?.origin || !fr?.destination) return null;
  const airport = (a) => ({ code: a.iata_code || a.icao_code || '', name: a.municipality || a.name || '', lat: Number.isFinite(a.latitude) ? a.latitude : null, lon: Number.isFinite(a.longitude) ? a.longitude : null });
  return { airline: fr.airline?.name || null, origin: airport(fr.origin), destination: airport(fr.destination) };
}

function parseAircraft(json) {
  const a = json?.response?.aircraft;
  if (!a) return null;
  return { typeCode: a.icao_type || null, typeName: a.manufacturer && a.type ? `${a.manufacturer} ${a.type}` : (a.type || null), registration: a.registration || null };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method Not Allowed' }); return; }

  const pathParts = Array.isArray(req.query.path) ? req.query.path : [req.query.path].filter(Boolean);
  const [kind, rawKey] = pathParts;
  const send = (status, obj) => res.status(status).json(obj);

  if (kind === 'route') {
    const cs = String(rawKey || '').toUpperCase();
    if (!/^[A-Z0-9]{2,8}$/.test(cs)) return send(400, { error: 'invalid callsign' });
    try {
      const upstream = await fetch(`https://api.adsbdb.com/v0/callsign/${encodeURIComponent(cs)}`, { signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json', 'User-Agent': 'deqode-earth-adsbdb-proxy/1.0' } });
      if (upstream.ok) { const data = parseRoute(await upstream.json()); return send(200, data ? { found: true, ...data } : { found: false }); }
      if (upstream.status === 404) return send(200, { found: false });
      return send(upstream.status, { error: `adsbdb returned HTTP ${upstream.status}` });
    } catch (err) { return send(502, { error: err?.message || 'adsbdb route fetch failed' }); }
  }

  if (kind === 'type') {
    const hex = String(rawKey || '').toLowerCase();
    if (!/^[0-9a-f]{6}$/.test(hex)) return send(400, { error: 'invalid hex' });
    try {
      const upstream = await fetch(`https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(hex)}`, { signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json', 'User-Agent': 'deqode-earth-adsbdb-proxy/1.0' } });
      if (upstream.ok) { const data = parseAircraft(await upstream.json()); return send(200, data ? { found: true, ...data } : { found: false }); }
      if (upstream.status === 404) return send(200, { found: false });
      return send(upstream.status, { error: `adsbdb returned HTTP ${upstream.status}` });
    } catch (err) { return send(502, { error: err?.message || 'adsbdb aircraft fetch failed' }); }
  }

  return send(404, { error: 'unknown endpoint' });
}
