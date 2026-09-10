/**
 * Realtime debug log endpoint.
 * POST /api/realtime/debug-log
 * No-op on Vercel — logs to Vercel function logs.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString());
    console.log('[realtime-debug]', JSON.stringify(body).slice(0, 2000));
  } catch { /* ignore parse errors */ }

  res.status(204).end();
}
