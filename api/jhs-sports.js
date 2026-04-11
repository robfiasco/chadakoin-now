// Proxy for Jamestown High School recent scores via MaxPreps
// MaxPreps is Next.js — page embeds __NEXT_DATA__ JSON we can parse server-side.

const SCHOOL_URL = 'https://www.maxpreps.com/ny/jamestown/jamestown-red-and-green/';

// Recursively search a JSON tree for arrays that look like score records.
// MaxPreps changes their data shape occasionally; this survives small renames.
function findScoreArrays(obj, depth = 0, results = []) {
  if (depth > 6 || !obj || typeof obj !== 'object') return results;

  if (Array.isArray(obj)) {
    // A score array: elements have a date field plus score-like numeric fields
    if (obj.length > 0 && obj[0] && typeof obj[0] === 'object') {
      const sample = obj[0];
      const keys = Object.keys(sample);
      const hasDate = keys.some(k => /date/i.test(k));
      const hasScore = keys.some(k => /score|point|run|goal/i.test(k));
      const hasSport = keys.some(k => /sport/i.test(k));
      if (hasDate && (hasScore || hasSport)) {
        results.push(obj);
        return results;
      }
    }
    obj.forEach(item => findScoreArrays(item, depth + 1, results));
  } else {
    Object.values(obj).forEach(v => findScoreArrays(v, depth + 1, results));
  }
  return results;
}

function normalizeGame(g) {
  try {
    // MaxPreps uses various shapes depending on sport/section/version
    const dateRaw = g.date ?? g.gameDate ?? g.startDate ?? g.scheduledDate ?? '';
    const date = dateRaw ? new Date(dateRaw).toISOString() : '';

    // Determine if game is final
    const state = (g.gameState ?? g.status ?? g.state ?? '').toString().toUpperCase();
    const isFinal = /F|FINAL|COMPLETE|COMPLETED/.test(state) || g.isCompleted === true;
    if (!isFinal || !date) return null;

    // Try to extract our score vs opponent score
    const homeScore = g.homeScore ?? g.homeTeamScore ?? g.homeGoals ?? g.homeRuns ?? null;
    const awayScore = g.awayScore ?? g.awayTeamScore ?? g.awayGoals ?? g.awayRuns ?? null;
    const isHome   = g.isHome ?? (g.homeTeam?.name ?? '').toLowerCase().includes('jamestown');

    const ourScore   = isHome ? homeScore : awayScore;
    const theirScore = isHome ? awayScore : homeScore;

    const opponentObj  = isHome ? (g.awayTeam ?? g.opponent) : (g.homeTeam ?? g.opponent);
    const opponentName = typeof opponentObj === 'string'
      ? opponentObj
      : (opponentObj?.name ?? opponentObj?.displayName ?? g.opponentName ?? 'Opponent');

    const won = ourScore != null && theirScore != null ? ourScore > theirScore : null;
    const result = won === true ? 'W' : won === false ? 'L' : 'F';
    const score  = (ourScore != null && theirScore != null) ? `${ourScore}-${theirScore}` : '';

    const sportRaw = g.sport?.name ?? g.sportName ?? g.sport ?? '';

    return { date, sport: sportRaw, opponent: opponentName, isHome, result, score, won };
  } catch { return null; }
}

export default async function handler(req, res) {
  try {
    const pageRes = await fetch(SCHOOL_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!pageRes.ok) throw new Error(`MaxPreps HTTP ${pageRes.status}`);

    const html = await pageRes.text();

    // Extract embedded Next.js data
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) throw new Error('__NEXT_DATA__ not found in page');

    const nextData = JSON.parse(match[1]);

    // Find all score-like arrays in the data tree
    const scoreArrays = findScoreArrays(nextData);
    const allGames = scoreArrays.flat();

    const results = allGames
      .map(normalizeGame)
      .filter(Boolean)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    res.status(200).json({ results });
  } catch (err) {
    // Return empty results rather than an error so the UI degrades gracefully
    res.status(200).json({ results: [] });
  }
}
