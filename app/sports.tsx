import React, { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, ScrollView, StyleSheet, Platform,
  TouchableOpacity, Linking, Image, ImageBackground, Animated, Easing, RefreshControl,
  useWindowDimensions, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse } from '../components/SkeletonPulse';
import { PulsingDot } from '../components/PulsingDot';
import { dark } from '../lib/colors';
import { openLink } from '../lib/openLink';
import { apiUrl } from '../lib/api';

interface NextUpItem {
  ts: number; sport: string; emoji: string; matchup: string;
  dateLabel: string; time?: string;
  gradStart: string; gradEnd: string; accent: string;
  ourLogoUrl?: string; oppLogoUrl?: string;
  isLive?: boolean; bgKey?: 'hockey' | 'baseball';
  // Detail sheet extras
  venue?: string; broadcast?: string;
  probablePitcher?: string; oppProbablePitcher?: string;
  record?: string; oppRecord?: string; opponentName?: string; isHome?: boolean;
  seriesLabel?: string; // e.g. "Round 1 · Best of 7"
}
interface GameResult {
  date: string; status: 'final' | 'live' | 'upcoming';
  opponentAbbr: string; opponentName: string; opponentLogo: string;
  ourScore: string; theirScore: string; isHome: boolean;
  won: boolean | null; venue: string; broadcast: string;
  // Live game extras (populated when status === 'live')
  period?: number; periodType?: string; timeRemaining?: string; inIntermission?: boolean;
}
interface Scorer { name: string; position: string; goals: number; assists: number; points: number; headshot: string; }
interface JCCResult   { date: string; sport: string; opponent: string; isHome: boolean; result: string; score: string; won: boolean; link: string; }
interface JCCUpcoming { date: string; sport: string; opponent: string; isHome: boolean; link: string; }
interface JCCData     { results: JCCResult[]; upcoming: JCCUpcoming[]; records: Record<string, { w: number; l: number }>; }
interface MLBGame     { date: string; opponent: string; ourScore: number; theirScore: number; isHome: boolean; won: boolean; }
interface MLBLiveGame {
  inning: number; inningOrdinal: string; topBottom: string;
  ourScore: number; theirScore: number; outs: number;
  isHome: boolean; opponent: string; opponentAbbr: string; opponentId?: number;
}
interface MLBNextGame {
  date: string; gameTime?: string | null; opponent: string;
  opponentAbbr?: string; opponentId?: number; isHome: boolean;
  probablePitcher?: string | null; oppProbablePitcher?: string | null;
  venue?: string | null; oppRecord?: string | null;
}
interface MLBTeam {
  id: number; name: string; abbr: string; record?: string;
  divisionRank?: number; gamesBack?: string; streak?: string; last10?: string;
  teamBA?: string; teamERA?: string;
  games: MLBGame[]; nextGame?: MLBNextGame | null;
  liveGame?: MLBLiveGame | null;
  communityPick?: string;
}

// MLB team ID → ESPN CDN abbreviation (reliable fallback when API omits abbreviation)
const MLB_ID_ESPN: Record<number, string> = {
  108:'laa', 109:'ari', 110:'bal', 111:'bos', 112:'chc',
  113:'cin', 114:'cle', 115:'col', 116:'det', 117:'hou',
  118:'kc',  119:'lad', 120:'wsh', 121:'nym', 133:'oak',
  134:'pit', 135:'sd',  136:'sea', 137:'sf',  138:'stl',
  139:'tb',  140:'tex', 141:'tor', 142:'min', 143:'phi',
  144:'atl', 145:'cws', 146:'mia', 147:'nyy', 158:'mil',
};
interface PlayoffSeries {
  round: number; roundLabel: string;
  opponent: string; bufWins: number; oppWins: number; neededToWin: number;
}
interface SabresData {
  record: string; standing: string; points?: number;
  wins?: number; losses?: number; otLosses?: number;
  recentGame?: GameResult; nextGame?: GameResult; liveGame?: GameResult | null;
  topScorers?: Scorer[]; jcc?: JCCData | null; mlb?: MLBTeam[];
  playoffSeries?: PlayoffSeries | null;
  news: any[];
}

const SABRES_ID   = '7';
const SABRES_LOGO = 'https://a.espncdn.com/i/teamlogos/nhl/500/buf.png';

// Renders a team logo with graceful fallback to abbreviation text if the image fails
function TeamLogo({ uri, abbr, size, accent }: { uri?: string; abbr: string; size: number; accent?: string }) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return (
      <Text style={{ fontFamily: 'DMSans_800ExtraBold', fontSize: size * 0.28, letterSpacing: 1, color: accent ?? 'rgba(255,255,255,0.55)', textAlign: 'center' }}>
        {abbr}
      </Text>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size }}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  );
}
const SABRES_ESPN = 'https://www.espn.com/nhl/team/_/name/buf/buffalo-sabres';
const JCC_LOGO    = require('../assets/jcc_logo.png');

const ACC = {
  jcc:    '#34d399',  // emerald-400
  skunks: '#84cc16',  // lime-500
  sabres: '#60a5fa',  // blue-400
  mlb:    '#a78bfa',  // violet-400
  label:  '#22d3ee',  // cyan-400 — section headers
} as const;

interface SkunksGame {
  date: string; time: string; isHome: boolean; opponent: string; promotion?: string | null;
}
const SKUNKS_SCHEDULE: SkunksGame[] = [
  { date: '2026-05-29', time: '6:30 PM', isHome: true,  opponent: 'Olean Oilers',          promotion: 'Opening Night Tailgate' },
  { date: '2026-05-30', time: '6:30 PM', isHome: false, opponent: 'Olean Oilers',          promotion: null },
  { date: '2026-06-02', time: '6:30 PM', isHome: true,  opponent: 'Olean Oilers',          promotion: '$2 Night' },
  { date: '2026-06-03', time: '6:30 PM', isHome: false, opponent: 'Batavia Muckdogs',      promotion: null },
  { date: '2026-06-04', time: '6:30 PM', isHome: false, opponent: 'Newark Pilots',         promotion: null },
  { date: '2026-06-05', time: '6:30 PM', isHome: false, opponent: 'Niagara Ironbacks',     promotion: null },
  { date: '2026-06-06', time: '6:30 PM', isHome: false, opponent: 'Niagara Falls Americans', promotion: null },
  { date: '2026-06-09', time: '11:00 AM', isHome: true, opponent: 'Olean Oilers',          promotion: 'School Kids Game' },
  { date: '2026-06-10', time: '6:30 PM', isHome: true,  opponent: 'Niagara Falls Americans', promotion: 'Bark at the Park' },
  { date: '2026-06-11', time: '6:30 PM', isHome: false, opponent: 'Batavia Muckdogs',      promotion: null },
  { date: '2026-06-12', time: '6:30 PM', isHome: false, opponent: 'Geneva Red Wings',      promotion: null },
  { date: '2026-06-13', time: '6:30 PM', isHome: true,  opponent: 'Niagara Ironbacks',     promotion: 'Kids Carnival Night' },
  { date: '2026-06-14', time: '4:00 PM', isHome: true,  opponent: 'Elmira Pioneers',       promotion: 'Electrovaya Night' },
  { date: '2026-06-14', time: '6:30 PM', isHome: true,  opponent: 'Elmira Pioneers',       promotion: 'Electrovaya Night' },
  { date: '2026-06-16', time: '6:30 PM', isHome: false, opponent: 'Newark Pilots',         promotion: null },
  { date: '2026-06-17', time: '6:30 PM', isHome: true,  opponent: 'Olean Oilers',          promotion: 'Lawley Night' },
  { date: '2026-06-18', time: '6:30 PM', isHome: true,  opponent: 'Niagara Falls Americans', promotion: 'First Responders Night' },
  { date: '2026-06-19', time: '6:30 PM', isHome: true,  opponent: 'Niagara Ironbacks',     promotion: 'Youth Baseball & Softball Night' },
  { date: '2026-06-23', time: '6:30 PM', isHome: false, opponent: 'Niagara Falls Americans', promotion: null },
  { date: '2026-06-25', time: '6:30 PM', isHome: true,  opponent: 'Batavia Muckdogs',      promotion: 'JCC Free Ticket Night' },
  { date: '2026-06-27', time: '6:30 PM', isHome: true,  opponent: 'Niagara Falls Americans', promotion: 'Kids Camp Day/Night' },
  { date: '2026-06-28', time: '4:00 PM', isHome: false, opponent: 'Auburn Doubledays',     promotion: null },
  { date: '2026-06-28', time: '7:00 PM', isHome: false, opponent: 'Auburn Doubledays',     promotion: null },
  { date: '2026-06-30', time: '6:30 PM', isHome: false, opponent: 'Olean Oilers',          promotion: null },
  { date: '2026-07-01', time: '6:30 PM', isHome: false, opponent: 'Batavia Muckdogs',      promotion: null },
  { date: '2026-07-02', time: '6:30 PM', isHome: false, opponent: 'Olean Oilers',          promotion: null },
  { date: '2026-07-03', time: '6:30 PM', isHome: true,  opponent: 'Olean Oilers',          promotion: 'Fireworks Night' },
  { date: '2026-07-04', time: '6:30 PM', isHome: false, opponent: 'Niagara Ironbacks',     promotion: null },
  { date: '2026-07-05', time: '2:05 PM', isHome: false, opponent: 'Elmira Pioneers',       promotion: null },
  { date: '2026-07-05', time: '4:30 PM', isHome: false, opponent: 'Elmira Pioneers',       promotion: null },
  { date: '2026-07-07', time: '6:30 PM', isHome: true,  opponent: 'Newark Pilots',         promotion: '$2 Night' },
  { date: '2026-07-10', time: '6:30 PM', isHome: true,  opponent: 'Batavia Muckdogs',      promotion: 'Wegmans Free Ticket Night' },
  { date: '2026-07-11', time: '6:30 PM', isHome: false, opponent: 'Geneva Red Wings',      promotion: null },
  { date: '2026-07-12', time: '4:00 PM', isHome: true,  opponent: 'Auburn Doubledays',     promotion: 'GCFCU Free Ticket Night' },
  { date: '2026-07-12', time: '6:30 PM', isHome: true,  opponent: 'Auburn Doubledays',     promotion: 'GCFCU Free Ticket Night' },
  { date: '2026-07-13', time: '6:30 PM', isHome: false, opponent: 'Batavia Muckdogs',      promotion: null },
  { date: '2026-07-15', time: '6:30 PM', isHome: true,  opponent: 'Batavia Muckdogs',      promotion: 'Superhero Night' },
  { date: '2026-07-16', time: '6:30 PM', isHome: false, opponent: 'Niagara Falls Americans', promotion: null },
  { date: '2026-07-17', time: '6:30 PM', isHome: true,  opponent: 'Newark Pilots',         promotion: 'Strike Out Cancer Night' },
  { date: '2026-07-19', time: '4:00 PM', isHome: true,  opponent: 'Geneva Red Wings',      promotion: 'United Way Night' },
  { date: '2026-07-21', time: '6:30 PM', isHome: true,  opponent: 'Niagara Ironbacks',     promotion: '$2 Night' },
  { date: '2026-07-23', time: '6:30 PM', isHome: false, opponent: 'Olean Oilers',          promotion: null },
  { date: '2026-07-24', time: '6:30 PM', isHome: false, opponent: 'Olean Oilers',          promotion: null },
  { date: '2026-07-25', time: '6:30 PM', isHome: true,  opponent: 'Geneva Red Wings',      promotion: 'Xmas in July' },
];

