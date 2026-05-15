import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Share, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse } from '../components/SkeletonPulse';
import { PulsingDot } from '../components/PulsingDot';
import { useTheme } from '../lib/ThemeContext';
import { useCivic } from '../lib/CivicDataContext';
import { dark } from '../lib/colors';
import { openLink } from '../lib/openLink';
import type { NewsItem } from '../hooks/useCivicData';


const HERO_PHOTOS = [
  require('../assets/JTNY1.png'),
  require('../assets/JTNY2.png'),
  require('../assets/JTNY3.png'),
  require('../assets/JTNY4.png'),
];
const HERO_PHOTO = HERO_PHOTOS[Math.floor(Math.random() * HERO_PHOTOS.length)];

// ── Category derivation ───────────────────────────────────────────
type NewsCategory = 'Music' | 'City' | 'State' | 'JCC' | 'Education' | 'Community' | 'Breaking' | 'Local';

function deriveCategory(title: string, source: string): NewsCategory {
  const t = title.toLowerCase();
  const s = source.toLowerCase();
  if (/\b(jcc|jamestown community college)\b/i.test(t) || s.includes('jcc')) return 'JCC';
  if (/breaking|urgent|alert|emergency/i.test(t)) return 'Breaking';
  if (/music|concert|band|jazz|blues|rock|hip.hop|symphony|choir|festival|setlist/i.test(t)) return 'Music';
  if (/school board|city council|mayor|budget|vote|election|municipal|zoning|permit|ordinance/i.test(t)) return 'City';
  if (/governor|legislature|assembly|senate|nys|nysdot|nysdec|albany|state police/i.test(t)) return 'State';
  // Incident/crime/safety — check before source-based fallbacks
  if (/dies|died|dead|killed|fatal|crash|accident|shooting|stabbing|arrested|charged|overdose|injured|rescue|missing/i.test(t)) return 'Local';
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
  Local:     '#fb923c',                // orange-400 — incidents/safety
};

type IoniconName = keyof typeof Ionicons.glyphMap;

