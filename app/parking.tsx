import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse } from '../components/SkeletonPulse';
import { dark } from '../lib/colors';
import { computeParkingSchedule } from '../hooks/useCivicData';
import { useCivic } from '../lib/CivicDataContext';

const ACC     = '#22d3ee';           // cyan-400
const ACC_RGB = '34,211,238';

export default function ParkingScreen() {
  const civic = useCivic();
  const { parking, loading } = civic;
  const [refreshing, setRefreshing] = useState(false);
  const schedule = computeParkingSchedule();

  async function onRefresh() {
    setRefreshing(true);
    await civic.refresh();
    setRefreshing(false);
  }

  const glassWeb = Platform.OS === 'web'
    ? { backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }
    : {};

  // Compute next switch label — monthly: "May 1 — Odd side" / daily: "Tomorrow — Even side"
  const nextSwitchLabel = (() => {
    const now = new Date();
    if (parking.mode === 'monthly') {
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonthNum = next.getMonth() + 1; // 1-based
      const nextSide = nextMonthNum % 2 === 0 ? 'Even' : 'Odd';
      const monthName = next.toLocaleDateString('en-US', { month: 'long' });
      return `${monthName} 1 — ${nextSide} side`;
    }
    // Daily mode: flips tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowDay = tomorrow.getDate();
    const nextSide = tomorrowDay % 2 === 0 ? 'Even' : 'Odd';
    return `Tomorrow — ${nextSide} side`;
  })();

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.title}>Parking</Text>
        <Text style={styles.subhead}>Alternate-side rules · Jamestown</Text>
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

        {/* Today's side hero card */}
        {/* @ts-ignore */}
        <View style={[styles.heroCard, glassWeb]}>
          {loading ? (
            <View style={{ gap: 10 }}>
              <SkeletonPulse width={160} height={32} borderRadius={6} accRGB={ACC_RGB} />
              <SkeletonPulse width="90%" height={14} borderRadius={4} accRGB={ACC_RGB} />
            </View>
          ) : (
            <>
              <Text style={styles.todaySide}>
                {parking.side === 'EVEN' ? 'Even side' : 'Odd side'}
              </Text>
              <Text style={styles.todayRule}>{parking.rule}</Text>
              <View style={styles.modeChip}>
                <Text style={styles.modeChipText}>
                  {parking.mode === 'daily' ? 'Daily switching active' : 'Monthly switching active'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Mode / Next switch 2-col cards */}
        <View style={styles.halfRow}>
          {/* @ts-ignore */}
          <View style={[styles.halfCard, glassWeb]}>
            <Ionicons name={parking.mode === 'daily' ? 'snow-outline' : 'sunny-outline'} size={18} color={ACC} />
            <Text style={styles.halfLabel}>Schedule</Text>
            <Text style={styles.halfValue}>{parking.mode === 'daily' ? 'Alternates daily' : 'Alternates monthly'}</Text>
          </View>
          {/* @ts-ignore */}
          <View style={[styles.halfCard, glassWeb]}>
            <Ionicons name="time-outline" size={18} color={ACC} />
            <Text style={styles.halfLabel}>Next change</Text>
            <Text style={styles.halfValue}>{nextSwitchLabel}</Text>
          </View>
        </View>

        {/* Weekly schedule */}
        <Text style={styles.sectionLabel}>THIS WEEK</Text>
        {schedule.map(day => (
          <View
            key={day.date}
            style={[
              styles.scheduleRow,
              day.isToday
                ? { backgroundColor: `rgba(${ACC_RGB},0.10)`, borderColor: `rgba(${ACC_RGB},0.28)`, borderWidth: 1 }
                : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: dark.border, borderWidth: 1 },
            ]}
          >
            <Text style={[styles.scheduleDate, day.isToday && { color: ACC }]}>{day.date}</Text>
            <Text style={styles.scheduleDay}>{day.day}</Text>
            <View style={[
              styles.sideChip,
              day.side === 'EVEN'
                ? { backgroundColor: `rgba(${ACC_RGB},0.12)`, borderColor: `rgba(${ACC_RGB},0.3)` }
                : { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' },
            ]}>
              <Text style={[styles.sideChipText, { color: day.side === 'EVEN' ? ACC : 'rgba(255,255,255,0.45)' }]}>
                {day.side}
              </Text>
            </View>
          </View>
        ))}

        {/* Exceptions — only relevant during daily (winter) switching */}
        {parking.mode === 'daily' && (
          <>
            <Text style={styles.sectionLabel}>EXCEPTIONS</Text>
            {/* @ts-ignore */}
            <View style={[styles.exceptionCard, glassWeb]}>
              <Ionicons name="alert-circle-outline" size={18} color="#f59e0b" />
              <Text style={styles.exceptionText}>
                Snow emergency routes override alternate-side rules. Check alerts.
              </Text>
            </View>
          </>
        )}

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
    textTransform: 'uppercase', marginBottom: 8, marginTop: 16, paddingLeft: 2,
    color: `rgba(${ACC_RGB},0.45)`,
  },

  heroCard: {
    padding: 20, borderRadius: 18, borderWidth: 1,
    backgroundColor: dark.surface, borderColor: dark.border,
  },
  todaySide: {
    fontFamily: 'Syne', fontSize: 28, fontWeight: '800', lineHeight: 34, marginBottom: 8,
    color: ACC,
  },
  todayRule: { fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14, lineHeight: 18 },
  modeChip: {
    borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start',
    backgroundColor: `rgba(${ACC_RGB},0.12)`, borderColor: `rgba(${ACC_RGB},0.28)`,
  },
  modeChipText: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, color: ACC },

  halfRow:  { flexDirection: 'row', gap: 10, marginTop: 10 },
  halfCard: { flex: 1, padding: 16, gap: 6, borderRadius: 14, borderWidth: 1, backgroundColor: dark.surface, borderColor: dark.border },
  halfLabel:{ fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: `rgba(${ACC_RGB},0.45)` },
  halfValue:{ fontFamily: 'Outfit', fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  scheduleRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginBottom: 6 },
  scheduleDate: { flex: 1, fontFamily: 'Outfit', fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  scheduleDay:  { flex: 1, fontFamily: 'Outfit', fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  sideChip:     { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  sideChipText: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  exceptionCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14,
    borderRadius: 14, borderWidth: 1,
    backgroundColor: 'rgba(245,158,11,0.07)', borderColor: 'rgba(245,158,11,0.2)',
  },
  exceptionText: { fontFamily: 'Outfit', flex: 1, fontSize: 13, lineHeight: 20, color: '#f59e0b' },

  updatedLine: {
    fontFamily: 'Outfit', fontSize: 11, textAlign: 'center', marginTop: 28,
    color: `rgba(${ACC_RGB},0.3)`,
  },
});
