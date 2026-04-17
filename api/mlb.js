// Regional MLB data via MLB Stats API (free, no key required)
// Teams: New York Mets, Cleveland Guardians, Toronto Blue Jays, Pittsburgh Pirates, New York Yankees

const TEAMS = [
  { id: 121, name: 'Mets',      abbr: 'NYM' },
  { id: 114, name: 'Guardians', abbr: 'CLE' },
  { id: 141, name: 'Blue Jays', abbr: 'TOR' },
  { id: 134, name: 'Pirates',   abbr: 'PIT' },
  { id: 147, name: 'Yankees',   abbr: 'NYY' },
];

async function fetchStandings() {
  const year = new Date().getFullYear();
  const url  = `https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${year}&standingsTypes=regularSeason&fields=records,teamRecords,team,id,wins,losses`;
  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return {};
    const json = await res.json();
    const map  = {};
    for (const division of (json.records ?? [])) {
      for (const tr of (division.teamRecords ?? [])) {
        if (tr.team?.id != null) map[tr.team.id] = `${tr.wins}-${tr.losses}`;
      }
    }
    return map;
  } catch { return {}; }
}

async function fetchTeamGames(teamId) {
  const now   = new Date();
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const end   = new Date(now.getTime() +  7 * 24 * 60 * 60 * 1000);
  const fmt   = d => d.toISOString().split('T')[0];
  const url   = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${teamId}&gameType=R&startDate=${fmt(start)}&endDate=${fmt(end)}&hydrate=team`;

  const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return { games: [], nextGame: null };
  const json = await res.json();

  const completed = [];
  let nextGame = null;

  for (const dateObj of (json.dates ?? [])) {
    for (const g of (dateObj.games ?? [])) {
      const state = g.status?.detailedState ?? '';

      if (state === 'Final' || state === 'Completed Early') {
        const weAreHome = g.teams?.home?.team?.id === teamId;
        const us   = weAreHome ? g.teams.home : g.teams.away;
        const them = weAreHome ? g.teams.away : g.teams.home;
        completed.push({
          date:       dateObj.date,
          opponent:   them?.team?.name ?? '???',
          ourScore:   us?.score   ?? 0,
          theirScore: them?.score ?? 0,
          isHome:     weAreHome,
          won:        us?.isWinner === true,
        });
      } else if (!nextGame && (state === 'Scheduled' || state === 'Pre-Game' || state === 'Warmup')) {
        const weAreHome = g.teams?.home?.team?.id === teamId;
        const them = weAreHome ? g.teams?.away : g.teams?.home;
        nextGame = {
          date:         dateObj.date,
          gameTime:     g.gameDate ?? null,
          opponent:     them?.team?.name ?? '???',
          opponentAbbr: them?.team?.abbreviation ?? '',
          isHome:       weAreHome,
        };
      }
    }
  }

  return {
    games: completed
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5),
    nextGame,
  };
}

export default async function handler(req, res) {
  try {
    const [standings, ...teamResults] = await Promise.all([
      fetchStandings(),
      ...TEAMS.map(t =>
        fetchTeamGames(t.id).then(d => ({ ...t, ...d, record: '' }))
      ),
    ]);

    const teams = teamResults.map(t => ({
      ...t,
      record: standings[t.id] ?? '',
    }));

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    res.status(200).json({ teams });
  } catch (err) {
    res.status(200).json({ teams: [] });
  }
}
