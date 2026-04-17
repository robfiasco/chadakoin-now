import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform,
  TouchableOpacity, Linking, Image, Animated, Easing, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse } from '../components/SkeletonPulse';
import { PulsingDot } from '../components/PulsingDot';
import { dark } from '../lib/colors';
import { openLink } from '../lib/openLink';

// ─── Types ────────────────────────────────────────────────────────────────────
interface GameResult {
  date: string; status: 'final' | 'live' | 'upcoming';
  opponentAbbr: string; opponentName: string; opponentLogo: string;
  ourScore: string; theirScore: string; isHome: boolean;
  won: boolean | null; venue: string; broadcast: string;
}
interface Scorer { name: string; position: string; goals: number; assists: number; points: number; headshot: string; }
interface JCCResult { date: string; sport: string; opponent: string; isHome: boolean; result: string; score: string; won: boolean; link: string; }
interface MLBGame     { date: string; opponent: string; ourScore: number; theirScore: number; isHome: boolean; won: boolean; }
interface MLBNextGame { date: string; gameTime?: string | null; opponent: string; opponentAbbr?: string; isHome: boolean; }
interface MLBTeam     { id: number; name: string; abbr: string; record?: string; games: MLBGame[]; nextGame?: MLBNextGame | null; }
interface PlayoffSeries {
  round: number; roundLabel: string;
  opponent: string; bufWins: number; oppWins: number; neededToWin: number;
}
interface SabresData {
  record: string; standing: string; points?: number;
  wins?: number; losses?: number; otLosses?: number;
  recentGame?: GameResult; nextGame?: GameResult;
  topScorers?: Scorer[]; jcc?: JCCResult[]; mlb?: MLBTeam[];
  playoffSeries?: PlayoffSeries | null;
  news: any[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SABRES_ID   = '7';
const SABRES_LOGO = 'https://a.espncdn.com/i/teamlogos/nhl/500/buf.png';
const SABRES_ESPN = 'https://www.espn.com/nhl/team/_/name/buf/buffalo-sabres';
const JCC_LOGO    = require('../assets/jcc.png');

const ACC = {
  jcc:    '#34d399',  // emerald-400
  skunks: '#84cc16',  // lime-500
  sabres: '#60a5fa',  // blue-400
  mlb:    '#a78bfa',  // violet-400
  label:  '#22d3ee',  // cyan-400 — section headers
} as const;

const SKUNKS_SCHEDULE = [
  { month: 'MAY', day: '29', dayOfWeek: 'Thu', opponent: 'vs. Olean Oilers', time: '6:30 PM' },
  { month: 'JUN', day: '2',  dayOfWeek: 'Mon', opponent: 'vs. Olean Oilers', time: '6:30 PM' },
  { month: 'JUN', day: '9',  dayOfWeek: 'Mon', opponent: 'vs. Olean Oilers', time: '11:00 AM' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
      opponentLogo: them.team?.logo ?? '',
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
      const res = await fetch('/api/mlb');
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

    let standingsMap: Record<number, string> = {};
    try {
      const sRes  = await fetch(`https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${year}&standingsTypes=regularSeason&fields=records,teamRecords,team,id,wins,losses`);
      const sJson = sRes.ok ? await sRes.json() : null;
      for (const div of (sJson?.records ?? [])) {
        for (const tr of (div.teamRecords ?? [])) {
          if (tr.team?.id != null) standingsMap[tr.team.id] = `${tr.wins}-${tr.losses}`;
        }
      }
    } catch {}

    const results = await Promise.all(MLB_TEAMS.map(async t => {
      try {
        const url  = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${t.id}&gameType=R&startDate=${fmt(start)}&endDate=${fmt(end)}&fields=dates,date,games,status,detailedState,gameDate,teams,away,home,team,id,name,abbreviation,score,isWinner`;
        const res  = await fetch(url);
        if (!res.ok) return { ...t, games: [], nextGame: null, record: standingsMap[t.id] ?? '' };
        const json = await res.json();
        const games: MLBGame[] = [];
        let nextGame: MLBNextGame | null = null;
        for (const dateObj of (json.dates ?? [])) {
          for (const g of (dateObj.games ?? [])) {
            const state = g.status?.detailedState ?? '';
            if (state === 'Final' || state === 'Completed Early') {
              const weAreHome = g.teams?.home?.team?.id === t.id;
              const us   = weAreHome ? g.teams.home : g.teams.away;
              const them = weAreHome ? g.teams.away : g.teams.home;
              games.push({ date: dateObj.date, opponent: them?.team?.name ?? '???', ourScore: us?.score ?? 0, theirScore: them?.score ?? 0, isHome: weAreHome, won: us?.isWinner === true });
            } else if (!nextGame && (state === 'Scheduled' || state === 'Pre-Game' || state === 'Warmup')) {
              const weAreHome = g.teams?.home?.team?.id === t.id;
              const them = weAreHome ? g.teams?.away : g.teams?.home;
              // Use gameDate for exact time; fall back to noon to avoid floating day games to end of day
              nextGame = { date: dateObj.date, gameTime: g.gameDate ?? null, opponent: them?.team?.name ?? '???', opponentAbbr: them?.team?.abbreviation ?? '', isHome: weAreHome };
            }
          }
        }
        return { ...t, games: games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5), nextGame, record: standingsMap[t.id] ?? '' };
      } catch { return { ...t, games: [], nextGame: null, record: '' }; }
    }));
    return results;
  } catch { return []; }
}

async function fetchJCCNative(): Promise<JCCResult[]> {
  try {
    const res = await fetch('https://jccjayhawks.com/composite?print=rss');
    if (!res.ok) return [];
    const text = await res.text();
    const items: JCCResult[] = [];
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
      if (!score || score.trim() === '' || date >= new Date()) continue;
      const parts = score.split(',').map((s: string) => s.trim());
      const wl = parts[0];
      const final = parts[1] ?? '';
      if (final === '0-0') continue;
      const opponentClean = opponent
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/^(at|vs\.?)\s*/i, '');
      items.push({ date: date.toISOString(), sport: category, opponent: opponentClean, isHome: !opponent.toLowerCase().startsWith('at '), result: wl, score: final, won: wl === 'W', link });
    }
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  } catch { return []; }
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
    const [sabresRes, mlbRes] = await Promise.all([fetch('/api/sabres'), fetchMLB()]);
    if (!sabresRes.ok) throw new Error('Sabres API failed');
    const json = await sabresRes.json();
    return { record: json.record ?? '', standing: json.standing ?? '', recentGame: json.recentGame, nextGame: json.nextGame, topScorers: json.topScorers ?? [], jcc: json.jcc ?? [], mlb: mlbRes, playoffSeries: json.playoffSeries ?? null, news: [] };
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
  return { record, standing, points, wins, losses, otLosses, recentGame: past[0] ? parseNHLGame(past[0]) ?? undefined : undefined, nextGame: upcoming[0] ? parseNHLGame(upcoming[0]) ?? undefined : undefined, topScorers, jcc, mlb, playoffSeries, news: [] };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={styles.sectionLabel}>{label}</Text>
  );
}

function TeamCard({
  accentColor, gradStart, gradEnd, iconContent,
  name, subtitle, glanceRow, children,
  defaultOpen = false, glassWeb,
}: {
  accentColor: string; gradStart: string; gradEnd: string;
  iconContent: React.ReactNode;
  name: string; subtitle: string;
  glanceRow: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  glassWeb: any;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rot = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  function toggle() {
    Animated.timing(rot, { toValue: open ? 0 : 1, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.ease) }).start();
    setOpen(v => !v);
  }

  const chevronRotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    // @ts-ignore
    <View style={[styles.teamCard, glassWeb]}>
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

      {/* Glance row — always visible */}
      <View style={styles.glanceRow}>{glanceRow}</View>

      {/* Expanded section */}
      {open && children && (
        <View style={[styles.teamCardExpanded, { borderTopColor: dark.border }]}>
          {children}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SportsScreen() {
  const [data, setData]           = useState<SabresData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedMlbAbbr, setExpandedMlbAbbr] = useState<string | null>(null);

  const glassWeb = Platform.OS === 'web'
    ? { backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }
    : {};

  useEffect(() => {
    fetchSabres().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    try { const d = await fetchSabres(); setData(d); } catch {}
    setRefreshing(false);
  }

  // Compute nearest upcoming game for "Next Up" hero
  const nextUp = useMemo(() => {
    if (!data) return null;
    type C = { ts: number; sport: string; emoji: string; matchup: string; dateLabel: string; time?: string; gradStart: string; gradEnd: string; accent: string; ourLogoUrl?: string; oppLogoUrl?: string; };
    const candidates: C[] = [];
    const now = new Date();

    if (data.nextGame) {
      const d = new Date(data.nextGame.date);
      if (d > now) {
        candidates.push({
          ts: d.getTime(),
          sport: 'Buffalo Sabres · NHL',
          emoji: '🏒',
          matchup: `BUF ${data.nextGame.isHome ? 'vs' : '@'} ${data.nextGame.opponentAbbr}`,
          dateLabel: '',
          time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          accent: ACC.sabres,
          gradStart: 'rgba(96,165,250,0.28)',
          gradEnd: 'rgba(6,14,24,0.7)',
          ourLogoUrl: SABRES_LOGO,
          oppLogoUrl: data.nextGame.opponentLogo || undefined,
        });
      }
    }
    for (const team of (data.mlb ?? [])) {
      if (team.nextGame) {
        const ng = team.nextGame;
        const d = ng.gameTime ? new Date(ng.gameTime) : new Date(ng.date + 'T12:00:00');
        if (d > now) {
          candidates.push({
            ts: d.getTime(),
            sport: `${team.name} · MLB`,
            emoji: '⚾',
            matchup: `${team.abbr} ${ng.isHome ? 'vs' : '@'} ${ng.opponent.split(' ').pop()}`,
            dateLabel: '',
            time: ng.gameTime ? new Date(ng.gameTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : undefined,
            accent: ACC.mlb,
            gradStart: 'rgba(167,139,250,0.28)',
            gradEnd: 'rgba(6,14,24,0.7)',
            ourLogoUrl: `https://a.espncdn.com/i/teamlogos/mlb/500/${team.abbr.toLowerCase()}.png`,
            oppLogoUrl: ng.opponentAbbr ? `https://a.espncdn.com/i/teamlogos/mlb/500/${ng.opponentAbbr.toLowerCase()}.png` : undefined,
          });
        }
      }
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.ts - b.ts);
    const c = { ...candidates[0] };
    const cd = new Date(c.ts);
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const cDay = new Date(cd); cDay.setHours(0,0,0,0);
    c.dateLabel = cDay.getTime() === today.getTime() ? 'Today'
      : cDay.getTime() === tomorrow.getTime() ? 'Tomorrow'
      : cd.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return c;
  }, [data]);

