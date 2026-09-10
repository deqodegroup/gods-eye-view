/**
 * OpenAI HUD summary proxy.
 * POST /api/openai/hud-summary
 * Deterministic fallback if OPENAI_API_KEY not set.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    res.status(200).json({ summary: 'Intelligence layer active. API key not configured.' });
    return;
  }

  let body;
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(20000),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_HUD_MODEL || 'gpt-4o-mini',
        messages: body.messages || [],
        max_tokens: body.max_tokens || 256,
        temperature: 0.3,
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      res.status(upstream.status).json({ error: err });
      return;
    }

    const data = await upstream.json();
    const summary = data?.choices?.[0]?.message?.content || '';
    res.status(200).json({ summary });
  } catch (err) {
    res.status(502).json({ error: err?.message || 'OpenAI proxy error' });
  }
}