function sportEmoji(sport: string): string {
  const s = sport.toLowerCase();
  if (s.includes('basketball')) return '🏀';
  if (s.includes('baseball'))   return '⚾';
  if (s.includes('hockey'))     return '🏒';
  if (s.includes('soccer'))     return '⚽';
  if (s.includes('golf'))       return '⛳';
  if (s.includes('softball'))   return '🥎';
  if (s.includes('volleyball')) return '🏐';
  if (s.includes('lacrosse'))   return '🥍';
  if (s.includes('swim'))       return '🏊';
  if (s.includes('track') || s.includes('cross')) return '🏃';
  if (s.includes('tennis'))     return '🎾';
  return '🏅';
}

// Transforms an ESPN-format game event into our GameResult shape.
function parseGame(event: any): GameResult | null {
  try {
    const comp = event.competitions?.[0]; if (!comp) return null;
    const competitors: any[] = comp.competitors ?? [];
    const us   = competitors.find(c => String(c.team?.id) === SABRES_ID);
    const them = competitors.find(c => String(c.team?.id) !== SABRES_ID);
    if (!us || !them) return null;
    const status: GameResult['status'] = comp.status?.type?.completed ? 'final' : comp.status?.type?.state === 'in' ? 'live' : 'upcoming';
    return {
      date: event.date, status,
      opponentAbbr: them.team?.abbreviation ?? '???',
      opponentName: them.team?.displayName ?? 'Opponent',
      opponentLogo: them.team?.abbreviation
        ? `https://a.espncdn.com/i/teamlogos/nhl/500/${them.team.abbreviation.toLowerCase()}.png`
        : (them.team?.logo ?? ''),
      ourScore: us.score ?? '—', theirScore: them.score ?? '—',
      isHome: us.homeAway === 'home',
      won: status === 'final' ? (us.winner === true) : null,
      venue: comp.venue?.fullName ?? '', broadcast: comp.broadcasts?.[0]?.names?.[0] ?? '',
    };
  } catch { return null; }
}

// Transforms an NHL API v1 game (native — different shape from ESPN).
function parseNHLGame(g: any): GameResult | null {
  try {
    const home = g.homeTeam; const away = g.awayTeam;
    if (!home || !away) return null;
    const weAreHome = (home.abbrev ?? '').toUpperCase() === 'BUF';
    const us = weAreHome ? home : away;
    const them = weAreHome ? away : home;
    const state = (g.gameState ?? '').toUpperCase();
    const status: GameResult['status'] = (state === 'FINAL' || state === 'OFF') ? 'final' : (state === 'LIVE' || state === 'CRIT') ? 'live' : 'upcoming';
    const ourScore   = us.score   != null ? String(us.score)   : '—';
    const theirScore = them.score != null ? String(them.score) : '—';
    const won = status === 'final' ? parseInt(ourScore) > parseInt(theirScore) : null;
    const abbrev = (them.abbrev ?? '').toUpperCase();
    const opponentLogo = abbrev
      ? `https://a.espncdn.com/i/teamlogos/nhl/500/${abbrev.toLowerCase()}.png`
      : '';
    return {
      date: g.startTimeUTC ?? g.gameDate ?? '', status,
      opponentAbbr: abbrev || '???',
      opponentName: them.placeName?.default ?? abbrev ?? 'Opponent',
      opponentLogo, ourScore, theirScore,
      isHome: weAreHome, won,
      venue: g.venue?.default ?? '', broadcast: '',
    };
  } catch { return null; }
}

async function fetchMLB(): Promise<MLBTeam[]> {
  try {
    if (Platform.OS === 'web') {
      const res = await fetch(apiUrl('/api/mlb'));
      if (!res.ok) return [];
      const json = await res.json();
      return (json.teams ?? []) as MLBTeam[];
    }
    const MLB_TEAMS = [
      { id: 121, name: 'Mets',      abbr: 'NYM' },
      { id: 114, name: 'Guardians', abbr: 'CLE' },
      { id: 141, name: 'Blue Jays', abbr: 'TOR' },
      { id: 134, name: 'Pirates',   abbr: 'PIT' },
      { id: 147, name: 'Yankees',   abbr: 'NYY' },
      { id: 117, name: 'Astros',    abbr: 'HOU', communityPick: "Raybeans' Pick · LOTD" },
    ];
    const now   = new Date();
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end   = new Date(now.getTime() +  7 * 24 * 60 * 60 * 1000);
    const fmt   = (d: Date) => d.toISOString().split('T')[0];
    const year  = now.getFullYear();

    let standingsMap: Record<number, { record: string; divisionRank: number; gamesBack: string; streak: string; last10: string }> = {};
    try {
      const sRes  = await fetch(`https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${year}&standingsTypes=regularSeason`);
      const sJson = sRes.ok ? await sRes.json() : null;
      for (const div of (sJson?.records ?? [])) {
        for (const tr of (div.teamRecords ?? [])) {
          const id = tr.team?.id;
          if (!id) continue;
          const last10rec = (tr.records?.splitRecords ?? []).find((r: any) => r.type === 'lastTen');
          standingsMap[id] = {
            record: `${tr.wins ?? 0}-${tr.losses ?? 0}`,
            divisionRank: parseInt(tr.divisionRank ?? '0'),
            gamesBack: tr.gamesBack === '-' ? '—' : `${tr.gamesBack} GB`,
            streak: tr.streak?.streakCode ?? '',
            last10: last10rec ? `${last10rec.wins}-${last10rec.losses}` : '',
          };
        }
      }
    } catch {}

    const results = await Promise.all(MLB_TEAMS.map(async t => {
      try {
        const scheduleUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${t.id}&gameType=R&startDate=${fmt(start)}&endDate=${fmt(end)}&hydrate=team(record),probablePitcher,linescore,venue`;
        const [res, statsRes] = await Promise.all([
          fetch(scheduleUrl),
          fetch(`https://statsapi.mlb.com/api/v1/teams/${t.id}/stats?stats=season&group=hitting,pitching&season=${year}`),
        ]);
        let teamBA: string | undefined, teamERA: string | undefined;
        if (statsRes.ok) {
          const statsJson = await statsRes.json();
          const hitting  = (statsJson.stats ?? []).find((s: any) => s.group?.displayName === 'hitting');
          const pitching = (statsJson.stats ?? []).find((s: any) => s.group?.displayName === 'pitching');
          teamBA  = hitting?.splits?.[0]?.stat?.avg   ?? undefined;
          teamERA = pitching?.splits?.[0]?.stat?.era  ?? undefined;
        }
        if (!res.ok) {
          const standing = standingsMap[t.id];
          return { ...t, games: [], nextGame: null, liveGame: null, teamBA, teamERA, record: standing?.record ?? '', divisionRank: standing?.divisionRank, gamesBack: standing?.gamesBack, streak: standing?.streak, last10: standing?.last10 };
        }
        const json = await res.json();
        const games: MLBGame[] = [];
        let nextGame: MLBNextGame | null = null;
        let liveGame: MLBLiveGame | null = null;
        for (const dateObj of (json.dates ?? [])) {
          for (const g of (dateObj.games ?? [])) {
            const state = g.status?.detailedState ?? '';
            if (state === 'Final' || state === 'Completed Early') {
              const weAreHome = g.teams?.home?.team?.id === t.id;
              const us   = weAreHome ? g.teams.home : g.teams.away;
              const them = weAreHome ? g.teams.away : g.teams.home;
              games.push({ date: dateObj.date, opponent: them?.team?.name ?? '???', ourScore: us?.score ?? 0, theirScore: them?.score ?? 0, isHome: weAreHome, won: us?.isWinner === true });
            } else if (!liveGame && (state === 'In Progress' || state === 'Live Preview')) {
              const weAreHome = g.teams?.home?.team?.id === t.id;
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
              const weAreHome = g.teams?.home?.team?.id === t.id;
              const them = weAreHome ? g.teams?.away : g.teams?.home;
              const probUs   = (weAreHome ? g.teams?.home : g.teams?.away)?.probablePitcher;
              const probThem = (weAreHome ? g.teams?.away : g.teams?.home)?.probablePitcher;
              const oppRec = them?.leagueRecord;
              nextGame = {
                date: dateObj.date, gameTime: g.gameDate ?? null,
                opponent: them?.team?.name ?? '???',
                opponentAbbr: them?.team?.abbreviation ?? '',
                opponentId: them?.team?.id,
                isHome: weAreHome,
                probablePitcher: probUs?.fullName ?? probUs?.lastName ?? null,
                oppProbablePitcher: probThem?.fullName ?? probThem?.lastName ?? null,
                venue: g.venue?.name ?? null,
                oppRecord: oppRec ? `${oppRec.wins}-${oppRec.losses}` : null,
              };
            }
          }
        }
        const standing = standingsMap[t.id];
        return {
          ...t,
          games: games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10),
          nextGame, liveGame,
          record: standing?.record ?? '',
          divisionRank: standing?.divisionRank,
          gamesBack: standing?.gamesBack,
          streak: standing?.streak,
          last10: standing?.last10,
          teamBA, teamERA,
        };
      } catch { return { ...t, games: [], nextGame: null, liveGame: null, record: '' }; }
    }));
    return results;
  } catch { return []; }
}

