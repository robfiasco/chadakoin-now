// Regional MLB data via MLB Stats API (free, no key required)
// Teams: New York Mets, Cleveland Guardians, Toronto Blue Jays, Pittsburgh Pirates, New York Yankees

const TEAMS = [
  { id: 121, name: 'Mets',      abbr: 'NYM' },
  { id: 114, name: 'Guardians', abbr: 'CLE' },
  { id: 141, name: 'Blue Jays', abbr: 'TOR' },
  { id: 134, name: 'Pirates',   abbr: 'PIT' },
  { id: 147, name: 'Yankees',   abbr: 'NYY' },
];

// MLB's own seriesDescription strings, shortened to fit a status-pill label.
const ROUND_LABELS = {
  'AL Wild Card Series':     'AL WILD CARD',
  'NL Wild Card Series':     'NL WILD CARD',
  'AL Division Series':      'ALDS',
  'NL Division Series':      'NLDS',
  'AL Championship Series':  'ALCS',
  'NL Championship Series':  'NLCS',
  'World Series':            'WORLD SERIES',
};

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
  const empty = { games: [], nextGame: null, liveGame: null, inPostseason: false, eliminated: false };
  try {
    const now   = new Date();
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end   = new Date(now.getTime() +  7 * 24 * 60 * 60 * 1000);
    const fmt   = d => d.toISOString().split('T')[0];
    // gameType R = regular season only — once the regular season ends (late
    // Sept) and the postseason starts, a team still alive in October needs
    // its Wild Card (F) / Division (D) / League Championship (L) / World
    // Series (W) games included too, or this silently freezes on their last
    // regular-season result for the rest of the playoffs.
    const url   = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${teamId}&gameType=R,F,D,L,W&startDate=${fmt(start)}&endDate=${fmt(end)}&hydrate=team(record),probablePitcher,linescore,venue,seriesStatus`;

    const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return empty;
    const json = await res.json();

    const completed = [];
    let nextGame = null;
    let liveGame = null;
    // Any non-'R' game in this window means the team actually made the
    // postseason — used to hide regional teams that didn't once the
    // regular season ends, instead of leaving their frozen final record on
    // screen as if it still mattered this week.
    let inPostseason = false;
    // Round + series score (e.g. "ALDS" / "0-2") instead of the frozen
    // regular-season record, which reads as current but isn't once a team
    // is actually playing a best-of-N series. Games arrive chronologically,
    // so the last non-R game seen (completed, live, or still-scheduled —
    // seriesStatus already reflects the series' current state either way)
    // is always the right one to read this from.
    let postseasonRound = null;
    let seriesRecord = null;
    // Set true only by a *decided* series (seriesStatus.isOver) we didn't
    // win — a team swept out of the ALDS still has "Scheduled" Games 4/5
    // sitting in this same window (MLB doesn't remove them), so without
    // this, inPostseason stayed true forever post-elimination and kept
    // showing a dead team's last series as if it were still live.
    let eliminated = false;
    // Round of the most recent COMPLETED postseason game, tracked apart from
    // the round of whatever is scheduled next. Reading one value off "the
    // last non-R game in the window" conflated the two: once Cleveland
    // clinched the ALDS, the scheduled ALCS games made postseasonRound
    // "ALCS" while the result line still showed the ALDS clincher, so the
    // card read "ALCS 0-0" next to a win from the previous round.
    let playedRound = null;
    let upcomingRound = null;
    let lastRoundResult = null;

    for (const dateObj of (json.dates ?? [])) {
      for (const g of (dateObj.games ?? [])) {
        const state = g.status?.detailedState ?? '';
        const isFinal = state === 'Final' || state === 'Completed Early';
        if (g.gameType && g.gameType !== 'R') {
          inPostseason = true;
          const round = ROUND_LABELS[g.seriesDescription] ?? g.seriesDescription ?? null;
          const ss = g.seriesStatus;

          if (isFinal) {
            playedRound = round ?? playedRound;
            if (ss) {
              const wins = ss.wins ?? 0, losses = ss.losses ?? 0;
              // seriesStatus.wins/losses is the LEADING team's record, and
              // winningTeam is frequently null even on a clinching game, so
              // neither can tell us who the leader is. The game itself can:
              // whoever won the clincher won the series, and for an
              // in-progress series the result string names the leader.
              const weAreHome = g.teams?.home?.team?.id === teamId;
              const weWonThisGame = (weAreHome ? g.teams?.home : g.teams?.away)?.isWinner === true;
              const ourAbbr = (weAreHome ? g.teams?.home : g.teams?.away)?.team?.abbreviation ?? '';
              const weLead = ss.isOver
                ? weWonThisGame
                : (ourAbbr && typeof ss.result === 'string' ? ss.result.startsWith(ourAbbr) : false);
              seriesRecord = weLead ? `${wins}-${losses}` : `${losses}-${wins}`;
              eliminated = !!ss.isOver && !weWonThisGame;
              lastRoundResult = ss.isOver && weWonThisGame && round
                ? `Won ${round} ${Math.max(wins, losses)}–${Math.min(wins, losses)}`
                : null;
            }
          } else if (!upcomingRound) {
            upcomingRound = round ?? null;
          }
        }

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
          const oppRec   = them?.leagueRecord;
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
      // Eliminated reads as "not in the postseason" for the client's
      // existing inPostseason filter/pill logic, but keeps the round name
      // around (eliminatedRound) so a "Season over · ALDS" label is still
      // possible instead of the team just silently vanishing.
      inPostseason: inPostseason && !eliminated,
      eliminated,
      eliminatedRound: eliminated ? playedRound : null,
      // The round the team is IN: whatever is scheduled next once the last
      // series finished, otherwise the one still being played.
      postseasonRound: (lastRoundResult && upcomingRound) ? upcomingRound : (playedRound ?? upcomingRound),
      // Suppressed between rounds — the next series genuinely is 0-0, but
      // rendering that next to the previous round's clincher just looked
      // like a wrong score.
      seriesRecord: (lastRoundResult && upcomingRound) ? null : seriesRecord,
      // e.g. "Won ALDS 3–2" — shown instead of the raw last-game result so
      // a clinching win isn't captioned with the next round's name.
      lastRoundResult: upcomingRound ? lastRoundResult : null,
    };
  } catch { return empty; }
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
      // streak/last10/gamesBack come from standingsTypes=regularSeason, so
      // once the postseason starts they're frozen at whatever the team's
      // final regular-season form was — which is why Cleveland showed "L1"
      // after three straight playoff wins and the swept Yankees showed "W1".
      // They describe a season that's over; drop them rather than present
      // stale numbers as current.
      const postseason = t.inPostseason || t.eliminated;
      return {
        ...t,
        record:      standing?.record      ?? '',
        divisionRank: standing?.divisionRank,
        gamesBack:   postseason ? undefined : standing?.gamesBack,
        streak:      postseason ? undefined : standing?.streak,
        last10:      postseason ? undefined : standing?.last10,
      };
    });

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    res.status(200).json({ teams });
  } catch {
    res.status(200).json({ teams: [] });
  }
}
