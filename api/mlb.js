// Regional MLB data via MLB Stats API (free, no key required)
// Teams: New York Mets, Cleveland Guardians, Toronto Blue Jays, Pittsburgh Pirates, New York Yankees, Houston Astros

const TEAMS = [
  { id: 121, name: 'Mets',      abbr: 'NYM' },
  { id: 114, name: 'Guardians', abbr: 'CLE' },
  { id: 141, name: 'Blue Jays', abbr: 'TOR' },
  { id: 134, name: 'Pirates',   abbr: 'PIT' },
  { id: 147, name: 'Yankees',   abbr: 'NYY' },
  { id: 117, name: 'Astros',    abbr: 'HOU', communityPick: "Raybeans' Pick · LOTD" },
];

async function fetchStandings() {
  const year = new Date().getFullYear();
  const url  = `https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${year}&standingsTypes=regularSeason`;
  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return {};
    const json = await res.json();
    const map  = {};
    for (const division of (json.records ?? [])) {
      for (const tr of (division.teamRecords ?? [])) {
        const id = tr.team?.id;
        if (!id) continue;
        const last10rec = (tr.records?.splitRecords ?? []).find(r => r.type === 'lastTen');
        map[id] = {
          record: `${tr.wins ?? 0}-${tr.losses ?? 0}`,
          divisionRank: parseInt(tr.divisionRank ?? '0'),
          gamesBack: tr.gamesBack === '-' ? '—' : `${tr.gamesBack} GB`,
          streak: tr.streak?.streakCode ?? '',
          last10: last10rec ? `${last10rec.wins}-${last10rec.losses}` : '',
        };
      }
    }
    return map;
  } catch { return {}; }
}

async function fetchTeamStats(teamId, year) {
  try {
    const url = `https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=hitting,pitching&season=${year}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return {};
    const json = await res.json();
    const hitting  = (json.stats ?? []).find(s => s.group?.displayName === 'hitting');
    const pitching = (json.stats ?? []).find(s => s.group?.displayName === 'pitching');
    return {
      teamBA:  hitting?.splits?.[0]?.stat?.avg  ?? undefined,
      teamERA: pitching?.splits?.[0]?.stat?.era ?? undefined,
    };
  } catch { return {}; }
}

async function fetchTeamGames(teamId) {
  const now   = new Date();
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const end   = new Date(now.getTime() +  7 * 24 * 60 * 60 * 1000);
  const fmt   = d => d.toISOString().split('T')[0];
  const url   = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${teamId}&gameType=R&startDate=${fmt(start)}&endDate=${fmt(end)}&hydrate=team(record),probablePitcher,linescore,venue`;

  const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return { games: [], nextGame: null, liveGame: null };
  const json = await res.json();

  const completed = [];
  let nextGame = null;
  let liveGame = null;

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
      } else if (!liveGame && (state === 'In Progress' || state === 'Live Preview')) {
        const weAreHome = g.teams?.home?.team?.id === teamId;
        const us   = weAreHome ? g.teams.home : g.teams.away;
        const them = weAreHome ? g.teams.away : g.teams.home;
        const ls   = g.linescore ?? {};
        liveGame = {
          inning: ls.currentInning ?? 0,
          inningOrdinal: ls.currentInningOrdinal ?? '',
          topBottom: ls.isTopInning ? 'Top' : 'Bot',
          ourScore:   us?.score   ?? 0,
          theirScore: them?.score ?? 0,
          outs: ls.outs ?? 0,
          isHome: weAreHome,
          opponent: them?.team?.name ?? '???',
          opponentAbbr: them?.team?.abbreviation ?? '',
          opponentId: them?.team?.id,
        };
      } else if (!nextGame && (state === 'Scheduled' || state === 'Pre-Game' || state === 'Warmup')) {
        const weAreHome = g.teams?.home?.team?.id === teamId;
        const them = weAreHome ? g.teams?.away : g.teams?.home;
        const probUs   = (weAreHome ? g.teams?.home : g.teams?.away)?.probablePitcher;
        const probThem = (weAreHome ? g.teams?.away : g.teams?.home)?.probablePitcher;
        const oppRec   = them?.team?.record;
        nextGame = {
          date:               dateObj.date,
          gameTime:           g.gameDate ?? null,
          opponent:           them?.team?.name ?? '???',
          opponentAbbr:       them?.team?.abbreviation ?? '',
          opponentId:         them?.team?.id,
          isHome:             weAreHome,
          probablePitcher:    probUs?.fullName  ?? probUs?.lastName  ?? null,
          oppProbablePitcher: probThem?.fullName ?? probThem?.lastName ?? null,
          venue:              g.venue?.name ?? null,
          oppRecord:          oppRec ? `${oppRec.wins}-${oppRec.losses}` : null,
        };
      }
    }
  }

  return {
    games: completed
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10),
    nextGame,
    liveGame,
  };
}

export default async function handler(req, res) {
  try {
    const year = new Date().getFullYear();
    const [standings, ...teamResults] = await Promise.all([
      fetchStandings(),
      ...TEAMS.map(t =>
        Promise.all([
          fetchTeamGames(t.id),
          fetchTeamStats(t.id, year),
        ]).then(([gameData, statsData]) => ({ ...t, ...gameData, ...statsData }))
      ),
    ]);

    const teams = teamResults.map(t => {
      const standing = standings[t.id];
      return {
        ...t,
        record:      standing?.record      ?? '',
        divisionRank: standing?.divisionRank,
        gamesBack:   standing?.gamesBack,
        streak:      standing?.streak,
        last10:      standing?.last10,
      };
    });

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    res.status(200).json({ teams });
  } catch (err) {
    res.status(200).json({ teams: [] });
  }
}
