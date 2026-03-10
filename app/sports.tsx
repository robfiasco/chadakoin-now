import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform,
  TouchableOpacity, Linking, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse } from '../components/SkeletonPulse';
import { useTheme } from '../lib/ThemeContext';

const SABRES_ID = '7';
const SABRES_LOGO = 'https://a.espncdn.com/i/teamlogos/nhl/500/buf.png';
const SABRES_ESPN = 'https://www.espn.com/nhl/team/_/name/buf/buffalo-sabres';

interface GameResult {
  date: string;
  status: 'final' | 'live' | 'upcoming';
  opponentAbbr: string;
  opponentName: string;
  opponentLogo: string;
  ourScore: string;
  theirScore: string;
  isHome: boolean;
  won: boolean | null;
  venue: string;
  broadcast: string;
}

interface SabresData {
  record: string;
  standing: string;
  recentGame?: GameResult;
  nextGame?: GameResult;
  news: { title: string; link: string; date: string; summary: string }[];
}

function parseGame(event: any): GameResult | null {
  try {
    const comp = event.competitions?.[0];
    if (!comp) return null;
    const competitors: any[] = comp.competitors ?? [];
    const us   = competitors.find(c => String(c.team?.id) === SABRES_ID);
    const them = competitors.find(c => String(c.team?.id) !== SABRES_ID);
    if (!us || !them) return null;

    const status: GameResult['status'] = comp.status?.type?.completed
      ? 'final'
      : comp.status?.type?.state === 'in'
      ? 'live'
      : 'upcoming';

    return {
      date: event.date,
      status,
      opponentAbbr: them.team?.abbreviation ?? '???',
      opponentName: them.team?.displayName ?? 'Opponent',
      opponentLogo: them.team?.logo ?? `https://a.espncdn.com/i/teamlogos/nhl/500/${them.team?.abbreviation?.toLowerCase()}.png`,
      ourScore:   us.score   ?? '—',
      theirScore: them.score ?? '—',
      isHome: us.homeAway === 'home',
      won: status === 'final' ? (us.winner === true) : null,
      venue: comp.venue?.fullName ?? '',
      broadcast: comp.broadcasts?.[0]?.names?.[0] ?? '',
    };
  } catch {
    return null;
  }
}

