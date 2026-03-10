// Vercel serverless function — Buffalo Sabres data via NHL official API
// api-web.nhle.com is publicly accessible from server environments.

export default async function handler(req, res) {
  try {
    console.log('Fetching Sabres from NHL API...');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let schedRes, standRes;
    try {
      [schedRes, standRes] = await Promise.all([
        fetch('https://api-web.nhle.com/v1/club-schedule-season/BUF/now', { signal: controller.signal }),
        fetch('https://api-web.nhle.com/v1/standings/now', { signal: controller.signal }),
      ]);
    } finally {
      clearTimeout(timeout);
    }

    console.log('Schedule:', schedRes.status, '| Standings:', standRes.status);

    if (!schedRes.ok) {
      return res.status(502).json({ error: 'NHL API failed', status: schedRes.status });
    }

    const schedJson = await schedRes.json();
    const standJson = standRes.ok ? await standRes.json() : null;

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
      news: [], // NHL API doesn't provide news — use Sabres-specific RSS in future
    };

    console.log(`record: "${record}", recent: ${result.recentGame?.opponentName}, next: ${result.nextGame?.opponentName}`);

    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(result);

  } catch (err) {
    console.error('Sabres error:', err.message);
    res.status(502).json({ error: err.message });
  }
}
