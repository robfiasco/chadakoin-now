import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse } from '../components/SkeletonPulse';
import { dark } from '../lib/colors';
import { RecyclingWeek } from '../hooks/useCivicData';
import { useCivic } from '../lib/CivicDataContext';

const ACC     = '#34d399';
const ACC_RGB = '52,211,153';

// Color per material type — no emojis
function materialColor(material: string): string {
  const m = material.toLowerCase();
  if (m.includes('cardboard') || m.includes('boxboard')) return '#d97706'; // amber
  if (m.includes('plastic'))  return '#0891b2'; // cyan
  if (m.includes('metal') || m.includes('can')) return '#64748b'; // slate
  if (m.includes('paper'))    return '#16a34a'; // green
  if (m.includes('glass'))    return '#7c3aed'; // violet
  return ACC;
}

function materialIcon(material: string): keyof typeof Ionicons.glyphMap {
  const m = material.toLowerCase();
  if (m.includes('cardboard') || m.includes('boxboard')) return 'cube-outline';
  if (m.includes('plastic'))  return 'water-outline';
  if (m.includes('metal') || m.includes('can')) return 'ellipse-outline';
  if (m.includes('paper'))    return 'document-outline';
  if (m.includes('glass'))    return 'wine-outline';
  return 'refresh-outline';
}

const NOT_ACCEPTED: { icon: keyof typeof Ionicons.glyphMap; label: string; detail: string | null }[] = [
  { icon: 'bag-outline',          label: 'Plastic bags',                    detail: 'Drop off at grocery store bins' },
  { icon: 'pizza-outline',        label: 'Pizza boxes & waxed cartons',     detail: 'Grease-contaminated cardboard is trash' },
  { icon: 'cube-outline',         label: 'Styrofoam & foam packaging',      detail: null },
  { icon: 'restaurant-outline',   label: 'Food residue containers',         detail: 'Rinse before recycling' },
  { icon: 'apps-outline',         label: 'Buckets, pots, pans & toys',      detail: null },
  { icon: 'shirt-outline',        label: 'Laundry baskets & totes',         detail: 'No lids either' },
  { icon: 'medkit-outline',       label: 'Medical waste & syringes',        detail: null },
  { icon: 'git-branch-outline',   label: 'Garden hoses, hangers & brooms',  detail: null },
  { icon: 'archive-outline',      label: 'Bubblewrap & packing peanuts',    detail: null },
  { icon: 'document-outline',     label: 'Shredded paper',                  detail: 'Bag it and place in trash' },
  { icon: 'construct-outline',    label: 'Vinyl, PVC & furniture',          detail: null },
];

