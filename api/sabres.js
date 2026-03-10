// Vercel serverless function — Buffalo Sabres data via NHL official API
// api-web.nhle.com is publicly accessible from server environments.

// ─── JCC helper (called from the same endpoint) ──────────────────

async function fetchJCC(signal) {
  try {
    const res = await fetch('https://jccjayhawks.com/composite?print=rss', { signal });
    if (!res.ok) return [];
    const text = await res.text();

    const items = [];
    const itemRx = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRx.exec(text)) !== null) {
      const block = m[1];
      const get = (tag) => {
        const r = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`);
        const match = r.exec(block);
        return match ? (match[1] ?? match[2] ?? '').trim() : '';
      };

      const score     = get('ps:score');
      const pubDate   = get('pubDate');
      const opponent  = get('ps:opponent');
      const category  = get('category');
      const link      = get('link');
      const desc      = get('description');

      if (!pubDate) continue;
      const date = new Date(pubDate);
      const now  = new Date();

      // Parse score: "W, 89-85" or "L, 80-69"
      const hasResult = score && score.trim() !== '';
      const isPast    = date < now;

      if (hasResult && isPast) {
        const parts = score.split(',').map(s => s.trim());
        const wl    = parts[0]; // "W" or "L"
        const final = parts[1] ?? '';
        items.push({
          date:     date.toISOString(),
          sport:    category,
          opponent: opponent.replace(/^(at|vs\.?)\s*/i, ''),
          isHome:   !opponent.toLowerCase().startsWith('at '),
          result:   wl,   // "W" or "L"
          score:    final,
          won:      wl === 'W',
          link,
        });
      }
    }

    // Most recent 5 completed games across all sports, newest first
    return items
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  try {
    console.log('Fetching Sabres from NHL API...');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let schedRes, standRes, statsRes, jccResults;
    try {
      [schedRes, standRes, statsRes, jccResults] = await Promise.all([
        fetch('https://api-web.nhle.com/v1/club-schedule-season/BUF/now', { signal: controller.signal }),
        fetch('https://api-web.nhle.com/v1/standings/now', { signal: controller.signal }),
        fetch('https://api-web.nhle.com/v1/club-stats/BUF/now', { signal: controller.signal }),
        fetchJCC(controller.signal),
      ]);
    } finally {
      clearTimeout(timeout);
    }

    console.log('Schedule:', schedRes.status, '| Standings:', standRes.status, '| Stats:', statsRes.status);

    if (!schedRes.ok) {
      return res.status(502).json({ error: 'NHL API failed', status: schedRes.status });
    }

    const schedJson = await schedRes.json();
    const standJson = standRes.ok ? await standRes.json() : null;
    const statsJson = statsRes.ok ? await statsRes.json() : null;

    // Top 5 skaters by points
    const topScorers = (statsJson?.skaters ?? [])
      .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
      .slice(0, 5)
      .map(p => ({
        name:     `${p.firstName?.default ?? ''} ${p.lastName?.default ?? ''}`.trim(),
        position: p.positionCode ?? '',
        goals:    p.goals ?? 0,
        assists:  p.assists ?? 0,
        points:   p.points ?? 0,
        headshot: p.headshot ?? '',
      }));

    const games = schedJson.games ?? [];
    console.log('Total games:', games.length);

    const now = new Date();

    const past = games
      .filter(g => g.gameState === 'FINAL' || g.gameState === 'OFF')
      .sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate));

    const upcoming = games
      .filter(g => g.gameState === 'FUT' || g.gameState === 'PRE')
      .sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));

    const live = games.filter(g => g.gameState === 'LIVE' || g.gameState === 'CRIT');

    console.log(`Past: ${past.length}, Upcoming: ${upcoming.length}, Live: ${live.length}`);

    // Sabres record from standings
    let record = '';
    let standing = '';
    if (standJson?.standings) {
      const sabres = standJson.standings.find(t => t.teamAbbrev?.default === 'BUF');
      if (sabres) {
        record = `${sabres.wins}-${sabres.losses}-${sabres.otLosses}`;
        standing = sabres.wildCardSequence
          ? `${sabres.conferenceName} WC${sabres.wildcardSequence ?? ''}`
          : `${sabres.divisionName} · ${sabres.divisionSequence ?? ''}`;
      }
    }

    function parseGame(g) {
      if (!g) return null;
      const isBufHome = g.homeTeam?.abbrev === 'BUF';
      const us   = isBufHome ? g.homeTeam : g.awayTeam;
      const them = isBufHome ? g.awayTeam : g.homeTeam;
      const state = g.gameState ?? '';
      const status = (state === 'FINAL' || state === 'OFF') ? 'final'
                   : (state === 'LIVE' || state === 'CRIT') ? 'live'
                   : 'upcoming';
      const ourScore   = us?.score   != null ? String(us.score)   : '';
      const theirScore = them?.score != null ? String(them.score) : '';
      const won = status === 'final' ? Number(ourScore) > Number(theirScore) : null;

      return {
        date:          g.startTimeUTC ?? `${g.gameDate}T19:00:00Z`,
        status,
        opponentAbbr:  them?.abbrev ?? '???',
        opponentName:  them?.commonName?.default ?? them?.placeName?.default ?? 'Opponent',
        opponentLogo:  them?.logo ?? '',
        ourScore,
        theirScore,
        isHome:        isBufHome,
        won,
        venue:         g.venue?.default ?? '',
        broadcast:     g.tvBroadcasts?.[0]?.network ?? '',
        periodDesc:    g.periodDescriptor?.periodType ?? '',
        clock:         g.clock?.timeRemaining ?? '',
      };
    }

    // Prioritize live game, then next upcoming, then most recent past
    const displayNext   = live[0] ?? upcoming[0];
    const displayRecent = past[0];

    const result = {
      record,
      standing,
      recentGame: parseGame(displayRecent),
      nextGame:   parseGame(displayNext),
      topScorers,
      news: [],
    };

    result.jcc = jccResults;
    console.log(`record: "${record}", recent: ${result.recentGame?.opponentName}, next: ${result.nextGame?.opponentName}, jcc: ${jccResults.length} results`);

    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(result);

  } catch (err) {
    console.error('Sabres error:', err.message);
    res.status(502).json({ error: err.message });
  }
}
