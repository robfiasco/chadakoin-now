import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse } from '../components/SkeletonPulse';
import { dark } from '../lib/colors';
import { RecyclingWeek } from '../hooks/useCivicData';
import { useCivic } from '../lib/CivicDataContext';

const ACC     = '#34d399';           // emerald-400
const ACC_RGB = '52,211,153';

const NOT_ACCEPTED = [
  { icon: '🛍️', label: 'Plastic bags', detail: 'Drop off at grocery store bins instead' },
  { icon: '🍕', label: 'Pizza boxes & waxed cartons', detail: 'Grease-contaminated cardboard is trash' },
  { icon: '🥡', label: 'Styrofoam & foam packaging', detail: null },
  { icon: '🥫', label: 'Food residue containers', detail: 'Rinse before recycling' },
  { icon: '🪣', label: 'Buckets, pots, pans & toys', detail: null },
  { icon: '🪜', label: 'Laundry baskets & totes', detail: 'No lids either' },
  { icon: '🩺', label: 'Medical waste & syringes', detail: null },
  { icon: '🧹', label: 'Garden hoses, hangers & brooms', detail: null },
  { icon: '📦', label: 'Bubblewrap & packing peanuts', detail: null },
  { icon: '📄', label: 'Shredded paper', detail: 'Bag it and place in trash' },
  { icon: '🪟', label: 'Vinyl, PVC & furniture', detail: null },
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ACC}
            colors={[ACC]}
          />
        }
      >
        <Text style={styles.sectionLabel}>SCHEDULE</Text>

        {loading ? (
          // @ts-ignore
          <View style={[styles.scheduleCard, glassWeb]}>
            <View style={{ gap: 10, padding: 20 }}>
              <SkeletonPulse width={80}  height={11} borderRadius={4} accRGB={ACC_RGB} />
              <SkeletonPulse width={160} height={28} borderRadius={6} accRGB={ACC_RGB} />
              <SkeletonPulse width={120} height={20} borderRadius={6} accRGB={ACC_RGB} />
              <SkeletonPulse width={140} height={11} borderRadius={4} accRGB={ACC_RGB} />
              <SkeletonPulse width={100} height={20} borderRadius={6} accRGB={ACC_RGB} />
            </View>
          </View>
        ) : (
          // @ts-ignore
          <View style={[styles.scheduleCard, glassWeb]}>
            {allWeeks.map((week, i) => (
              <View
                key={week.startDate || i}
                style={[
                  styles.weekRow,
                  i < allWeeks.length - 1 && { borderBottomWidth: 1, borderBottomColor: dark.border },
                  week.isThis && { paddingBottom: 16 },
                ]}
              >
                <View style={styles.weekDate}>
                  {week.label ? (
                    <Text style={[styles.weekLabel, { color: week.isThis ? ACC : `rgba(${ACC_RGB},0.45)` }]}>
                      {week.label}
                    </Text>
                  ) : null}
                  <Text style={[styles.weekRange, { color: week.isThis ? ACC : `rgba(${ACC_RGB},0.4)` }]}>
                    {week.dateRange || '—'}
                  </Text>
                </View>

                <View style={[styles.dividerV, { backgroundColor: dark.border }]} />

                <View style={styles.weekMaterial}>
                  <Text style={[styles.weekEmoji, { opacity: week.isThis ? 1 : 0.55 }]}>{week.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    {(() => {
                      const pm = week.material.match(/^(.+?)\s*\((.+)\)$/);
                      const name   = pm ? pm[1].trim() : week.material;
                      const detail = pm ? pm[2].trim() : '';
                      return (
                        <>
                          <Text style={[
                            week.isThis ? styles.materialName : styles.materialNameDim,
                            { color: week.isThis ? '#fff' : 'rgba(255,255,255,0.55)' },
                          ]}>
                            {name}
                          </Text>
                          {detail && week.isThis ? (
                            <Text style={styles.materialDetail}>{detail}</Text>
                          ) : null}
                          {week.note && week.isThis ? (
                            <Text style={[styles.materialDetail, { color: 'rgba(255,255,255,0.7)' }]}>
                              • {week.note}
                            </Text>
                          ) : null}
                          {week.exclusions && week.isThis ? (
                            <Text style={[styles.exclusions, { color: `rgba(${ACC_RGB},0.5)` }]}>
                              ✕ {week.exclusions}
                            </Text>
                          ) : null}
                        </>
                      );
                    })()}
                  </View>
                </View>
              </View>
            ))}
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
              <Text style={styles.naIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.naLabel}>{item.label}</Text>
                {item.detail ? <Text style={styles.naDetail}>{item.detail}</Text> : null}
              </View>
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
    overflow: 'hidden', marginBottom: 0,
  },
  weekRow:     { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  weekDate:    { width: 72, gap: 3 },
  weekLabel:   { fontFamily: 'Outfit', fontSize: 8, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  weekRange:   { fontFamily: 'Outfit', fontSize: 11, fontWeight: '600', lineHeight: 15 },
  dividerV:    { width: 1, alignSelf: 'stretch' },
  weekMaterial:{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  weekEmoji:   { fontSize: 22, lineHeight: 28 },
  materialName:    { fontFamily: 'Syne', fontSize: 15, fontWeight: '700', lineHeight: 20 },
  materialNameDim: { fontFamily: 'Outfit', fontSize: 13, fontWeight: '500', lineHeight: 18 },
  materialDetail:  { fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, lineHeight: 14 },
  exclusions:      { fontFamily: 'Outfit', fontSize: 10, marginTop: 4, lineHeight: 14 },

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

  notAcceptedRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  naIcon:   { fontSize: 18, lineHeight: 24 },
  naLabel:  { fontFamily: 'Outfit', fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.75)', lineHeight: 18 },
  naDetail: { fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1, lineHeight: 14 },

});
