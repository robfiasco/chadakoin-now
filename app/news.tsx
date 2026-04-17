import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse } from '../components/SkeletonPulse';
import { PulsingDot } from '../components/PulsingDot';
import { useTheme } from '../lib/ThemeContext';
import { useCivicData } from '../hooks/useCivicData';
import { dark } from '../lib/colors';
import { openLink } from '../lib/openLink';
import type { NewsItem } from '../hooks/useCivicData';

// ── Filters ───────────────────────────────────────────────────────
type FilterKey = 'All' | 'WRFA' | 'City' | 'State' | 'JCC';
const FILTERS: FilterKey[] = ['All', 'WRFA', 'City', 'State', 'JCC'];

function matchesFilter(source: string, f: FilterKey): boolean {
  if (f === 'All')   return true;
  if (f === 'WRFA')  return source.includes('WRFA');
  if (f === 'City')  return source.includes('City') || source.includes('Jamestown');
  if (f === 'State') return source.includes('DEC') || source.includes('DOT') || source.includes('NYS');
  if (f === 'JCC')   return source.includes('JCC');
  return true;
}

// ── Category derivation ───────────────────────────────────────────
type NewsCategory = 'Music' | 'City' | 'State' | 'JCC' | 'Education' | 'Community' | 'Breaking';

function deriveCategory(title: string, source: string): NewsCategory {
  const t = title.toLowerCase();
  const s = source.toLowerCase();
  if (/\b(jcc|jamestown community college)\b/i.test(t) || s.includes('jcc')) return 'JCC';
  if (/breaking|urgent|alert|emergency/i.test(t)) return 'Breaking';
  if (/music|concert|band|jazz|blues|rock|hip.hop|symphony|choir|festival|setlist/i.test(t)) return 'Music';
  if (/school board|city council|mayor|budget|vote|election|municipal|zoning|permit|ordinance/i.test(t)) return 'City';
  if (/governor|legislature|assembly|senate|nys|nysdot|nysdec|albany|state police/i.test(t)) return 'State';
  if (s.includes('city') || s.includes('jamestown') || s.includes('bpu')) return 'City';
  if (s.includes('nys') || s.includes('dec') || s.includes('dot') || s.includes('wgrz')) return 'State';
  return 'Community';
}

const CATEGORY_COLORS: Record<NewsCategory, string> = {
  Music:     dark.category.music,      // rose
  City:      dark.category.city,       // cyan
  State:     dark.category.film,       // amber
  JCC:       dark.category.jcc,        // violet
  Education: dark.category.jcc,        // violet
  Community: dark.category.community,  // emerald
  Breaking:  dark.category.breaking,   // rose
};

type IoniconName = keyof typeof Ionicons.glyphMap;
const CATEGORY_ICONS: Record<NewsCategory, IoniconName> = {
  Music:     'musical-notes-outline',
  City:      'business-outline',
  State:     'flag-outline',
  JCC:       'school-outline',
  Education: 'school-outline',
  Community: 'people-outline',
  Breaking:  'alert-circle-outline',
};

