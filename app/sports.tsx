import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform,
  TouchableOpacity, Linking, Image, Animated, Easing, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse } from '../components/SkeletonPulse';
import { useTheme } from '../lib/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────

interface GameResult {
  date: string; status: 'final' | 'live' | 'upcoming';
  opponentAbbr: string; opponentName: string; opponentLogo: string;
  ourScore: string; theirScore: string; isHome: boolean;
  won: boolean | null; venue: string; broadcast: string;
}
interface Scorer { name: string; position: string; goals: number; assists: number; points: number; headshot: string; }
interface JCCResult { date: string; sport: string; opponent: string; isHome: boolean; result: string; score: string; won: boolean; link: string; }
interface SabresData {
  record: string; standing: string;
  recentGame?: GameResult; nextGame?: GameResult;
  topScorers?: Scorer[]; jcc?: JCCResult[]; news: any[];
}

const SABRES_ID   = '7';
const SABRES_LOGO = 'https://a.espncdn.com/i/teamlogos/nhl/500/buf.png';
const SABRES_ESPN = 'https://www.espn.com/nhl/team/_/name/buf/buffalo-sabres';
const JCC_LOGO    = 'https://jccjayhawks.com/images/setup/logo-jayhawk.png';

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

// ─── Fetch ────────────────────────────────────────────────────────

// Transforms an ESPN-format game event into our GameResult shape.
// Used by the web API route (/api/sabres); the native path uses the NHL API directly.
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
      const get = (tag: string) => {
        const r = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`);
        const match = r.exec(block);
        return match ? (match[1] ?? match[2] ?? '').trim() : '';
      };
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
    const res = await fetch('/api/sabres');
    if (!res.ok) throw new Error('Sabres API failed');
    const json = await res.json();
    return { record: json.record ?? '', standing: json.standing ?? '', recentGame: json.recentGame, nextGame: json.nextGame, topScorers: json.topScorers ?? [], jcc: json.jcc ?? [], news: [] };
  }
  const [schedRes, standRes, statsRes, jcc] = await Promise.all([
    fetch('https://api-web.nhle.com/v1/club-schedule-season/BUF/now'),
    fetch('https://api-web.nhle.com/v1/standings/now'),
    fetch('https://api-web.nhle.com/v1/club-stats/BUF/now'),
    fetchJCCNative(),
  ]);
  const schedJson = await schedRes.json();
  const standJson = standRes.ok ? await standRes.json() : null;
  const statsJson = statsRes.ok ? await statsRes.json() : null;
  const record = schedJson.team?.record?.items?.[0]?.summary ?? '';
  const standing = standJson?.standings?.find((t: any) => t.teamAbbrev?.default === 'BUF')?.divisionName ?? '';
  const games: any[] = schedJson.games ?? [];
  const now = new Date();
  const past = games.filter((g: any) => g.gameState === 'FINAL' || g.gameState === 'OFF').sort((a: any, b: any) => new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime());
  const upcoming = games.filter((g: any) => (g.gameState === 'FUT' || g.gameState === 'PRE') && new Date(g.startTimeUTC) >= now).sort((a: any, b: any) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime());
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
  return { record, standing, recentGame: past[0] ? parseGame(past[0]) ?? undefined : undefined, nextGame: upcoming[0] ? parseGame(upcoming[0]) ?? undefined : undefined, topScorers, jcc, news: [] };
}

// ─── Collapsible Team Section ─────────────────────────────────────

function TeamSection({ id, logo, name, subtitle, children, acc, accRGB, glassWeb }: {
  id: string; logo: string; name: string; subtitle?: string;
  children: React.ReactNode; acc: string; accRGB: string; glassWeb: any;
}) {
  const [open, setOpen] = useState(false);
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
        <Image source={{ uri: logo }} style={styles.teamRowLogo} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.teamRowName, { color: open ? acc : '#fff' }]}>{name}</Text>
          {subtitle ? <Text style={[styles.teamRowSub, { color: `rgba(${accRGB},0.5)` }]}>{subtitle}</Text> : null}
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

// ─── Game card ────────────────────────────────────────────────────

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

// ─── Sports Screen ────────────────────────────────────────────────

export default function SportsScreen() {
  const { theme } = useTheme();
  const [data, setData]       = useState<SabresData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

        {/* ── Tarp Skunks banner ────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => Linking.openURL('https://www.jamestowntarpskunks.com/sports/bsb/2024-25/releases/202501232it6bg')}
          // @ts-ignore
          style={[styles.skunksBanner, {
            borderRadius: 16, borderWidth: 1,
            backgroundColor: `rgba(${theme.acc2RGB},0.1)`,
            borderColor: `rgba(${theme.acc2RGB},0.3)`,
            ...glassWeb,
          }]}
        >
          <Text style={styles.skunksEmoji}>⚾</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.skunksTitle, { color: theme.acc2 }]}>Tarp Skunks 2026</Text>
            <Text style={styles.skunksSub}>Season tickets on sale · Diethrick Park</Text>
          </View>
          <Ionicons name="ticket-outline" size={18} color={`rgba(${theme.acc2RGB},0.5)`} />
        </TouchableOpacity>

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
              {data?.recentGame && <GameCard game={data.recentGame} label="Last Game" acc={theme.acc} accRGB={theme.accRGB} glassStyle={innerCard} />}
              {data?.nextGame   && <GameCard game={data.nextGame}   label="Next Game" acc={theme.acc} accRGB={theme.accRGB} glassStyle={{ ...innerCard, borderColor: `rgba(${theme.accRGB},0.3)` }} />}

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
          subtitle="Jamestown Community College"
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
                  <TouchableOpacity key={i} onPress={() => g.link && Linking.openURL(g.link)} activeOpacity={0.7}
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

        <Text style={[styles.source, { color: `rgba(${theme.accRGB},0.2)` }]}>Sabres via NHL · JCC via jccjayhawks.com</Text>
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
  teamRowName: { fontFamily: 'Syne', fontSize: 15, fontWeight: '700' },
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
});