  // Days until Tarp Skunks season opens
  const daysUntilSkunks = useMemo(() => {
    const open = new Date('2026-05-29T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    return Math.max(0, Math.ceil((open.getTime() - today.getTime()) / 86400000));
  }, []);

  // JCC glance: last 2 results across different sports
  const jccGlance = useMemo(() => {
    const results = data?.jcc ?? [];
    const seen = new Set<string>();
    const out: typeof results = [];
    for (const r of results) {
      const key = r.sport.toLowerCase().split(' ')[0];
      if (!seen.has(key)) { seen.add(key); out.push(r); }
      if (out.length >= 2) break;
    }
    // Fall back to last 2 if no distinct sports
    return out.length > 0 ? out : results.slice(0, 2);
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
    return { abbr: best.team.abbr, opp: ng.opponent.split(' ').pop(), oppAbbr: ng.opponentAbbr ?? '', isHome: ng.isHome, dateLabel, timeStr };
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

        {/* ── Next Up hero ────────────────────────────────────── */}
        {(loading || nextUp) && (
          <View style={styles.nextUpSection}>
            <View style={styles.sectionLabelRow}>
              <PulsingDot color="#fb7185" size={6} />
              <Text style={styles.sectionLabel}>Next Up</Text>
            </View>

            {loading ? (
              <SkeletonPulse width="100%" height={112} borderRadius={18} accRGB="34,211,238" />
            ) : nextUp ? (
              // @ts-ignore
              <View style={[styles.nextUpCard, glassWeb]}>
                <LinearGradient
                  colors={[nextUp.gradStart, nextUp.gradEnd] as [string, string]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.nextUpHeader}
                >
                  {/* Logo matchup fills the header when both logos are available */}
                  {(nextUp.ourLogoUrl && nextUp.oppLogoUrl) ? (
                    <View style={styles.nextUpLogoRow}>
                      <Image source={{ uri: nextUp.ourLogoUrl }} style={styles.nextUpHeaderLogo} resizeMode="contain" />
                      <LinearGradient
                        colors={[nextUp.gradEnd, nextUp.gradStart, nextUp.gradEnd] as any}
                        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                        style={styles.nextUpVsDivider}
                      >
                        <Text style={[styles.nextUpVsText, { color: nextUp.accent }]}>
                          {nextUp.matchup.includes('@') ? '@' : 'vs'}
                        </Text>
                      </LinearGradient>
                      <Image source={{ uri: nextUp.oppLogoUrl }} style={styles.nextUpHeaderLogo} resizeMode="contain" />
                    </View>
                  ) : (
                    <Text style={styles.nextUpBgEmoji} aria-hidden>{nextUp.emoji}</Text>
                  )}
                  <View style={[styles.nextUpPill, { borderColor: `${nextUp.accent}40` }]}>
                    <Text style={[styles.nextUpPillText, { color: nextUp.accent }]}>{nextUp.sport}</Text>
                  </View>
                </LinearGradient>
                <View style={styles.nextUpBody}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nextUpMatchup}>{nextUp.matchup}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Text style={{ fontFamily: 'Outfit', fontSize: 12, fontWeight: '600', color: dark.text.primary }}>{nextUp.dateLabel}</Text>
                      {nextUp.time && (
                        <>
                          <Text style={{ color: dark.text.subtle, fontSize: 11 }}>·</Text>
                          <Text style={{ fontFamily: 'Outfit', fontSize: 12, color: dark.text.muted }}>{nextUp.time}</Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              </View>
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
          glanceRow={
            loading ? (
              <SkeletonPulse width="60%" height={14} borderRadius={4} accRGB="52,211,153" />
            ) : jccGlance.length > 0 ? (
              <View style={{ gap: 5 }}>
                {jccGlance.map((r, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 14 }}>{sportEmoji(r.sport)}</Text>
                    <Text style={[styles.glanceText, { color: dark.text.muted }]}>{r.sport.split(' ')[0]}</Text>
                    <Text style={{ color: dark.text.subtle, fontSize: 11 }}>·</Text>
                    <Text style={[styles.glanceText, { color: r.won ? ACC.jcc : '#fb7185', fontWeight: '700' }]}>
                      {r.won ? 'W' : 'L'} {r.score}
                    </Text>
                    <Text style={{ color: dark.text.subtle, fontSize: 11 }}>·</Text>
                    <Text style={[styles.glanceText, { color: dark.text.subtle }]}>{r.isHome ? 'vs' : '@'} {r.opponent}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.glanceText, { color: dark.text.subtle }]}>No recent results</Text>
            )
          }
        >
          {loading ? (
            <SkeletonPulse width="100%" height={180} borderRadius={12} accRGB="52,211,153" />
          ) : data?.jcc && data.jcc.length > 0 ? (
            <>
              <Text style={[styles.innerLabel, { color: `${ACC.jcc}80` }]}>Recent Results</Text>
              {/* @ts-ignore */}
              <View style={[innerCard, { padding: 0, overflow: 'hidden' }]}>
                {data.jcc.map((g, i) => {
                  const dateStr = new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <TouchableOpacity key={i} onPress={() => openLink(g.link)} activeOpacity={0.7}
                      style={[styles.jccRow, i < data.jcc!.length - 1 && { borderBottomWidth: 1, borderBottomColor: `${dark.border}` }]}>
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
          iconContent={<Text style={{ fontSize: 22 }}>⚾</Text>}
          name="Tarp Skunks"
          subtitle="PGCBL · Diethrick Park"
          defaultOpen={false}
          glassWeb={glassWeb}
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
            {SKUNKS_SCHEDULE.map((game, i) => (
              <View key={i} style={[styles.skunksRow, i < SKUNKS_SCHEDULE.length - 1 && { borderBottomWidth: 1, borderBottomColor: dark.border }]}>
                <View style={styles.skunksDateCol}>
                  <Text style={[styles.skunksDay, { color: ACC.skunks }]}>{game.day}</Text>
                  <Text style={styles.skunksMonth}>{game.month}</Text>
                </View>
                <Text style={styles.skunksOpponent}>{game.opponent}</Text>
                <Text style={[styles.skunksTime, { color: dark.text.subtle }]}>{game.time}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.jamestowntarpskunks.com')} activeOpacity={0.7} style={styles.moreLink}>
            <Text style={[styles.moreLinkText, { color: `${ACC.skunks}70` }]}>jamestowntarpskunks.com →</Text>
          </TouchableOpacity>
        </TeamCard>

        {/* ── Regional ────────────────────────────────────────── */}
        <SectionLabel label="Regional" />

        {/* Buffalo Sabres */}
        <TeamCard
          accentColor={ACC.sabres}
          gradStart="rgba(96,165,250,0.22)"
          gradEnd="rgba(15,23,42,0.9)"
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
              {/* Last / Next 2-col grid */}
              {(data?.recentGame || data?.nextGame) && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {data?.recentGame && (
                    // @ts-ignore
                    <View style={[innerCard, { flex: 1, padding: 12 }]}>
                      <Text style={[styles.innerLabel, { color: dark.text.subtle }]}>Last Game</Text>
                      <Text style={{ fontFamily: 'Syne', fontSize: 14, fontWeight: '800', color: '#fff', marginTop: 6 }}>
                        BUF {data.recentGame.ourScore} · {data.recentGame.opponentAbbr} {data.recentGame.theirScore}
                      </Text>
                      <Text style={{ fontFamily: 'Outfit', fontSize: 11, marginTop: 4, color: data.recentGame.won === true ? ACC.jcc : data.recentGame.won === false ? '#fb7185' : dark.text.subtle }}>
                        {data.recentGame.won === true ? 'Win' : data.recentGame.won === false ? 'Loss' : 'Final'}
                      </Text>
                    </View>
                  )}
                  {data?.nextGame && (
                    // @ts-ignore
                    <View style={[innerCard, { flex: 1, padding: 12, borderColor: `${ACC.sabres}40` }]}>
                      <Text style={[styles.innerLabel, { color: ACC.sabres }]}>Next Game</Text>
                      <Text style={{ fontFamily: 'Syne', fontSize: 14, fontWeight: '800', color: '#fff', marginTop: 6 }}>
                        {data.nextGame.isHome ? 'vs' : '@'} {data.nextGame.opponentAbbr}
                      </Text>
                      <Text style={{ fontFamily: 'Outfit', fontSize: 11, marginTop: 4, color: dark.text.muted }}>
                        {new Date(data.nextGame.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' · '}{new Date(data.nextGame.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    </View>
                  )}
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
          subtitle="NYM · CLE · TOR · PIT · NYY"
          defaultOpen={false}
          glassWeb={glassWeb}
          glanceRow={
            loading ? (
              <SkeletonPulse width="65%" height={14} borderRadius={4} accRGB="167,139,250" />
            ) : mlbNextUp ? (
              <View style={styles.mlbMatchup}>
                {/* Left logo + gradient */}
                <Image
                  source={{ uri: `https://a.espncdn.com/i/teamlogos/mlb/500/${mlbNextUp.abbr.toLowerCase()}.png` }}
                  style={styles.mlbMatchupLogo}
                  resizeMode="contain"
                />
                <LinearGradient
                  colors={['rgba(167,139,250,0.18)', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.mlbMatchupGradL}
                  pointerEvents="none"
                />
                {/* Center info */}
                <View style={styles.mlbMatchupCenter}>
                  <Text style={styles.mlbMatchupGame}>
                    {mlbNextUp.abbr} {mlbNextUp.isHome ? 'vs' : '@'} {mlbNextUp.opp}
                  </Text>
                  <Text style={[styles.mlbMatchupMeta, { color: dark.text.subtle }]}>
                    {mlbNextUp.dateLabel}{mlbNextUp.timeStr ? ` · ${mlbNextUp.timeStr}` : ''}
                  </Text>
                </View>
                {/* Right gradient + logo */}
                <LinearGradient
                  colors={['transparent', 'rgba(167,139,250,0.18)']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.mlbMatchupGradR}
                  pointerEvents="none"
                />
                {mlbNextUp.oppAbbr ? (
                  <Image
                    source={{ uri: `https://a.espncdn.com/i/teamlogos/mlb/500/${mlbNextUp.oppAbbr.toLowerCase()}.png` }}
                    style={styles.mlbMatchupLogo}
                    resizeMode="contain"
                  />
                ) : null}
              </View>
            ) : (
              <Text style={[styles.glanceText, { color: dark.text.subtle }]}>No upcoming games found</Text>
            )
          }
        >
          {loading ? (
            <SkeletonPulse width="100%" height={160} borderRadius={12} accRGB="167,139,250" />
          ) : (data?.mlb ?? []).length > 0 ? (
            <>
              {/* @ts-ignore */}
              <View style={[innerCard, { padding: 0, overflow: 'hidden' }]}>
                {(data?.mlb ?? []).map((t, i) => {
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
                        <Image
                          source={{ uri: `https://a.espncdn.com/i/teamlogos/mlb/500/${t.abbr.toLowerCase()}.png` }}
                          style={styles.mlbLogo}
                          resizeMode="contain"
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mlbTeamName}>{t.name}</Text>
                          {nextStr ? <Text style={[styles.mlbNext, { color: dark.text.subtle }]}>{nextStr}</Text> : null}
                        </View>
                        {t.record ? <Text style={[styles.mlbRecord, { color: dark.text.muted }]}>{t.record}</Text> : null}
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
                          )}
                          {t.games.length > 0 && (
                            <>
                              <Text style={[styles.mlbExpandLabel, { color: dark.text.subtle, marginTop: ng ? 10 : 0, marginBottom: 6 }]}>Last {t.games.length} Games</Text>
                              {t.games.map((g, gi) => {
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
                          )}
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
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 40, zIndex: 10 },
  title:   { fontFamily: 'Syne', fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  subhead: { fontFamily: 'Outfit', fontSize: 11, marginTop: 4, letterSpacing: 1.5, textTransform: 'uppercase', color: ACC.label },
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
  nextUpHeader: { height: 110, overflow: 'hidden', justifyContent: 'flex-end', padding: 12 },
  nextUpBgEmoji: { position: 'absolute', right: -8, bottom: -16, fontSize: 90, opacity: 0.08 },
  nextUpLogoRow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
  },
  nextUpHeaderLogo: { width: 64, height: 64, flexShrink: 0 },
  nextUpVsDivider: { flex: 1, height: 1, alignItems: 'center', justifyContent: 'center' },
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
  nextUpMatchup: { fontFamily: 'Syne', fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },

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
  mlbLogo:     { width: 28, height: 28 },
  mlbTeamName: { fontFamily: 'Outfit', fontSize: 13, fontWeight: '600', color: '#fff' },
  mlbNext:     { fontFamily: 'Outfit', fontSize: 10, marginTop: 1 },
  mlbRecord:   { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600' },

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
});