// Per-category banner: gradient stops, bg icon, accent bar color
const CATEGORY_BANNERS: Record<NewsCategory, {
  grad: [string, string, string];
  gStart: { x: number; y: number };
  gEnd:   { x: number; y: number };
  icon:   IoniconName;
  bar:    string;   // top border color
}> = {
  Breaking:  {
    grad: ['rgba(239,68,68,0.55)', 'rgba(239,68,68,0.18)', 'rgba(6,14,24,0.2)'],
    gStart: { x: 0, y: 0 }, gEnd: { x: 1, y: 1 },
    icon: 'flame-outline', bar: '#ef4444',
  },
  Music:  {
    grad: ['rgba(251,113,133,0.50)', 'rgba(244,63,94,0.14)', 'rgba(6,14,24,0.2)'],
    gStart: { x: 0, y: 0 }, gEnd: { x: 1, y: 1 },
    icon: 'musical-notes-outline', bar: '#fb7185',
  },
  City:  {
    grad: ['rgba(34,211,238,0.42)', 'rgba(6,182,212,0.12)', 'rgba(6,14,24,0.2)'],
    gStart: { x: 0, y: 0 }, gEnd: { x: 1, y: 1 },
    icon: 'business-outline', bar: '#22d3ee',
  },
  State:  {
    grad: ['rgba(251,191,36,0.48)', 'rgba(245,158,11,0.14)', 'rgba(6,14,24,0.2)'],
    gStart: { x: 0, y: 1 }, gEnd: { x: 1, y: 0 },
    icon: 'flag-outline', bar: '#fbbf24',
  },
  JCC:  {
    grad: ['rgba(167,139,250,0.48)', 'rgba(139,92,246,0.14)', 'rgba(6,14,24,0.2)'],
    gStart: { x: 0, y: 0 }, gEnd: { x: 1, y: 1 },
    icon: 'trophy-outline', bar: '#a78bfa',
  },
  Education:  {
    grad: ['rgba(96,165,250,0.45)', 'rgba(59,130,246,0.14)', 'rgba(6,14,24,0.2)'],
    gStart: { x: 0, y: 0 }, gEnd: { x: 1, y: 1 },
    icon: 'school-outline', bar: '#60a5fa',
  },
  Community:  {
    grad: ['rgba(52,211,153,0.40)', 'rgba(16,185,129,0.12)', 'rgba(6,14,24,0.2)'],
    gStart: { x: 0, y: 0 }, gEnd: { x: 1, y: 1 },
    icon: 'people-outline', bar: '#34d399',
  },
  Local:  {
    grad: ['rgba(251,146,60,0.45)', 'rgba(234,88,12,0.12)', 'rgba(6,14,24,0.2)'],
    gStart: { x: 0, y: 0 }, gEnd: { x: 1, y: 1 },
    icon: 'newspaper-outline', bar: '#fb923c',
  },
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

// Crime/incident keywords — all matching stories go to Police Blotter (shown last, collapsed).
export const CRIME_PATTERN = /\b(arrest|arrested|arraigned|charged|indicted|convicted|sentence|prison|jail|fugitive|wanted|probation|appearance ticket|unlawful|trespass|harassment|dispute|domestic|assault|robbery|burglary|larceny|shoplifting|vandalism|graffiti|disorderly|drunken|dwi|dui|possession|meth|drug|gun|gunshot|shot|shooting|stabbing|homicide|murder|killed|fatal|manhunt|missing person|amber alert|sex crime|condemn|police|crime)\b/i;

function isBlotter(item: NewsItem): boolean {
  return CRIME_PATTERN.test(item.title);
}

type Bucket = { label: string; items: NewsItem[]; isBlotter?: boolean };

function bucketItems(items: NewsItem[]): Bucket[] {
  const now = Date.now();

  const mainItems   = items.filter(i => !isBlotter(i));
  const blotterItems = items.filter(isBlotter);

  // Week starts Sunday — anything published before this Sunday is "Last Week"
  const sunday = new Date();
  sunday.setHours(0, 0, 0, 0);
  sunday.setDate(sunday.getDate() - sunday.getDay());
  const weekStartMs = sunday.getTime();

  const bins: Bucket[] = [
    { label: 'Just In',       items: [] },
    { label: 'Earlier Today', items: [] },
    { label: 'This Week',     items: [] },
    { label: 'Last Week',     items: [] },
  ];
  for (const item of mainItems) {
    const pubMs = new Date(item.pubDate || '').getTime();
    const hrs = (now - pubMs) / 3_600_000;
    if (hrs < 3)                   bins[0].items.push(item);
    else if (hrs < 24)             bins[1].items.push(item);
    else if (pubMs >= weekStartMs) bins[2].items.push(item);
    else                           bins[3].items.push(item);
  }

  const result = bins.filter(b => b.items.length > 0);
  if (blotterItems.length > 0) {
    result.push({ label: 'Police Blotter', items: blotterItems, isBlotter: true });
  }
  return result;
}

// ── Hero card ─────────────────────────────────────────────────────
function shareItem(item: NewsItem) {
  Share.share({
    title: item.title,
    message: `${item.title}\n\nvia Chadakoin Now — Jamestown, NY\n${item.link ?? ''}`,
    url: item.link ?? '',
  }).catch(() => {});
}

function HeroCard({ item }: { item: NewsItem }) {
  const category = deriveCategory(item.title, item.source ?? '');
  const banner = CATEGORY_BANNERS[category];
  const bar = banner.bar;

  return (
    <TouchableOpacity
      onPress={() => openLink(item.link)}
      activeOpacity={0.75}
      style={hero.card}
    >
      <Image source={HERO_PHOTO} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(4,10,22,0.7)', 'rgba(4,10,22,0.97)'] as any}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[hero.accentBar, { backgroundColor: bar }]} />

      {/* TOP STORY badge pinned top-left */}
      <View style={hero.badgeWrap}>
        <View style={[hero.topBadge, { borderColor: `${bar}80`, backgroundColor: 'rgba(0,0,0,0.55)' }]}>
          <View style={[hero.badgeDot, { backgroundColor: bar }]} />
          <Text style={[hero.topBadgeText, { color: '#fff' }]}>TOP STORY</Text>
        </View>
      </View>

      {/* Content pinned to bottom */}
      <View style={hero.content}>
        <Text style={hero.title} numberOfLines={3}>{item.title}</Text>
        {item.excerpt ? (
          <Text style={hero.excerpt} numberOfLines={2}>{item.excerpt}</Text>
        ) : null}
        <View style={hero.metaRow}>
          <Text style={hero.source}>{item.source}</Text>
          <Text style={hero.dot}>·</Text>
          <Text style={hero.time}>{relativeTime(item.pubDate)}</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={() => shareItem(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={15} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const hero = StyleSheet.create({
  card: {
    height: 220, borderRadius: 18, overflow: 'hidden',
    marginBottom: 12, position: 'relative',
  },
  accentBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2, zIndex: 2,
  },
  badgeWrap: {
    position: 'absolute', top: 14, left: 18, zIndex: 2,
  },
  topBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6, borderWidth: 1,
  },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  topBadgeText: {
    fontFamily: 'DMSans_700Bold', fontSize: 10, letterSpacing: 0.8,
  },
  headerMeta: {
    fontFamily: 'DMSans_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.40)',
  },
  categoryLabel: {
    fontFamily: 'DMSans_800ExtraBold', fontSize: 24, letterSpacing: 1,
  },
  content:{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, gap: 6, zIndex: 2 },
  title:  { fontFamily: 'Syne', fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: -0.3, lineHeight: 24 },
  excerpt:{ fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 19 },
  metaRow:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  source: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  dot:    { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.2)' },
  time:   { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.35)' },
});

// ── Compact news row ──────────────────────────────────────────────
function NewsRow({ item }: { item: NewsItem }) {
  const { theme } = useTheme();
  const category = deriveCategory(item.title, item.source ?? '');
  const color = CATEGORY_COLORS[category] ?? 'rgba(255,255,255,0.4)';
  const isWJTN = item.source === 'WJTN';
  const [expanded, setExpanded] = useState(false);

  const meta = (
    <View style={row.meta}>
      {item.source ? <Text style={row.source}>{item.source}</Text> : null}
      {item.source ? <Text style={row.dot}>·</Text> : null}
      <Text style={row.time}>{relativeTime(item.pubDate)}</Text>
      <Text style={row.dot}>·</Text>
      <Text style={[row.category, { color }]}>{category}</Text>
    </View>
  );

  if (isWJTN) {
    return (
      <View style={row.card}>
        <View style={[row.bar, { backgroundColor: color }]} />
        <View style={row.inner}>
          <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.72}>
            <View style={row.topRow}>
              <Text style={row.title}>{item.title}</Text>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="rgba(255,255,255,0.3)"
                style={{ marginTop: 2 }}
              />
            </View>
            {meta}
          </TouchableOpacity>

          {expanded && (
            <View style={row.expandBody}>
              <Text style={row.bodyText}>{item.excerpt}</Text>
              <TouchableOpacity
                onPress={() => openLink(item.link)}
                activeOpacity={0.7}
                style={[row.sourceLink, { borderColor: `rgba(${theme.accRGB},0.25)` }]}
              >
                <Text style={[row.sourceLinkText, { color: theme.acc }]}>Read at source →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={() => openLink(item.link)} activeOpacity={0.72} style={row.card}>
      <View style={[row.bar, { backgroundColor: color }]} />
      <View style={row.inner}>
        <View style={row.topRow}>
          <Text style={row.title}>{item.title}</Text>
          <TouchableOpacity
            onPress={() => shareItem(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            style={row.shareBtn}
          >
            <Ionicons name="share-social-outline" size={14} color="rgba(255,255,255,0.25)" />
          </TouchableOpacity>
        </View>
        {meta}
      </View>
    </TouchableOpacity>
  );
}

const row = StyleSheet.create({
  card:     {
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border,
    borderRadius: 14, overflow: 'hidden', flexDirection: 'row', marginBottom: 6,
  },
  bar:      { width: 3, flexShrink: 0 },
  inner:    { flex: 1, padding: 14 },
  topRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  title:    { flex: 1, fontFamily: 'Syne', fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: -0.2, lineHeight: 21 },
  shareBtn: { paddingTop: 2 },
  meta:     { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  source:   { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)' },
  dot:      { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.2)' },
  time:     { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  category:      { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700' },
  expandBody:    { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', gap: 12 },
  bodyText:      { fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 20 },
  sourceLink:    { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  sourceLinkText:{ fontFamily: 'Outfit', fontSize: 12, fontWeight: '700' },
});

// ── Section header ────────────────────────────────────────────────
function SectionHeader({ label, blotter, expanded, onToggle }: { label: string; blotter?: boolean; expanded?: boolean; onToggle?: () => void }) {
  const { theme } = useTheme();
  const color = blotter ? 'rgba(255,255,255,0.3)' : theme.acc;
  const gradColor = blotter ? 'rgba(255,255,255,0.08)' : `rgba(${theme.accRGB},0.25)`;
  const inner = (
    <View style={sec.row}>
      {blotter && <Ionicons name="shield-outline" size={10} color={color} style={{ marginRight: 2 }} />}
      <Text style={[sec.label, { color }]}>{label.toUpperCase()}</Text>
      <LinearGradient
        colors={[gradColor, 'transparent'] as any}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={sec.line}
      />
      {blotter && (
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={12} color={color}
        />
      )}
    </View>
  );
  if (blotter && onToggle) {
    return <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>{inner}</TouchableOpacity>;
  }
  return inner;
}

const sec = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, marginTop: 4 },
  label: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', letterSpacing: 1.8 },
  line:  { flex: 1, height: 1 },
});

// ── Screen ────────────────────────────────────────────────────────
export default function NewsScreen() {
  const { theme } = useTheme();
  const civic = useCivic();
  const { news, loading } = civic;
  const [refreshing, setRefreshing] = useState(false);
  const [blotterOpen, setBlotterOpen] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await civic.refresh();
    setRefreshing(false);
  }

  const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const filtered = news
    .filter(item => !item.pubDate || new Date(item.pubDate) >= cutoff);

  const buckets = bucketItems(filtered);

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <Text style={styles.title}>Local <Text style={{ color: theme.acc }}>News</Text></Text>
        <Text style={[styles.subtitle, { color: theme.acc }]}>Jamestown, NY</Text>

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
            {buckets.map((bucket, bi) => (
              <View key={bucket.label} style={{ marginBottom: 8 }}>
                <SectionHeader
                  label={bucket.label}
                  blotter={bucket.isBlotter}
                  expanded={blotterOpen}
                  onToggle={() => setBlotterOpen(o => !o)}
                />
                {(!bucket.isBlotter || blotterOpen) && bucket.items.map((item, i) =>
                  bi === 0 && i === 0 && !bucket.isBlotter
                    ? <HeroCard key={i} item={item} />
                    : <NewsRow key={i} item={item} />
                )}
              </View>
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
  title:    { fontFamily: 'Syne', fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
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
