// CORS proxy for RSS/JSON feeds.
// Add new sources to ALLOWED_HOSTS when integrating new data feeds.
const ALLOWED_HOSTS = new Set([
  'wrfalp.com',
  'www.wrfalp.com',
  'jamestownny.gov',
  'www.jamestownny.gov',
  'www.jamestownbpu.com',
  'jamestownbpu.com',
  'www.jamestownnybpu.gov',
  'jamestownnybpu.gov',
  'www.roberthjackson.org',
  'roberthjackson.org',
  'jccjayhawks.com',
  'www.jccjayhawks.com',
  'www.dec.ny.gov',
  'dec.ny.gov',
  'www.dot.ny.gov',
  'dot.ny.gov',
  'www.wgrz.com',
  'wgrz.com',
  'api.weather.gov',
  'jfmny.org',
  'www.jfmny.org',
  'prendergastlibrary.org',
  'www.prendergastlibrary.org',
  'rss.libsyn.com',
  'reglenna.com',
  'www.reglenna.com',
  'chautauquacountyny.gov',
  'www.chautauquacountyny.gov',
]);

// In-memory rate limiter: 60 req/IP/min rolling window
const rateLimitMap = new Map();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).send('Too many requests');
  }

  const { url } = req.query;
  if (!url) return res.status(400).send('Missing url param');

  let parsed;
  try {
    parsed = new URL(decodeURIComponent(url));
  } catch {
    return res.status(400).send('Invalid url');
  }

  if (parsed.protocol !== 'https:') {
    return res.status(403).send('Only https URLs are allowed');
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return res.status(403).send('Host not permitted');
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        'User-Agent': 'ChadakoinNow/1.0',
        'Accept': 'text/calendar, application/rss+xml, application/xml, application/json, text/xml, */*',
      },
    });

    const body = await upstream.text();
    const contentType = upstream.headers.get('content-type') ?? 'text/plain';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(upstream.status).send(body);
  } catch {
    res.status(502).send('Proxy fetch failed');
  }
}
