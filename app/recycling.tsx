import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse, ErrorBanner } from '../components/SkeletonPulse';
import { useTheme } from '../lib/ThemeContext';
import { useCivicData, RecyclingWeek } from '../hooks/useCivicData';

export default function RecyclingScreen() {
  const { theme } = useTheme();
  const civic = useCivicData();
  const { recycling, loading, error } = civic;
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await civic.refresh();
    setRefreshing(false);
  }

  const glassWeb = Platform.OS === 'web'
    ? { backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }
    : {};
  const panel     = { borderRadius: 20, borderWidth: 1, backgroundColor: `rgba(${theme.accRGB},0.05)`, borderColor: `rgba(${theme.accRGB},0.16)`, ...glassWeb };
  const panelGlow = { borderRadius: 20, borderWidth: 1, backgroundColor: `rgba(${theme.accRGB},0.07)`, borderColor: `rgba(${theme.accRGB},0.22)`, ...glassWeb };

  const allWeeks: Array<RecyclingWeek & { label: string; isThis: boolean }> = loading ? [] : [
    recycling.thisWeek.startDate ? { ...recycling.thisWeek, label: 'THIS WEEK', isThis: true }  : null,
    recycling.nextWeek.startDate ? { ...recycling.nextWeek, label: 'NEXT WEEK', isThis: false } : null,
    ...recycling.upcomingWeeks.map(w => ({ ...w, label: '', isThis: false })),
  ].filter(Boolean) as Array<RecyclingWeek & { label: string; isThis: boolean }>;

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.title}>Recycling</Text>
        <Text style={[styles.subhead, { color: theme.acc55 }]}>Jamestown pickup schedule</Text>
      </SafeAreaView>

      {error && <ErrorBanner message={error} accRGB={theme.accRGB} />}

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

        <Text style={[styles.sectionLabel, { color: theme.acc45 }]}>SCHEDULE</Text>

        {loading ? (
          // @ts-ignore
          <View style={[styles.card, panelGlow]}>
            <View style={{ gap: 10 }}>
              <SkeletonPulse width={80} height={11} borderRadius={4} accRGB={theme.accRGB} />
              <SkeletonPulse width={160} height={28} borderRadius={6} accRGB={theme.accRGB} />
              <SkeletonPulse width={120} height={20} borderRadius={6} accRGB={theme.accRGB} />
              <SkeletonPulse width={140} height={11} borderRadius={4} accRGB={theme.accRGB} />
              <SkeletonPulse width={100} height={20} borderRadius={6} accRGB={theme.accRGB} />
            </View>
          </View>
        ) : (
          // @ts-ignore
          <View style={[styles.scheduleCard, panelGlow]}>
            {allWeeks.map((week, i) => (
              <View
                key={week.startDate || i}
                style={[
                  styles.weekRow,
                  i < allWeeks.length - 1 && { borderBottomWidth: 1, borderBottomColor: `rgba(${theme.accRGB},0.1)` },
                  week.isThis && { paddingBottom: 16 },
                ]}
              >
                <View style={styles.weekDate}>
                  {week.label ? (
                    <Text style={[styles.weekLabel, { color: week.isThis ? theme.acc : `rgba(${theme.accRGB},0.45)` }]}>
                      {week.label}
                    </Text>
                  ) : null}
                  <Text style={[styles.weekRange, { color: week.isThis ? theme.acc : `rgba(${theme.accRGB},0.4)` }]}>
                    {week.dateRange || '—'}
                  </Text>
                </View>

                <View style={[styles.dividerV, { backgroundColor: `rgba(${theme.accRGB},0.12)` }]} />

                <View style={styles.weekMaterial}>
                  <Text style={[styles.weekEmoji, { opacity: week.isThis ? 1 : 0.55 }]}>{week.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    {/* Split "Material (detail)" into two lines */}
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
                            <Text style={[styles.materialDetail, { color: `rgba(255,255,255,0.7)` }]}>
                              • {week.note}
                            </Text>
                          ) : null}
                          {week.exclusions && week.isThis ? (
                            <Text style={[styles.exclusions, { color: `rgba(${theme.accRGB},0.5)` }]}>
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

        <Text style={[styles.sectionLabel, { color: theme.acc45, marginTop: 20 }]}>HOLIDAY RULE</Text>
        {/* @ts-ignore */}
        <View style={[styles.card, panel, { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }]}>
          <Ionicons name="information-circle-outline" size={18} color={theme.acc} />
          <Text style={styles.infoText}>If your pickup falls on a holiday, recycling moves to Saturday.</Text>
        </View>

        {recycling.holidayDelay && (
          // @ts-ignore
          <View style={[styles.delayBanner, { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)' }]}>
            <Ionicons name="warning-outline" size={14} color="#f59e0b" />
            <Text style={styles.delayText}>
              Holiday this week — pickup may shift by one day.
            </Text>
          </View>
        )}

        <Text style={[styles.updatedLine, { color: `rgba(${theme.accRGB},0.35)` }]}>
          {civic.lastUpdated
            ? `Updated ${new Date(civic.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Loading…'}
        </Text>
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 40, zIndex: 10 },
  title: { fontFamily: 'Syne', fontSize: 21, fontWeight: '700', color: '#fff' },
  subhead: { fontFamily: 'Outfit', fontSize: 11, marginTop: 3, letterSpacing: 1 },
  content: { padding: 16, paddingTop: 4, paddingBottom: 32 },
  sectionLabel: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 4, paddingLeft: 2 },
  card: { padding: 20, marginBottom: 0 },
  scheduleCard: { overflow: 'hidden', marginBottom: 0 },
  weekRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  weekDate: { width: 72, gap: 3 },
  weekLabel: { fontFamily: 'Outfit', fontSize: 8, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  weekRange: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '600', lineHeight: 15 },
  dividerV: { width: 1, alignSelf: 'stretch' },
  weekMaterial: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  weekEmoji: { fontSize: 22, lineHeight: 28 },
  materialName: { fontFamily: 'Syne', fontSize: 15, fontWeight: '700', lineHeight: 20 },
  materialNameDim: { fontFamily: 'Outfit', fontSize: 13, fontWeight: '500', lineHeight: 18 },
  materialDetail: { fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, lineHeight: 14 },
  exclusions: { fontFamily: 'Outfit', fontSize: 10, marginTop: 4, lineHeight: 14 },
  infoText: { fontFamily: 'Outfit', flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },
  delayBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 8 },
  delayText: { fontFamily: 'Outfit', fontSize: 12, color: '#f59e0b', flex: 1, lineHeight: 17 },
  updatedLine: { fontFamily: 'Outfit', fontSize: 11, textAlign: 'center', marginTop: 28 },
});
