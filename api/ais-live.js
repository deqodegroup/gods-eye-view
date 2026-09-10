/**
 * AISStream vessel snapshot proxy.
 * GET /api/ais-live          — collect 4s of WebSocket vessel data
 * GET /api/ais-live/track    — track history stub (stateless, returns empty)
 */

import { WebSocket } from 'ws';

const AISSTREAM_WS = 'wss://stream.aisstream.io/v0/stream';
const COLLECT_MS = 4000;
const MAX_VESSELS = 12000;

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Track stub
  if (url.pathname.endsWith('/track')) {
    res.status(200).json({ mmsi: req.query.mmsi || '', positions: [] });
    return;
  }

  const key = process.env.AISSTREAM_API_KEY;
  if (!key) {
    res.status(503).json({ error: 'AISSTREAM_API_KEY not configured' });
    return;
  }

  const vessels = new Map();

  await new Promise((resolve) => {
    const ws = new WebSocket(AISSTREAM_WS);
    const timer = setTimeout(() => { ws.close(); resolve(); }, COLLECT_MS);

    ws.on('open', () => {
      ws.send(JSON.stringify({
        APIkey: key,
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        FilterMessageTypes: ['PositionReport'],
      }));
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        const pos = msg?.Message?.PositionReport;
        const meta = msg?.MetaData;
        if (!pos || !meta) return;
        const mmsi = String(meta.MMSI || '');
        if (!mmsi) return;
        vessels.set(mmsi, {
          mmsi,
          lat: pos.Latitude,
          lon: pos.Longitude,
          cog: pos.Cog,
          sog: pos.Sog,
          heading: pos.TrueHeading,
          name: meta.ShipName?.trim() || '',
          ts: meta.time_utc || new Date().toISOString(),
        });
        if (vessels.size >= MAX_VESSELS) { clearTimeout(timer); ws.close(); resolve(); }
      } catch { /* skip malformed */ }
    });

    ws.on('error', () => { clearTimeout(timer); resolve(); });
    ws.on('close', () => { clearTimeout(timer); resolve(); });
  });

  res.status(200)
    .setHeader('Content-Type', 'application/json')
    .setHeader('Cache-Control', 'no-store')
    .json({ vessels: Array.from(vessels.values()), count: vessels.size, ts: new Date().toISOString() });
}