async function fetchJCCNative(): Promise<JCCData> {
  const empty: JCCData = { results: [], upcoming: [], records: {} };
  try {
    const res = await fetch('https://jccjayhawks.com/composite?print=rss');
    if (!res.ok) return empty;
    const text = await res.text();
    const results: JCCResult[] = [];
    const upcoming: JCCUpcoming[] = [];
    const itemRx = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRx.exec(text)) !== null) {
      const block = m[1];
      const RX: Record<string, RegExp> = {
        'ps:score':    /<ps:score[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/ps:score>|<ps:score[^>]*>([^<]*)<\/ps:score>/,
        'pubDate':     /<pubDate[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/pubDate>|<pubDate[^>]*>([^<]*)<\/pubDate>/,
        'ps:opponent': /<ps:opponent[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/ps:opponent>|<ps:opponent[^>]*>([^<]*)<\/ps:opponent>/,
        'category':    /<category[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/category>|<category[^>]*>([^<]*)<\/category>/,
        'link':        /<link[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/link>|<link[^>]*>([^<]*)<\/link>/,
      };
      const get = (tag: string) => { const match = RX[tag]?.exec(block); return match ? (match[1] ?? match[2] ?? '').trim() : ''; };
      const score    = get('ps:score');
      const pubDate  = get('pubDate');
      const opponent = get('ps:opponent');
      const category = get('category');
      const link     = get('link');
      if (!pubDate) continue;
      const date = new Date(pubDate);
      const now  = new Date();
      const opponentClean = opponent
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/^(at|vs\.?)\s*/i, '');
      const hasResult = score && score.trim() !== '';
      if (hasResult && date < now) {
        const parts = score.split(',').map((s: string) => s.trim());
        const wl = parts[0]; const final = parts[1] ?? '';
        if (final === '0-0') continue;
        results.push({ date: date.toISOString(), sport: category, opponent: opponentClean, isHome: !opponent.toLowerCase().startsWith('at '), result: wl, score: final, won: wl === 'W', link });
      } else if (!hasResult && date >= now) {
        upcoming.push({ date: date.toISOString(), sport: category, opponent: opponentClean, isHome: !opponent.toLowerCase().startsWith('at '), link });
      }
    }
    results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const records: Record<string, { w: number; l: number }> = {};
    for (const r of results) {
      if (!records[r.sport]) records[r.sport] = { w: 0, l: 0 };
      if (r.won) records[r.sport].w++; else records[r.sport].l++;
    }
    return { results: results.slice(0, 8), upcoming: upcoming.slice(0, 8), records };
  } catch { return empty; }
}

async function fetchPlayoffSeries(): Promise<PlayoffSeries | null> {
  try {
    const year = new Date().getFullYear();
    const seasonId = `${year - 1}${year}`;
    const res = await fetch(`https://api-web.nhle.com/v1/playoff-series/carousel/${seasonId}`);
    if (!res.ok) return null;
    const data = await res.json();
    for (const round of (data.rounds ?? [])) {
      for (const series of (round.series ?? [])) {
        const top = series.topSeed ?? {};
        const bot = series.bottomSeed ?? {};
        if (top.abbrev === 'BUF' || bot.abbrev === 'BUF') {
          const bufWins = top.abbrev === 'BUF' ? top.wins : bot.wins;
          const oppWins = top.abbrev === 'BUF' ? bot.wins : top.wins;
          return {
            round: round.roundNumber,
            roundLabel: round.roundLabel ?? `Round ${round.roundNumber}`,
            opponent: top.abbrev === 'BUF' ? bot.abbrev : top.abbrev,
            bufWins, oppWins,
            neededToWin: series.neededToWin ?? 4,
          };
        }
      }
    }
    return null;
  } catch { return null; }
}

async function fetchSabres(): Promise<SabresData> {
  if (Platform.OS === 'web') {
    const [sabresRes, mlbRes] = await Promise.all([fetch(apiUrl('/api/sabres')), fetchMLB()]);
    if (!sabresRes.ok) throw new Error('Sabres API failed');
    const json = await sabresRes.json();
    const rawJcc = json.jcc;
    const jcc: JCCData = rawJcc && typeof rawJcc === 'object' && !Array.isArray(rawJcc)
      ? rawJcc
      : { results: [], upcoming: [], records: {} };
    return { record: json.record ?? '', standing: json.standing ?? '', recentGame: json.recentGame, nextGame: json.nextGame, liveGame: json.liveGame ?? null, topScorers: json.topScorers ?? [], jcc, mlb: mlbRes, playoffSeries: json.playoffSeries ?? null, news: [] };
  }
  const [schedRes, standRes, statsRes, jcc, mlb, playoffSeries] = await Promise.all([
    fetch('https://api-web.nhle.com/v1/club-schedule-season/BUF/now'),
    fetch('https://api-web.nhle.com/v1/standings/now'),
    fetch('https://api-web.nhle.com/v1/club-stats/BUF/now'),
    fetchJCCNative(),
    fetchMLB(),
    fetchPlayoffSeries(),
  ]);
  const schedJson = await schedRes.json();
  const standJson = standRes.ok ? await standRes.json() : null;
  const statsJson = statsRes.ok ? await statsRes.json() : null;
  const bufStanding = standJson?.standings?.find((t: any) => t.teamAbbrev?.default === 'BUF');
  const wins     = bufStanding?.wins     ?? 0;
  const losses   = bufStanding?.losses   ?? 0;
  const otLosses = bufStanding?.otLosses ?? 0;
  const points   = bufStanding?.points   ?? 0;
  const record   = bufStanding ? `${wins}-${losses}-${otLosses}` : '';
  const standing = bufStanding?.divisionName ?? '';
  const games: any[] = schedJson.games ?? [];
  const now = new Date();
  const past = games
    .filter((g: any) => g.gameState === 'FINAL' || g.gameState === 'OFF')
    .sort((a: any, b: any) => new Date(b.startTimeUTC).getTime() - new Date(a.startTimeUTC).getTime());
  const upcoming = games
    .filter((g: any) => (g.gameState === 'FUT' || g.gameState === 'PRE') && new Date(g.startTimeUTC) >= now)
    .sort((a: any, b: any) => new Date(a.startTimeUTC).getTime() - new Date(b.startTimeUTC).getTime());
  const topScorers: Scorer[] = (statsJson?.skaters ?? [])
    .sort((a: any, b: any) => (b.points ?? 0) - (a.points ?? 0))
    .slice(0, 5)
    .map((p: any) => ({
      name: `${p.firstName?.default ?? ''} ${p.lastName?.default ?? ''}`.trim(),
      position: p.positionCode ?? '',
      goals: p.goals ?? 0,
      assists: p.assists ?? 0,
      points: p.points ?? 0,
      headshot: p.headshot ?? '',
    }));
  const liveGames: any[] = games.filter((g: any) => g.gameState === 'LIVE' || g.gameState === 'CRIT');
  const liveGame: GameResult | null = liveGames[0] ? (parseNHLGame(liveGames[0]) ?? null) : null;
  return { record, standing, points, wins, losses, otLosses, recentGame: past[0] ? parseNHLGame(past[0]) ?? undefined : undefined, nextGame: upcoming[0] ? parseNHLGame(upcoming[0]) ?? undefined : undefined, liveGame, topScorers, jcc, mlb, playoffSeries, news: [] };
}

function ordinal(n: number): string {
  if (n === 1) return '1st'; if (n === 2) return '2nd'; if (n === 3) return '3rd';
  return `${n}th`;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={styles.sectionLabel}>{label}</Text>
  );
}

function TeamCard({
  accentColor, gradStart, gradEnd, iconContent,
  name, subtitle, glanceRow, children,
  defaultOpen = false, glassWeb, bgImage,
}: {
  accentColor: string; gradStart: string; gradEnd: string;
  iconContent: React.ReactNode;
  name: string; subtitle: string;
  glanceRow: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  glassWeb: any;
  bgImage?: any;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rot = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  function toggle() {
    Animated.timing(rot, { toValue: open ? 0 : 1, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.ease) }).start();
    setOpen(v => !v);
  }

  const chevronRotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const cardContent = (
    <>
      <TouchableOpacity onPress={toggle} activeOpacity={0.7} style={styles.teamCardHeader}>
        <LinearGradient
          colors={[gradStart, gradEnd]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.teamIconSquare}
        >
          {iconContent}
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.teamCardName}>{name}</Text>
          <Text style={[styles.teamCardSub, { color: dark.text.subtle }]}>{subtitle}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <Ionicons name="chevron-down" size={16} color={dark.text.subtle} />
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.glanceRow}>{glanceRow}</View>

      {open && children && (
        <View style={[styles.teamCardExpanded, { borderTopColor: dark.border }]}>
          {children}
        </View>
      )}
    </>
  );

  if (bgImage) {
    return (
      // @ts-ignore
      <ImageBackground source={bgImage} style={[styles.teamCard, glassWeb]} imageStyle={{ borderRadius: 16, opacity: 0.18 }} resizeMode="cover">
        {cardContent}
      </ImageBackground>
    );
  }

  return (
    // @ts-ignore
    <View style={[styles.teamCard, glassWeb]}>
      {cardContent}
    </View>
  );
}

