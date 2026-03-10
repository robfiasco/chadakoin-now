// Vercel serverless function — fetches Buffalo Sabres data from ESPN
// Running server-side avoids CORS and gives us reliable logs.

const SABRES_ID = '7';

function parseGame(event) {
  try {
    const comp = event.competitions?.[0];
    if (!comp) return null;
    const competitors = comp.competitors ?? [];
    const us   = competitors.find(c => String(c.team?.id) === SABRES_ID);
    const them = competitors.find(c => String(c.team?.id) !== SABRES_ID);
    if (!us || !them) return null;

    const completed = comp.status?.type?.completed ?? false;
    const state     = comp.status?.type?.state ?? '';
    const status    = completed ? 'final' : state === 'in' ? 'live' : 'upcoming';

    return {
      date: event.date,
      status,
      opponentAbbr: them.team?.abbreviation ?? '???',
      opponentName: them.team?.displayName ?? 'Opponent',
      opponentLogo: them.team?.logo ?? '',
      ourScore:   String(us.score   ?? ''),
      theirScore: String(them.score ?? ''),
      isHome: us.homeAway === 'home',
      won: completed ? (us.winner === true) : null,
      venue: comp.venue?.fullName ?? '',
      broadcast: comp.broadcasts?.[0]?.names?.[0] ?? '',
    };
  } catch (e) {
    console.error('parseGame error', e);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    console.log('Fetching Sabres data from ESPN...');

    // 8-second timeout — Vercel hobby functions allow 10s max
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let schedRes, newsRes;
    try {
      [schedRes, newsRes] = await Promise.all([
        fetch('https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams/buf/schedule', { signal: controller.signal }),
        fetch('https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams/buf/news',     { signal: controller.signal }),
      ]);
    } finally {
      clearTimeout(timeout);
    }

    console.log('Schedule status:', schedRes.status, '| News status:', newsRes.status);

    const schedText = await schedRes.text();
    console.log('Schedule response (first 200):', schedText.slice(0, 200));

    if (!schedRes.ok) {
      return res.status(502).json({ error: 'ESPN schedule fetch failed', status: schedRes.status, body: schedText.slice(0, 300) });
    }

    let schedJson;
    try {
      schedJson = JSON.parse(schedText);
    } catch (e) {
      console.error('JSON parse failed:', e.message);
      return res.status(502).json({ error: 'ESPN returned non-JSON', body: schedText.slice(0, 300) });
    }

    const newsJson = newsRes.ok ? await newsRes.json().catch(() => ({ articles: [] })) : { articles: [] };

    const record   = schedJson.team?.record?.items?.[0]?.summary ?? '';
    const standing = schedJson.team?.standingSummary ?? '';
    const events   = schedJson.events ?? [];

    console.log(`Got ${events.length} schedule events, record: "${record}"`);

    const now = new Date();
    const past = events
      .filter(e => e.competitions?.[0]?.status?.type?.completed)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const upcoming = events
      .filter(e => !e.competitions?.[0]?.status?.type?.completed && new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`Past: ${past.length}, Upcoming: ${upcoming.length}`);

    const news = (newsJson.articles ?? []).slice(0, 5).map(a => ({
      title:   a.headline    ?? '',
      link:    a.links?.web?.href ?? '',
      date:    a.published   ?? '',
      summary: a.description ?? '',
    }));

    const recentGame = past[0]    ? parseGame(past[0])    : null;
    const nextGame   = upcoming[0] ? parseGame(upcoming[0]) : null;

    console.log(`recentGame: ${recentGame?.opponentName ?? 'none'}, nextGame: ${nextGame?.opponentName ?? 'none'}`);

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ record, standing, recentGame, nextGame, news });
  } catch (err) {
    console.error('Sabres handler error:', err.message);
    res.status(502).json({ error: err.message });
  }
}