async function fetchSabres(): Promise<SabresData> {
  if (Platform.OS === 'web') {
    // On web: use our Vercel API endpoint (server-side, no CORS)
    const res = await fetch('/api/sabres');
    if (!res.ok) throw new Error('Sabres API failed');
    const json = await res.json();
    return {
      record:      json.record ?? '',
      standing:    json.standing ?? '',
      recentGame:  json.recentGame ?? undefined,
      nextGame:    json.nextGame ?? undefined,
      news:        json.news ?? [],
    };
  }

  // On native: call ESPN directly (no CORS restriction)
  const [schedRes, newsRes] = await Promise.all([
    fetch('https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams/buf/schedule'),
    fetch('https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams/buf/news'),
  ]);

  const schedJson = await schedRes.json();
  const newsJson  = newsRes.ok ? await newsRes.json() : { articles: [] };

  const record   = schedJson.team?.record?.items?.[0]?.summary ?? '';
  const standing = schedJson.team?.standingSummary ?? '';
  const events: any[] = schedJson.events ?? [];
  const now = new Date();

  const past = events
    .filter(e => e.competitions?.[0]?.status?.type?.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const upcoming = events
    .filter(e => !e.competitions?.[0]?.status?.type?.completed && new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const news = (newsJson.articles ?? []).slice(0, 5).map((a: any) => ({
    title: a.headline ?? '',
    link:  a.links?.web?.href ?? '',
    date:  a.published ?? '',
    summary: a.description ?? '',
  }));

  return {
    record,
    standing,
    recentGame: past[0]     ? (parseGame(past[0])     ?? undefined) : undefined,
    nextGame:   upcoming[0] ? (parseGame(upcoming[0]) ?? undefined) : undefined,
    news,
  };
}

// ─── Game card ────────────────────────────────────────────────────

function GameCard({ game, label, acc, accRGB, glassStyle }: {
  game: GameResult; label: string; acc: string; accRGB: string; glassStyle: any;
}) {
  const d = new Date(game.date);
  const dateStr  = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr  = game.status === 'upcoming'
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : game.status === 'live' ? 'LIVE' : 'Final';
  const resultColor = game.won === true ? '#2FBF71' : game.won === false ? '#ef4444' : acc;

  return (
    // @ts-ignore
    <View style={[styles.gameCard, glassStyle]}>
      <Text style={[styles.gameLabel, { color: `rgba(${accRGB},0.5)` }]}>{label.toUpperCase()}</Text>
      <View style={styles.gameRow}>
        {/* Opponent logo */}
        <Image
          source={{ uri: game.opponentLogo }}
          style={styles.oppLogo}
          resizeMode="contain"
        />
        {/* Matchup */}
        <View style={styles.gameCenter}>
          <Text style={styles.matchup}>
            {game.isHome
              ? `BUF vs ${game.opponentAbbr}`
              : `BUF @ ${game.opponentAbbr}`}
          </Text>
          <Text style={styles.opponentName}>{game.opponentName}</Text>
          {game.venue ? <Text style={[styles.venue, { color: `rgba(${accRGB},0.4)` }]}>{game.venue}</Text> : null}
          {game.broadcast ? <Text style={[styles.broadcast, { color: `rgba(${accRGB},0.35)` }]}>{game.broadcast}</Text> : null}
        </View>
        {/* Score / time */}
        <View style={styles.gameRight}>
          {game.status !== 'upcoming' ? (
            <Text style={[styles.score, { color: resultColor }]}>
              {game.ourScore}–{game.theirScore}
            </Text>
          ) : null}
          <Text style={[styles.gameTime, {
            color: game.status === 'live' ? '#2FBF71' : `rgba(${accRGB},0.6)`,
            fontWeight: game.status === 'live' ? '700' : '500',
          }]}>{timeStr}</Text>
          <Text style={[styles.gameDate, { color: `rgba(${accRGB},0.35)` }]}>{dateStr}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Sports Screen ────────────────────────────────────────────────

export default function SportsScreen() {
  const { theme } = useTheme();
  const [data, setData]     = useState<SabresData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);

  const glassWeb = Platform.OS === 'web'
    ? { backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }
    : {};
  const card = {
    borderRadius: 18, borderWidth: 1,
    backgroundColor: `rgba(${theme.accRGB},0.12)`,
    borderColor: `rgba(${theme.accRGB},0.28)`,
    ...glassWeb,
  };

  useEffect(() => {
    fetchSabres()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.header}>
        {/* Team hero */}
        <View style={styles.heroRow}>
          <Image source={{ uri: SABRES_LOGO }} style={styles.teamLogo} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={styles.teamName}>Buffalo Sabres</Text>
            {data?.record ? (
              <Text style={[styles.record, { color: theme.acc55 }]}>
                {data.record}{data.standing ? `  ·  ${data.standing}` : ''}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => Linking.openURL(SABRES_ESPN)} activeOpacity={0.7}>
            <Ionicons name="open-outline" size={18} color={`rgba(${theme.accRGB},0.45)`} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {loading ? (
          <>
            <SkeletonPulse width="100%" height={110} borderRadius={18} accRGB={theme.accRGB} style={{ marginBottom: 12 }} />
            <SkeletonPulse width="100%" height={110} borderRadius={18} accRGB={theme.accRGB} style={{ marginBottom: 24 }} />
            {[1,2,3].map(i => (
              <View key={i} style={{ gap: 6, marginBottom: 14 }}>
                <SkeletonPulse width="80%" height={13} borderRadius={4} accRGB={theme.accRGB} />
                <SkeletonPulse width="60%" height={11} borderRadius={4} accRGB={theme.accRGB} />
              </View>
            ))}
          </>
        ) : error ? (
          // @ts-ignore
          <View style={[card, { padding: 18 }]}>
            <Text style={{ fontFamily: 'Outfit', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              Could not load Sabres data. Check your connection.
            </Text>
          </View>
        ) : (
          <>
            {data?.recentGame && (
              <GameCard game={data.recentGame} label="Last Game" acc={theme.acc} accRGB={theme.accRGB} glassStyle={card} />
            )}
            {data?.nextGame && (
              <GameCard game={data.nextGame} label="Next Game" acc={theme.acc} accRGB={theme.accRGB} glassStyle={{ ...card, borderColor: `rgba(${theme.accRGB},0.4)` }} />
            )}

            {/* News */}
            {data?.news && data.news.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: `rgba(${theme.accRGB},0.5)` }]}>SABRES NEWS</Text>
                {data.news.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.7}
                    onPress={() => item.link && Linking.openURL(item.link)}
                    // @ts-ignore
                    style={[styles.newsItem, card, i < data.news.length - 1 && { marginBottom: 8 }]}
                  >
                    <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                    {item.summary ? (
                      <Text style={styles.newsSummary} numberOfLines={2}>{item.summary}</Text>
                    ) : null}
                    {item.date ? (
                      <Text style={[styles.newsDate, { color: `rgba(${theme.accRGB},0.4)` }]}>
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </>
            )}

            <Text style={[styles.source, { color: `rgba(${theme.accRGB},0.25)` }]}>Data via ESPN</Text>
          </>
        )}
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 40, zIndex: 10 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  teamLogo: { width: 52, height: 52 },
  teamName: { fontFamily: 'Syne', fontSize: 20, fontWeight: '700', color: '#fff' },
  record: { fontFamily: 'Outfit', fontSize: 12, marginTop: 3 },
  content: { padding: 16, paddingTop: 8, paddingBottom: 40, gap: 12 },
  sectionLabel: {
    fontFamily: 'Outfit', fontSize: 9, fontWeight: '700',
    letterSpacing: 1.8, textTransform: 'uppercase', paddingLeft: 2, marginTop: 8,
  },
  gameCard: { padding: 18 },
  gameLabel: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 12 },
  gameRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  oppLogo: { width: 44, height: 44 },
  gameCenter: { flex: 1, gap: 3 },
  matchup: { fontFamily: 'Syne', fontSize: 15, fontWeight: '700', color: '#fff' },
  opponentName: { fontFamily: 'Outfit', fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  venue: { fontFamily: 'Outfit', fontSize: 11 },
  broadcast: { fontFamily: 'Outfit', fontSize: 11 },
  gameRight: { alignItems: 'flex-end', gap: 3 },
  score: { fontFamily: 'Syne', fontSize: 20, fontWeight: '800' },
  gameTime: { fontFamily: 'Outfit', fontSize: 12 },
  gameDate: { fontFamily: 'Outfit', fontSize: 10 },
  newsItem: { padding: 16, gap: 5 },
  newsTitle: { fontFamily: 'Outfit', fontSize: 13, fontWeight: '700', color: '#fff', lineHeight: 18 },
  newsSummary: { fontFamily: 'Outfit', fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 17 },
  newsDate: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '600' },
  source: { fontFamily: 'Outfit', fontSize: 10, textAlign: 'center' },
});
