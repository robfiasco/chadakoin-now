import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform,
  TouchableOpacity, Linking, Image, ImageBackground, Animated, Easing, RefreshControl,
  useWindowDimensions,
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
import { SKUNKS_SCHEDULE } from '../lib/skunksSchedule';
import { useCivicData } from '../hooks/useCivicData';
import { EVENT_BOOST_PRICES, AD_BADGE_LABEL } from '../lib/adPricing';
import FeedbackScreen from './feedback';

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
  // Compact NEXT list — JCC rows deep-link out instead of opening the detail sheet
  isJcc?: boolean; externalLink?: string;
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
  inPostseason?: boolean;
  postseasonRound?: string | null;
  seriesRecord?: string | null;
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
// MLB's own seriesDescription strings, shortened to fit a status-pill label.
const MLB_ROUND_LABELS: Record<string, string> = {
  'AL Wild Card Series':     'AL WILD CARD',
  'NL Wild Card Series':     'NL WILD CARD',
  'AL Division Series':      'ALDS',
  'NL Division Series':      'NLDS',
  'AL Championship Series':  'ALCS',
  'NL Championship Series':  'NLCS',
  'World Series':            'WORLD SERIES',
};
interface PlayoffSeries {
  round: number; roundLabel: string;
  opponent: string; bufWins: number; oppWins: number; neededToWin: number;
}
interface SabresData {
  record: string; standing: string; points?: number;
  wins?: number; losses?: number; otLosses?: number;
  recentGame?: GameResult; nextGame?: GameResult; liveGame?: GameResult | null;
  topScorers?: Scorer[]; jcc?: JCCData | null; mlb?: MLBTeam[]; nfl?: NFLTeam[];
  playoffSeries?: PlayoffSeries | null;
}

interface NFLGame     { date: string; week: string; opponent: string; opponentAbbr: string; ourScore: string; theirScore: string; isHome: boolean; won: boolean; }
interface NFLNextGame { date: string; week: string; opponent: string; opponentAbbr: string; opponentLogo: string; isHome: boolean; venue: string; broadcast: string; }
interface NFLLiveGame { week: string; opponent: string; opponentAbbr: string; opponentLogo: string; ourScore: string; theirScore: string; isHome: boolean; clock: string; }
interface NFLTeam {
  abbr: string; name: string; logo: string; record: string;
  games: NFLGame[]; nextGame: NFLNextGame | null; liveGame: NFLLiveGame | null;
}

const NFL_TEAMS = [
  { espnAbbr: 'buf', abbr: 'BUF', name: 'Bills' },
  { espnAbbr: 'pit', abbr: 'PIT', name: 'Steelers' },
  { espnAbbr: 'cle', abbr: 'CLE', name: 'Browns' },
];

const SABRES_LOGO = 'https://a.espncdn.com/i/teamlogos/nhl/500/buf.png';
const SABRES_ESPN = 'https://www.espn.com/nhl/team/_/name/buf/buffalo-sabres';
const JCC_LOGO    = require('../assets/jcc_logo.png');

// Max rows shown in the compact "Live Now" list. Bumped from 3 to 5 so a
// league with more tracked teams (MLB, 5 teams) can't fill every slot and
// starve out a league with fewer (NFL, 3 teams) when both are live at once.
const LIVE_COMPACT_CAP = 5;

const ACC = {
  jcc:    '#34d399',  // emerald-400
  skunks: '#84cc16',  // lime-500
  sabres: '#60a5fa',  // blue-400
  mlb:    '#a78bfa',  // violet-400
  nfl:    '#fb923c',  // orange-400
  label:  '#22d3ee',  // cyan-400 — section headers
} as const;

// "Corning Community College" → "Corning CC" — deliberate abbreviation,
// not truncation, so opponent names never get cut mid-word
function abbreviateOpponent(name: string): string {
  return name.replace(/\bCommunity College\b/gi, 'CC');
}

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

// NFL team row state — feeds all three uniform rows (Bills, Steelers,
// Browns). Never renders "0-0": a team with no completed regular-season
// game shows its next kickoff instead of a record.
function nflTeamStatus(t: NFLTeam): { pill?: string; pillLive?: boolean; line: string; record?: string } {
  // t.record is only ever '' (never the literal string '0-0') when the
  // fetch fails — see fetchTeamRecord in api/nfl.js — so a real 0-0 (e.g.
  // Week 1, before anyone's played) is legitimate data, not a fetch
  // failure, and should still show.
  const record = t.record || undefined;
  if (t.liveGame) {
    const lg = t.liveGame;
    return {
      pill: 'LIVE', pillLive: true,
      line: `${lg.isHome ? 'vs' : '@'} ${lg.opponentAbbr} · ${lg.ourScore}–${lg.theirScore}`,
      record,
    };
  }
  if (t.games.length > 0) {
    const g = t.games[0];
    return {
      line: `${g.won ? 'W' : 'L'} ${g.ourScore}–${g.theirScore} ${g.isHome ? 'vs' : '@'} ${g.opponentAbbr}`,
      record,
    };
  }
  if (t.nextGame) {
    const d = new Date(t.nextGame.date);
    const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const wk = t.nextGame.week || '';
    const weekNum = wk.match(/\d+/)?.[0];
    const pill = /pre/i.test(wk) ? 'PRE' : (weekNum ? `WK${weekNum}` : undefined);
    return { pill, line: `${dayStr} ${timeStr} · ${t.nextGame.isHome ? 'vs' : '@'} ${t.nextGame.opponentAbbr}` };
  }
  return { line: 'Schedule TBD' };
}