export default function RecyclingScreen() {
  const civic = useCivic();
  const { recycling, loading } = civic;
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await civic.refresh();
    setRefreshing(false);
  }

  const glassWeb = Platform.OS === 'web'
    ? { backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }
    : {};

  const allWeeks: Array<RecyclingWeek & { label: string; isThis: boolean }> = loading ? [] : [
    recycling.thisWeek.startDate ? { ...recycling.thisWeek, label: 'THIS WEEK', isThis: true }  : null,
    recycling.nextWeek.startDate ? { ...recycling.nextWeek, label: 'NEXT WEEK', isThis: false } : null,
    ...recycling.upcomingWeeks.map(w => ({ ...w, label: '', isThis: false })),
  ].filter(Boolean) as Array<RecyclingWeek & { label: string; isThis: boolean }>;

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.title}>Recycling</Text>
        <Text style={styles.subhead}>Jamestown pickup schedule</Text>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACC} colors={[ACC]} />
        }
      >
        <Text style={styles.sectionLabel}>SCHEDULE</Text>

        {loading ? (
          // @ts-ignore
          <View style={[styles.scheduleCard, glassWeb]}>
            <View style={{ gap: 10, padding: 20 }}>
              <SkeletonPulse width={80}  height={11} borderRadius={4} accRGB={ACC_RGB} />
              <SkeletonPulse width={160} height={28} borderRadius={6} accRGB={ACC_RGB} />
              <SkeletonPulse width={140} height={11} borderRadius={4} accRGB={ACC_RGB} />
              <SkeletonPulse width={100} height={20} borderRadius={6} accRGB={ACC_RGB} />
            </View>
          </View>
        ) : (
          // @ts-ignore
          <View style={[styles.scheduleCard, glassWeb]}>
            {allWeeks.map((week, i) => {
              const color = materialColor(week.material);
              const icon  = materialIcon(week.material);
              const pm    = week.material.match(/^(.+?)\s*\((.+)\)$/);
              const name   = pm ? pm[1].trim() : week.material;
              const detail = pm ? pm[2].trim() : '';

              return (
                <View
                  key={week.startDate || i}
                  style={[
                    styles.weekRow,
                    week.isThis && { backgroundColor: `${color}0d` },
                    i < allWeeks.length - 1 && { borderBottomWidth: 1, borderBottomColor: dark.border },
                  ]}
                >
                  {/* Left color stripe */}
                  <View style={[styles.stripe, { backgroundColor: week.isThis ? color : `${color}44` }]} />

                  {/* Date column */}
                  <View style={styles.weekDate}>
                    {week.label ? (
                      <Text style={[styles.weekLabel, { color: week.isThis ? color : `${color}70` }]}>
                        {week.label}
                      </Text>
                    ) : null}
                    <Text style={[styles.weekRange, { color: week.isThis ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)' }]}>
                      {week.dateRange || '—'}
                    </Text>
                  </View>

                  {/* Material column */}
                  <View style={styles.weekMaterial}>
                    <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
                      <Ionicons name={icon} size={16} color={week.isThis ? color : `${color}88`} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.materialName,
                        { color: week.isThis ? '#fff' : 'rgba(255,255,255,0.45)' },
                      ]}>
                        {name}
                      </Text>
                      {detail && week.isThis ? (
                        <Text style={styles.materialDetail}>{detail}</Text>
                      ) : null}
                      {week.note && week.isThis ? (
                        <Text style={[styles.materialDetail, { color: 'rgba(255,255,255,0.55)' }]}>
                          {week.note}
                        </Text>
                      ) : null}
                      {week.exclusions && week.isThis ? (
                        <View style={styles.exclusionRow}>
                          <Ionicons name="close-circle" size={11} color={`${color}80`} />
                          <Text style={[styles.exclusions, { color: `${color}80` }]}>{week.exclusions}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>HOLIDAY RULE</Text>
        {/* @ts-ignore */}
        <View style={[styles.infoCard, glassWeb]}>
          <Ionicons name="information-circle-outline" size={18} color={ACC} />
          <Text style={styles.infoText}>If a holiday falls on your pickup day, your pickup shifts to the next day — and every pickup after it that week shifts one day too. A Monday holiday means Monday pickup moves to Tuesday, Tuesday moves to Wednesday, and so on.</Text>
        </View>

        {recycling.holidayDelay && (
          <View style={styles.delayBanner}>
            <Ionicons name="warning-outline" size={14} color="#f59e0b" />
            <Text style={styles.delayText}>Holiday this week — pickup may shift by one day.</Text>
          </View>
        )}

        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>NOT ACCEPTED</Text>
        {/* @ts-ignore */}
        <View style={[styles.scheduleCard, glassWeb]}>
          {NOT_ACCEPTED.map((item, i) => (
            <View
              key={item.label}
              style={[
                styles.notAcceptedRow,
                i < NOT_ACCEPTED.length - 1 && { borderBottomWidth: 1, borderBottomColor: dark.border },
              ]}
            >
              <View style={styles.naIconWrap}>
                <Ionicons name={item.icon} size={14} color="rgba(255,255,255,0.3)" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.naLabel}>{item.label}</Text>
                {item.detail ? <Text style={styles.naDetail}>{item.detail}</Text> : null}
              </View>
              <Ionicons name="close-circle" size={14} color="rgba(251,113,133,0.4)" />
            </View>
          ))}
        </View>

        <Text style={styles.updatedLine}>
          {civic.lastUpdated
            ? `Updated ${new Date(civic.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Loading…'}
        </Text>
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  header:  { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 40, zIndex: 10 },
  title:   { fontFamily: 'Syne', fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  subhead: { fontFamily: 'Outfit', fontSize: 11, marginTop: 4, letterSpacing: 1.5, textTransform: 'uppercase', color: ACC },
  content: { padding: 16, paddingTop: 4, paddingBottom: 32, gap: 0 },

  sectionLabel: {
    fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.8,
    textTransform: 'uppercase', marginBottom: 8, marginTop: 4, paddingLeft: 2,
    color: `rgba(${ACC_RGB},0.45)`,
  },

  scheduleCard: {
    borderRadius: 18, borderWidth: 1,
    backgroundColor: dark.surface,
    borderColor: dark.border,
    overflow: 'hidden',
  },

  weekRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingRight: 16, gap: 12 },
  stripe:   { width: 3, alignSelf: 'stretch', borderRadius: 2 },
  weekDate: { width: 76, gap: 3 },
  weekLabel:  { fontFamily: 'Outfit', fontSize: 8, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  weekRange:  { fontFamily: 'Outfit', fontSize: 11, fontWeight: '500', lineHeight: 15 },

  weekMaterial: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconWrap:     { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  materialName:    { fontFamily: 'Syne', fontSize: 14, fontWeight: '700', lineHeight: 19 },
  materialDetail:  { fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, lineHeight: 14 },
  exclusionRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  exclusions:      { fontFamily: 'Outfit', fontSize: 10, lineHeight: 14 },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16,
    borderRadius: 14, borderWidth: 1,
    backgroundColor: dark.surface, borderColor: dark.border,
  },
  infoText: { fontFamily: 'Outfit', flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },

  delayBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10,
    padding: 12, marginTop: 8,
    backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)',
  },
  delayText: { fontFamily: 'Outfit', fontSize: 12, color: '#f59e0b', flex: 1, lineHeight: 17 },

  updatedLine: {
    fontFamily: 'Outfit', fontSize: 11, textAlign: 'center', marginTop: 28,
    color: `rgba(${ACC_RGB},0.3)`,
  },

  notAcceptedRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, gap: 12 },
  naIconWrap: { width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  naLabel:  { fontFamily: 'Outfit', fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.6)', lineHeight: 18 },
  naDetail: { fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1, lineHeight: 14 },
});
