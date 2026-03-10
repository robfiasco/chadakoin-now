import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse, ErrorBanner } from '../components/SkeletonPulse';
import { useTheme } from '../lib/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────

interface GameResult {
  id: string;
  date: string;
  status: string;        // 'final' | 'live' | 'upcoming'
  homeTeam: string;
  homeScore: string;
  awayTeam: string;
  awayScore: string;
  isHome: boolean;       // is the "our" team home?
  won: boolean | null;   // null if upcoming
  venue?: string;
  broadcast?: string;
}

interface TeamData {
  name: string;
  abbr: string;
  record?: string;
  recentGame?: GameResult;
  nextGame?: GameResult;
  sport: string;
  espnUrl: string;
}

// ─── ESPN API helpers ─────────────────────────────────────────────

const TEAMS = [
  { key: 'bills',    sport: 'football',    league: 'nfl',                     id: 'buf',  label: 'Buffalo Bills',         abbr: 'BUF' },
  { key: 'sabres',   sport: 'hockey',      league: 'nhl',                     id: 'buf',  label: 'Buffalo Sabres',        abbr: 'BUF' },
  { key: 'syracuse', sport: 'basketball',  league: 'mens-college-basketball', id: '183',  label: 'Syracuse Orange',       abbr: 'SYR' },
  { key: 'bonaventure', sport: 'basketball', league: 'mens-college-basketball', id: '179', label: 'St. Bonaventure',      abbr: 'SBU' },
  { key: 'ub',       sport: 'basketball',  league: 'mens-college-basketball', id: '56',   label: 'UB Bulls',              abbr: 'UB'  },
];

function espnUrl(sport: string, league: string, id: string) {
  return `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${id}/schedule`;
}

function parseGame(event: any, teamId: string): GameResult | null {
  try {
    const comp = event.competitions?.[0];
    if (!comp) return null;
    const competitors = comp.competitors ?? [];
    const us   = competitors.find((c: any) => c.team?.id === teamId || c.team?.abbreviation?.toLowerCase() === teamId.toLowerCase());
    const them = competitors.find((c: any) => c.team?.id !== (us?.team?.id));
    if (!us || !them) return null;

    const status = event.status?.type?.completed
      ? 'final'
      : event.status?.type?.state === 'in'
      ? 'live'
      : 'upcoming';

    return {
      id: event.id,
      date: event.date,
      status,
      homeTeam: comp.homeAway === 'home' ? us.team.abbreviation : them.team.abbreviation,
      awayTeam: comp.homeAway === 'away' ? us.team.abbreviation : them.team.abbreviation,
      homeScore: us.homeAway === 'home' ? (us.score ?? '—') : (them.score ?? '—'),
      awayScore: us.homeAway === 'away' ? (us.score ?? '—') : (them.score ?? '—'),
      isHome: us.homeAway === 'home',
      won: status === 'final' ? us.winner === true : null,
      venue: comp.venue?.fullName,
      broadcast: comp.broadcasts?.[0]?.names?.[0],
    };
  } catch {
    return null;
  }
}

async function fetchTeamData(team: typeof TEAMS[0]): Promise<TeamData> {
  const url = espnUrl(team.sport, team.league, team.id);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed for ${team.label}`);
  const json = await res.json();

  const record = json.team?.record?.items?.[0]?.summary ?? '';
  const events: any[] = json.events ?? [];
  const now = new Date();

  const past = events
    .filter(e => e.status?.type?.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const upcoming = events
    .filter(e => !e.status?.type?.completed && new Date(e.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    name: team.label,
    abbr: team.abbr,
    record,
    recentGame: past[0] ? parseGame(past[0], team.id) ?? undefined : undefined,
    nextGame: upcoming[0] ? parseGame(upcoming[0], team.id) ?? undefined : undefined,
    sport: team.sport,
    espnUrl: `https://www.espn.com/${team.sport}/team/_/id/${team.id}`,
  };
}

// ─── Game card ────────────────────────────────────────────────────

function GameCard({ game, teamAbbr, accRGB, acc, glassStyle }: {
  game: GameResult; teamAbbr: string; accRGB: string; acc: string; glassStyle: any;
}) {
  const d = new Date(game.date);
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = game.status === 'upcoming'
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : game.status === 'live' ? 'LIVE' : 'Final';

  const isWin = game.won === true;
  const isLoss = game.won === false;
  const resultColor = isWin ? '#2FBF71' : isLoss ? '#ef4444' : acc;

  return (
    // @ts-ignore
    <View style={[styles.gameCard, glassStyle]}>
      <View style={styles.gameRow}>
        <View style={styles.gameTeams}>
          <Text style={[styles.gameTeam, game.isHome ? styles.gameTeamBold : {}]}>
            {game.awayTeam} @ {game.homeTeam}
          </Text>
          {game.venue ? <Text style={styles.gameVenue}>{game.venue}</Text> : null}
        </View>
        <View style={styles.gameScore}>
          {game.status !== 'upcoming' ? (
            <Text style={[styles.scoreText, { color: resultColor }]}>
              {game.awayScore} – {game.homeScore}
            </Text>
          ) : null}
          <Text style={[styles.gameStatus, { color: game.status === 'live' ? '#2FBF71' : `rgba(${accRGB},0.5)` }]}>
            {timeStr}
          </Text>
        </View>
      </View>
      <Text style={[styles.gameDate, { color: `rgba(${accRGB},0.4)` }]}>{dateStr}</Text>
    </View>
  );
}