// MLB row line for a team's last result or next game. Omits the pitch
// time when the same club is already shown with a time in the NEXT list,
// to avoid repeating it.
function mlbLastOrNext(t: MLBTeam, alreadyInNext: boolean): string {
  if (t.games[0]) {
    const g = t.games[0];
    return `${g.won ? 'W' : 'L'} ${g.ourScore}–${g.theirScore} ${g.isHome ? 'vs' : '@'} ${g.opponent.split(' ').pop()}`;
  }
  if (t.nextGame) {
    const opp = t.nextGame.opponent.split(' ').pop();
    const prefix = `${t.nextGame.isHome ? 'vs' : '@'} ${opp}`;
    if (alreadyInNext) return prefix;
    const timeStr = t.nextGame.gameTime
      ? new Date(t.nextGame.gameTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : '';
    return timeStr ? `${prefix} · ${timeStr}` : prefix;
  }
  return 'Schedule TBD';
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
        // gameType R = regular season only — include postseason rounds (Wild
        // Card/Division/League Championship/World Series) too, or this stays
        // frozen on a team's last regular-season result through October.
        const scheduleUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${t.id}&gameType=R,F,D,L,W&startDate=${fmt(start)}&endDate=${fmt(end)}&hydrate=team(record),probablePitcher,linescore,venue,seriesStatus`;
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
        let inPostseason = false;
        let postseasonRound: string | null = null;
        let seriesRecord: string | null = null;
        for (const dateObj of (json.dates ?? [])) {
          for (const g of (dateObj.games ?? [])) {
            const state = g.status?.detailedState ?? '';
            if (g.gameType && g.gameType !== 'R') {
              inPostseason = true;
              postseasonRound = MLB_ROUND_LABELS[g.seriesDescription] ?? g.seriesDescription ?? postseasonRound;
              const ss = g.seriesStatus;
              if (ss) {
                const wins = ss.wins ?? 0, losses = ss.losses ?? 0;
                const weAreLeadOrTied = !ss.winningTeam || ss.winningTeam.id === t.id;
                seriesRecord = weAreLeadOrTied ? `${wins}-${losses}` : `${losses}-${wins}`;
              }
            }
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
          nextGame, liveGame, inPostseason, postseasonRound, seriesRecord,
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

// The team /schedule endpoint below never populates `score` for
// in-progress games (only for completed ones) — ESPN doesn't hydrate live
// scoring on that endpoint. The league scoreboard endpoint does, so it's
// fetched once and used to patch in real live scores.
async function fetchNFLScoreboard(): Promise<any> {
  try {
    const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function liveNFLScoreFromScoreboard(scoreboard: any, espnAbbr: string): { ourScore: string; theirScore: string } | null {
  for (const event of (scoreboard?.events ?? [])) {
    const comp = event.competitions?.[0];
    if (comp?.status?.type?.state !== 'in') continue;
    const competitors: any[] = comp.competitors ?? [];
    const us = competitors.find(c => c.team?.abbreviation?.toLowerCase() === espnAbbr.toLowerCase());
    if (!us) continue;
    const them = competitors.find(c => c !== us);
    return { ourScore: us.score ?? '0', theirScore: them?.score ?? '0' };
  }
  return null;
}

async function fetchNFL(): Promise<NFLTeam[]> {
  try {
    if (Platform.OS === 'web') {
      const res = await fetch(apiUrl('/api/nfl'));
      if (!res.ok) return [];
      const json = await res.json();
      return (json.teams ?? []) as NFLTeam[];
    }
    const scoreboard = await fetchNFLScoreboard();
    const results = await Promise.all(NFL_TEAMS.map(async t => {
      const logo = `https://a.espncdn.com/i/teamlogos/nfl/500/${t.espnAbbr}.png`;
      try {
        const [recRes, schedRes] = await Promise.all([
          fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${t.espnAbbr}`),
          fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${t.espnAbbr}/schedule`),
        ]);
        const record = recRes.ok ? ((await recRes.json())?.team?.record?.items?.[0]?.summary ?? '') : '';
        const games: NFLGame[] = [];
        let nextGame: NFLNextGame | null = null;
        let liveGame: NFLLiveGame | null = null;
        if (schedRes.ok) {
          const schedJson = await schedRes.json();
          for (const event of (schedJson.events ?? [])) {
            const comp = event.competitions?.[0]; if (!comp) continue;
            const state = comp.status?.type?.state ?? '';
            const competitors: any[] = comp.competitors ?? [];
            const us   = competitors.find(c => c.team?.abbreviation === t.espnAbbr.toUpperCase());
            const them = competitors.find(c => c.team?.abbreviation !== t.espnAbbr.toUpperCase());
            if (!us || !them) continue;
            const isHome = us.homeAway === 'home';
            if (state === 'post') {
              games.push({
                date: event.date, week: event.week?.text ?? '',
                opponent: them.team?.displayName ?? '???', opponentAbbr: them.team?.abbreviation ?? '???',
                ourScore: us.score?.displayValue ?? '0', theirScore: them.score?.displayValue ?? '0',
                isHome, won: us.winner === true,
              });
            } else if (state === 'in') {
              const liveScore = liveNFLScoreFromScoreboard(scoreboard, t.espnAbbr);
              liveGame = {
                week: event.week?.text ?? '',
                opponent: them.team?.displayName ?? '???', opponentAbbr: them.team?.abbreviation ?? '???',
                opponentLogo: them.team?.logo ?? '',
                ourScore: liveScore?.ourScore ?? us.score?.displayValue ?? '0',
                theirScore: liveScore?.theirScore ?? them.score?.displayValue ?? '0',
                isHome, clock: comp.status?.type?.shortDetail ?? '',
              };
            } else if (!nextGame && state === 'pre' && new Date(event.date) > new Date()) {
              nextGame = {
                date: event.date, week: event.week?.text ?? '',
                opponent: them.team?.displayName ?? '???', opponentAbbr: them.team?.abbreviation ?? '???',
                opponentLogo: them.team?.logo ?? '',
                isHome, venue: comp.venue?.fullName ?? '', broadcast: comp.broadcasts?.[0]?.media?.shortName ?? '',
              };
            }
          }
        }
        return {
          abbr: t.abbr, name: t.name, logo, record,
          games: games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
          nextGame, liveGame,
        };
      } catch { return { abbr: t.abbr, name: t.name, logo, record: '', games: [], nextGame: null, liveGame: null }; }
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
        // Cross country (and similar) report a meet placement here (e.g. "100th")
        // instead of W/L — skip rather than mis-recording it as a loss.
        if (wl !== 'W' && wl !== 'L') continue;
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
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentResults = results.filter(r => new Date(r.date) >= sevenDaysAgo);
    return { results: recentResults.slice(0, 8), upcoming: upcoming.slice(0, 8), records };
  } catch { return empty; }
}

async function fetchPlayoffSeries(): Promise<PlayoffSeries | null> {
  try {
    const year = new Date().getFullYear();
    const seasonId = `${year - 1}${year}`;
    const res = await fetch(`https://api-web.nhle.com/v1/playoff-series/carousel/${seasonId}`);
    if (!res.ok) return null;
    const data = await res.json();
    // Pick the highest round BUF appears in — earlier rounds remain in the carousel
    // after they end, so a first-match return would stay stuck on round 1.
    let latest: PlayoffSeries | null = null;
    for (const round of (data.rounds ?? [])) {
      for (const series of (round.series ?? [])) {
        const top = series.topSeed ?? {};
        const bot = series.bottomSeed ?? {};
        if (top.abbrev !== 'BUF' && bot.abbrev !== 'BUF') continue;
        if (latest && round.roundNumber <= latest.round) continue;
        const bufWins = top.abbrev === 'BUF' ? top.wins : bot.wins;
        const oppWins = top.abbrev === 'BUF' ? bot.wins : top.wins;
        latest = {
          round: round.roundNumber,
          roundLabel: round.roundLabel ?? `Round ${round.roundNumber}`,
          opponent: top.abbrev === 'BUF' ? bot.abbrev : top.abbrev,
          bufWins, oppWins,
          neededToWin: series.neededToWin ?? 4,
        };
      }
    }
    return latest;
  } catch { return null; }
}

