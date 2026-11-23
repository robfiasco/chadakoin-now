import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

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

const UPSTREAM_TIMEOUT_MS = 8_000;
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

// Last-good-response cache. Some civic hosts (jamestownnybpu.gov) silently
// drop connections from Vercel's IP ranges for hours at a time, so a hard
// 502 blanks the section. Serving the last good copy keeps it populated.
// Memory covers a warm instance; /tmp survives instance reuse but not cold
// starts on a new box — best effort, never authoritative.
const lastGood = new Map();
const LAST_GOOD_MAX_ENTRIES = 100;
const LAST_GOOD_MAX_BYTES = 1_000_000;
const DISK_CACHE_DIR = path.join(os.tmpdir(), 'proxy-last-good');

function cacheFile(url) {
  return path.join(DISK_CACHE_DIR, crypto.createHash('sha1').update(url).digest('hex') + '.json');
}

async function saveLastGood(url, entry) {
  if (entry.body.length > LAST_GOOD_MAX_BYTES) return;
  lastGood.delete(url);
  lastGood.set(url, entry);
  if (lastGood.size > LAST_GOOD_MAX_ENTRIES) lastGood.delete(lastGood.keys().next().value);
  try {
    await fs.mkdir(DISK_CACHE_DIR, { recursive: true });
    await fs.writeFile(cacheFile(url), JSON.stringify(entry));
  } catch {}
}

async function loadLastGood(url) {
  const mem = lastGood.get(url);
  if (mem) return mem;
  try {
    return JSON.parse(await fs.readFile(cacheFile(url), 'utf8'));
  } catch {
    return null;
  }
}

// BPU relay. jamestownnybpu.gov drops connections from Vercel, so a cron job
// on the chadakoindigital.com server (tools/bpu-relay/) mirrors both feeds
// every 10 min. Order for these URLs: relay → BPU direct → last-good cache.
const RELAY_BASE = 'https://chadakoindigital.com/feeds/';
const BPU_RELAY = new Map([
  ['https://www.jamestownnybpu.gov/RSSFeed.aspx?ModID=63&CID=Alerts-11',
    { file: 'bpu-alerts.xml', statusKey: 'alerts' }],
  ['https://www.jamestownnybpu.gov/RSSFeed.aspx?ModID=58&CID=Jamestown-Board-Meeting-Calendar-23',
    { file: 'bpu-meetings.xml', statusKey: 'meetings' }],
]);
const RELAY_TIMEOUT_MS = 5_000;
// The relay refreshes every 10 min; a copy older than this means its own
// BPU fetches are failing, so the app should show the "Last confirmed" line.
const RELAY_STALE_AFTER_MS = 60 * 60_000;

async function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'ChadakoinNow/1.0' } });
  } finally {
    clearTimeout(t);
  }
}

// Returns { body, contentType, asOf } or null if the relay can't serve it.
// asOf is the relay's last successful BPU fetch (null if status is unknown).
async function fetchFromRelay({ file, statusKey }) {
  try {
    const [feedRes, statusRes] = await Promise.all([
      fetchWithTimeout(RELAY_BASE + file, RELAY_TIMEOUT_MS),
      fetchWithTimeout(RELAY_BASE + 'bpu-status.json', RELAY_TIMEOUT_MS).catch(() => null),
    ]);
    if (!feedRes.ok) throw new Error(`relay HTTP ${feedRes.status}`);
    const body = await feedRes.text();
    if (!body.includes('<rss') || !body.includes('<channel')) throw new Error('relay body is not RSS');

    let asOf = null;
    try {
      if (statusRes?.ok) asOf = Number((await statusRes.json())?.[statusKey]?.lastSuccessMs) || null;
    } catch {}

    return { body, contentType: feedRes.headers.get('content-type') ?? 'application/xml', asOf };
  } catch (err) {
    console.warn(`[proxy] BPU relay ${file} failed (${err?.name ?? 'Error'}: ${err?.message ?? err}), trying BPU directly`);
    return null;
  }
}

function sendStale(res, entry) {
  res.setHeader('Content-Type', entry.contentType);
  res.setHeader('X-Proxy-Stale', '1');
  res.setHeader('X-Proxy-Stale-As-Of', String(entry.fetchedAt));
  // Short edge cache: spares every visitor the upstream timeout wait while
  // the host is down, but rechecks every few minutes.
  res.setHeader('Cache-Control', 'public, s-maxage=300');
  return res.status(200).send(entry.body);
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

  const target = parsed.toString();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Expose-Headers', 'X-Proxy-Stale, X-Proxy-Stale-As-Of');

  const relay = BPU_RELAY.get(target);
  if (relay) {
    const copy = await fetchFromRelay(relay);
    if (copy) {
      const fetchedAt = copy.asOf ?? Date.now();
      await saveLastGood(target, { body: copy.body, contentType: copy.contentType, fetchedAt });
      if (copy.asOf && Date.now() - copy.asOf > RELAY_STALE_AFTER_MS) {
        return sendStale(res, { body: copy.body, contentType: copy.contentType, fetchedAt: copy.asOf });
      }
      res.setHeader('Content-Type', copy.contentType);
      // Relay refreshes every 10 min — keep the edge copy short enough that
      // the 60-min staleness check isn't hidden behind a long CDN cache.
      res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
      return res.status(200).send(copy.body);
    }
  }

  let upstream = null;
  let body = '';
  try {
    try {
      upstream = await fetchUpstream(target);
      if (RETRYABLE_STATUSES.has(upstream.status)) {
        console.warn(`[proxy] ${parsed.hostname} returned ${upstream.status}, retrying once`);
        upstream = await fetchUpstream(target);
      }
    } catch (err) {
      // Relay-backed feeds already spent up to 5s on the relay; a second
      // 8s BPU attempt would push past the native app's 18s fetch timeout
      // and it would never see the stale fallback below.
      if (relay) throw err;
      // Network/TLS/timeout error on the first attempt — one retry after a
      // short backoff before giving up.
      console.warn(`[proxy] ${parsed.hostname} fetch failed (${err?.name ?? 'Error'}: ${err?.message ?? err}), retrying once`);
      await new Promise(r => setTimeout(r, 300));
      upstream = await fetchUpstream(target);
    }
    body = await upstream.text();
  } catch (err) {
    console.error(`[proxy] ${parsed.hostname} fetch failed after retry: ${err?.name ?? 'Error'}: ${err?.message ?? err}`);
    upstream = null;
  }

  if (upstream?.ok) {
    const contentType = upstream.headers.get('content-type') ?? 'text/plain';
    await saveLastGood(target, { body, contentType, fetchedAt: Date.now() });
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
    return res.status(upstream.status).send(body);
  }

  if (upstream) console.warn(`[proxy] ${parsed.hostname} final status ${upstream.status}`);

  const cached = await loadLastGood(target);
  if (cached) return sendStale(res, cached);

  // No good copy yet — pass through the upstream's own error status, or 502
  // when it never answered.
  if (upstream) {
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'text/plain');
    return res.status(upstream.status).send(body);
  }
  return res.status(502).send('Proxy fetch failed');
}
