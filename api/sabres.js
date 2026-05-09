async function fetchJCC(signal) {
  try {
    const res = await fetch('https://jccjayhawks.com/composite?print=rss', { signal });
    if (!res.ok) return { results: [], upcoming: [], records: {} };
    const text = await res.text();

    const results = [];
    const upcoming = [];
    const itemRx = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRx.exec(text)) !== null) {
      const block = m[1];
      // Precompiled regexes — avoids dynamic RegExp construction (ReDoS risk)
      const RX = {
        'ps:score':    /<ps:score[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/ps:score>|<ps:score[^>]*>([^<]*)<\/ps:score>/,
        'pubDate':     /<pubDate[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/pubDate>|<pubDate[^>]*>([^<]*)<\/pubDate>/,
        'ps:opponent': /<ps:opponent[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/ps:opponent>|<ps:opponent[^>]*>([^<]*)<\/ps:opponent>/,
        'category':    /<category[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/category>|<category[^>]*>([^<]*)<\/category>/,
        'link':        /<link[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/link>|<link[^>]*>([^<]*)<\/link>/,
      };
      const get = (tag) => { const match = RX[tag]?.exec(block); return match ? (match[1] ?? match[2] ?? '').trim() : ''; };

      const score    = get('ps:score');
      const pubDate  = get('pubDate');
      const opponent = get('ps:opponent');
      const category = get('category');
      const link     = get('link');

      if (!pubDate) continue;
      const date = new Date(pubDate);
      const now  = new Date();

      const opponentClean = opponent
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/^(at|vs\.?)\s*/i, '');

      const hasResult = score && score.trim() !== '';

      if (hasResult && date < now) {
        const parts = score.split(',').map(s => s.trim());
        const wl    = parts[0];
        const final = parts[1] ?? '';
        if (final === '0-0') continue; // postponed/cancelled/bad data
        results.push({
          date:     date.toISOString(),
          sport:    category,
          opponent: opponentClean,
          isHome:   !opponent.toLowerCase().startsWith('at '),
          result:   wl,
          score:    final,
          won:      wl === 'W',
          link,
        });
      } else if (!hasResult && date >= now) {
        upcoming.push({
          date:     date.toISOString(),
          sport:    category,
          opponent: opponentClean,
          isHome:   !opponent.toLowerCase().startsWith('at '),
          link,
        });
      }
    }

    results.sort((a, b) => new Date(b.date) - new Date(a.date));
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Compute per-sport season records from all results (not just the slice)
    const records = {};
    for (const r of results) {
      if (!records[r.sport]) records[r.sport] = { w: 0, l: 0 };
      if (r.won) records[r.sport].w++;
      else records[r.sport].l++;
    }

    return {
      results:  results.slice(0, 8),
      upcoming: upcoming.slice(0, 8),
      records,
    };
  } catch {
    return { results: [], upcoming: [], records: {} };
  }
}

async function fetchPlayoffSeries(signal) {
  try {
    const now = new Date();
    const year = now.getFullYear();
    // NHL season ID format: "{priorYear}{currentYear}" e.g. "20252026"
    const seasonId = `${year - 1}${year}`;
    const res = await fetch(`https://api-web.nhle.com/v1/playoff-series/carousel/${seasonId}`, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    // Pick the highest round BUF appears in — earlier rounds remain in the carousel
    // after they end, so a first-match return would stay stuck on round 1.
    let latest = null;
    for (const round of (data.rounds ?? [])) {
      for (const series of (round.series ?? [])) {
        const top = series.topSeed ?? {};
        const bot = series.bottomSeed ?? {};
        if (top.abbrev !== 'BUF' && bot.abbrev !== 'BUF') continue;
        if (latest && round.roundNumber <= latest.round) continue;
        const bufWins = top.abbrev === 'BUF' ? top.wins : bot.wins;
        const oppWins = top.abbrev === 'BUF' ? bot.wins : top.wins;
        const oppAbbrev = top.abbrev === 'BUF' ? bot.abbrev : top.abbrev;
        latest = {
          round: round.roundNumber,
          roundLabel: round.roundLabel ?? `Round ${round.roundNumber}`,
          opponent: oppAbbrev,
          bufWins,
          oppWins,
          neededToWin: series.neededToWin ?? 4,
        };
      }
    }
    return latest;
  } catch { return null; }
}

export default async function handler(req, res) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let schedRes, standRes, statsRes, jccResults, playoffSeries;
    try {
      [schedRes, standRes, statsRes, jccResults, playoffSeries] = await Promise.all([
        fetch('https://api-web.nhle.com/v1/club-schedule-season/BUF/now', { signal: controller.signal }),
        fetch('https://api-web.nhle.com/v1/standings/now', { signal: controller.signal }),
        fetch('https://api-web.nhle.com/v1/club-stats/BUF/now', { signal: controller.signal }),
        fetchJCC(controller.signal),
        fetchPlayoffSeries(controller.signal),
      ]);
    } finally {
      clearTimeout(timeout);
    }

    if (!schedRes.ok) {
      return res.status(502).json({ error: 'NHL API failed', status: schedRes.status });
    }

    const schedJson = await schedRes.json();
    const standJson = standRes.ok ? await standRes.json() : null;
    const statsJson = statsRes.ok ? await statsRes.json() : null;

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

    const past = games
      .filter(g => g.gameState === 'FINAL' || g.gameState === 'OFF')
      .sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate));

    const upcoming = games
      .filter(g => g.gameState === 'FUT' || g.gameState === 'PRE')
      .sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));

    const live = games.filter(g => g.gameState === 'LIVE' || g.gameState === 'CRIT');
    const liveGameRaw = live[0] ?? null;

    // Fetch period/clock for live game from gamecenter endpoint
    let liveDetails = null;
    if (liveGameRaw?.id) {
      try {
        const lgRes = await fetch(
          `https://api-web.nhle.com/v1/gamecenter/${liveGameRaw.id}/landing`,
          { signal: controller.signal }
        );
        if (lgRes.ok) {
          const lg = await lgRes.json();
          liveDetails = {
            period:          lg.periodDescriptor?.number       ?? 1,
            periodType:      lg.periodDescriptor?.periodType   ?? 'REG',
            timeRemaining:   lg.clock?.timeRemaining           ?? '',
            inIntermission:  lg.clock?.inIntermission          ?? false,
          };
        }
      } catch {}
    }

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
        date:         g.startTimeUTC ?? `${g.gameDate}T19:00:00Z`,
        status,
        opponentAbbr: them?.abbrev ?? '???',
        opponentName: them?.commonName?.default ?? them?.placeName?.default ?? 'Opponent',
        opponentLogo: them?.logo ?? '',
        ourScore,
        theirScore,
        isHome:       isBufHome,
        won,
        venue:        g.venue?.default ?? '',
        broadcast:    g.tvBroadcasts?.[0]?.network ?? '',
      };
    }

    const liveGame = liveGameRaw
      ? { ...parseGame(liveGameRaw), ...(liveDetails ?? {}) }
      : null;

    const result = {
      record,
      standing,
      liveGame,
      recentGame:    parseGame(past[0]),
      nextGame:      parseGame(upcoming[0]),
      topScorers,
      jcc:           jccResults,
      playoffSeries: playoffSeries ?? null,
      news: [],
    };

    // Tighter cache during live games so scores refresh quickly
    const cacheMaxAge = liveGame ? 30 : 120;
    const cacheSwr    = liveGame ? 15 : 60;
    res.setHeader('Cache-Control', `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=${cacheSwr}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(result);

  } catch {
    res.status(502).json({ error: 'Sports data fetch failed' });
  }
}
