// POST /api/verify-turnstile
//
// Exchanges a raw Cloudflare Turnstile token for a short-lived, signed proof
// that the NOVA backend (Hugging Face Space) can verify locally, with no
// network call of its own. This exists because the HF Space's outbound
// connection to challenges.cloudflare.com was unreliable (ConnectTimeout on
// every attempt); Vercel's network reaches Cloudflare fine, so the actual
// siteverify call now happens here instead.
//
// Required environment variables (set on this Vercel project):
//   TURNSTILE_SECRET_KEY        - the Cloudflare Turnstile secret key
//   NOVA_VERIFY_BRIDGE_SECRET   - shared HMAC secret; MUST be set to the
//                                 exact same value on the HF Space
//   TURNSTILE_EXPECTED_ACTION   - optional, defaults to "nova_chat"
//
// Request body (JSON): { "token": "<cf-turnstile-token>", "csrf_token": "<csrf token the frontend already holds>" }
// Success response:    { "ok": true, "proof": "<unix_ts>.<hex_hmac>" }
// The backend re-derives the same HMAC from (timestamp + csrf_token) using
// the shared secret and compares it -- so the proof is bound to that
// specific browser session's CSRF token and can't be replayed elsewhere.

const crypto = require('node:crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  const bridgeSecret = process.env.NOVA_VERIFY_BRIDGE_SECRET;
  if (!secretKey || !bridgeSecret) {
    res.status(503).json({ error: 'not_configured', detail: 'TURNSTILE_SECRET_KEY and/or NOVA_VERIFY_BRIDGE_SECRET are not set on this Vercel project.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};
  const token = typeof body.token === 'string' ? body.token : '';
  const csrfToken = typeof body.csrf_token === 'string' ? body.csrf_token : '';

  if (!token) {
    res.status(400).json({ error: 'missing_token' });
    return;
  }
  if (!csrfToken) {
    res.status(400).json({ error: 'missing_csrf_token' });
    return;
  }

  const forwardedFor = req.headers['x-forwarded-for'];
  const remoteIp = Array.isArray(forwardedFor) ? forwardedFor[0] : String(forwardedFor || '').split(',')[0].trim();

  const params = new URLSearchParams();
  params.set('secret', secretKey);
  params.set('response', token);
  if (remoteIp) params.set('remoteip', remoteIp);

  let cfResult;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let cfRes;
    try {
      cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    cfResult = await cfRes.json();
  } catch (err) {
    res.status(503).json({ error: 'cloudflare_unreachable', detail: String((err && err.message) || err) });
    return;
  }

  if (!cfResult || cfResult.success !== true) {
    res.status(403).json({ error: 'verification_failed', codes: (cfResult && cfResult['error-codes']) || [] });
    return;
  }

  const expectedAction = process.env.TURNSTILE_EXPECTED_ACTION || 'nova_chat';
  if (expectedAction && cfResult.action && cfResult.action !== expectedAction) {
    res.status(403).json({ error: 'action_mismatch' });
    return;
  }

  const ts = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac('sha256', bridgeSecret).update(`${ts}.${csrfToken}`).digest('hex');
  const proof = `${ts}.${sig}`;

  res.status(200).json({ ok: true, proof });
};
