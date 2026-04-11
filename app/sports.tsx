import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform,
  TouchableOpacity, Linking, Image, Animated, Easing, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse } from '../components/SkeletonPulse';
import { useTheme } from '../lib/ThemeContext';
import { openLink } from '../lib/openLink';

interface GameResult {
  date: string; status: 'final' | 'live' | 'upcoming';
  opponentAbbr: string; opponentName: string; opponentLogo: string;
  ourScore: string; theirScore: string; isHome: boolean;
  won: boolean | null; venue: string; broadcast: string;
}
interface Scorer { name: string; position: string; goals: number; assists: number; points: number; headshot: string; }
interface JCCResult { date: string; sport: string; opponent: string; isHome: boolean; result: string; score: string; won: boolean; link: string; }
interface MLBGame     { date: string; opponent: string; ourScore: number; theirScore: number; isHome: boolean; won: boolean; }
interface MLBNextGame { date: string; gameTime?: string | null; opponent: string; isHome: boolean; }
interface MLBTeam     { id: number; name: string; abbr: string; record?: string; games: MLBGame[]; nextGame?: MLBNextGame | null; }
interface SabresData {
  record: string; standing: string; points?: number;
  wins?: number; losses?: number; otLosses?: number;
  recentGame?: GameResult; nextGame?: GameResult;
  topScorers?: Scorer[]; jcc?: JCCResult[]; mlb?: MLBTeam[]; news: any[];
}
const SABRES_ID   = '7';
const SABRES_LOGO = 'https://a.espncdn.com/i/teamlogos/nhl/500/buf.png';
const SABRES_ESPN = 'https://www.espn.com/nhl/team/_/name/buf/buffalo-sabres';
const JCC_LOGO    = require('../assets/jcc.png');

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
// Used by the web API route (/api/sabres).
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

// Transforms an NHL API v1 game (used on native — different shape from ESPN).
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
    // NHL API returns SVG logos which React Native can't render — use ESPN PNG CDN instead
    const opponentLogo = abbrev
      ? `https://a.espncdn.com/i/teamlogos/nhl/500/${abbrev.toLowerCase()}.png`
      : '';
    return {
      date: g.startTimeUTC ?? g.gameDate ?? '',
      status,
      opponentAbbr: abbrev || '???',
      opponentName: them.placeName?.default ?? abbrev ?? 'Opponent',
      opponentLogo,
      ourScore, theirScore,
      isHome: weAreHome,
      won,
      venue: g.venue?.default ?? '',
      broadcast: '',
    };
  } catch { return null; }
}

