// GET /api/archives — "From Jamestown's Archives" stories.
//
// Only stories whose publishDate has arrived are returned, and the cut is
// made HERE rather than on the device. Previously every story shipped inside
// the app bundle and the client filtered by local device date, which meant
// (a) unreleased story text was sitting on every phone, readable by anyone
// who looked, (b) a wrong device clock could reveal a story early, and
// (c) publishing a new story needed an App Store build.

import { ARCHIVE_STORIES } from '../content/archives.js';

const SITE_ORIGIN = 'https://now.chadakoindigital.com';

// Release dates are Eastern calendar dates — this app's entire audience is
// in Jamestown, NY. Vercel runs the function in UTC, so asking the server
// for "today" directly would flip stories live ~4-5 hours early (UTC
// midnight is 8pm the previous day in ET). en-CA gives YYYY-MM-DD directly.
function easternDateKey(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export default async function handler(req, res) {
  try {
    const todayKey = easternDateKey();

    // Chronological, so "next" is simply the following entry — computed
    // across ALL stories (including unreleased ones) because the teaser box
    // needs to name what's coming. Only year + title cross the wire; the
    // unreleased body never leaves the server.
    const chronological = [...ARCHIVE_STORIES].sort((a, b) =>
      a.publishDate.localeCompare(b.publishDate));

    const stories = chronological
      .map((s, i) => {
        const next = chronological[i + 1];
        return {
          id: s.id,
          slug: s.slug,
          title: s.title,
          year: s.year,
          teaser: s.teaser,
          body: s.body,
          publishDate: s.publishDate,
          // Absolute so the native build can load it directly — a relative
          // path resolves against the app bundle on iOS, not the site.
          headerImage: `${SITE_ORIGIN}/old-jamestown/headers/${s.headerImage}`,
          headerImageAlt: s.headerImageAlt,
          sourceLabel: s.sourceLabel,
          sourceUrl: s.sourceUrl,
          credit: s.credit,
          tags: s.tags ?? [],
          next: next ? { year: next.year, title: next.title } : null,
        };
      })
      .filter(s => s.publishDate <= todayKey)
      // Newest first — the Home card takes [0], the archive list renders in
      // this order.
      .reverse();

    // Short TTL: a story going live is time-sensitive (publishDate flips at
    // ET midnight) and the payload is small, so there's no reason to let a
    // stale "not yet released" response sit at the edge for hours.
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ stories, asOf: todayKey });
  } catch {
    // Client falls back to its bundled copy of already-released stories.
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ stories: [], asOf: null });
  }
}
