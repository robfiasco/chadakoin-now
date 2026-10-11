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
  'wnynewsnow.com',
  'www.wnynewsnow.com',
  'wjtn.com',
  'www.wjtn.com',
  'mediaonegroupradio.com',
  'www.mediaonegroupradio.com',
  'mychq.org',
  'www.mychq.org',
  // Fenton History Center events feed. Both forms: FEEDS.fenton uses the
  // bare host, the hardcoded detail links elsewhere use www.
  'fentonhistorycenter.org',
  'www.fentonhistorycenter.org',
]);

const rateLimitMap = new Map();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
const CLEANUP_INTERVAL = 5 * 60_000;

const UPSTREAM_TIMEOUT_MS = 10_000;
const RETRYABLE_STATUSES = new Set([502, 503, 504]);

function fetchUpstream(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);
  return fetch(url, {
    signal: ctrl.signal,
    headers: {
      'User-Agent': 'ChadakoinNow/1.0',
      'Accept': 'text/calendar, application/rss+xml, application/xml, application/json, text/xml, */*',
    },
  }).finally(() => clearTimeout(t));
}

let lastCleanup = Date.now();
function isRateLimited(ip) {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetAt) rateLimitMap.delete(key);
    }
    lastCleanup = now;
  }
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
    let upstream;
    try {
      upstream = await fetchUpstream(parsed.toString());
      if (RETRYABLE_STATUSES.has(upstream.status)) {
        console.warn(`[proxy] ${parsed.hostname} returned ${upstream.status}, retrying once`);
        upstream = await fetchUpstream(parsed.toString());
      }
    } catch (err) {
      // Network/TLS/timeout error on the first attempt — one retry after a
      // short backoff before giving up. Upstream civic feeds (BPU, county)
      // occasionally hiccup; a single retry clears most of them without
      // masking a genuinely dead source.
      console.warn(`[proxy] ${parsed.hostname} fetch failed (${err?.name ?? 'Error'}: ${err?.message ?? err}), retrying once`);
      await new Promise(r => setTimeout(r, 300));
      upstream = await fetchUpstream(parsed.toString());
    }

    if (!upstream.ok) {
      console.warn(`[proxy] ${parsed.hostname} final status ${upstream.status}`);
    }

    const body = await upstream.text();
    const contentType = upstream.headers.get('content-type') ?? 'text/plain';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
    res.status(upstream.status).send(body);
  } catch (err) {
    console.error(`[proxy] ${parsed.hostname} fetch failed after retry: ${err?.name ?? 'Error'}: ${err?.message ?? err}`);
    res.status(502).send('Proxy fetch failed');
  }
}
