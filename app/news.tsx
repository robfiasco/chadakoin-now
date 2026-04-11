import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse, ErrorBanner } from '../components/SkeletonPulse';
import { useTheme } from '../lib/ThemeContext';
import { useCivicData } from '../hooks/useCivicData';
import { openLink } from '../lib/openLink';

const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  'WRFA-LP':           { bg: 'rgba(0,212,200,0.12)',   text: '#00D4C8' },
  'City of Jamestown': { bg: 'rgba(91,141,184,0.15)',  text: '#5B8DB8' },
  'NYS DEC':           { bg: 'rgba(245,166,35,0.12)',  text: '#F5A623' },
  'NYSDOT':            { bg: 'rgba(245,166,35,0.12)',  text: '#F5A623' },
  'JCC':               { bg: 'rgba(155,109,255,0.12)', text: '#9B6DFF' },
  'Jackson Center':    { bg: 'rgba(255,107,138,0.12)', text: '#FF6B8A' },
  'WGRZ':              { bg: 'rgba(91,141,184,0.15)',  text: '#5B8DB8' },
};
const DEFAULT_SOURCE = { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.4)' };

function sourceColor(src: string) {
  return SOURCE_COLORS[src] ?? DEFAULT_SOURCE;
}

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

function formatDate(str: string) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NewsScreen() {
  const { theme } = useTheme();
  const civic = useCivicData();
  const { news, loading, error } = civic;
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

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.title}>Local News</Text>
        <Text style={[styles.subtitle, { color: theme.acc }]}>Jamestown, NY</Text>

        {/* Source filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {FILTERS.map(f => {
            const active = f === activeFilter;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.7}
                style={[
                  styles.filterPill,
                  active ? [styles.filterActive, { backgroundColor: theme.acc }] : styles.filterInactive,
                ]}
              >
                <Text style={[styles.filterText, active ? [styles.filterTextOn, { color: theme.bg }] : styles.filterTextOff]}>
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {error && <ErrorBanner message={error} accRGB={theme.accRGB} />}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.acc} colors={[theme.acc]} />
        }
      >
        {loading ? (
          [1,2,3,4].map(i => (
            <View key={i} style={[styles.newsCard, { marginBottom: 8 }]}>
              <View style={styles.cardTop}>
                <SkeletonPulse width={60} height={16} borderRadius={5} accRGB={theme.accRGB} />
                <SkeletonPulse width={40} height={10} borderRadius={4} accRGB={theme.accRGB} />
              </View>
              <View style={[styles.cardBody, { gap: 6 }]}>
                <SkeletonPulse width="90%" height={14} borderRadius={4} accRGB={theme.accRGB} />
                <SkeletonPulse width="100%" height={11} borderRadius={4} accRGB={theme.accRGB} />
                <SkeletonPulse width="75%" height={11} borderRadius={4} accRGB={theme.accRGB} />
              </View>
            </View>
          ))
        ) : filtered.length === 0 ? (
          <View style={styles.newsCard}>
            <View style={styles.cardBody}>
              <Text style={{ fontFamily: 'Outfit', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                No news available.
              </Text>
            </View>
          </View>
        ) : (
          filtered.map((item, i) => {
            const sc = sourceColor(item.source ?? '');
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={item.link ? 0.72 : 1}
                onPress={() => openLink(item.link)}
                style={styles.newsCard}
              >
                {/* Top row: source badge + date */}
                <View style={styles.cardTop}>
                  {item.source ? (
                    <Text style={[styles.sourceBadge, { backgroundColor: sc.bg, color: sc.text }]}>
                      {item.source}
                    </Text>
                  ) : <View />}
                  <Text style={styles.cardDate}>{formatDate(item.pubDate)}</Text>
                </View>

                {/* Body */}
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={3}>{item.title}</Text>
                  {item.excerpt ? (
                    <Text style={styles.cardBlurb} numberOfLines={2}>{item.excerpt}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <Text style={[styles.sourceFooter, { color: `rgba(${theme.accRGB},0.2)` }]}>
          WRFA-LP 107.9 · jamestownny.gov · roberthjackson.org
        </Text>
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  header:   { paddingHorizontal: 20, paddingBottom: 0, paddingTop: 40, zIndex: 10 },
  title:    { fontFamily: 'Syne', fontSize: 21, fontWeight: '700', color: '#fff', letterSpacing: 0.1 },
  subtitle: { fontFamily: 'Outfit', fontSize: 11, letterSpacing: 1.2, marginTop: 3 },

  filtersRow:    { flexDirection: 'row', gap: 7, marginTop: 14, marginBottom: 18 },
  filterPill:    { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20 },
  filterActive:  { borderWidth: 1, borderColor: 'transparent' },
  filterInactive:{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  filterText:    { fontFamily: 'Outfit', fontSize: 12, fontWeight: '700' },
  filterTextOn:  {},
  filterTextOff: { color: 'rgba(255,255,255,0.45)' },

  content: { padding: 16, paddingTop: 4, paddingBottom: 40 },

  newsCard: {
    backgroundColor: 'rgba(0,212,200,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16, marginBottom: 8, overflow: 'hidden',
  },
  cardTop:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 11, paddingBottom: 0 },
  cardDate:    { fontFamily: 'Outfit', fontSize: 9, color: 'rgba(255,255,255,0.25)' },
  sourceBadge: { fontFamily: 'Outfit', fontSize: 8, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 5, overflow: 'hidden' },
  cardBody:    { padding: 8, paddingTop: 6, paddingHorizontal: 14, paddingBottom: 13 },
  cardTitle:   { fontFamily: 'Outfit', fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: -0.3, lineHeight: 18, marginBottom: 5 },
  cardBlurb:   { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 16 },

  sourceFooter: { fontFamily: 'Outfit', fontSize: 10, textAlign: 'center', marginTop: 8 },
});