async function fetchSabres(): Promise<SabresData> {
  if (Platform.OS === 'web') {
    const [sabresRes, mlbRes, nflRes] = await Promise.all([fetch(apiUrl('/api/sabres')), fetchMLB(), fetchNFL()]);
    if (!sabresRes.ok) throw new Error('Sabres API failed');
    const json = await sabresRes.json();
    const rawJcc = json.jcc;
    const jcc: JCCData = rawJcc && typeof rawJcc === 'object' && !Array.isArray(rawJcc)
      ? rawJcc
      : { results: [], upcoming: [], records: {} };
    return { record: json.record ?? '', standing: json.standing ?? '', recentGame: json.recentGame, nextGame: json.nextGame, liveGame: json.liveGame ?? null, topScorers: json.topScorers ?? [], jcc, mlb: mlbRes, nfl: nflRes, playoffSeries: json.playoffSeries ?? null };
  }
  const [schedRes, standRes, statsRes, jcc, mlb, nfl, playoffSeries] = await Promise.all([
    fetch('https://api-web.nhle.com/v1/club-schedule-season/BUF/now'),
    fetch('https://api-web.nhle.com/v1/standings/now'),
    fetch('https://api-web.nhle.com/v1/club-stats/BUF/now'),
    fetchJCCNative(),
    fetchMLB(),
    fetchNFL(),
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
  return { record, standing, points, wins, losses, otLosses, recentGame: past[0] ? parseNHLGame(past[0]) ?? undefined : undefined, nextGame: upcoming[0] ? parseNHLGame(upcoming[0]) ?? undefined : undefined, liveGame, topScorers, jcc, mlb, nfl, playoffSeries };
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
  gradStart, gradEnd, iconContent,
  name, subtitle, glanceRow, children,
  defaultOpen = false, glassWeb, bgImage, hideChevron = false,
  iconSize, nameStyle,
}: {
  gradStart: string; gradEnd: string;
  iconContent: React.ReactNode;
  name: string; subtitle?: string;
  glanceRow: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  glassWeb: any;
  bgImage?: any;
  // No expand affordance when there's no extra detail to reveal (e.g. NFL,
  // whose full state already lives in the glance row).
  hideChevron?: boolean;
  // Shrinks the leading icon tile and restyles the name as a small caps
  // kicker instead of a full team-name heading — for cards that front a
  // league rather than one team, so the header doesn't visually compete
  // with a team row immediately below it (e.g. MLB/NFL above Bills).
  iconSize?: number;
  nameStyle?: any;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rot = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  function toggle() {
    Animated.timing(rot, { toValue: open ? 0 : 1, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.ease) }).start();
    setOpen(v => !v);
  }

  const chevronRotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const headerInner = (
    <>
      <LinearGradient
        colors={[gradStart, gradEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.teamIconSquare, iconSize ? { width: iconSize, height: iconSize, borderRadius: Math.round(iconSize * 0.27) } : null]}
      >
        {iconContent}
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={[styles.teamCardName, nameStyle]}>{name}</Text>
        {subtitle ? <Text style={[styles.teamCardSub, { color: dark.text.subtle }]}>{subtitle}</Text> : null}
      </View>
      {!hideChevron && (
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <Ionicons name="chevron-down" size={16} color={dark.text.subtle} />
        </Animated.View>
      )}
    </>
  );

  const cardContent = (
    <>
      {hideChevron ? (
        <View style={styles.teamCardHeader}>{headerInner}</View>
      ) : (
        <TouchableOpacity onPress={toggle} activeOpacity={0.7} style={styles.teamCardHeader}>{headerInner}</TouchableOpacity>
      )}

      <View style={styles.glanceRow}>{glanceRow}</View>

      {!hideChevron && open && children && (
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

// Compact row for the NEXT list — News/City-Services chrome, not a hero card.
// JCC rows deep-link out (no rich detail data); everything else opens the
// existing game detail sheet.
function NextRow({ item, onPress, isLast }: { item: NextUpItem; onPress: () => void; isLast: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.nextRow, !isLast && { borderBottomWidth: 1, borderBottomColor: dark.border }]}
    >
      <View style={[styles.nextRowStripe, { backgroundColor: item.accent }]} />
      <Text style={styles.nextRowEmoji}>{item.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.nextRowSport, { color: item.accent }]} numberOfLines={1}>{item.sport}</Text>
        <Text style={styles.nextRowMatchup} numberOfLines={1}>{item.matchup}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.nextRowDate, item.isLive && { color: '#fb7185' }]}>{item.dateLabel}</Text>
        {item.time ? <Text style={styles.nextRowTime}>{item.time}</Text> : null}
      </View>
      <Ionicons
        name={item.isJcc ? 'open-outline' : 'chevron-forward'}
        size={13}
        color="rgba(255,255,255,0.2)"
        style={{ marginLeft: 8 }}
      />
    </TouchableOpacity>
  );
}

// One uniform row for MLB (5 teams) / NFL (3 teams) league cards — logo,
// name, status line, trailing record and/or pill. Every team gets the same
// treatment; nothing hidden behind a tap since the full roster fits.
function LeagueTeamRow({
  logo, name, line, lineColor, record, recordColor, pill, pillLive,
}: {
  logo: string; name: string; line: string; lineColor?: string;
  record?: string; recordColor?: string; pill?: string; pillLive?: boolean;
}) {
  return (
    <View style={league.row}>
      <View style={league.rowLogoWrap}>
        <Image source={{ uri: logo }} style={league.rowLogo} resizeMode="contain" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={league.rowName} numberOfLines={1}>{name}</Text>
        <Text style={[league.rowLine, lineColor && { color: lineColor }]} numberOfLines={1}>{line}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 3 }}>
        {pill ? (
          <View style={[league.statusPill, pillLive && league.statusPillLive]}>
            <Text style={[league.statusPillText, pillLive && { color: '#fb7185' }]}>{pill}</Text>
          </View>
        ) : null}
        {record ? <Text style={[league.rowRecord, recordColor && { color: recordColor }]}>{record}</Text> : null}
      </View>
    </View>
  );
}

// Ad slot — sells the Featured spot, never mixed into standings/score rows.
// Reuses the same pricing constant as the Events tab's ad CTA.
function SportsAdCTA({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={adCta.card}>
      <View style={adCta.badge}>
        <Ionicons name="megaphone-outline" size={11} color={ACC.label} />
        <Text style={adCta.badgeText}>{AD_BADGE_LABEL}</Text>
      </View>
      <Text style={adCta.title}>Put Your Team First</Text>
      <Text style={adCta.body}>
        This slot stays at the top of Sports — seen every time residents check scores.
      </Text>
      <View style={adCta.pricingRow}>
        {EVENT_BOOST_PRICES.map(p => (
          <View key={p} style={adCta.pricePill}>
            <Text style={adCta.priceText}>{p}</Text>
          </View>
        ))}
      </View>
      <View style={adCta.ctaBtn}>
        <Text style={adCta.ctaBtnText}>Feature This Team</Text>
        <Ionicons name="arrow-forward" size={13} color="#000" />
      </View>
    </TouchableOpacity>
  );
}

const adCta = StyleSheet.create({
  card:      { borderWidth: 1, borderColor: `${ACC.label}48`, backgroundColor: `${ACC.label}0d`, borderRadius: 18, padding: 18, gap: 10 },
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: `${ACC.label}4d`, backgroundColor: `${ACC.label}1f`, borderRadius: 20 },
  badgeText: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: ACC.label },
  title:     { fontFamily: 'Syne', fontSize: 19, fontWeight: '700', color: '#fff', letterSpacing: -0.3, lineHeight: 25, marginBottom: 2 },
  body:      { fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 19 },
  pricingRow:{ flexDirection: 'row', gap: 8 },
  pricePill: { borderWidth: 1, borderColor: `${ACC.label}4d`, backgroundColor: `${ACC.label}1a`, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  priceText: { fontFamily: 'Syne', fontSize: 13, fontWeight: '700', color: ACC.label },
  ctaBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 44, borderRadius: 12, marginTop: 4, backgroundColor: ACC.label },
  ctaBtnText:{ fontFamily: 'Syne', fontSize: 13, fontWeight: '700', color: '#000' },
});