// Fetch regional MLB recent results
async function fetchMLB(): Promise<MLBTeam[]> {
  try {
    if (Platform.OS === 'web') {
      const res = await fetch('/api/mlb');
      if (!res.ok) return [];
      const json = await res.json();
      return (json.teams ?? []) as MLBTeam[];
    }
    // Native: call MLB Stats API directly
    const MLB_TEAMS = [
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

    // Standings for records
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
        const url  = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${t.id}&gameType=R&startDate=${fmt(start)}&endDate=${fmt(end)}&fields=dates,date,games,status,detailedState,gameDate,teams,away,home,team,id,name,score,isWinner`;
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
            } else if (!nextGame && (state === 'Scheduled' || state === 'Pre-Game')) {
              const weAreHome = g.teams?.home?.team?.id === t.id;
              const them = weAreHome ? g.teams?.away : g.teams?.home;
              nextGame = { date: dateObj.date, gameTime: g.gameDate ?? null, opponent: them?.team?.name ?? '???', isHome: weAreHome };
            }
          }
        }
        return { ...t, games: games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5), nextGame, record: standingsMap[t.id] ?? '' };
      } catch { return { ...t, games: [], nextGame: null, record: '' }; }
    }));
    return results;
  } catch { return []; }
}

// Fetch JCC results directly from their RSS feed (native only — no CORS restriction)
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
      // Precompiled regexes — avoids dynamic RegExp construction (ReDoS risk)
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

async function fetchSabres(): Promise<SabresData> {
  if (Platform.OS === 'web') {
    const [sabresRes, mlbRes] = await Promise.all([
      fetch('/api/sabres'),
      fetchMLB(),
    ]);
    if (!sabresRes.ok) throw new Error('Sabres API failed');
    const json = await sabresRes.json();
    return { record: json.record ?? '', standing: json.standing ?? '', recentGame: json.recentGame, nextGame: json.nextGame, topScorers: json.topScorers ?? [], jcc: json.jcc ?? [], mlb: mlbRes, news: [] };
  }
  const [schedRes, standRes, statsRes, jcc, mlb] = await Promise.all([
    fetch('https://api-web.nhle.com/v1/club-schedule-season/BUF/now'),
    fetch('https://api-web.nhle.com/v1/standings/now'),
    fetch('https://api-web.nhle.com/v1/club-stats/BUF/now'),
    fetchJCCNative(),
    fetchMLB(),
  ]);
  const schedJson = await schedRes.json();
  const standJson = standRes.ok ? await standRes.json() : null;
  const statsJson = statsRes.ok ? await statsRes.json() : null;
  // Build record from standings (more reliable than schedJson.team.record)
  const bufStanding = standJson?.standings?.find((t: any) => t.teamAbbrev?.default === 'BUF');
  const wins    = bufStanding?.wins     ?? 0;
  const losses  = bufStanding?.losses   ?? 0;
  const otLosses = bufStanding?.otLosses ?? 0;
  const points  = bufStanding?.points   ?? 0;
  const record  = bufStanding ? `${wins}-${losses}-${otLosses}` : '';
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
  return { record, standing, points, wins, losses, otLosses, recentGame: past[0] ? parseNHLGame(past[0]) ?? undefined : undefined, nextGame: upcoming[0] ? parseNHLGame(upcoming[0]) ?? undefined : undefined, topScorers, jcc, mlb, news: [] };
}

function TeamSection({ id, logo, name, subtitle, children, acc, accRGB, glassWeb }: {
  id: string; logo: string | number; name: string; subtitle?: string;
  children: React.ReactNode; acc: string; accRGB: string; glassWeb: any;
}) {
  const [open, setOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const rot = useRef(new Animated.Value(0)).current;

  function toggle() {
    Animated.timing(rot, { toValue: open ? 0 : 1, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.ease) }).start();
    setOpen(v => !v);
  }

  const chevronStyle = { transform: [{ rotate: rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] };
  const rowStyle = { borderRadius: 18, borderWidth: 1, backgroundColor: open ? `rgba(${accRGB},0.08)` : `rgba(${accRGB},0.04)`, borderColor: `rgba(${accRGB},${open ? '0.28' : '0.14'})`, ...glassWeb };

  return (
    // @ts-ignore
    <View style={[{ overflow: 'hidden' }, rowStyle]}>
      {/* Header row — always visible */}
      <TouchableOpacity onPress={toggle} activeOpacity={0.7} style={styles.teamRow}>
        {!logoError ? (
          <Image source={typeof logo === 'string' ? { uri: logo } : logo} style={styles.teamRowLogo} resizeMode="contain" onError={() => setLogoError(true)} />
        ) : (
          <View style={[styles.teamRowLogo, { borderRadius: 22, backgroundColor: `rgba(${accRGB},0.12)`, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="trophy-outline" size={20} color={acc} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.teamRowName, { color: open ? acc : '#fff' }]}>{name}</Text>
          {subtitle ? <Text style={[styles.teamRowSub, { color: `rgba(${accRGB},0.7)` }]}>{subtitle}</Text> : null}
        </View>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={18} color={`rgba(${accRGB},0.5)`} />
        </Animated.View>
      </TouchableOpacity>

      {/* Expandable content */}
      {open && (
        <View style={[styles.teamContent, { borderTopColor: `rgba(${accRGB},0.1)` }]}>
          {children}
        </View>
      )}
    </View>
  );
}

function GameCard({ game, label, acc, accRGB, glassStyle }: { game: GameResult; label: string; acc: string; accRGB: string; glassStyle: any }) {
  const d = new Date(game.date);
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = game.status === 'upcoming' ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : game.status === 'live' ? 'LIVE' : 'Final';
  const resultColor = game.won === true ? '#2FBF71' : game.won === false ? '#ef4444' : acc;
  return (
    // @ts-ignore
    <View style={[styles.gameCard, glassStyle]}>
      <Text style={[styles.gameLabel, { color: `rgba(${accRGB},0.5)` }]}>{label.toUpperCase()}</Text>
      <View style={styles.gameRow}>
        <View style={styles.oppLogoWrap}><Image source={{ uri: game.opponentLogo }} style={styles.oppLogo} resizeMode="contain" /></View>
        <View style={styles.gameCenter}>
          <Text style={styles.matchup}>{game.isHome ? `BUF vs ${game.opponentAbbr}` : `BUF @ ${game.opponentAbbr}`}</Text>
          <Text style={styles.opponentName}>{game.opponentName}</Text>
          {game.venue ? <Text style={[styles.venue, { color: `rgba(${accRGB},0.4)` }]}>{game.venue}</Text> : null}
          {game.broadcast ? <Text style={[styles.broadcast, { color: `rgba(${accRGB},0.35)` }]}>{game.broadcast}</Text> : null}
        </View>
        <View style={styles.gameRight}>
          {game.status !== 'upcoming' ? <Text style={[styles.score, { color: resultColor }]}>{game.ourScore}–{game.theirScore}</Text> : null}
          <Text style={[styles.gameTime, { color: game.status === 'live' ? '#2FBF71' : `rgba(${accRGB},0.6)`, fontWeight: game.status === 'live' ? '700' : '500' }]}>{timeStr}</Text>
          <Text style={[styles.gameDate, { color: `rgba(${accRGB},0.35)` }]}>{dateStr}</Text>
        </View>
      </View>
    </View>
  );
}

export default function SportsScreen() {
  const { theme } = useTheme();
  const [data, setData]           = useState<SabresData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mlbTeam, setMlbTeam]     = useState<string>('CLE');

  const glassWeb = Platform.OS === 'web' ? { backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' } : {};
  const innerCard = { borderRadius: 14, borderWidth: 1, backgroundColor: `rgba(${theme.accRGB},0.07)`, borderColor: `rgba(${theme.accRGB},0.18)`, ...glassWeb };

  useEffect(() => {
    fetchSabres().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    try { const d = await fetchSabres(); setData(d); } catch {}
    setRefreshing(false);
  }

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.title}>Sports</Text>
        <Text style={[styles.subhead, { color: theme.acc55 }]}>Local teams · Jamestown</Text>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.acc}
            colors={[theme.acc]}
          />
        }
      >

        {/* ── Tarp Skunks card ──────────────────────── */}
        <View style={{ borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,180,80,0.2)', overflow: 'hidden' }}>
          <LinearGradient
            colors={['rgba(0,80,40,0.4)', 'rgba(0,212,200,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Radial glow orb */}
            <View
              pointerEvents="none"
              // @ts-ignore
              style={[{ position: 'absolute', width: 120, height: 120, borderRadius: 60, top: -30, right: -30, backgroundColor: 'rgba(0,200,80,0.15)' }, Platform.OS === 'web' ? { filter: 'blur(30px)' } : {}]}
            />
          {/* Header row */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => Linking.openURL('https://www.jamestowntarpskunks.com')}
            style={[styles.skunksBanner]}
          >
            <Text style={styles.skunksEmoji}>⚾</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.skunksTitle, { color: theme.acc2 }]}>Tarp Skunks 2026</Text>
              <Text style={styles.skunksSub}>Perfect Game Collegiate League · Diethrick Park</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={`rgba(${theme.acc2RGB},0.4)`} />
          </TouchableOpacity>

          {/* Upcoming home games */}
          <View style={[styles.skunksScheduleHeader, { borderTopColor: `rgba(${theme.acc2RGB},0.1)` }]}>
            <Text style={[styles.skunksScheduleLabel, { color: `rgba(${theme.acc2RGB},0.5)` }]}>UPCOMING HOME GAMES</Text>
          </View>
          {[
            { month: 'MAY', day: '29', opponent: 'vs. Olean Oilers',          time: '6:30 PM' },
            { month: 'JUN', day: '2',  opponent: 'vs. Olean Oilers',          time: '6:30 PM' },
            { month: 'JUN', day: '9',  opponent: 'vs. Olean Oilers',          time: '11:00 AM' },
          ].map((game, i, arr) => (
            <View
              key={i}
              style={[
                styles.skunksGameRow,
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
              ]}
            >
              <View style={styles.skunksDateCol}>
                <Text style={[styles.skunksDay, { color: theme.acc2 }]}>{game.day}</Text>
                <Text style={styles.skunksMonth}>{game.month}</Text>
              </View>
              <Text style={styles.skunksGameOpponent}>{game.opponent}</Text>
              <Text style={[styles.skunksGameTime, { color: `rgba(${theme.acc2RGB},0.45)` }]}>{game.time}</Text>
            </View>
          ))}
          </LinearGradient>
        </View>

        {/* ── Buffalo Sabres ─────────────────────────── */}
        <TeamSection
          id="sabres" logo={SABRES_LOGO}
          name="Buffalo Sabres"
          subtitle={data?.record ? `${data.record}${data.standing ? ` · ${data.standing}` : ''}` : undefined}
          acc={theme.acc} accRGB={theme.accRGB} glassWeb={glassWeb}
        >
          {loading ? (
            <View style={{ gap: 8 }}>
              <SkeletonPulse width="100%" height={90} borderRadius={14} accRGB={theme.accRGB} />
              <SkeletonPulse width="100%" height={90} borderRadius={14} accRGB={theme.accRGB} />
            </View>
          ) : (
            <>
              {/* 4-column stat grid */}
              {(data?.wins != null || data?.record) && (() => {
                // Parse record "W-L-OTL" if individual fields not set
                const parts = (data?.record ?? '').split('-');
                const w   = data?.wins     ?? parseInt(parts[0] ?? '0');
                const l   = data?.losses   ?? parseInt(parts[1] ?? '0');
                const otl = data?.otLosses ?? parseInt(parts[2] ?? '0');
                const pts = data?.points   ?? 0;
                const stats = [
                  { label: 'W',   value: String(w) },
                  { label: 'L',   value: String(l) },
                  { label: 'OTL', value: String(otl) },
                  { label: 'PTS', value: String(pts) },
                ];
                return (
                  <View style={styles.statGrid}>
                    {stats.map((s) => (
                      <View key={s.label} style={styles.statGridCell}>
                        <Text style={[styles.statGridLabel, { color: `rgba(${theme.accRGB},0.45)` }]}>{s.label}</Text>
                        <Text style={[styles.statGridValue, { color: s.label === 'PTS' ? theme.acc : '#fff' }]}>{s.value}</Text>
                      </View>
                    ))}
                  </View>
                );
              })()}

              {(data?.recentGame || data?.nextGame) && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {data?.recentGame && (
                    // @ts-ignore
                    <View style={[innerCard, { flex: 1, padding: 12 }]}>
                      <Text style={{ fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>Last Game</Text>
                      <Text style={{ fontFamily: 'Syne', fontSize: 14, fontWeight: '800', color: '#fff' }}>
                        BUF {data.recentGame.ourScore} · {data.recentGame.opponentAbbr} {data.recentGame.theirScore}
                      </Text>
                      <Text style={{ fontFamily: 'Outfit', fontSize: 12, marginTop: 4, color: data.recentGame.won === true ? theme.acc : data.recentGame.won === false ? '#ef4444' : 'rgba(255,255,255,0.4)' }}>
                        {data.recentGame.won === true ? 'Win' : data.recentGame.won === false ? 'Loss' : 'Final'}
                      </Text>
                    </View>
                  )}
                  {data?.nextGame && (
                    // @ts-ignore
                    <View style={[innerCard, { flex: 1, padding: 12, borderColor: `rgba(${theme.accRGB},0.3)` }]}>
                      <Text style={{ fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>Next Game</Text>
                      <Text style={{ fontFamily: 'Syne', fontSize: 14, fontWeight: '800', color: '#fff' }}>
                        {data.nextGame.isHome ? 'vs' : '@'} {data.nextGame.opponentAbbr}
                      </Text>
                      <Text style={{ fontFamily: 'Outfit', fontSize: 12, marginTop: 4, color: 'rgba(255,255,255,0.4)' }}>
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
                  <Text style={[styles.innerLabel, { color: `rgba(${theme.accRGB},0.5)` }]}>TOP SCORERS</Text>
                  {/* @ts-ignore */}
                  <View style={[innerCard, { padding: 0, overflow: 'hidden' }]}>
                    <View style={[styles.scorerRow, { borderBottomWidth: 1, borderBottomColor: `rgba(${theme.accRGB},0.12)`, paddingTop: 10 }]}>
                      <Text style={[styles.scorerName, { color: `rgba(${theme.accRGB},0.4)`, fontSize: 9, letterSpacing: 1 }]}>PLAYER</Text>
                      <Text style={[styles.scorerStat, { color: `rgba(${theme.accRGB},0.4)`, fontSize: 9 }]}>G</Text>
                      <Text style={[styles.scorerStat, { color: `rgba(${theme.accRGB},0.4)`, fontSize: 9 }]}>A</Text>
                      <Text style={[styles.scorerStat, { color: `rgba(${theme.accRGB},0.4)`, fontSize: 9 }]}>PTS</Text>
                    </View>
                    {data.topScorers.map((p, i) => (
                      <View key={p.name} style={[styles.scorerRow, i < data.topScorers!.length - 1 && { borderBottomWidth: 1, borderBottomColor: `rgba(${theme.accRGB},0.07)` }]}>
                        <View style={styles.scorerLeft}>
                          {p.headshot ? <Image source={{ uri: p.headshot }} style={styles.scorerHeadshot} resizeMode="cover" /> : null}
                          <View><Text style={styles.scorerName}>{p.name}</Text><Text style={[styles.scorerPos, { color: `rgba(${theme.accRGB},0.4)` }]}>{p.position}</Text></View>
                        </View>
                        <Text style={styles.scorerStat}>{p.goals}</Text>
                        <Text style={styles.scorerStat}>{p.assists}</Text>
                        <Text style={[styles.scorerStat, { color: theme.acc, fontWeight: '700' }]}>{p.points}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              <TouchableOpacity onPress={() => Linking.openURL(SABRES_ESPN)} activeOpacity={0.7} style={styles.moreLink}>
                <Text style={[styles.moreLinkText, { color: `rgba(${theme.accRGB},0.4)` }]}>More on ESPN →</Text>
              </TouchableOpacity>
            </>
          )}
        </TeamSection>

        {/* ── JCC Jayhawks ───────────────────────────── */}
        <TeamSection
          id="jcc" logo={JCC_LOGO}
          name="JCC Jayhawks"
          subtitle="Jamestown Community College · NJCAA"
          acc={theme.acc2} accRGB={theme.acc2RGB} glassWeb={glassWeb}
        >
          {loading ? (
            <SkeletonPulse width="100%" height={200} borderRadius={14} accRGB={theme.acc2RGB} />
          ) : data?.jcc && data.jcc.length > 0 ? (
            // @ts-ignore
            <View style={[innerCard, { padding: 0, overflow: 'hidden', borderColor: `rgba(${theme.acc2RGB},0.18)` }]}>
              {data.jcc.map((g, i) => {
                const d = new Date(g.date);
                const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const resultColor = g.won ? '#2FBF71' : '#ef4444';
                return (
                  <TouchableOpacity key={i} onPress={() => openLink(g.link)} activeOpacity={0.7}
                    style={[styles.jccRow, i < data.jcc!.length - 1 && { borderBottomWidth: 1, borderBottomColor: `rgba(${theme.acc2RGB},0.08)` }]}>
                    <Text style={[styles.jccResult, { color: resultColor }]}>{g.result}</Text>
                    <Text style={styles.jccSportIcon}>{sportEmoji(g.sport)}</Text>
                    <View style={styles.jccCenter}>
                      <Text style={styles.jccGame}>{g.isHome ? 'vs' : '@'} {g.opponent}</Text>
                      <Text style={[styles.jccSport, { color: `rgba(${theme.acc2RGB},0.45)` }]}>{g.sport}</Text>
                    </View>
                    <View style={styles.jccRight}>
                      <Text style={[styles.jccScore, { color: resultColor }]}>{g.score}</Text>
                      <Text style={[styles.jccDate, { color: `rgba(${theme.acc2RGB},0.35)` }]}>{dateStr}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={{ fontFamily: 'Outfit', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No recent results found.</Text>
          )}
        </TeamSection>

        {/* ── Regional MLB ───────────────────────────── */}
        {(() => {
          const activeTeam = data?.mlb?.find(t => t.abbr === mlbTeam);
          const teamLogoUri = `https://a.espncdn.com/i/teamlogos/mlb/500/${mlbTeam.toLowerCase()}.png`;
          return (
            <TeamSection
              id="mlb"
              logo="https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png"
              name="Regional Major League Baseball"
              subtitle="Guardians · Blue Jays · Pirates · Yankees"
              acc={theme.acc3} accRGB={theme.acc3RGB} glassWeb={glassWeb}
            >
              {loading ? (
                <SkeletonPulse width="100%" height={200} borderRadius={14} accRGB={theme.acc3RGB} />
              ) : (
                <>
                  {/* Team selector tabs with logos */}
                  <View style={styles.mlbTabs}>
                    {(data?.mlb ?? []).map(t => {
                      const active = t.abbr === mlbTeam;
                      return (
                        <TouchableOpacity
                          key={t.abbr}
                          onPress={() => setMlbTeam(t.abbr)}
                          activeOpacity={0.7}
                          style={[
                            styles.mlbTab,
                            active
                              ? { backgroundColor: `rgba(${theme.acc3RGB},0.18)`, borderColor: `rgba(${theme.acc3RGB},0.4)` }
                              : { borderColor: `rgba(${theme.acc3RGB},0.12)` },
                          ]}
                        >
                          <Image
                            source={{ uri: `https://a.espncdn.com/i/teamlogos/mlb/500/${t.abbr.toLowerCase()}.png` }}
                            style={styles.mlbTabLogo}
                            resizeMode="contain"
                          />
                          <View>
                            <Text style={[styles.mlbTabText, { color: active ? theme.acc3 : 'rgba(255,255,255,0.55)' }]}>{t.abbr}</Text>
                            {t.record ? <Text style={[styles.mlbTabRecord, { color: active ? `rgba(${theme.acc3RGB},0.7)` : 'rgba(255,255,255,0.35)' }]}>{t.record}</Text> : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Next game */}
                  {activeTeam?.nextGame && (() => {
                    const ng = activeTeam.nextGame!;
                    const dateStr = new Date(ng.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    const timeStr = ng.gameTime ? new Date(ng.gameTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
                    return (
                      // @ts-ignore
                      <View style={[innerCard, { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }]}>
                        <Text style={[styles.innerLabel, { color: `rgba(${theme.acc3RGB},0.4)`, margin: 0 }]}>NEXT</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: 'Outfit', fontSize: 13, fontWeight: '700', color: '#fff' }}>
                            {ng.isHome ? 'vs' : '@'} {ng.opponent}
                          </Text>
                          <Text style={{ fontFamily: 'Outfit', fontSize: 10, color: `rgba(${theme.acc3RGB},0.4)`, marginTop: 2 }}>
                            {dateStr}{timeStr ? ` · ${timeStr}` : ''}
                          </Text>
                        </View>
                      </View>
                    );
                  })()}

                  {/* Recent results */}
                  {activeTeam && activeTeam.games.length > 0 ? (
                    // @ts-ignore
                    <View style={[innerCard, { padding: 0, overflow: 'hidden', borderColor: `rgba(${theme.acc3RGB},0.18)` }]}>
                      {activeTeam.games.map((g, i) => {
                        const dateStr = new Date(g.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const resultColor = g.won ? '#2FBF71' : '#ef4444';
                        return (
                          <View key={i} style={[styles.jccRow, i < activeTeam.games.length - 1 && { borderBottomWidth: 1, borderBottomColor: `rgba(${theme.acc3RGB},0.08)` }]}>
                            <Text style={[styles.jccResult, { color: resultColor }]}>{g.won ? 'W' : 'L'}</Text>
                            <Text style={styles.jccSportIcon}>⚾</Text>
                            <View style={styles.jccCenter}>
                              <Text style={styles.jccGame}>{g.isHome ? 'vs' : '@'} {g.opponent}</Text>
                            </View>
                            <View style={styles.jccRight}>
                              <Text style={[styles.jccScore, { color: resultColor }]}>{g.ourScore}-{g.theirScore}</Text>
                              <Text style={[styles.jccDate, { color: `rgba(${theme.acc3RGB},0.35)` }]}>{dateStr}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={{ fontFamily: 'Outfit', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No recent results found.</Text>
                  )}

                  <TouchableOpacity onPress={() => Linking.openURL('https://www.mlb.com')} activeOpacity={0.7} style={styles.moreLink}>
                    <Text style={[styles.moreLinkText, { color: `rgba(${theme.acc3RGB},0.4)` }]}>More on MLB.com →</Text>
                  </TouchableOpacity>
                </>
              )}
            </TeamSection>
          );
        })()}

        <Text style={[styles.source, { color: `rgba(${theme.accRGB},0.2)` }]}>Sabres via NHL · JCC via jccjayhawks.com · MLB via MLB Stats API</Text>
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 40, zIndex: 10 },
  title: { fontFamily: 'Syne', fontSize: 21, fontWeight: '700', color: '#fff' },
  subhead: { fontFamily: 'Outfit', fontSize: 11, marginTop: 3, letterSpacing: 1 },
  content: { padding: 16, paddingTop: 8, paddingBottom: 40, gap: 12 },

  // Tarp Skunks banner
  skunksBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  skunksEmoji: { fontSize: 22 },
  skunksTitle: { fontFamily: 'Syne', fontSize: 14, fontWeight: '700' },
  skunksSub: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  // Team section
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  teamRowLogo: { width: 44, height: 44 },
  teamRowName: { fontFamily: 'Syne', fontSize: 14, fontWeight: '700' },
  teamRowSub: { fontFamily: 'Outfit', fontSize: 11, marginTop: 2 },
  teamContent: { borderTopWidth: 1, padding: 12, gap: 10 },
  innerLabel: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', paddingLeft: 2 },
  moreLink: { alignItems: 'flex-end', paddingTop: 4 },
  moreLinkText: { fontFamily: 'Outfit', fontSize: 11 },

  // Game card
  gameCard: { padding: 16 },
  gameLabel: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 12 },
  gameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  oppLogoWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  oppLogo: { width: 46, height: 46 },
  gameCenter: { flex: 1, gap: 3 },
  matchup: { fontFamily: 'Syne', fontSize: 14, fontWeight: '700', color: '#fff' },
  opponentName: { fontFamily: 'Outfit', fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  venue: { fontFamily: 'Outfit', fontSize: 11 },
  broadcast: { fontFamily: 'Outfit', fontSize: 11 },
  gameRight: { alignItems: 'flex-end', gap: 3 },
  score: { fontFamily: 'Syne', fontSize: 20, fontWeight: '800' },
  gameTime: { fontFamily: 'Outfit', fontSize: 12 },
  gameDate: { fontFamily: 'Outfit', fontSize: 10 },

  // Top scorers
  scorerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  scorerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  scorerHeadshot: { width: 30, height: 30, borderRadius: 15 },
  scorerName: { fontFamily: 'Outfit', fontSize: 13, fontWeight: '600', color: '#fff', flex: 1 },
  scorerPos: { fontFamily: 'Outfit', fontSize: 10 },
  scorerStat: { fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.7)', width: 34, textAlign: 'center' },

  // JCC
  jccRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  jccResult: { fontFamily: 'Outfit', fontSize: 14, fontWeight: '800', width: 22, textAlign: 'center' },
  jccSportIcon: { fontSize: 17, width: 24, textAlign: 'center' },
  jccCenter: { flex: 1, gap: 2 },
  jccGame: { fontFamily: 'Outfit', fontSize: 13, fontWeight: '600', color: '#fff' },
  jccSport: { fontFamily: 'Outfit', fontSize: 10 },
  jccRight: { alignItems: 'flex-end', gap: 2 },
  jccScore: { fontFamily: 'Outfit', fontSize: 13, fontWeight: '700' },
  jccDate: { fontFamily: 'Outfit', fontSize: 10 },

  source: { fontFamily: 'Outfit', fontSize: 10, textAlign: 'center' },

  // MLB team tabs
  mlbTabs:      { flexDirection: 'row', gap: 8, marginBottom: 10 },
  mlbTab:       { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  mlbTabLogo:   { width: 22, height: 22 },
  mlbTabText:   { fontFamily: 'Outfit', fontSize: 12, fontWeight: '700' },
  mlbTabRecord: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '600' },

  // Stat grid
  statGrid: { flexDirection: 'row', gap: 6 },
  statGridCell: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12, padding: 10 },
  statGridLabel: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  statGridValue: { fontFamily: 'Syne', fontSize: 16, fontWeight: '800' },

  // Tarp Skunks schedule
  skunksScheduleHeader: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  skunksScheduleLabel: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  skunksGameRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  skunksDateCol: { width: 44, alignItems: 'center' },
  skunksDay: { fontFamily: 'Syne', fontSize: 16, fontWeight: '700', lineHeight: 18 },
  skunksMonth: { fontFamily: 'Outfit', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.8, textTransform: 'uppercase' },
  skunksGameOpponent: { fontFamily: 'Outfit', flex: 1, fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  skunksGameTime: { fontFamily: 'Outfit', fontSize: 11 },
});