// ─── Sports Screen ────────────────────────────────────────────────

export default function SportsScreen() {
  const { theme } = useTheme();
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const glassWeb = Platform.OS === 'web'
    ? { backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }
    : {};
  const panel = { borderRadius: 16, borderWidth: 1, backgroundColor: `rgba(${theme.accRGB},0.05)`, borderColor: `rgba(${theme.accRGB},0.16)`, ...glassWeb };

  useEffect(() => {
    Promise.allSettled(TEAMS.map(fetchTeamData))
      .then(results => {
        const loaded = results
          .filter(r => r.status === 'fulfilled')
          .map(r => (r as PromiseFulfilledResult<TeamData>).value);
        setTeams(loaded);
        if (loaded.length === 0) setError('Could not load sports data.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.title}>Local Sports</Text>
        <Text style={[styles.subhead, { color: theme.acc55 }]}>Bills · Sabres · Regional NCAA</Text>
      </SafeAreaView>

      {error && <ErrorBanner message={error} accRGB={theme.accRGB} />}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          [1, 2, 3].map(i => (
            <View key={i} style={{ marginBottom: 20, gap: 8 }}>
              <SkeletonPulse width={120} height={14} borderRadius={4} accRGB={theme.accRGB} />
              <SkeletonPulse width="100%" height={70} borderRadius={14} accRGB={theme.accRGB} />
            </View>
          ))
        ) : (
          teams.map(team => (
            <View key={team.name} style={styles.teamSection}>
              <TouchableOpacity
                style={styles.teamHeader}
                onPress={() => Linking.openURL(team.espnUrl)}
                activeOpacity={0.7}
              >
                <Text style={[styles.teamName, { color: theme.acc }]}>{team.name}</Text>
                {team.record ? (
                  <Text style={[styles.teamRecord, { color: `rgba(${theme.accRGB},0.5)` }]}>{team.record}</Text>
                ) : null}
                <Ionicons name="open-outline" size={13} color={`rgba(${theme.accRGB},0.35)`} />
              </TouchableOpacity>

              {team.recentGame && (
                <GameCard game={team.recentGame} teamAbbr={team.abbr} accRGB={theme.accRGB} acc={theme.acc} glassStyle={panel} />
              )}
              {team.nextGame && (
                <GameCard game={team.nextGame} teamAbbr={team.abbr} accRGB={theme.accRGB} acc={theme.acc} glassStyle={{ ...panel, borderColor: `rgba(${theme.accRGB},0.28)` }} />
              )}
              {!team.recentGame && !team.nextGame && (
                // @ts-ignore
                <View style={[panel, { padding: 14 }]}>
                  <Text style={{ fontFamily: 'Outfit', fontSize: 12, color: `rgba(${theme.accRGB},0.4)` }}>No recent or upcoming games found.</Text>
                </View>
              )}
            </View>
          ))
        )}
        <Text style={[styles.source, { color: `rgba(${theme.accRGB},0.25)` }]}>Data via ESPN</Text>
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 40, zIndex: 10 },
  title: { fontFamily: 'Syne', fontSize: 21, fontWeight: '700', color: '#fff' },
  subhead: { fontFamily: 'Outfit', fontSize: 11, marginTop: 3, letterSpacing: 1 },
  content: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  teamSection: { marginBottom: 24 },
  teamHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  teamName: { fontFamily: 'Syne', fontSize: 15, fontWeight: '700', flex: 1 },
  teamRecord: { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600' },
  gameCard: { padding: 14, marginBottom: 6 },
  gameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  gameTeams: { flex: 1 },
  gameTeam: { fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  gameTeamBold: { fontWeight: '700', color: '#fff' },
  gameVenue: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  gameScore: { alignItems: 'flex-end', gap: 2 },
  scoreText: { fontFamily: 'Syne', fontSize: 16, fontWeight: '700' },
  gameStatus: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '600' },
  gameDate: { fontFamily: 'Outfit', fontSize: 10, letterSpacing: 0.5 },
  source: { fontFamily: 'Outfit', fontSize: 10, textAlign: 'center', marginTop: 8 },
});