export default function SportsScreen() {
  const { news: civicNews } = useCivicData();
  const skunksNews = useMemo(
    () => civicNews.filter(n => /tarp skunks|jamestown tarp|pgcbl|diethrick/i.test(n.title + ' ' + (n.excerpt ?? ''))),
    [civicNews],
  );

  const [data, setData]           = useState<SabresData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showSkunksSchedule, setShowSkunksSchedule] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
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
  // Cards fill full page width (winWidth) — internal padding handles the
  // visual inset. This prevents next-card peek-through with pagingEnabled.

  const glassWeb = Platform.OS === 'web'
    ? { backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }
    : {};

  useEffect(() => {
    fetchSabres().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Once any tracked team is confirmed in the postseason, drop the others —
  // showing Pirates/Mets/Blue Jays-style frozen regular-season finales next
  // to teams playing real October games reads as stale clutter. Regular
  // season / full offseason (no one has inPostseason set) shows all 5 as
  // before.
  const mlbTeams = data?.mlb ?? [];
  const visibleMlb = mlbTeams.some(t => t.inPostseason) ? mlbTeams.filter(t => t.inPostseason) : mlbTeams;

  // Auto-poll every 60s when any live game is in progress
  const hasLive = !!(data?.liveGame?.status === 'live' || data?.mlb?.some(t => t.liveGame) || data?.nfl?.some(t => t.liveGame));
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
    const candidates: NextUpItem[] = [];
    const seenGamePairs = new Set<string>(); // dedup games where both teams are tracked
    const now = new Date();
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    // Tarp Skunks — always available from static schedule
    const nextSkunksGame = SKUNKS_SCHEDULE.find(g => {
      const [timeStr, ampm] = g.time.split(' ');
      const [h, m] = timeStr.split(':').map(Number);
      let hours = h;
      if (ampm === 'PM' && h !== 12) hours += 12;
      if (ampm === 'AM' && h === 12) hours = 0;
      return new Date(`${g.date}T${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`) > now;
    });
    if (nextSkunksGame) {
      const [timeStr, ampm] = nextSkunksGame.time.split(' ');
      const [h, m] = timeStr.split(':').map(Number);
      let hours = h;
      if (ampm === 'PM' && h !== 12) hours += 12;
      if (ampm === 'AM' && h === 12) hours = 0;
      const gameDate = new Date(`${nextSkunksGame.date}T${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
      candidates.push({
        ts: gameDate.getTime(),
        sport: 'Tarp Skunks · PGCBL',
        emoji: '⚾',
        matchup: `Tarp Skunks ${nextSkunksGame.isHome ? 'vs' : '@'} ${nextSkunksGame.opponent}`,
        dateLabel: '',
        time: nextSkunksGame.time,
        accent: ACC.skunks,
        gradStart: 'rgba(132,204,22,0.22)',
        gradEnd: 'rgba(6,14,24,0.7)',
        bgKey: 'baseball',
        isHome: nextSkunksGame.isHome,
        opponentName: nextSkunksGame.opponent,
        venue: nextSkunksGame.isHome ? (nextSkunksGame.promotion ? `Diethrick Park · ${nextSkunksGame.promotion}` : 'Diethrick Park') : nextSkunksGame.opponent.replace(' ', ' @ '),
      });
    }

    if (data) {

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
    for (const team of visibleMlb) {
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
    for (const team of (data.nfl ?? [])) {
      if (team.liveGame) {
        const lg = team.liveGame;
        if (seenGamePairs.has(`nfl-${team.abbr}`)) continue;
        seenGamePairs.add(`nfl-${team.abbr}`);
        candidates.push({
          ts: Date.now(), // live — always first
          sport: `${team.name} · NFL`, emoji: '🏈',
          matchup: `${team.abbr} ${lg.isHome ? 'vs' : '@'} ${lg.opponentAbbr}`,
          dateLabel: lg.week,
          time: `${lg.ourScore}–${lg.theirScore} · ${lg.clock}`,
          accent: ACC.nfl, gradStart: 'rgba(251,146,60,0.28)', gradEnd: 'rgba(6,14,24,0.7)',
          ourLogoUrl: team.logo, oppLogoUrl: lg.opponentLogo || undefined,
          isLive: true,
        });
      } else if (team.nextGame) {
        const ng = team.nextGame;
        if (seenGamePairs.has(`nfl-${team.abbr}`)) continue;
        seenGamePairs.add(`nfl-${team.abbr}`);
        const d = new Date(ng.date);
        if (d > now) {
          candidates.push({
            ts: d.getTime(), sport: `${team.name} · NFL`, emoji: '🏈',
            matchup: `${team.abbr} ${ng.isHome ? 'vs' : '@'} ${ng.opponentAbbr}`,
            dateLabel: '',
            time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            accent: ACC.nfl, gradStart: 'rgba(251,146,60,0.28)', gradEnd: 'rgba(6,14,24,0.7)',
            ourLogoUrl: team.logo, oppLogoUrl: ng.opponentLogo || undefined,
            record: team.record,
            opponentName: ng.opponent, isHome: ng.isHome,
            venue: ng.venue || undefined, broadcast: ng.broadcast || undefined,
          });
        }
      }
    }
    } // end if (data)
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

  // Opening Night countdown badge — shows for 3 days leading up to May 29, clears after
  const openingNightBadge = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const opening = new Date('2026-05-29T00:00:00');
    if (today > opening) return null;
    if (daysUntilSkunks === 0) return 'TONIGHT';
    if (daysUntilSkunks === 1) return 'TOMORROW';
    if (daysUntilSkunks === 2) return 'THIS FRIDAY';
    return null;
  }, [daysUntilSkunks]);

  // Tarp Skunks season is active only while future games remain in the schedule —
  // auto-hides once the season ends, auto-reappears when next year's dates are added
  const skunksSeasonActive = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return SKUNKS_SCHEDULE.some(g => g.date >= todayStr);
  }, []);

  // Next Skunks home game — used in expanded card
  const nextSkunksHome = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return SKUNKS_SCHEDULE.find(g => g.isHome && g.date >= todayStr) ?? null;
  }, []);

  // Next Skunks game (any) — used in glance row
  const nextSkunksAny = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return SKUNKS_SCHEDULE.find(g => g.date >= todayStr) ?? null;
  }, []);

  // JCC glance: last result per distinct sport within 7 days — every active
  // sport, not an arbitrary cap. Keyed on the full sport name, not just its
  // first word, so "Women's Soccer" and "Women's Volleyball" don't collide
  // (both start with "women's").
  const jccGlance = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const results = (data?.jcc?.results ?? []).filter(r => new Date(r.date) >= sevenDaysAgo);
    const seen = new Set<string>();
    const out: JCCResult[] = [];
    for (const r of results) {
      const key = r.sport.toLowerCase();
      if (!seen.has(key)) { seen.add(key); out.push(r); }
    }
    return out;
  }, [data]);

  // JCC next game per sport (soonest upcoming per unique sport)
  const jccNextBySport = useMemo(() => {
    const upcomingList = data?.jcc?.upcoming ?? [];
    const seen = new Set<string>();
    const out: JCCUpcoming[] = [];
    for (const u of upcomingList) {
      const key = u.sport.toLowerCase();
      if (!seen.has(key)) { seen.add(key); out.push(u); }
    }
    return out;
  }, [data]);

  // Compact NEXT list — max 3 rows. Local (JCC) first, then regional
  // favorites (BUF/CLE/PIT) over farther teams, then whatever's soonest.
  const nextCompactItems = useMemo((): NextUpItem[] => {
    if (nextUpItems.length === 0 && jccNextBySport.length === 0) return [];
    if (nextUpItems[0]?.isLive) {
      // Plain array order would let one league with several teams playing
      // at once (e.g. 5 MLB games simultaneously) fill every slot before a
      // league with fewer tracked teams (e.g. NFL) ever gets a turn — so
      // interleave one game per league at a time instead of taking the
      // first N in push order.
      const bySport = new Map<string, NextUpItem[]>();
      for (const item of nextUpItems) {
        const key = item.sport.split('·').pop()?.trim() ?? item.sport;
        if (!bySport.has(key)) bySport.set(key, []);
        bySport.get(key)!.push(item);
      }
      const groups = [...bySport.values()];
      const interleaved: NextUpItem[] = [];
      for (let i = 0; interleaved.length < LIVE_COMPACT_CAP && groups.some(g => i < g.length); i++) {
        for (const g of groups) {
          if (i < g.length) interleaved.push(g[i]);
          if (interleaved.length >= LIVE_COMPACT_CAP) break;
        }
      }
      return interleaved;
    }

    // JCC is one candidate among many here, not pinned first — a JCC game
    // tomorrow shouldn't bump MLB games happening today. Straight
    // chronological sort across every source, live games only excepted.
    const candidates: NextUpItem[] = nextUpItems.filter(g => !g.isLive);

    if (jccNextBySport.length > 0) {
      const soonest = [...jccNextBySport].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
      const d = new Date(soonest.date);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      const dDay = new Date(d); dDay.setHours(0, 0, 0, 0);
      const dateLabel = dDay.getTime() === today.getTime() ? 'Today'
        : dDay.getTime() === tomorrow.getTime() ? 'Tomorrow'
        : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const isMidnight = d.getHours() === 0 && d.getMinutes() === 0;
      candidates.push({
        ts: d.getTime(),
        sport: `JCC · ${soonest.sport}`,
        emoji: sportEmoji(soonest.sport),
        matchup: `${soonest.isHome ? 'vs' : '@'} ${abbreviateOpponent(soonest.opponent)}`,
        dateLabel,
        time: isMidnight ? undefined : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        accent: ACC.jcc, gradStart: '', gradEnd: '',
        isJcc: true, externalLink: soonest.link,
      });
    }

    candidates.sort((a, b) => a.ts - b.ts);
    return candidates.slice(0, 3);
  }, [nextUpItems, jccNextBySport]);

  const innerCard = {
    borderRadius: 14, borderWidth: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    borderColor: dark.border,
    ...glassWeb,
  };

  if (showSkunksSchedule) {
    return (
      <ThemedBackground>
        <SafeAreaView edges={['top']} style={styles.header}>
          <TouchableOpacity onPress={() => setShowSkunksSchedule(false)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Ionicons name="chevron-back" size={18} color={ACC.skunks} />
            <Text style={[styles.subhead, { color: ACC.skunks }]}>Sports</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Tarp Skunks</Text>
          <Text style={styles.subhead}>2026 Schedule · PGCBL</Text>
        </SafeAreaView>
        <ScrollView contentContainerStyle={schedModal.list} showsVerticalScrollIndicator={false}>
          {SKUNKS_SCHEDULE.map((g, i) => {
            const d = new Date(g.date + 'T12:00:00');
            const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            const day   = d.getDate();
            const dow   = d.toLocaleDateString('en-US', { weekday: 'short' });
            return (
              <View key={i} style={[schedModal.row, i < SKUNKS_SCHEDULE.length - 1 && schedModal.rowBorder]}>
                <View style={schedModal.dateCol}>
                  <Text style={[schedModal.dateDay, { color: ACC.skunks }]}>{day}</Text>
                  <Text style={schedModal.dateMonth}>{month}</Text>
                </View>
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
      </ThemedBackground>
    );
  }

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

        {/* ── Featured — ad slot stays at the top, matching Visit/Events ── */}
        <SectionLabel label="Featured" />
        <SportsAdCTA onPress={() => setFeedbackOpen(true)} />

        {/* ── Local Teams — page subtitle already says "Local Teams ·
            Jamestown", so the section header names the place instead of
            repeating "Local Teams" right underneath it ───────────────── */}
        <SectionLabel label="Jamestown" />

        {/* Tarp Skunks — hidden once the season ends until next year's schedule is added */}
        {skunksSeasonActive && <TeamCard
          gradStart="rgba(132,204,22,0.22)"
          gradEnd="rgba(15,23,42,0.9)"
          iconContent={
            <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={require('../assets/tarpskunk.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
            </View>
          }
          name="Tarp Skunks"
          subtitle="PGCBL · Diethrick Park"
          defaultOpen={daysUntilSkunks <= 2}
          glassWeb={glassWeb}
          bgImage={Platform.OS === 'web' ? { uri: '/tspark.jpg' } : require('../assets/tspark.jpg')}
          glanceRow={
            nextSkunksAny ? (() => {
              const d = new Date(nextSkunksAny.date + 'T12:00:00');
              const dow = d.toLocaleDateString('en-US', { weekday: 'short' });
              const mon = d.toLocaleDateString('en-US', { month: 'short' });
              const day = d.getDate();
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={[styles.glanceText, { color: dark.text.muted }]}>Next {nextSkunksAny.isHome ? 'home' : 'away'}</Text>
                  <Text style={{ color: dark.text.subtle, fontSize: 10 }}>·</Text>
                  <Text style={[styles.glanceText, { color: ACC.skunks, fontWeight: '700' }]}>{dow} {mon} {day}</Text>
                </View>
              );
            })() : openingNightBadge ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Text style={[styles.glanceText, { color: ACC.skunks, fontWeight: '700' }]}>Opening Night</Text>
                <View style={{ backgroundColor: `${ACC.skunks}28`, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 }}>
                  <Text style={{ fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: ACC.skunks }}>{openingNightBadge}</Text>
                </View>
              </View>
            ) : (
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
            )
          }
        >
          {openingNightBadge && (
            <View style={styles.openingNightBanner}>
              <Ionicons name="star" size={13} color={ACC.skunks} />
              <View style={{ flex: 1 }}>
                <Text style={styles.openingNightTitle}>Opening Night Tailgate</Text>
                <Text style={styles.openingNightDetail}>Fri May 29 · Tailgate 5 PM · First pitch 6:30 PM · Fireworks after · vs. Olean Oilers</Text>
              </View>
            </View>
          )}

          {/* Next home game — featured */}
          {nextSkunksHome && (() => {
            const next = nextSkunksHome;
            const d   = new Date(next.date + 'T12:00:00');
            const dow = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
            const mon = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            const day = d.getDate();
            return (
              <>
                <Text style={[styles.innerLabel, { color: `${ACC.skunks}60` }]}>Next Home Game</Text>
                <View style={sk.nextHomeCard}>
                  <View style={sk.nextHomeDate}>
                    <Text style={sk.nextHomeDow}>{dow}</Text>
                    <Text style={sk.nextHomeDay} numberOfLines={1} adjustsFontSizeToFit>{day}</Text>
                    <Text style={sk.nextHomeMon}>{mon}</Text>
                  </View>
                  <View style={sk.nextHomeInfo}>
                    <Text style={sk.nextHomeTime}>{next.time}</Text>
                    <Text style={sk.nextHomeOpp}>vs. {next.opponent}</Text>
                    {next.promotion && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <Ionicons name="star-outline" size={10} color={`${ACC.skunks}70`} />
                        <Text style={sk.nextHomePromo}>{next.promotion}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </>
            );
          })()}

          {/* More home games */}
          {(() => {
            const more = SKUNKS_SCHEDULE.filter(g => g.isHome && g.date > (nextSkunksHome?.date ?? '')).slice(0, 4);
            if (!more.length) return null;
            return (
              <>
                <Text style={[styles.innerLabel, { color: `${ACC.skunks}60` }]}>More at Diethrick Park</Text>
                {/* @ts-ignore */}
                <View style={[innerCard, { padding: 0, overflow: 'hidden' }]}>
                  {more.map((game, i) => {
                    const d    = new Date(game.date + 'T12:00:00');
                    const dayN = d.toLocaleDateString('en-US', { day: 'numeric' });
                    const mon  = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                    return (
                      <View key={i} style={[styles.skunksRow, i < more.length - 1 && { borderBottomWidth: 1, borderBottomColor: dark.border }]}>
                        <View style={styles.skunksDateCol}>
                          <Text style={[styles.skunksDay, { color: ACC.skunks }]}>{dayN}</Text>
                          <Text style={styles.skunksMonth}>{mon}</Text>
                        </View>
                        <Text style={styles.skunksOpponent} numberOfLines={1}>{game.opponent}</Text>
                        {game.promotion
                          ? <Text style={[styles.skunksTime, { color: `${ACC.skunks}55`, flex: 1, textAlign: 'right' }]} numberOfLines={1}>{game.promotion}</Text>
                          : <Text style={[styles.skunksTime, { color: dark.text.subtle }]}>{game.time}</Text>
                        }
                      </View>
                    );
                  })}
                </View>
              </>
            );
          })()}

          {/* Single game pricing */}
          <Text style={[styles.innerLabel, { color: `${ACC.skunks}60` }]}>Single Game Tickets</Text>
          {/* @ts-ignore */}
          <View style={[innerCard, { padding: 12, gap: 8 }]}>
            <View style={styles.skunksPricingRow}>
              {[
                { section: 'Reserved',   adult: '$14', disc: '$13' },
                { section: 'Grandstand', adult: '$9',  disc: '$8'  },
                { section: 'Bleacher',   adult: '$6',  disc: '$5'  },
              ].map(tier => (
                <View key={tier.section} style={styles.skunksPriceTile}>
                  <Text style={styles.skunksPriceAdult}>{tier.adult}</Text>
                  <Text style={styles.skunksPriceSection}>{tier.section}</Text>
                  <Text style={styles.skunksPriceDisc}>{tier.disc} Sr/Mil/Child</Text>
                </View>
              ))}
            </View>
            <View style={styles.skunksBoxOfficeNote}>
              <Ionicons name="ticket-outline" size={12} color={`${ACC.skunks}60`} />
              <Text style={styles.skunksBoxOfficeText}>Box office only · Not available online</Text>
            </View>
          </View>

          {skunksNews.length > 0 && (
            <>
              <Text style={[styles.innerLabel, { color: `${ACC.skunks}60` }]}>News & Recaps</Text>
              {skunksNews.slice(0, 3).map((item, i) => {
                const ago = (() => {
                  const diff = Date.now() - new Date(item.pubDate).getTime();
                  const h = Math.floor(diff / 3_600_000);
                  const d = Math.floor(diff / 86_400_000);
                  if (h < 1) return 'Just now';
                  if (h < 24) return `${h}h ago`;
                  if (d < 7) return `${d}d ago`;
                  return new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                })();
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => openLink(item.link)}
                    activeOpacity={0.72}
                    style={[styles.skunksNewsRow, i < Math.min(skunksNews.length, 3) - 1 && { borderBottomWidth: 1, borderBottomColor: dark.border }]}
                  >
                    <View style={[styles.skunksNewsBar, { backgroundColor: ACC.skunks }]} />
                    <View style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12 }}>
                      <Text style={styles.skunksNewsTitle}>{item.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                        {item.source ? <Text style={styles.skunksNewsMeta}>{item.source}</Text> : null}
                        {item.source ? <Text style={styles.skunksNewsDot}>·</Text> : null}
                        <Text style={styles.skunksNewsMeta}>{ago}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.2)" style={{ alignSelf: 'center', marginRight: 10 }} />
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 16, paddingTop: 4 }}>
            <TouchableOpacity onPress={() => openLink('https://tarp-skunks-2026.vercel.app/')} activeOpacity={0.7}>
              <Text style={[styles.moreLinkText, { color: `${ACC.skunks}80` }]}>Fan Guide →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSkunksSchedule(true)} activeOpacity={0.7}>
              <Text style={[styles.moreLinkText, { color: ACC.skunks }]}>Full Schedule →</Text>
            </TouchableOpacity>
          </View>
        </TeamCard>}

        {/* JCC Jayhawks */}
        <TeamCard
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
          glanceRow={
            loading ? (
              <SkeletonPulse width="60%" height={14} borderRadius={4} accRGB="52,211,153" />
            ) : jccGlance.length > 0 ? (
              // Sport + record only — no result/score here. Stacking "W 2-0"
              // next to a bare "M 17-10" read as ambiguous score soup, and a
              // lone W/M glyph next to a win "W" was confusing.
              <View style={{ gap: 5 }}>
                {jccGlance.map((r, i) => {
                  const rec = data?.jcc?.records?.[r.sport];
                  const recLabel = rec ? `${rec.w}-${rec.l}` : '';
                  return (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 13 }}>{sportEmoji(r.sport)}</Text>
                      <Text style={[styles.glanceText, { color: dark.text.muted, flex: 1 }]} numberOfLines={1}>{r.sport}</Text>
                      {recLabel ? (
                        <Text style={[styles.glanceText, { color: ACC.jcc, fontWeight: '700' }]}>{recLabel}</Text>
                      ) : null}
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
                            <Text style={styles.jccGame} numberOfLines={1}>{u.isHome ? 'vs' : '@'} {abbreviateOpponent(u.opponent)}</Text>
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
              {(() => {
                // Group by sport — a flat mixed list reads as score soup;
                // grouping keeps each sport scannable on its own.
                const bySport = new Map<string, JCCResult[]>();
                for (const g of data!.jcc!.results) {
                  if (!bySport.has(g.sport)) bySport.set(g.sport, []);
                  bySport.get(g.sport)!.push(g);
                }
                const groups = [...bySport.entries()];
                return groups.map(([sport, results], gi) => (
                  <View key={sport} style={{ marginBottom: gi < groups.length - 1 ? 10 : 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Text style={styles.jccSportIcon}>{sportEmoji(sport)}</Text>
                      <Text style={[styles.jccGroupLabel, { color: dark.text.subtle }]}>{sport}</Text>
                    </View>
                    {/* @ts-ignore */}
                    <View style={[innerCard, { padding: 0, overflow: 'hidden' }]}>
                      {results.map((g, i) => {
                        const dateStr = new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        return (
                          <TouchableOpacity key={i} onPress={() => openLink(g.link)} activeOpacity={0.7}
                            style={[styles.jccRow, i < results.length - 1 && { borderBottomWidth: 1, borderBottomColor: dark.border }]}>
                            <Text style={[styles.jccResult, { color: g.won ? ACC.jcc : '#fb7185' }]}>{g.result}</Text>
                            <Text style={[styles.jccGame, { flex: 1 }]} numberOfLines={1}>{g.isHome ? 'vs' : '@'} {abbreviateOpponent(g.opponent)}</Text>
                            <Text style={[styles.jccScore, { color: g.won ? ACC.jcc : '#fb7185' }]}>{g.score}</Text>
                            <Text style={[styles.jccDate, { color: dark.text.subtle }]}>{dateStr}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ));
              })()}
              <TouchableOpacity onPress={() => Linking.openURL('https://jccjayhawks.com')} activeOpacity={0.7} style={styles.moreLink}>
                <Text style={[styles.moreLinkText, { color: `${ACC.jcc}70` }]}>Full schedule →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={{ fontFamily: 'Outfit', color: dark.text.subtle, fontSize: 13 }}>No recent results found.</Text>
          )}
        </TeamCard>

        {/* ── Next — compact, not a hero carousel ─────────────── */}
        {(loading || nextCompactItems.length > 0) && (
          <>
            <SectionLabel label={nextCompactItems[0]?.isLive ? 'Live Now' : 'Next'} />
            {loading ? (
              <SkeletonPulse width="100%" height={72} borderRadius={14} accRGB="34,211,238" />
            ) : (
              // @ts-ignore
              <View style={[styles.nextList, glassWeb]}>
                {nextCompactItems.map((item, idx) => (
                  <NextRow
                    key={idx}
                    item={item}
                    isLast={idx === nextCompactItems.length - 1}
                    onPress={() => {
                      if (item.isLive) return;
                      if (item.isJcc) {
                        if (item.externalLink) openLink(item.externalLink);
                        return;
                      }
                      const nonLive = nextUpItems.filter(g => !g.isLive);
                      const si = nonLive.findIndex(g => g.ts === item.ts);
                      setSheetCarouselIdx(si >= 0 ? si : 0);
                      setDetailGame(item);
                    }}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* ── Regional ────────────────────────────────────────── */}
        <SectionLabel label="Regional" />

        {/* Buffalo Sabres — hidden May–Sep (off-season); returns Oct for pre-season */}
        {(() => { const m = new Date().getMonth() + 1; return m < 5 || m > 9; })() && <TeamCard
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
        </TeamCard>}

        {/* MLB — all 5 tracked clubs shown as one flat list. Nothing behind
            a tap: with only 5 rows, splitting the face from an accordion
            body just made the card feel like it was hiding content. */}
        <TeamCard
          gradStart="rgba(167,139,250,0.22)"
          gradEnd="rgba(15,23,42,0.9)"
          iconContent={
            <View style={styles.leagueIconWrap}>
              <Image source={{ uri: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png' }} style={styles.leagueIconImg} resizeMode="contain" />
            </View>
          }
          iconSize={36}
          name="MLB"
          nameStyle={{ fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: ACC.mlb }}
          defaultOpen={false}
          hideChevron
          glassWeb={glassWeb}
          glanceRow={
            loading ? (
              <SkeletonPulse width="100%" height={140} borderRadius={8} accRGB="167,139,250" />
            ) : visibleMlb.length > 0 ? (
              <View style={{ gap: 10 }}>
                {['PIT', 'NYY', 'CLE', 'NYM', 'TOR'].map(abbr => {
                  const t = visibleMlb.find(x => x.abbr === abbr);
                  if (!t) return null;
                  const alreadyInNext = nextCompactItems.some(n => n.sport === `${t.name} · MLB`);
                  return (
                    <LeagueTeamRow
                      key={abbr}
                      logo={`https://a.espncdn.com/i/teamlogos/mlb/500/${abbr.toLowerCase()}.png`}
                      name={t.name}
                      line={t.liveGame ? `LIVE · ${t.liveGame.ourScore}–${t.liveGame.theirScore}` : mlbLastOrNext(t, alreadyInNext)}
                      lineColor={t.liveGame ? '#fb7185' : undefined}
                      record={t.inPostseason && t.seriesRecord ? t.seriesRecord : t.record}
                      recordColor="#f59e0b"
                      pill={t.inPostseason && t.postseasonRound ? t.postseasonRound : undefined}
                    />
                  );
                })}
                <TouchableOpacity onPress={() => Linking.openURL('https://www.mlb.com')} activeOpacity={0.7} style={[styles.moreLink, { paddingTop: 0 }]}>
                  <Text style={[styles.moreLinkText, { color: `${ACC.mlb}70` }]}>More on MLB.com →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ fontFamily: 'Outfit', color: dark.text.subtle, fontSize: 13 }}>No recent results found.</Text>
            )
          }
        />

        {/* NFL — same treatment: all 3 teams as one flat list, Bills first
            but no heavier than Steelers/Browns. */}
        <TeamCard
          gradStart="rgba(251,146,60,0.22)"
          gradEnd="rgba(15,23,42,0.9)"
          iconContent={
            <View style={styles.leagueIconWrap}>
              <Image source={{ uri: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png' }} style={styles.leagueIconImg} resizeMode="contain" />
            </View>
          }
          iconSize={36}
          name="NFL"
          nameStyle={{ fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: ACC.nfl }}
          defaultOpen={false}
          hideChevron
          glassWeb={glassWeb}
          glanceRow={
            loading ? (
              <SkeletonPulse width="100%" height={100} borderRadius={8} accRGB="251,146,60" />
            ) : (() => {
              const teams = ['BUF', 'PIT', 'CLE']
                .map(abbr => (data?.nfl ?? []).find(t => t.abbr === abbr))
                .filter((t): t is NFLTeam => !!t);
              if (teams.length === 0) return <Text style={[styles.glanceText, { color: dark.text.subtle }]}>No schedule data.</Text>;
              return (
                <View style={{ gap: 10 }}>
                  {teams.map(t => {
                    const s = nflTeamStatus(t);
                    return (
                      <LeagueTeamRow
                        key={t.abbr}
                        logo={t.logo}
                        name={t.name}
                        line={s.line}
                        lineColor={s.pillLive ? '#fb7185' : undefined}
                        record={s.record}
                        recordColor="#f59e0b"
                        pill={s.pill}
                        pillLive={s.pillLive}
                      />
                    );
                  })}
                  <TouchableOpacity onPress={() => Linking.openURL('https://www.espn.com/nfl/')} activeOpacity={0.7} style={[styles.moreLink, { paddingTop: 0 }]}>
                    <Text style={[styles.moreLinkText, { color: `${ACC.nfl}70` }]}>More on ESPN →</Text>
                  </TouchableOpacity>
                </View>
              );
            })()
          }
        />

      </ScrollView>

      {feedbackOpen && (
        <View style={styles.fullOverlay}>
          <FeedbackScreen
            onClose={() => setFeedbackOpen(false)}
            initialType="team"
            initialMessage="I'd like to reserve the Featured Team slot on Sports. "
          />
        </View>
      )}


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

const sk = StyleSheet.create({
  // Stat strip
  statStrip: {
    flexDirection: 'row',
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(132,204,22,0.15)',
    backgroundColor: 'rgba(132,204,22,0.06)',
    overflow: 'hidden',
  },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 13 },
  statCellBorder: { borderRightWidth: 1, borderRightColor: 'rgba(132,204,22,0.12)' },
  statValue: { fontFamily: 'Syne', fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  statLabel: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginTop: 3 },

  // Game scoreboard cards
  resultRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  resultWL:      { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  resultWLText:  { fontFamily: 'Syne', fontSize: 11, fontWeight: '800' },
  resultTeamUs:  { fontFamily: 'Syne', fontSize: 13, fontWeight: '700', color: '#fff', flex: 1 },
  resultScoreUs: { fontFamily: 'Syne', fontSize: 17, fontWeight: '800', letterSpacing: -0.5, width: 30, textAlign: 'right' },
  resultTeamThem:{ fontFamily: 'Outfit', fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.6)', flex: 1 },
  resultScoreThem:{ fontFamily: 'Syne', fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.45)', width: 30, textAlign: 'right' },
  resultDate:    { fontFamily: 'Outfit', fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.25)', letterSpacing: 0.4 },
  resultLoc:     { fontFamily: 'Outfit', fontSize: 8, fontWeight: '800', letterSpacing: 0.7 },

  // Next home game
  nextHomeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(132,204,22,0.4)',
    backgroundColor: 'rgba(132,204,22,0.07)',
    padding: 14,
  },
  nextHomeDate: { alignItems: 'center', width: 42 },
  nextHomeDow:  { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: `${ACC.skunks}90` },
  nextHomeDay:  { fontFamily: 'Syne', fontSize: 28, fontWeight: '800', color: ACC.skunks, lineHeight: 30, marginTop: 1 },
  nextHomeMon:  { fontFamily: 'Outfit', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.8, textTransform: 'uppercase' },
  nextHomeInfo: { flex: 1, gap: 2 },
  nextHomeTime: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: 0.5 },
  nextHomeOpp:  { fontFamily: 'Syne', fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  nextHomePromo:{ fontFamily: 'Outfit', fontSize: 10, color: `${ACC.skunks}70` },
  ticketBtn: {
    alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(132,204,22,0.13)',
    borderRadius: 11, borderWidth: 1, borderColor: 'rgba(132,204,22,0.32)',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  ticketBtnText: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', color: ACC.skunks },
});

const schedModal = StyleSheet.create({
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

// Uniform row language for league cards — MLB (5 teams) and NFL (3 teams)
// both fit entirely without paging or an expand tap, so every team gets the
// same weight: logo, name, one status line, trailing record/pill. No
// hero-vs-secondary hierarchy — with this few rows, differentiating one
// team just made the list read as incomplete.
const league = StyleSheet.create({
  row:            { flexDirection: 'row', alignItems: 'center', gap: 10 },
  // White backing behind every logo — some team marks (Yankees navy "NY",
  // etc.) are nearly invisible directly on the dark card background.
  rowLogoWrap:    { width: 30, height: 30, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 3 },
  rowLogo:        { width: '100%', height: '100%' },
  rowName:        { fontFamily: 'Outfit', fontSize: 13, fontWeight: '700', color: '#fff' },
  rowLine:        { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  rowRecord:      { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  statusPill:     { borderWidth: 1, borderColor: `${ACC.nfl}40`, backgroundColor: `${ACC.nfl}18`, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statusPillLive: { borderColor: 'rgba(251,113,133,0.4)', backgroundColor: 'rgba(251,113,133,0.12)' },
  statusPillText: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '800', letterSpacing: 0.6, color: ACC.nfl },
});

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 40, zIndex: 10 },
  title:   { fontFamily: 'Syne', fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  subhead: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', marginTop: 4, letterSpacing: 1.5, textTransform: 'uppercase', color: ACC.label },
  content: { padding: 16, paddingTop: 8, paddingBottom: 40, gap: 10 },
  fullOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 600, flex: 1 },

  // Official league mark (MLB/NFL) on a white backing — same reason as
  // team logos: league marks aren't designed to sit on a dark gradient.
  leagueIconWrap: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 3 },
  leagueIconImg:  { width: '100%', height: '100%' },

  // Section labels
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 6, paddingHorizontal: 2 },
  sectionLabel:    { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase', color: ACC.label },

  // Next — compact list (News/City Services chrome, not a hero card)
  nextList: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(30,41,59,0.8)',
    backgroundColor: 'rgba(15,23,42,0.4)',
    overflow: 'hidden',
  },
  nextRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  nextRowStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  nextRowEmoji: { fontSize: 16, width: 20, textAlign: 'center' },
  nextRowSport: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  nextRowMatchup: { fontFamily: 'DMSans_700Bold', fontSize: 13, color: '#fff', marginTop: 2 },
  nextRowDate: { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600', color: dark.text.primary },
  nextRowTime: { fontFamily: 'Outfit', fontSize: 11, color: dark.text.muted, marginTop: 1 },

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
  jccGroupLabel: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },

  // Opening Night banner
  openingNightBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 12, borderWidth: 1, padding: 12,
    backgroundColor: 'rgba(132,204,22,0.08)', borderColor: 'rgba(132,204,22,0.3)',
  },
  openingNightTitle: { fontFamily: 'Syne', fontSize: 13, fontWeight: '700', color: '#84cc16', lineHeight: 17 },
  openingNightDetail:{ fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, lineHeight: 15 },

  // Single game pricing
  skunksPricingRow:   { flexDirection: 'row', gap: 8 },
  skunksPriceTile:    { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(132,204,22,0.07)', borderWidth: 1, borderColor: 'rgba(132,204,22,0.15)' },
  skunksPriceAdult:   { fontFamily: 'Syne', fontSize: 18, fontWeight: '700', color: '#84cc16', lineHeight: 22 },
  skunksPriceSection: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  skunksPriceDisc:    { fontFamily: 'Outfit', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1, textAlign: 'center' },
  skunksBoxOfficeNote:{ flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center' },
  skunksBoxOfficeText:{ fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.3)' },

  // Tarp Skunks news rows
  skunksNewsRow:   { flexDirection: 'row', alignItems: 'stretch', backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border, borderRadius: 12, overflow: 'hidden', marginBottom: 6 },
  skunksNewsBar:   { width: 3, flexShrink: 0 },
  skunksNewsTitle: { fontFamily: 'Syne', fontSize: 13, fontWeight: '700', color: '#fff', lineHeight: 18, letterSpacing: -0.1 },
  skunksNewsMeta:  { fontFamily: 'Outfit', fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  skunksNewsDot:   { fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.2)' },

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

  playoffsBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  playoffsBadgeText: { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },

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
