export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);

    // www, matching FEEDS.news in hooks/useCivicData.ts. The bare host 301s
    // here anyway, so this only mattered if WRFA ever stopped redirecting —
    // at which point health would have failed while the real feed kept
    // working. Check the same URL the app actually reads.
    const [feedRes, homeRes] = await Promise.all([
      fetch('https://www.wrfalp.com/feed/', { signal: ctrl.signal }),
      fetch('https://www.wrfalp.com/', { signal: ctrl.signal }),
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

    // Deliberately NO freshness check. There used to be one (36h), but
    // "hasn't published recently" is not the same as "is broken": WRFA is a
    // small volunteer station that routinely goes quiet over a weekend, and
    // a 49h gap was enough to mark a perfectly healthy 200 RSS feed as down.
    // Because callers hard-drop WRFA items when this is false (see wrfaUp in
    // hooks/useCivicData.ts), that quietly emptied the news feed of its main
    // local source for no reason. Genuine breakage still gets caught by the
    // non-200, maintenance-mode and not-actually-RSS checks above.
    res.json({ wrfa: true });
  } catch {
    res.json({ wrfa: true }); // fail open
  }
}
