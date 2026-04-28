const STALE_THRESHOLD_MS = 36 * 60 * 60 * 1000; // 36 hours

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);

    // Check both the RSS feed AND the homepage in parallel
    const [feedRes, homeRes] = await Promise.all([
      fetch('https://wrfalp.com/feed/', { signal: ctrl.signal }),
      fetch('https://wrfalp.com/', { signal: ctrl.signal }),
    ]);
    clearTimeout(t);

    if (!feedRes.ok) return res.json({ wrfa: false });

    // If the homepage is in maintenance mode, links won't work — treat as down
    const homeText = homeRes.ok ? await homeRes.text() : '';
    if (/maintenance mode/i.test(homeText)) return res.json({ wrfa: false });

    const text = await feedRes.text();

    // Maintenance mode returns 200 HTML — verify it's actually RSS
    const isRss = text.trimStart().startsWith('<?xml') || /<rss[\s>]/i.test(text.slice(0, 500));
    if (!isRss) return res.json({ wrfa: false });

    // Check freshness: if the most recent article is >36h old, treat the source as down.
    const pubDateMatch = text.match(/<pubDate>([^<]+)<\/pubDate>/);
    if (pubDateMatch) {
      const latest = new Date(pubDateMatch[1].trim());
      const ageMs = Date.now() - latest.getTime();
      if (ageMs > STALE_THRESHOLD_MS) return res.json({ wrfa: false });
    }

    res.json({ wrfa: true });
  } catch {
    res.json({ wrfa: true }); // fail open
  }
}