// ── Time helpers ──────────────────────────────────────────────────
function relativeTime(pubDate: string): string {
  if (!pubDate) return '';
  const diff = Date.now() - new Date(pubDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type Bucket = { label: string; items: NewsItem[] };

function bucketItems(items: NewsItem[]): Bucket[] {
  const now = Date.now();
  const bins: Bucket[] = [
    { label: 'Just In',       items: [] },
    { label: 'Earlier Today', items: [] },
    { label: 'This Week',     items: [] },
  ];
  for (const item of items) {
    const hrs = (now - new Date(item.pubDate || '').getTime()) / 3_600_000;
    if (hrs < 3)       bins[0].items.push(item);
    else if (hrs < 24) bins[1].items.push(item);
    else               bins[2].items.push(item);
  }
  return bins.filter(b => b.items.length > 0);
}

// ── Hero card ─────────────────────────────────────────────────────
function HeroCard({ item }: { item: NewsItem }) {
  const { theme } = useTheme();
  const category = deriveCategory(item.title, item.source ?? '');
  const color = CATEGORY_COLORS[category] ?? theme.acc;
  const icon = CATEGORY_ICONS[category] ?? 'newspaper-outline';

  return (
    <TouchableOpacity
      onPress={() => openLink(item.link)}
      activeOpacity={0.75}
      style={hero.card}
    >
      {/* Gradient header */}
      <View style={hero.header}>
        <LinearGradient
          colors={[`${color}44`, `${color}18`, 'transparent'] as any}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name={icon} size={88} color={`${color}14`} style={hero.bgIcon} />

        {/* Top Story badge */}
        <View style={hero.topBadge}>
          <PulsingDot color="#fff" size={5} />
          <Text style={hero.topBadgeText}>Top Story</Text>
        </View>

        {/* Category pill — bottom left */}
        <View style={[hero.catPill, { backgroundColor: `${color}22`, borderColor: `${color}44` }]}>
          <Text style={[hero.catText, { color }]}>{category.toUpperCase()}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={hero.body}>
        <Text style={hero.title} numberOfLines={3}>{item.title}</Text>
        {item.excerpt ? (
          <Text style={hero.excerpt} numberOfLines={2}>{item.excerpt}</Text>
        ) : null}
        <View style={hero.metaRow}>
          <Text style={hero.source}>{item.source}</Text>
          <Text style={hero.dot}>·</Text>
          <Text style={hero.time}>{relativeTime(item.pubDate)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const hero = StyleSheet.create({
  card:   {
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border,
    borderRadius: 18, overflow: 'hidden', marginBottom: 12,
  },
  header: { height: 148, position: 'relative', justifyContent: 'space-between', padding: 14 },
  bgIcon: { position: 'absolute', right: -12, bottom: -12 },
  topBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 7,
  },
  topBadgeText: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.8 },
  catPill: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  catText: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  body:   { padding: 16, gap: 8 },
  title:  { fontFamily: 'Syne', fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: -0.3, lineHeight: 24 },
  excerpt:{ fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 19 },
  metaRow:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  source: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  dot:    { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.2)' },
  time:   { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.35)' },
});

// ── Compact news row ──────────────────────────────────────────────
function NewsRow({ item }: { item: NewsItem }) {
  const category = deriveCategory(item.title, item.source ?? '');
  const color = CATEGORY_COLORS[category] ?? 'rgba(255,255,255,0.4)';

  return (
    <TouchableOpacity
      onPress={() => openLink(item.link)}
      activeOpacity={0.72}
      style={row.card}
    >
      <Text style={row.title} numberOfLines={2}>{item.title}</Text>
      <View style={row.meta}>
        {item.source ? <Text style={row.source}>{item.source}</Text> : null}
        {item.source ? <Text style={row.dot}>·</Text> : null}
        <Text style={row.time}>{relativeTime(item.pubDate)}</Text>
        <Text style={row.dot}>·</Text>
        <Text style={[row.category, { color }]}>{category}</Text>
      </View>
    </TouchableOpacity>
  );
}

const row = StyleSheet.create({
  card:     {
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border,
    borderRadius: 14, padding: 14, marginBottom: 6,
  },
  title:    { fontFamily: 'Syne', fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: -0.2, lineHeight: 21, marginBottom: 8 },
  meta:     { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  source:   { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)' },
  dot:      { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.2)' },
  time:     { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  category: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700' },
});

// ── Section header ────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  const { theme } = useTheme();
  return (
    <View style={sec.row}>
      <Text style={[sec.label, { color: theme.acc }]}>{label.toUpperCase()}</Text>
      <LinearGradient
        colors={[`rgba(${theme.accRGB},0.25)`, 'transparent'] as any}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={sec.line}
      />
    </View>
  );
}

const sec = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, marginTop: 4 },
  label: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', letterSpacing: 1.8 },
  line:  { flex: 1, height: 1 },
});

// ── Screen ────────────────────────────────────────────────────────
export default function NewsScreen() {
  const { theme } = useTheme();
  const civic = useCivicData();
  const { news, loading } = civic;
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await civic.refresh();
    setRefreshing(false);
  }

  const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const filtered = news
    .filter(item => !item.pubDate || new Date(item.pubDate) >= cutoff)
    .filter(item => matchesFilter(item.source ?? '', activeFilter));

  const hero  = filtered[0] ?? null;
  const rest  = filtered.slice(1);
  const buckets = bucketItems(rest);

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <Text style={styles.title}>Local News</Text>
        <Text style={[styles.subtitle, { color: theme.acc }]}>Jamestown, NY</Text>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={{ marginTop: 14 }}
        >
          {FILTERS.map(f => {
            const active = f === activeFilter;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.7}
                style={[styles.chip, active && {
                  backgroundColor: `rgba(${theme.accRGB},0.12)`,
                  borderColor: `rgba(${theme.accRGB},0.35)`,
                }]}
              >
                <Text style={[styles.chipText, active && { color: theme.acc }]}>{f}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
        {loading ? (
          // Skeleton
          <>
            <View style={[skel.heroCard]}>
              <SkeletonPulse width="100%" height={148} borderRadius={0} accRGB={theme.accRGB} />
              <View style={{ padding: 16, gap: 8 }}>
                <SkeletonPulse width="85%" height={18} borderRadius={5} accRGB={theme.accRGB} />
                <SkeletonPulse width="100%" height={13} borderRadius={4} accRGB={theme.accRGB} />
                <SkeletonPulse width="65%" height={13} borderRadius={4} accRGB={theme.accRGB} />
                <SkeletonPulse width={120} height={11} borderRadius={4} accRGB={theme.accRGB} />
              </View>
            </View>
            {[1, 2, 3].map(i => (
              <View key={i} style={skel.rowCard}>
                <SkeletonPulse width="90%" height={15} borderRadius={4} accRGB={theme.accRGB} />
                <SkeletonPulse width="70%" height={11} borderRadius={4} accRGB={theme.accRGB} style={{ marginTop: 8 }} />
              </View>
            ))}
          </>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No news available right now.</Text>
          </View>
        ) : (
          <>
            {/* Hero */}
            {hero && <HeroCard item={hero} />}

            {/* Bucketed sections */}
            {buckets.map(bucket => (
              <View key={bucket.label} style={{ marginBottom: 8 }}>
                <SectionHeader label={bucket.label} />
                {bucket.items.map((item, i) => (
                  <NewsRow key={i} item={item} />
                ))}
              </View>
            ))}

            {/* Fallback: no bucketed items (all news is the hero) */}
            {buckets.length === 0 && rest.length > 0 && rest.map((item, i) => (
              <NewsRow key={i} item={item} />
            ))}
          </>
        )}

        <Text style={[styles.footer, { color: `rgba(${theme.accRGB},0.2)` }]}>
          WRFA-LP 107.9 · jamestownny.gov · roberthjackson.org
        </Text>
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  safe:     { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 16 },
  title:    { fontFamily: 'Syne', fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 },

  chipsRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip:     {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border,
  },
  chipText: { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },

  content:  { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 48 },

  emptyWrap: { paddingTop: 40, alignItems: 'center' },
  emptyText: { fontFamily: 'Outfit', fontSize: 14, color: 'rgba(255,255,255,0.3)' },

  footer:   { fontFamily: 'Outfit', fontSize: 10, textAlign: 'center', marginTop: 16 },
});

const skel = StyleSheet.create({
  heroCard: {
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border,
    borderRadius: 18, overflow: 'hidden', marginBottom: 12,
  },
  rowCard: {
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border,
    borderRadius: 14, padding: 14, marginBottom: 6,
  },
});