export default function SportsScreen() {
  const [data, setData]           = useState<SabresData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedMlbAbbr, setExpandedMlbAbbr] = useState<string | null>(null);
  const [pinnedMlbAbbr, setPinnedMlbAbbr] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('pinnedMlb').then(v => { if (v) setPinnedMlbAbbr(v); });
  }, []);

  function togglePinMlb(abbr: string) {
    const next = pinnedMlbAbbr === abbr ? null : abbr;
    setPinnedMlbAbbr(next);
    if (next) AsyncStorage.setItem('pinnedMlb', next);
    else AsyncStorage.removeItem('pinnedMlb');
  }
  const [nextUpIdx, setNextUpIdx] = useState(0);
  const [showSkunksSchedule, setShowSkunksSchedule] = useState(false);
  const [detailGame, setDetailGame] = useState<NextUpItem | null>(null);
  const [sheetCarouselIdx, setSheetCarouselIdx] = useState(0);
  const sheetScrollRef = useRef<any>(null);
  const { width: winWidth } = useWindowDimensions();

  // Scroll the sheet carousel to the correct game when it opens
  useEffect(() => {
    if (!detailGame) return;
    const timeout = setTimeout(() => {
      sheetScrollRef.current?.scrollTo({ x: sheetCarouselIdx * winWidth, animated: false });
    }, 50); // small delay lets the ScrollView mount first
    return () => clearTimeout(timeout);
  }, [detailGame]);
  // Cards fill full page width — internal padding handles the visual inset.
  // This prevents next-card peek-through with pagingEnabled.
  const cardWidth = winWidth;

  const glassWeb = Platform.OS === 'web'
    ? { backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }
    : {};

  useEffect(() => {
    fetchSabres().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Auto-poll every 60s when any live game is in progress
  const hasLive = !!(data?.liveGame?.status === 'live' || data?.mlb?.some(t => t.liveGame));
  useEffect(() => {
    if (hasLive) {
      if (!pollRef.current) {
        pollRef.current = setInterval(() => {
          fetchSabres().then(setData).catch(() => {});
        }, 60_000);
      }
    } else {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
  }, [hasLive]);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function onRefresh() {
    setRefreshing(true);
    try { const d = await fetchSabres(); setData(d); } catch {}
    setRefreshing(false);
  }

  // All upcoming games sorted by time — powers the Next Up carousel
  const nextUpItems = useMemo(() => {
    if (!data) return [];
    const candidates: NextUpItem[] = [];
    const seenGamePairs = new Set<string>(); // dedup games where both teams are tracked
    const now = new Date();
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    if (data.liveGame?.status === 'live') {
      const lg = data.liveGame;
      const periodLabel = lg.inIntermission
        ? `INT after ${ordinal(lg.period ?? 1)}`
        : lg.periodType === 'OT' ? `OT${lg.timeRemaining ? ` · ${lg.timeRemaining}` : ''}`
        : `${ordinal(lg.period ?? 1)} · ${lg.timeRemaining ?? 'Live'}`;
      candidates.push({
        ts: Date.now(),
        sport: 'Buffalo Sabres · NHL', emoji: '🏒',
        matchup: `BUF ${lg.isHome ? 'vs' : '@'} ${lg.opponentAbbr}`,
        dateLabel: periodLabel,
        time: `${lg.ourScore}–${lg.theirScore}`,
        accent: ACC.sabres, gradStart: 'rgba(96,165,250,0.28)', gradEnd: 'rgba(6,14,24,0.7)',
        ourLogoUrl: SABRES_LOGO, oppLogoUrl: lg.opponentLogo || undefined,
        isLive: true, bgKey: 'hockey',
      });
    } else if (data.nextGame) {
      const d = new Date(data.nextGame.date);
      if (d > now) {
        candidates.push({
          ts: d.getTime(), sport: 'Buffalo Sabres · NHL', emoji: '🏒',
          matchup: `BUF ${data.nextGame.isHome ? 'vs' : '@'} ${data.nextGame.opponentAbbr}`,
          dateLabel: '', time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          accent: ACC.sabres, gradStart: 'rgba(96,165,250,0.28)', gradEnd: 'rgba(6,14,24,0.7)',
          ourLogoUrl: SABRES_LOGO, oppLogoUrl: data.nextGame.opponentLogo || undefined,
          bgKey: 'hockey',
          venue: data.nextGame.venue, broadcast: data.nextGame.broadcast || undefined,
          // In playoffs, show series record under logos instead of season record
          record: data.playoffSeries
            ? `${data.playoffSeries.bufWins}–${data.playoffSeries.oppWins} series`
            : data.record,
          oppRecord: data.playoffSeries
            ? `${data.playoffSeries.oppWins}–${data.playoffSeries.bufWins} series`
            : undefined,
          seriesLabel: data.playoffSeries
            ? `${data.playoffSeries.roundLabel.replace(/-/g, ' ')} · First to ${data.playoffSeries.neededToWin}`
            : undefined,
          opponentName: data.nextGame.opponentName,
          isHome: data.nextGame.isHome,
        });
      }
    }
    for (const team of (data.mlb ?? [])) {
      if (team.liveGame) {
        const lg = team.liveGame;
        const pairKey = [team.id, lg.opponentId ?? 0].sort((a, b) => a - b).join('-');
        if (seenGamePairs.has(pairKey)) continue;
        seenGamePairs.add(pairKey);
        const oppAbbr = (lg.opponentAbbr && lg.opponentAbbr.toLowerCase())
          || (lg.opponentId != null ? MLB_ID_ESPN[lg.opponentId] : undefined);
        candidates.push({
          ts: Date.now(), // live — always first
          sport: `${team.name} · MLB`, emoji: '⚾',
          matchup: `${team.abbr} ${lg.isHome ? 'vs' : '@'} ${lg.opponent.split(' ').pop()}`,
          dateLabel: `${lg.topBottom} ${lg.inningOrdinal}`,
          time: `${lg.ourScore}–${lg.theirScore} · ${lg.outs} out${lg.outs !== 1 ? 's' : ''}`,
          accent: ACC.mlb, gradStart: 'rgba(167,139,250,0.28)', gradEnd: 'rgba(6,14,24,0.7)',
          ourLogoUrl: `https://a.espncdn.com/i/teamlogos/mlb/500/${team.abbr.toLowerCase()}.png`,
          oppLogoUrl: oppAbbr ? `https://a.espncdn.com/i/teamlogos/mlb/500/${oppAbbr}.png` : undefined,
          isLive: true, bgKey: 'baseball',
        });
      } else if (team.nextGame) {
        const ng = team.nextGame;
        const pairKey = [team.id, ng.opponentId ?? 0].sort((a, b) => a - b).join('-');
        if (seenGamePairs.has(pairKey)) continue;
        seenGamePairs.add(pairKey);
        const d = ng.gameTime ? new Date(ng.gameTime) : new Date(ng.date + 'T12:00:00');
        if (d > now) {
          const oppAbbrRaw = ng.opponentAbbr || (ng.opponentId != null ? MLB_ID_ESPN[ng.opponentId] : '') || '';
          candidates.push({
            ts: d.getTime(), sport: `${team.name} · MLB`, emoji: '⚾',
            matchup: `${team.abbr} ${ng.isHome ? 'vs' : '@'} ${ng.opponent.split(' ').pop()}`,
            dateLabel: '',
            time: ng.gameTime ? new Date(ng.gameTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : undefined,
            accent: ACC.mlb, gradStart: 'rgba(167,139,250,0.28)', gradEnd: 'rgba(6,14,24,0.7)',
            ourLogoUrl: `https://a.espncdn.com/i/teamlogos/mlb/500/${team.abbr.toLowerCase()}.png`,
            oppLogoUrl: oppAbbrRaw ? `https://a.espncdn.com/i/teamlogos/mlb/500/${oppAbbrRaw.toLowerCase()}.png` : undefined,
            bgKey: 'baseball',
            record: team.record, oppRecord: ng.oppRecord || undefined,
            opponentName: ng.opponent, isHome: ng.isHome,
            probablePitcher: ng.probablePitcher || undefined,
            oppProbablePitcher: ng.oppProbablePitcher || undefined,
            venue: ng.venue || undefined,
          });
        }
      }
    }
    if (candidates.length === 0) return [];
    // If any game is live, show only live games. Otherwise show upcoming.
    const liveOnly = candidates.filter(c => c.isLive);
    if (liveOnly.length > 0) return liveOnly;
    candidates.sort((a, b) => a.ts - b.ts);
    return candidates.map(c => {
      // Live games already have their dateLabel set (e.g. "Top 5th")
      if (c.isLive) return c;
      const cd = new Date(c.ts);
      const cDay = new Date(cd); cDay.setHours(0,0,0,0);
      return {
        ...c,
        dateLabel: cDay.getTime() === today.getTime() ? 'Today'
          : cDay.getTime() === tomorrow.getTime() ? 'Tomorrow'
          : cd.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      };
    });
  }, [data]);

  // Days until Tarp Skunks season opens
  const daysUntilSkunks = useMemo(() => {
    const open = new Date('2026-05-29T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    return Math.max(0, Math.ceil((open.getTime() - today.getTime()) / 86400000));
  }, []);

  // JCC glance: last result per sport (up to 2 distinct sports)
  const jccGlance = useMemo(() => {
    const results = data?.jcc?.results ?? [];
    const seen = new Set<string>();
    const out: JCCResult[] = [];
    for (const r of results) {
      const key = r.sport.toLowerCase().split(' ')[0];
      if (!seen.has(key)) { seen.add(key); out.push(r); }
      if (out.length >= 2) break;
    }
    return out.length > 0 ? out : results.slice(0, 2);
  }, [data]);

  // JCC next game per sport (soonest upcoming per unique sport)
  const jccNextBySport = useMemo(() => {
    const upcomingList = data?.jcc?.upcoming ?? [];
    const seen = new Set<string>();
    const out: JCCUpcoming[] = [];
    for (const u of upcomingList) {
      const key = u.sport.toLowerCase().split(' ')[0];
      if (!seen.has(key)) { seen.add(key); out.push(u); }
    }
    return out;
  }, [data]);

  // Nearest MLB next game for MLB glance row
  const mlbNextUp = useMemo(() => {
    if (!data?.mlb) return null;
    const now = new Date();
    let best: { team: MLBTeam; date: Date } | null = null;
    for (const t of data.mlb) {
      if (!t.nextGame) continue;
      const ng = t.nextGame;
      const d = ng.gameTime ? new Date(ng.gameTime) : new Date(ng.date + 'T12:00:00');
      if (d > now && (!best || d < best.date)) best = { team: t, date: d };
    }
    if (!best) return null;
    const ng = best.team.nextGame!;
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const cDay = new Date(best.date); cDay.setHours(0,0,0,0);
    const dateLabel = cDay.getTime() === today.getTime() ? 'Today'
      : cDay.getTime() === tomorrow.getTime() ? 'Tomorrow'
      : best.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = ng.gameTime
      ? new Date(ng.gameTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : '';
    const oppAbbrRaw = ng.opponentAbbr || (ng.opponentId != null ? MLB_ID_ESPN[ng.opponentId] : '') || '';
    return { abbr: best.team.abbr, opp: ng.opponent.split(' ').pop(), oppAbbr: oppAbbrRaw, isHome: ng.isHome, dateLabel, timeStr };
  }, [data]);

  const innerCard = {
    borderRadius: 14, borderWidth: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    borderColor: dark.border,
    ...glassWeb,
  };

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.title}>Sports</Text>
        <Text style={styles.subhead}>Local teams · Jamestown</Text>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACC.label} colors={[ACC.label]} />
        }
      >

        {(loading || nextUpItems.length > 0) && (
          <View style={styles.nextUpSection}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>{nextUpItems[nextUpIdx]?.isLive ? 'Live Now' : 'Next Up'}</Text>
            </View>

            {loading ? (
              <SkeletonPulse width="100%" height={112} borderRadius={18} accRGB="34,211,238" />
            ) : nextUpItems.length > 0 ? (
              <>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={e => {
                    setNextUpIdx(Math.round(e.nativeEvent.contentOffset.x / winWidth));
                  }}
                  onScroll={e => {
                    // Keep dots in sync on web where onMomentumScrollEnd may not fire
                    const idx = Math.round(e.nativeEvent.contentOffset.x / winWidth);
                    if (idx !== nextUpIdx) setNextUpIdx(idx);
                  }}
                  scrollEventThrottle={16}
                  style={{ marginHorizontal: -16 }}
                  contentContainerStyle={{ paddingHorizontal: 0 }}
                >
                  {nextUpItems.map((nextUp, idx) => {
                    const bgOpacity = nextUp.bgKey === 'baseball' ? 0.45 : 0.4;
                    const bgUri = nextUp.bgKey === 'baseball' ? '/ballpark.jpg'
                      : nextUp.bgKey === 'hockey' ? '/hockey.jpg' : null;
                    const bgSourceNative = nextUp.bgKey === 'baseball'
                      ? require('../assets/ballpark.jpg')
                      : nextUp.bgKey === 'hockey'
                      ? require('../assets/hockey.jpg')
                      : null;
                    const cardContent = (
                      <View style={styles.nextUpBody}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <View style={[styles.nextUpPill, { borderColor: `${nextUp.accent}40` }]}>
                              <Text style={[styles.nextUpPillText, { color: nextUp.accent }]}>{nextUp.sport}</Text>
                            </View>
                          </View>
                          <Text style={styles.nextUpMatchup}>{nextUp.matchup}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <Text style={{ fontFamily: 'Outfit', fontSize: 12, fontWeight: '600', color: nextUp.isLive ? '#fb7185' : dark.text.primary }}>{nextUp.dateLabel}</Text>
                            {nextUp.time && (
                              <>
                                <Text style={{ color: dark.text.subtle, fontSize: 11 }}>·</Text>
                                <Text style={{ fontFamily: 'Outfit', fontSize: 12, color: nextUp.isLive ? ACC.mlb : dark.text.muted }}>{nextUp.time}</Text>
                              </>
                            )}
                          </View>
                          {!nextUp.isLive && (
                            <Text style={{ fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>Tap for details</Text>
                          )}
                        </View>
                      </View>
                    );
                    const handlePress = () => {
                      if (nextUp.isLive) return;
                      const nonLive = nextUpItems.filter(g => !g.isLive);
                      const si = nonLive.findIndex(g => g.ts === nextUp.ts);
                      setSheetCarouselIdx(si >= 0 ? si : 0);
                      setDetailGame(nextUp);
                    };
                    if (Platform.OS === 'web' && bgUri) {
                      return (
                        <View key={idx} style={{ width: cardWidth, paddingHorizontal: 16 }}>
                          <TouchableOpacity onPress={handlePress} activeOpacity={nextUp.isLive ? 1 : 0.85}>
                            {/* @ts-ignore */}
                            <View style={[styles.nextUpCard, { backgroundImage: `url(${bgUri})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 1 }]}>
                              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(6,14,24,${1 - bgOpacity})`, borderRadius: 18 }]} pointerEvents="none" />
                              {cardContent}
                            </View>
                          </TouchableOpacity>
                        </View>
                      );
                    }
                    // @ts-ignore
                    return bgSourceNative ? (
                      <View key={idx} style={{ width: cardWidth, paddingHorizontal: 16 }}>
                        <TouchableOpacity onPress={handlePress} activeOpacity={nextUp.isLive ? 1 : 0.85}>
                          <ImageBackground
                            source={bgSourceNative}
                            style={styles.nextUpCard}
                            imageStyle={{ borderRadius: 18, opacity: bgOpacity }}
                            resizeMode="cover"
                          >
                            {cardContent}
                          </ImageBackground>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View key={idx} style={{ width: cardWidth, paddingHorizontal: 16 }}>
                        <TouchableOpacity onPress={handlePress} activeOpacity={nextUp.isLive ? 1 : 0.85}>
                          {/* @ts-ignore */}
                          <View style={[styles.nextUpCard, glassWeb]}>
                            {cardContent}
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
                {/* Dots — only shown when there are multiple cards */}
                {nextUpItems.length > 1 && (
                  <View style={styles.nextUpDots}>
                    {nextUpItems.map((_, i) => (
                      <View key={i} style={[styles.nextUpDot, i === nextUpIdx && styles.nextUpDotActive]} />
                    ))}
                  </View>
                )}
              </>
            ) : null}
          </View>
        )}

        {/* ── Local Teams ─────────────────────────────────────── */}
        <SectionLabel label="Local Teams" />

        {/* JCC Jayhawks */}
        <TeamCard
          accentColor={ACC.jcc}
          gradStart="rgba(52,211,153,0.25)"
          gradEnd="rgba(15,23,42,0.9)"
          iconContent={
            loading ? null : (
              <Image source={JCC_LOGO} style={{ width: 28, height: 28 }} resizeMode="contain" />
            )
          }
          name="JCC Jayhawks"
          subtitle="NJCAA · Jamestown Community College"
          defaultOpen={false}
          glassWeb={glassWeb}
          bgImage={Platform.OS === 'web' ? { uri: '/jcc.jpg' } : require('../assets/jcc.jpg')}
          glanceRow={
            loading ? (
              <SkeletonPulse width="60%" height={14} borderRadius={4} accRGB="52,211,153" />
            ) : jccGlance.length > 0 ? (
              <View style={{ gap: 5 }}>
                {jccGlance.map((r, i) => {
                  const rec = data?.jcc?.records?.[r.sport];
                  const recLabel = rec ? `${rec.w}-${rec.l}` : '';
                  return (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, width: 22 }}>{sportEmoji(r.sport)}</Text>
                      <Text style={[styles.glanceText, { color: dark.text.muted, width: 52 }]}>{r.sport.split(' ')[0]}</Text>
                      {recLabel ? (
                        <Text style={[styles.glanceText, { color: `${ACC.jcc}80`, width: 36 }]}>{recLabel}</Text>
                      ) : null}
                      <Text style={[styles.glanceText, { color: r.won ? ACC.jcc : '#fb7185', fontWeight: '700', width: 52 }]}>
                        {r.won ? 'W' : 'L'} {r.score}
                      </Text>
                      <Text style={{ color: dark.text.subtle, fontSize: 11, marginRight: 4 }}>·</Text>
                      <Text style={[styles.glanceText, { color: dark.text.subtle, flex: 1 }]} numberOfLines={1}>{r.isHome ? 'vs' : '@'} {r.opponent}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={[styles.glanceText, { color: dark.text.subtle }]}>No recent results</Text>
            )
          }
        >
          {loading ? (
            <SkeletonPulse width="100%" height={180} borderRadius={12} accRGB="52,211,153" />
          ) : (data?.jcc?.results?.length ?? 0) > 0 ? (
            <>
              {jccNextBySport.length > 0 && (
                <>
                  <Text style={[styles.innerLabel, { color: `${ACC.jcc}80` }]}>Next Games</Text>
                  {/* @ts-ignore */}
                  <View style={[innerCard, { padding: 0, overflow: 'hidden', marginBottom: 10 }]}>
                    {jccNextBySport.map((u, i) => {
                      const d = new Date(u.date);
                      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      // Suppress time if feed only provided a date (defaults to midnight)
                      const isMidnight = d.getHours() === 0 && d.getMinutes() === 0;
                      const timeStr = isMidnight ? null : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                      return (
                        <TouchableOpacity key={i} onPress={() => openLink(u.link)} activeOpacity={0.7}
                          style={[styles.jccRow, i < jccNextBySport.length - 1 && { borderBottomWidth: 1, borderBottomColor: dark.border }]}>
                          <Text style={styles.jccSportIcon}>{sportEmoji(u.sport)}</Text>
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={styles.jccGame}>{u.isHome ? 'vs' : '@'} {u.opponent}</Text>
                            <Text style={[styles.jccSport, { color: dark.text.subtle }]}>{u.sport}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: 2 }}>
                            <Text style={[styles.jccDate, { color: ACC.jcc }]}>{dateStr}</Text>
                            {timeStr ? <Text style={[styles.jccDate, { color: dark.text.subtle }]}>{timeStr}</Text> : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
              <Text style={[styles.innerLabel, { color: `${ACC.jcc}80` }]}>Recent Results</Text>
              {/* @ts-ignore */}
              <View style={[innerCard, { padding: 0, overflow: 'hidden' }]}>
                {data!.jcc!.results.map((g, i) => {
                  const dateStr = new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <TouchableOpacity key={i} onPress={() => openLink(g.link)} activeOpacity={0.7}
                      style={[styles.jccRow, i < data!.jcc!.results.length - 1 && { borderBottomWidth: 1, borderBottomColor: dark.border }]}>
                      <Text style={[styles.jccResult, { color: g.won ? ACC.jcc : '#fb7185' }]}>{g.result}</Text>
                      <Text style={styles.jccSportIcon}>{sportEmoji(g.sport)}</Text>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.jccGame}>{g.isHome ? 'vs' : '@'} {g.opponent}</Text>
                        <Text style={[styles.jccSport, { color: dark.text.subtle }]}>{g.sport}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <Text style={[styles.jccScore, { color: g.won ? ACC.jcc : '#fb7185' }]}>{g.score}</Text>
                        <Text style={[styles.jccDate, { color: dark.text.subtle }]}>{dateStr}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity onPress={() => Linking.openURL('https://jccjayhawks.com')} activeOpacity={0.7} style={styles.moreLink}>
                <Text style={[styles.moreLinkText, { color: `${ACC.jcc}70` }]}>Full schedule →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={{ fontFamily: 'Outfit', color: dark.text.subtle, fontSize: 13 }}>No recent results found.</Text>
          )}
        </TeamCard>

        {/* Tarp Skunks */}
        <TeamCard
          accentColor={ACC.skunks}
          gradStart="rgba(132,204,22,0.22)"
          gradEnd="rgba(15,23,42,0.9)"
          iconContent={
            <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={require('../assets/tarpskunk.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
            </View>
          }
          name="Tarp Skunks"
          subtitle="PGCBL · Diethrick Park"
          defaultOpen={false}
          glassWeb={glassWeb}
          bgImage={Platform.OS === 'web' ? { uri: '/tspark.jpg' } : require('../assets/tspark.jpg')}
          glanceRow={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.glanceText, { color: dark.text.muted }]}>Season opens</Text>
              <Text style={[styles.glanceText, { color: ACC.skunks, fontWeight: '700' }]}>May 29</Text>
              {daysUntilSkunks > 0 && (
                <>
                  <Text style={{ color: dark.text.subtle, fontSize: 11 }}>·</Text>
                  <Text style={[styles.glanceText, { color: dark.text.subtle }]}>{daysUntilSkunks} days</Text>
                </>
              )}
            </View>
          }
        >
          <Text style={[styles.innerLabel, { color: `${ACC.skunks}80` }]}>Upcoming Home Games</Text>
          {/* @ts-ignore */}
          <View style={[innerCard, { padding: 0, overflow: 'hidden' }]}>
            {(() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const upcoming = SKUNKS_SCHEDULE
                .filter(g => g.isHome && g.date >= todayStr)
                .slice(0, 5);
              return upcoming.map((game, i) => {
                const d = new Date(game.date + 'T12:00:00');
                const dayNum = d.toLocaleDateString('en-US', { day: 'numeric' });
                const month  = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                return (
                  <View key={i} style={[styles.skunksRow, i < upcoming.length - 1 && { borderBottomWidth: 1, borderBottomColor: dark.border }]}>
                    <View style={styles.skunksDateCol}>
                      <Text style={[styles.skunksDay, { color: ACC.skunks }]}>{dayNum}</Text>
                      <Text style={styles.skunksMonth}>{month}</Text>
                    </View>
                    <Text style={styles.skunksOpponent}>{game.opponent}</Text>
                    <Text style={[styles.skunksTime, { color: dark.text.subtle }]}>{game.time}</Text>
                  </View>
                );
              });
            })()}
          </View>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity onPress={() => setShowSkunksSchedule(true)} activeOpacity={0.7} style={styles.moreLink}>
              <Text style={[styles.moreLinkText, { color: ACC.skunks }]}>Full Schedule →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openLink('https://www.milb.com/jamestown/tickets')} activeOpacity={0.7} style={styles.moreLink}>
              <Text style={[styles.moreLinkText, { color: ACC.skunks }]}>Get Tickets →</Text>
            </TouchableOpacity>
          </View>
        </TeamCard>

        {/* ── Regional ────────────────────────────────────────── */}
        <SectionLabel label="Regional" />

        {/* Buffalo Sabres */}
        <TeamCard
          accentColor={ACC.sabres}
          gradStart="rgba(96,165,250,0.22)"
          gradEnd="rgba(15,23,42,0.9)"
          bgImage={Platform.OS === 'web' ? { uri: '/hockey.jpg' } : require('../assets/hockey.jpg')}
          iconContent={
            <Image source={{ uri: SABRES_LOGO }} style={{ width: 30, height: 30 }} resizeMode="contain" />
          }
          name="Buffalo Sabres"
          subtitle={data?.playoffSeries ? `NHL · ${data.playoffSeries.roundLabel.replace(/-/g, ' ')} · Playoffs` : 'NHL · Atlantic Division'}
          defaultOpen={false}
          glassWeb={glassWeb}
          glanceRow={
            loading ? (
              <SkeletonPulse width="50%" height={14} borderRadius={4} accRGB="96,165,250" />
            ) : data?.playoffSeries ? (() => {
              const ps = data.playoffSeries!;
              // When series hasn't started, show Game 1 date/time from nextGame
              const seriesNotStarted = ps.bufWins === 0 && ps.oppWins === 0;
              let seriesStr: string;
              if (seriesNotStarted && data.nextGame?.date) {
                const g1 = new Date(data.nextGame.date);
                const today = new Date(); today.setHours(0,0,0,0);
                const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
                const gDay = new Date(g1); gDay.setHours(0,0,0,0);
                const dayLabel = gDay.getTime() === today.getTime() ? 'Today'
                  : gDay.getTime() === tomorrow.getTime() ? 'Tomorrow'
                  : g1.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const timeLabel = g1.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                seriesStr = `Game 1 · ${dayLabel} ${timeLabel}`;
              } else if (ps.bufWins === ps.oppWins) {
                seriesStr = `Tied ${ps.bufWins}–${ps.oppWins}`;
              } else if (ps.bufWins > ps.oppWins) {
                seriesStr = `BUF leads ${ps.bufWins}–${ps.oppWins}`;
              } else {
                seriesStr = `${ps.opponent} leads ${ps.oppWins}–${ps.bufWins}`;
              }
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <View style={[styles.playoffsBadge, { borderColor: `${ACC.sabres}40`, backgroundColor: `${ACC.sabres}15` }]}>
                    <Text style={[styles.playoffsBadgeText, { color: ACC.sabres }]}>🏒 PLAYOFFS</Text>
                  </View>
                  <Text style={[styles.glanceText, { color: dark.text.muted }]}>vs {ps.opponent}</Text>
                  <Text style={{ color: dark.text.subtle, fontSize: 11 }}>·</Text>
                  <Text style={[styles.glanceText, { color: ACC.sabres, fontWeight: '700' }]}>{seriesStr}</Text>
                </View>
              );
            })() : data?.record ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={[styles.glanceText, { color: ACC.sabres, fontWeight: '700' }]}>{data.record}</Text>
                {data.points ? (
                  <>
                    <Text style={{ color: dark.text.subtle, fontSize: 11 }}>·</Text>
                    <Text style={[styles.glanceText, { color: dark.text.muted }]}>{data.points} PTS</Text>
                  </>
                ) : null}
                {data.standing ? (
                  <>
                    <Text style={{ color: dark.text.subtle, fontSize: 11 }}>·</Text>
                    <Text style={[styles.glanceText, { color: dark.text.subtle }]}>{data.standing}</Text>
                  </>
                ) : null}
              </View>
            ) : (
              <Text style={[styles.glanceText, { color: dark.text.subtle }]}>Loading season data…</Text>
            )
          }
        >
          {loading ? (
            <View style={{ gap: 8 }}>
              <SkeletonPulse width="100%" height={72} borderRadius={12} accRGB="96,165,250" />
              <SkeletonPulse width="100%" height={120} borderRadius={12} accRGB="96,165,250" />
            </View>
          ) : (
            <>
              {/* Last / Live / Next 2-col grid */}
              {(data?.recentGame || data?.liveGame?.status === 'live' || data?.nextGame) && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {data?.recentGame && (
                    // @ts-ignore
                    <View style={[innerCard, { flex: 1, padding: 12 }]}>
                      <Text style={[styles.innerLabel, { color: dark.text.subtle }]}>Last Game</Text>
                      <Text style={{ fontFamily: 'DMSans_800ExtraBold', fontSize: 14, color: '#fff', marginTop: 6 }}>
                        BUF {data.recentGame.ourScore} · {data.recentGame.opponentAbbr} {data.recentGame.theirScore}
                      </Text>
                      <Text style={{ fontFamily: 'Outfit', fontSize: 11, marginTop: 4, color: data.recentGame.won === true ? ACC.jcc : data.recentGame.won === false ? '#fb7185' : dark.text.subtle }}>
                        {data.recentGame.won === true ? 'Win' : data.recentGame.won === false ? 'Loss' : 'Final'}
                      </Text>
                    </View>
                  )}
                  {data?.liveGame?.status === 'live' ? (
                    // @ts-ignore
                    <View style={[innerCard, { flex: 1, padding: 12, borderColor: `${ACC.sabres}55` }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <PulsingDot color={ACC.sabres} size={6} />
                        <Text style={[styles.innerLabel, { color: ACC.sabres }]}>Live Now</Text>
                      </View>
                      <Text style={{ fontFamily: 'DMSans_800ExtraBold', fontSize: 14, color: '#fff', marginTop: 6 }}>
                        BUF {data.liveGame.ourScore} · {data.liveGame.opponentAbbr} {data.liveGame.theirScore}
                      </Text>
                      <Text style={{ fontFamily: 'Outfit', fontSize: 11, marginTop: 4, color: dark.text.muted }}>
                        {data.liveGame.inIntermission
                          ? `Intermission · after ${ordinal(data.liveGame.period ?? 1)}`
                          : data.liveGame.periodType === 'OT'
                          ? `Overtime${data.liveGame.timeRemaining ? ` · ${data.liveGame.timeRemaining}` : ''}`
                          : `${ordinal(data.liveGame.period ?? 1)} Period${data.liveGame.timeRemaining ? ` · ${data.liveGame.timeRemaining}` : ''}`}
                      </Text>
                    </View>
                  ) : data?.nextGame ? (
                    // @ts-ignore
                    <View style={[innerCard, { flex: 1, padding: 12, borderColor: `${ACC.sabres}40` }]}>
                      <Text style={[styles.innerLabel, { color: ACC.sabres }]}>Next Game</Text>
                      <Text style={{ fontFamily: 'DMSans_800ExtraBold', fontSize: 14, color: '#fff', marginTop: 6 }}>
                        {data.nextGame.isHome ? 'vs' : '@'} {data.nextGame.opponentAbbr}
                      </Text>
                      <Text style={{ fontFamily: 'Outfit', fontSize: 11, marginTop: 4, color: dark.text.muted }}>
                        {new Date(data.nextGame.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' · '}{new Date(data.nextGame.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Top scorers */}
              {data?.topScorers && data.topScorers.length > 0 && (
                <>
                  <Text style={[styles.innerLabel, { color: dark.text.subtle }]}>Top Scorers</Text>
                  {/* @ts-ignore */}
                  <View style={[innerCard, { padding: 0, overflow: 'hidden' }]}>
                    <View style={[styles.scorerRow, { borderBottomWidth: 1, borderBottomColor: dark.border }]}>
                      <Text style={[styles.scorerName, { color: dark.text.subtle, fontSize: 9, letterSpacing: 1 }]}>PLAYER</Text>
                      <Text style={[styles.scorerStat, { color: dark.text.subtle, fontSize: 9 }]}>G</Text>
                      <Text style={[styles.scorerStat, { color: dark.text.subtle, fontSize: 9 }]}>A</Text>
                      <Text style={[styles.scorerStat, { color: dark.text.subtle, fontSize: 9 }]}>PTS</Text>
                    </View>
                    {data.topScorers.map((p, i) => (
                      <View key={p.name} style={[styles.scorerRow, i < data.topScorers!.length - 1 && { borderBottomWidth: 1, borderBottomColor: dark.border }]}>
                        <View style={styles.scorerLeft}>
                          {p.headshot ? <Image source={{ uri: p.headshot }} style={styles.scorerHeadshot} resizeMode="cover" /> : null}
                          <View style={{ flex: 1 }}>
                            <Text style={styles.scorerName}>{p.name}</Text>
                            <Text style={[styles.scorerPos, { color: dark.text.subtle }]}>{p.position}</Text>
                          </View>
                        </View>
                        <Text style={styles.scorerStat}>{p.goals}</Text>
                        <Text style={styles.scorerStat}>{p.assists}</Text>
                        <Text style={[styles.scorerStat, { color: ACC.sabres, fontWeight: '700' }]}>{p.points}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              <TouchableOpacity onPress={() => Linking.openURL(SABRES_ESPN)} activeOpacity={0.7} style={styles.moreLink}>
                <Text style={[styles.moreLinkText, { color: `${ACC.sabres}70` }]}>More on ESPN →</Text>
              </TouchableOpacity>
            </>
          )}
        </TeamCard>

        {/* Regional MLB */}
        <TeamCard
          accentColor={ACC.mlb}
          gradStart="rgba(167,139,250,0.22)"
          gradEnd="rgba(15,23,42,0.9)"
          iconContent={
            <Image source={{ uri: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png' }} style={{ width: 30, height: 30 }} resizeMode="contain" />
          }
          name="Regional MLB"
          subtitle="NYM · CLE · TOR · PIT · NYY · HOU"
          defaultOpen={false}
          glassWeb={glassWeb}
          glanceRow={
            loading ? (
              <SkeletonPulse width="65%" height={14} borderRadius={4} accRGB="167,139,250" />
            ) : (
              <LinearGradient
                colors={['rgba(100,116,139,0.35)', 'rgba(203,213,225,0.55)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flexDirection: 'row', flexWrap: 'wrap', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 5, justifyContent: 'space-between', flex: 1 }}
              >
                {(data?.mlb ?? []).map(t => (
                  <View key={t.abbr} style={{ alignItems: 'center', gap: 3 }}>
                    <Image source={{ uri: `https://a.espncdn.com/i/teamlogos/mlb/500/${t.abbr.toLowerCase()}.png` }} style={{ width: 20, height: 20 }} resizeMode="contain" />
                    <Text style={[styles.glanceText, { color: 'rgba(255,255,255,0.7)', fontSize: 10 }]}>{t.record ?? t.abbr}</Text>
                  </View>
                ))}
              </LinearGradient>
            )
          }
        >
          {loading ? (
            <SkeletonPulse width="100%" height={160} borderRadius={12} accRGB="167,139,250" />
          ) : (data?.mlb ?? []).length > 0 ? (
            <>
              {/* @ts-ignore */}
              <View style={[innerCard, { padding: 0, overflow: 'hidden' }]}>
                {[...(data?.mlb ?? [])].sort((a, b) => {
                  if (a.abbr === pinnedMlbAbbr) return -1;
                  if (b.abbr === pinnedMlbAbbr) return 1;
                  return 0;
                }).map((t, i) => {
                  const ng = t.nextGame;
                  const opp = ng?.opponent?.split(' ').pop() ?? '';
                  const today = new Date(); today.setHours(0,0,0,0);
                  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
                  let nextStr = '';
                  if (ng) {
                    const d = ng.gameTime ? new Date(ng.gameTime) : new Date(ng.date + 'T12:00:00');
                    const dDay = new Date(d); dDay.setHours(0,0,0,0);
                    const dayLabel = dDay.getTime() === today.getTime() ? 'Today'
                      : dDay.getTime() === tomorrow.getTime() ? 'Tmrw'
                      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const timeStr = ng.gameTime
                      ? new Date(ng.gameTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', '')
                      : '';
                    nextStr = `${ng.isHome ? 'vs' : '@'} ${opp} · ${dayLabel}${timeStr ? ` ${timeStr}` : ''}`;
                  }
                  const isExpanded = expandedMlbAbbr === t.abbr;
                  return (
                    <View key={t.abbr} style={[i < (data?.mlb?.length ?? 0) - 1 && !isExpanded && { borderBottomWidth: 1, borderBottomColor: dark.border }]}>
                      <TouchableOpacity
                        onPress={() => setExpandedMlbAbbr(isExpanded ? null : t.abbr)}
                        activeOpacity={0.7}
                        style={styles.mlbTeamRow}
                      >
                        <View style={styles.mlbLogoWrap}>
                          <Image
                            source={{ uri: `https://a.espncdn.com/i/teamlogos/mlb/500/${t.abbr.toLowerCase()}.png` }}
                            style={styles.mlbLogo}
                            resizeMode="contain"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mlbTeamName}>{t.name}</Text>
                          {t.liveGame ? (
                            <Text style={[styles.mlbNext, { color: dark.text.muted }]}>
                              {`${t.abbr} ${t.liveGame.isHome ? 'vs' : '@'} ${t.liveGame.opponent.split(' ').pop()} · ${t.liveGame.ourScore}–${t.liveGame.theirScore}`}
                            </Text>
                          ) : nextStr ? (
                            <Text style={[styles.mlbNext, { color: dark.text.subtle }]}>{nextStr}</Text>
                          ) : null}
                          {t.divisionRank ? (
                            <Text style={[styles.mlbNext, { color: 'rgba(255,255,255,0.2)' }]}>
                              {ordinal(t.divisionRank)} · {t.gamesBack ?? ''}
                            </Text>
                          ) : null}
                          {t.communityPick ? (
                            <Text style={[styles.mlbCommunityPick, { color: ACC.mlb }]}>🎙 {t.communityPick}</Text>
                          ) : null}
                        </View>
                        {t.record ? <Text style={[styles.mlbRecord, { color: dark.text.muted }]}>{t.record}</Text> : null}
                        {t.liveGame ? (
                          <View style={styles.mlbLiveBadge}>
                            <Text style={styles.mlbLiveBadgeText}>● LIVE</Text>
                          </View>
                        ) : t.streak ? (
                          <View style={[styles.mlbStreakBadge, {
                            borderColor: t.streak.startsWith('W') ? `${ACC.jcc}40` : 'rgba(251,113,133,0.4)',
                            backgroundColor: t.streak.startsWith('W') ? `${ACC.jcc}12` : 'rgba(251,113,133,0.12)',
                          }]}>
                            <Text style={[styles.mlbStreakBadgeText, { color: t.streak.startsWith('W') ? ACC.jcc : '#fb7185' }]}>{t.streak}</Text>
                          </View>
                        ) : null}
                        <TouchableOpacity
                          onPress={() => togglePinMlb(t.abbr)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={{ marginLeft: 6 }}
                        >
                          <Ionicons
                            name={pinnedMlbAbbr === t.abbr ? 'star' : 'star-outline'}
                            size={14}
                            color={pinnedMlbAbbr === t.abbr ? '#f59e0b' : 'rgba(255,255,255,0.18)'}
                          />
                        </TouchableOpacity>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={13}
                          color="rgba(255,255,255,0.2)"
                          style={{ marginLeft: 4 }}
                        />
                      </TouchableOpacity>

                      {/* Expanded: last 5 games + next game */}
                      {isExpanded && (
                        <View style={[styles.mlbExpanded, { borderTopColor: dark.border }]}>
                          {ng && (
                            <View style={{ gap: 4 }}>
                              <View style={styles.mlbExpandedNext}>
                                <Text style={[styles.mlbExpandLabel, { color: ACC.mlb }]}>Next</Text>
                                <Image
                                  source={{ uri: ng.opponentAbbr ? `https://a.espncdn.com/i/teamlogos/mlb/500/${ng.opponentAbbr.toLowerCase()}.png` : undefined }}
                                  style={styles.mlbExpandLogo}
                                  resizeMode="contain"
                                />
                                <Text style={[styles.mlbExpandText, { color: '#fff', fontWeight: '700' }]}>
                                  {ng.isHome ? 'vs' : '@'} {ng.opponent.split(' ').pop()}
                                </Text>
                                <Text style={{ color: dark.text.subtle, fontSize: 10 }}>·</Text>
                                <Text style={[styles.mlbExpandText, { color: dark.text.muted }]}>{nextStr.split('· ')[1] ?? ''}</Text>
                              </View>
                              {(ng.probablePitcher || ng.oppProbablePitcher) ? (
                                <Text style={[styles.mlbExpandText, { color: dark.text.subtle, marginTop: 3 }]}>
                                  {ng.probablePitcher ?? 'TBD'} vs {ng.oppProbablePitcher ?? 'TBD'}
                                </Text>
                              ) : null}
                            </View>
                          )}
                          {t.games.length > 0 && (() => {
                            // Streak from games as fallback if API data not available
                            const streakChar = t.games[0].won ? 'W' : 'L';
                            let streakCount = 0;
                            for (const g of t.games) {
                              if (g.won === t.games[0].won) streakCount++; else break;
                            }
                            const streakLabel = `${streakChar}${streakCount}`;
                            const last3 = t.games.slice(0, 3);
                            // Last 10 from games as fallback
                            const last10Wins = t.games.slice(0, 10).filter(g => g.won).length;
                            const last10Total = Math.min(t.games.length, 10);
                            const last10FromGames = last10Total > 0 ? `${last10Wins}-${last10Total - last10Wins}` : '';
                            return (
                              <>
                                {/* Stats strip */}
                                <View style={[styles.mlbStatsStrip, { marginTop: ng ? 10 : 0, borderColor: 'rgba(167,139,250,0.12)' }]}>
                                  <View style={styles.mlbStatCell}>
                                    <Text style={[styles.mlbStatVal, { color: t.games[0]?.won ? ACC.jcc : '#fb7185' }]}>{t.streak || streakLabel}</Text>
                                    <Text style={styles.mlbStatLbl}>Streak</Text>
                                  </View>
                                  <View style={styles.mlbStatDivider} />
                                  <View style={styles.mlbStatCell}>
                                    <Text style={styles.mlbStatVal}>{t.last10 || last10FromGames}</Text>
                                    <Text style={styles.mlbStatLbl}>Last 10</Text>
                                  </View>
                                  <View style={styles.mlbStatDivider} />
                                  <View style={styles.mlbStatCell}>
                                    <Text style={styles.mlbStatVal}>{t.teamBA ?? '—'}</Text>
                                    <Text style={styles.mlbStatLbl}>Team BA</Text>
                                  </View>
                                  <View style={styles.mlbStatDivider} />
                                  <View style={styles.mlbStatCell}>
                                    <Text style={styles.mlbStatVal}>{t.teamERA ?? '—'}</Text>
                                    <Text style={styles.mlbStatLbl}>Team ERA</Text>
                                  </View>
                                </View>
                                {/* Last 3 games */}
                                <Text style={[styles.mlbExpandLabel, { color: dark.text.subtle, marginTop: 12, marginBottom: 6 }]}>Last 3 Games</Text>
                                {last3.map((g, gi) => {
                                  const dateStr = new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                  return (
                                    <View key={gi} style={styles.mlbGameRow}>
                                      <Text style={[styles.mlbGameResult, { color: g.won ? ACC.jcc : '#fb7185' }]}>{g.won ? 'W' : 'L'}</Text>
                                      <Text style={[styles.mlbExpandText, { color: dark.text.muted, width: 60 }]}>{g.isHome ? 'vs' : '@'} {g.opponent.split(' ').pop()}</Text>
                                      <Text style={[styles.mlbExpandText, { color: '#fff', fontWeight: '600' }]}>{g.ourScore}–{g.theirScore}</Text>
                                      <Text style={[styles.mlbExpandText, { color: dark.text.subtle, marginLeft: 'auto' }]}>{dateStr}</Text>
                                    </View>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </View>
                      )}
                      {i < (data?.mlb?.length ?? 0) - 1 && (
                        <View style={{ height: 1, backgroundColor: dark.border }} />
                      )}
                    </View>
                  );
                })}
              </View>
              <TouchableOpacity onPress={() => Linking.openURL('https://www.mlb.com')} activeOpacity={0.7} style={styles.moreLink}>
                <Text style={[styles.moreLinkText, { color: `${ACC.mlb}70` }]}>More on MLB.com →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={{ fontFamily: 'Outfit', color: dark.text.subtle, fontSize: 13 }}>No recent results found.</Text>
          )}
        </TeamCard>

      </ScrollView>

      {/* ── Tarp Skunks Full Schedule Modal ─────────────────────── */}
      <Modal
        visible={showSkunksSchedule}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSkunksSchedule(false)}
      >
        <View style={schedModal.container}>
          <SafeAreaView edges={['top']}>
            <View style={schedModal.header}>
              <View style={schedModal.headerLeft}>
                <Text style={schedModal.headerTitle}>Tarp Skunks</Text>
                <Text style={schedModal.headerSub}>2026 Schedule · PGCBL</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSkunksSchedule(false)}
                activeOpacity={0.7}
                style={schedModal.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <ScrollView contentContainerStyle={schedModal.list} showsVerticalScrollIndicator={false}>
            {SKUNKS_SCHEDULE.map((g, i) => {
              const d = new Date(g.date + 'T12:00:00');
              const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
              const day   = d.getDate();
              const dow   = d.toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <View key={i} style={[schedModal.row, i < SKUNKS_SCHEDULE.length - 1 && schedModal.rowBorder]}>
                  {/* Date col */}
                  <View style={schedModal.dateCol}>
                    <Text style={[schedModal.dateDay, { color: ACC.skunks }]}>{day}</Text>
                    <Text style={schedModal.dateMonth}>{month}</Text>
                  </View>
                  {/* Info col */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <View style={[schedModal.badge, g.isHome ? schedModal.badgeHome : schedModal.badgeAway]}>
                        <Text style={[schedModal.badgeText, { color: g.isHome ? ACC.skunks : 'rgba(255,255,255,0.4)' }]}>
                          {g.isHome ? 'HOME' : 'AWAY'}
                        </Text>
                      </View>
                      <Text style={schedModal.dow}>{dow}</Text>
                      <Text style={schedModal.time}>{g.time}</Text>
                    </View>
                    <Text style={schedModal.opponent}>{g.isHome ? 'vs. ' : '@ '}{g.opponent}</Text>
                    {g.promotion ? (
                      <Text style={[schedModal.promo, { color: `${ACC.skunks}80` }]}>{g.promotion}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Game Detail Sheet — carousel, in-tree overlay ── */}
      {!!detailGame && (() => {
        const sheetItems = nextUpItems.filter(g => !g.isLive);
        const currentGame = sheetItems[sheetCarouselIdx] ?? sheetItems[0];
        const bgSrc = currentGame?.bgKey === 'baseball' ? require('../assets/ballpark.jpg')
          : currentGame?.bgKey === 'hockey' ? require('../assets/hockey.jpg') : null;
        return (
          <View style={styles.sheetOverlay}>
            <TouchableOpacity style={[StyleSheet.absoluteFillObject, styles.sheetBackdrop]} activeOpacity={1} onPress={() => setDetailGame(null)} />
            <ImageBackground
              source={bgSrc ?? undefined}
              style={styles.sheetCard}
              imageStyle={{ opacity: 0.1, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
              resizeMode="cover"
            >
              <View style={styles.sheetHandle} />
              <TouchableOpacity onPress={() => setDetailGame(null)} style={styles.sheetClose}>
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.45)" />
              </TouchableOpacity>

              {/* Carousel pages */}
              <ScrollView
                ref={sheetScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentOffset={{ x: sheetCarouselIdx * winWidth, y: 0 }}
                onMomentumScrollEnd={e => setSheetCarouselIdx(Math.round(e.nativeEvent.contentOffset.x / winWidth))}
                style={{ marginHorizontal: -24 }}
              >
                {sheetItems.map((game, i) => {
                  const matchParts = game.matchup.split(' ');
                  const ourAbbr = matchParts[0];
                  const oppAbbr = matchParts[2];
                  const accentRGB = game.accent === ACC.sabres ? '96,165,250' : '167,139,250';
                  const homePitcher = game.isHome ? game.probablePitcher : game.oppProbablePitcher;
                  const awayPitcher = game.isHome ? game.oppProbablePitcher : game.probablePitcher;
                  const rows = [
                    { icon: 'trophy-outline',    label: 'Playoffs',      value: game.seriesLabel },
                    { icon: 'calendar-outline',  label: 'Date',          value: [game.dateLabel, game.time].filter(Boolean).join(' · ') },
                    { icon: 'location-outline',  label: 'Venue',         value: game.venue },
                    { icon: 'tv-outline',        label: 'Broadcast',     value: game.broadcast },
                    { icon: 'baseball-outline',  label: 'Home pitcher',  value: homePitcher },
                    { icon: 'baseball-outline',  label: 'Away pitcher',  value: awayPitcher },
                  ].filter(r => r.value) as { icon: string; label: string; value: string }[];

                  return (
                    <View key={i} style={{ width: winWidth, paddingHorizontal: 24, paddingBottom: 4 }}>
                      {/* Accent gradient wash */}
                      <LinearGradient
                        colors={[`rgba(${accentRGB},0.18)`, 'transparent']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                      />

                      <Text style={[styles.sheetSport, { color: game.accent }]}>{game.sport}</Text>

                      {/* Team logos */}
                      <View style={styles.sheetMatchupRow}>
                        <View style={styles.sheetTeamBlock}>
                          {game.ourLogoUrl
                            ? <Image source={{ uri: game.ourLogoUrl }} style={styles.sheetLogo} resizeMode="contain" />
                            : <View style={styles.sheetLogo} />}
                          <Text style={styles.sheetTeamAbbr}>{ourAbbr}</Text>
                          {game.record ? <Text style={styles.sheetRecord}>{game.record}</Text> : null}
                        </View>
                        <Text style={styles.sheetVs}>{game.isHome ? 'vs' : '@'}</Text>
                        <View style={styles.sheetTeamBlock}>
                          {game.oppLogoUrl
                            ? <Image source={{ uri: game.oppLogoUrl }} style={styles.sheetLogo} resizeMode="contain" />
                            : <View style={styles.sheetLogo} />}
                          <Text style={styles.sheetTeamAbbr}>{oppAbbr}</Text>
                          {game.oppRecord ? <Text style={styles.sheetRecord}>{game.oppRecord}</Text> : null}
                        </View>
                      </View>

                      {game.opponentName ? (
                        <Text style={styles.sheetOppName}>
                          {game.isHome ? 'vs ' : '@ '}{game.opponentName}
                        </Text>
                      ) : null}

                      {rows.length > 0 && <View style={styles.sheetDivider} />}

                      {rows.map(r => (
                        <View key={r.label} style={styles.sheetRow}>
                          <Ionicons name={r.icon as any} size={14} color="rgba(255,255,255,0.3)" style={{ marginTop: 1, width: 18 }} />
                          <Text style={styles.sheetRowLabel}>{r.label}</Text>
                          <Text style={styles.sheetRowValue}>{r.value}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </ScrollView>

              {/* Dots — only shown when multiple games */}
              {sheetItems.length > 1 && (
                <View style={styles.sheetDots}>
                  {sheetItems.map((_, i) => (
                    <View key={i} style={[styles.sheetDot, i === sheetCarouselIdx && styles.sheetDotActive]} />
                  ))}
                </View>
              )}
            </ImageBackground>
          </View>
        );
      })()}

    </ThemedBackground>
  );
}

const schedModal = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#060e18' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  headerLeft:  { gap: 2 },
  headerTitle: { fontFamily: 'Syne', fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  headerSub:   { fontFamily: 'Outfit', fontSize: 11, fontWeight: '600', color: ACC.skunks, letterSpacing: 1.2, textTransform: 'uppercase' },
  closeBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  list:        { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48 },
  row:         { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 12 },
  rowBorder:   { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  dateCol:     { width: 36, alignItems: 'center', paddingTop: 2 },
  dateDay:     { fontFamily: 'Syne', fontSize: 18, fontWeight: '800', lineHeight: 20 },
  dateMonth:   { fontFamily: 'Outfit', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.8, textTransform: 'uppercase' },
  badge:       { borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  badgeHome:   { borderColor: `${ACC.skunks}40`, backgroundColor: `${ACC.skunks}12` },
  badgeAway:   { borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'transparent' },
  badgeText:   { fontFamily: 'Outfit', fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  dow:         { fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.3)' },
  time:        { fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.3)' },
  opponent:    { fontFamily: 'Syne', fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  promo:       { fontFamily: 'Outfit', fontSize: 10, marginTop: 2 },
});

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 40, zIndex: 10 },
  title:   { fontFamily: 'Syne', fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  subhead: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', marginTop: 4, letterSpacing: 1.5, textTransform: 'uppercase', color: ACC.label },
  content: { padding: 16, paddingTop: 8, paddingBottom: 40, gap: 10 },

  // Section labels
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 6, paddingHorizontal: 2 },
  sectionLabel:    { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase', color: ACC.label },

  // Next Up hero card
  nextUpSection: { gap: 10 },
  nextUpCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(30,41,59,0.8)',
    backgroundColor: 'rgba(15,23,42,0.4)',
    overflow: 'hidden',
  },
  nextUpHeader: { height: 130, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24 },
  nextUpBgEmoji: { fontSize: 90, opacity: 0.08, alignSelf: 'center' },
  nextUpLogoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1,
  },
  nextUpLogoCol: { alignItems: 'center', gap: 6, width: 96, flexShrink: 0 },
  nextUpLogoBg: {
    width: 76, height: 76, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  nextUpHeaderLogo: { width: 72, height: 72, flexShrink: 0 },
  nextUpLogoLabel: { fontFamily: 'Syne', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  nextUpVsDivider: { width: 64, flexShrink: 0, height: 1, alignItems: 'center', justifyContent: 'center' },
  nextUpVsText: { fontFamily: 'Syne', fontSize: 13, fontWeight: '800', letterSpacing: 1, backgroundColor: 'transparent', paddingHorizontal: 8 },
  nextUpPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  nextUpPillText: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  nextUpBody: { padding: 14, flexDirection: 'row', alignItems: 'center' },
  nextUpDots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 },
  nextUpDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  nextUpDotActive: { backgroundColor: 'rgba(255,255,255,0.7)', width: 14 },
  nextUpMatchup: { fontFamily: 'DMSans_800ExtraBold', fontSize: 16, color: '#fff', letterSpacing: -0.3 },

  // Team cards
  teamCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(30,41,59,0.8)',
    backgroundColor: 'rgba(15,23,42,0.4)',
    overflow: 'hidden',
  },
  teamCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  teamIconSquare: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  teamCardName:  { fontFamily: 'Syne', fontSize: 15, fontWeight: '700', color: '#fff' },
  teamCardSub:   { fontFamily: 'Outfit', fontSize: 10, marginTop: 2, letterSpacing: 0.5, textTransform: 'uppercase' },
  glanceRow:     { paddingHorizontal: 14, paddingBottom: 14, marginTop: -6 },
  glanceText:    { fontFamily: 'Outfit', fontSize: 12 },

  mlbMatchup: {
    flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden', borderRadius: 10,
    backgroundColor: 'rgba(167,139,250,0.06)',
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.12)',
    height: 56,
  },
  mlbMatchupLogo:    { width: 44, height: 44, flexShrink: 0, marginHorizontal: 4 },
  mlbMatchupGradL:   { position: 'absolute', left: 52, top: 0, bottom: 0, width: 40 },
  mlbMatchupGradR:   { position: 'absolute', right: 52, top: 0, bottom: 0, width: 40 },
  mlbMatchupCenter:  { flex: 1, alignItems: 'center' },
  mlbMatchupGame:    { fontFamily: 'DMSans_700Bold', fontSize: 13, color: '#fff', letterSpacing: -0.2 },
  mlbMatchupMeta:    { fontFamily: 'Outfit', fontSize: 10, marginTop: 2 },
  teamCardExpanded: { borderTopWidth: 1, padding: 12, gap: 10 },

  innerLabel: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', paddingLeft: 2 },
  moreLink:   { alignItems: 'flex-end', paddingTop: 4 },
  moreLinkText: { fontFamily: 'Outfit', fontSize: 11 },

  // JCC rows
  jccRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, gap: 10 },
  jccResult:   { fontFamily: 'Outfit', fontSize: 13, fontWeight: '800', width: 20, textAlign: 'center' },
  jccSportIcon:{ fontSize: 16, width: 22, textAlign: 'center' },
  jccGame:     { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600', color: '#fff' },
  jccSport:    { fontFamily: 'Outfit', fontSize: 10 },
  jccScore:    { fontFamily: 'Outfit', fontSize: 12, fontWeight: '700' },
  jccDate:     { fontFamily: 'Outfit', fontSize: 10 },

  // Tarp Skunks schedule
  skunksRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  skunksDateCol:  { width: 40, alignItems: 'center' },
  skunksDay:      { fontFamily: 'Syne', fontSize: 15, fontWeight: '700', lineHeight: 17 },
  skunksMonth:    { fontFamily: 'Outfit', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.8, textTransform: 'uppercase' },
  skunksOpponent: { fontFamily: 'Outfit', flex: 1, fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  skunksTime:     { fontFamily: 'Outfit', fontSize: 11 },

  // Sabres scorers
  scorerRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9 },
  scorerLeft:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  scorerHeadshot:{ width: 28, height: 28, borderRadius: 14 },
  scorerName:    { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600', color: '#fff', flex: 1 },
  scorerPos:     { fontFamily: 'Outfit', fontSize: 9 },
  scorerStat:    { fontFamily: 'Outfit', fontSize: 12, color: 'rgba(255,255,255,0.65)', width: 32, textAlign: 'center' },

  // MLB team list
  mlbTeamRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  mlbLogoWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  mlbLogo:     { width: 28, height: 28 },
  mlbTeamName: { fontFamily: 'Outfit', fontSize: 13, fontWeight: '600', color: '#fff' },
  mlbNext:     { fontFamily: 'Outfit', fontSize: 10, marginTop: 1 },
  mlbRecord:   { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600' },

  // MLB stats strip
  mlbStatsStrip: {
    flexDirection: 'row', borderWidth: 1, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.02)', overflow: 'hidden',
  },
  mlbStatCell:    { flex: 1, alignItems: 'center', paddingVertical: 10 },
  mlbStatVal:     { fontFamily: 'DMSans_700Bold', fontSize: 14, color: '#fff' },
  mlbStatLbl:     { fontFamily: 'Outfit', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.8, marginTop: 2, textTransform: 'uppercase' },
  mlbStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 8 },

  // MLB expanded detail
  mlbExpanded:     { paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, backgroundColor: 'rgba(255,255,255,0.02)' },
  mlbExpandedNext: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mlbExpandLabel:  { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  mlbExpandLogo:   { width: 20, height: 20 },
  mlbExpandText:   { fontFamily: 'Outfit', fontSize: 12 },
  mlbGameRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  mlbGameResult:   { fontFamily: 'Outfit', fontSize: 12, fontWeight: '800', width: 14 },

  playoffsBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  playoffsBadgeText: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  // MLB live/streak badges and community pick
  mlbLiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251,113,133,0.12)', borderWidth: 1, borderColor: 'rgba(251,113,133,0.3)', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  mlbLiveBadgeText: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '800', color: '#fb7185', letterSpacing: 0.8 },
  mlbStreakBadge: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  mlbStreakBadgeText: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  mlbCommunityPick: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', marginTop: 1 },

  // Game detail bottom sheet — in-tree overlay (not Modal) so it respects app container on web
  sheetOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 500 },
  sheetBackdrop: { backgroundColor: 'rgba(0,0,0,0.65)' },
  sheetCard: {
    backgroundColor: 'rgba(8,16,32,0.96)', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 24, paddingBottom: 40, overflow: 'hidden',
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  sheetClose: { position: 'absolute', top: 16, right: 20, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  sheetSport: { fontFamily: 'DMSans_600SemiBold', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 20 },
  sheetMatchupRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 10 },
  sheetTeamBlock: { alignItems: 'center', gap: 6, flex: 1 },
  sheetLogo: { width: 72, height: 72 },
  sheetTeamAbbr: { fontFamily: 'DMSans_700Bold', fontSize: 13, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
  sheetVs: { fontFamily: 'DMSans_700Bold', fontSize: 20, color: 'rgba(255,255,255,0.25)', marginBottom: 28 },
  sheetRecord: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  sheetOppName: { fontFamily: 'Editorial', fontSize: 20, color: '#fff', textAlign: 'center', marginBottom: 20, lineHeight: 26 },
  sheetDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 12 },
  sheetRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  sheetRowLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.35)', width: 100, flexShrink: 0 },
  sheetRowValue: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.8)', flex: 1, lineHeight: 17 },

  sheetDots: { flexDirection: 'row', justifyContent: 'center', gap: 5, paddingTop: 14, paddingBottom: 4 },
  sheetDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)' },
  sheetDotActive: { backgroundColor: 'rgba(255,255,255,0.65)', width: 14 },
});
