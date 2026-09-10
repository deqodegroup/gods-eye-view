/**
 * OpenAI Realtime ephemeral session token.
 * GET /api/realtime/token?tier=standard|mini
 */

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') { res.status(405).json({ error: 'Method Not Allowed' }); return; }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) { res.status(503).json({ error: 'OPENAI_API_KEY not configured' }); return; }

  const tier = String(req.query.tier || 'standard').toLowerCase();
  const isMini = tier === 'mini';

  const model = isMini
    ? (process.env.OPENAI_REALTIME_MODEL_MINI || 'gpt-4o-mini-realtime-preview')
    : (process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview');

  const voice = process.env.OPENAI_REALTIME_VOICE || 'alloy';

  try {
    const upstream = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, voice }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      res.status(upstream.status).json({ error: err });
      return;
    }

    const data = await upstream.json();
    res.status(200).setHeader('Content-Type', 'application/json').setHeader('Cache-Control', 'no-store').json(data);
  } catch (err) {
    res.status(502).json({ error: err?.message || 'Realtime token proxy error' });
  }
}
