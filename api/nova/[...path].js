// Vercel same-origin proxy for NOVA's private web-session endpoints.
// Purpose: keep the nova_session cookie first-party to the Vercel site while
// forwarding requests to Hugging Face. No API secrets are stored here.

const UPSTREAM = 'https://xameraman5022-nova-guides.hf.space';
const ALLOWED = new Set(['session', 'chat', 'view', 'status']);

function requestBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  if (req.body == null) return undefined;
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) return req.body;
  return JSON.stringify(req.body);
}

function forwardHeaders(req) {
  const out = new Headers();
  const allowed = [
    'accept',
    'content-type',
    'cookie',
    'origin',
    'referer',
    'user-agent',
    'x-forwarded-for',
    'x-forwarded-proto',
    'x-real-ip',
    'x-nova-csrf',
    'x-idempotency-key',
    'x-request-id',
  ];
  for (const name of allowed) {
    const value = req.headers?.[name];
    if (value) out.set(name, Array.isArray(value) ? value.join(', ') : value);
  }
  return out;
}

function normalizeSetCookie(value) {
  return String(value)
    .replace(/;\s*Domain=[^;]+/gi, '')
    .replace(/;\s*Path=[^;]*/gi, '; Path=/');
}

module.exports = async function handler(req, res) {
  const rawPath = Array.isArray(req.query?.path)
    ? req.query.path.join('/')
    : String(req.query?.path || '');
  const route = rawPath.replace(/^\/+|\/+$/g, '');

  if (!ALLOWED.has(route)) {
    res.status(404).json({ detail: 'Not found' });
    return;
  }

  if (!['GET', 'POST', 'OPTIONS'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    res.status(405).json({ detail: 'Method not allowed' });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
    res.status(204).end();
    return;
  }

  const headers = forwardHeaders(req);
  const body = requestBody(req);
  const upstream = await fetch(`${UPSTREAM}/web/${route}`, {
    method: req.method,
    headers,
    body,
    redirect: 'manual',
    cache: 'no-store',
  });

  // Never let Vercel cache session/chat/status/view responses.
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');

  const getSetCookie = upstream.headers.getSetCookie;
  const cookies = typeof getSetCookie === 'function'
    ? getSetCookie.call(upstream.headers)
    : (upstream.headers.get('set-cookie') ? [upstream.headers.get('set-cookie')] : []);
  if (cookies.length) {
    res.setHeader('Set-Cookie', cookies.map(normalizeSetCookie));
  }

  const text = await upstream.text();
  res.status(upstream.status).send(text);
}
