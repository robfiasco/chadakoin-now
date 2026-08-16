// Regional NFL data via ESPN's public site API (free, no key required)
// Teams: Buffalo Bills, Pittsburgh Steelers, Cleveland Browns

const TEAMS = [
  { espnAbbr: 'buf', abbr: 'BUF', name: 'Bills' },
  { espnAbbr: 'pit', abbr: 'PIT', name: 'Steelers' },
  { espnAbbr: 'cle', abbr: 'CLE', name: 'Browns' },
];

async function fetchTeamRecord(espnAbbr) {
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${espnAbbr}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return '';
    const json = await res.json();
    return json.team?.record?.items?.[0]?.summary ?? '';
  } catch { return ''; }
}

async function fetchTeamSchedule(espnAbbr) {
  const empty = { games: [], nextGame: null, liveGame: null };
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${espnAbbr}/schedule`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return empty;
    const json = await res.json();

    const games = [];
    let nextGame = null;
    let liveGame = null;

    for (const event of (json.events ?? [])) {
      const comp = event.competitions?.[0];
      if (!comp) continue;
      const state = comp.status?.type?.state ?? '';
      const us   = (comp.competitors ?? []).find(c => c.team?.abbreviation === espnAbbr.toUpperCase());
      const them = (comp.competitors ?? []).find(c => c.team?.abbreviation !== espnAbbr.toUpperCase());
      if (!us || !them) continue;
      const isHome = us.homeAway === 'home';
      const venue  = comp.venue?.fullName ?? '';
      const broadcast = comp.broadcasts?.[0]?.media?.shortName ?? '';

      if (state === 'post') {
        games.push({
          date: event.date,
          week: event.week?.text ?? '',
          opponent: them.team?.displayName ?? '???',
          opponentAbbr: them.team?.abbreviation ?? '???',
          ourScore: us.score?.displayValue ?? '0',
          theirScore: them.score?.displayValue ?? '0',
          isHome,
          won: us.winner === true,
        });
      } else if (state === 'in') {
        liveGame = {
          week: event.week?.text ?? '',
          opponent: them.team?.displayName ?? '???',
          opponentAbbr: them.team?.abbreviation ?? '???',
          opponentLogo: them.team?.logo ?? '',
          ourScore: us.score?.displayValue ?? '0',
          theirScore: them.score?.displayValue ?? '0',
          isHome,
          clock: comp.status?.type?.shortDetail ?? '',
        };
      } else if (!nextGame && state === 'pre') {
        const d = new Date(event.date);
        if (d > new Date()) {
          nextGame = {
            date: event.date,
            week: event.week?.text ?? '',
            opponent: them.team?.displayName ?? '???',
            opponentAbbr: them.team?.abbreviation ?? '???',
            opponentLogo: them.team?.logo ?? '',
            isHome,
            venue,
            broadcast,
          };
        }
      }
    }

    return {
      games: games.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
      nextGame,
      liveGame,
    };
  } catch { return empty; }
}

export default async function handler(req, res) {
  try {
    const teams = await Promise.all(TEAMS.map(async t => {
      const [record, schedule] = await Promise.all([
        fetchTeamRecord(t.espnAbbr),
        fetchTeamSchedule(t.espnAbbr),
      ]);
      return {
        abbr: t.abbr,
        name: t.name,
        logo: `https://a.espncdn.com/i/teamlogos/nfl/500/${t.espnAbbr}.png`,
        record,
        ...schedule,
      };
    }));

    const hasLive = teams.some(t => t.liveGame);
    const cacheMaxAge = hasLive ? 30 : 300;
    const cacheSwr    = hasLive ? 15 : 60;
    res.setHeader('Cache-Control', `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=${cacheSwr}`);
    res.status(200).json({ teams });
  } catch (err) {
    res.status(200).json({ teams: [] });
  }
}
