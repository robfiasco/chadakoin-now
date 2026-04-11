import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse } from '../components/SkeletonPulse';
import { useTheme } from '../lib/ThemeContext';
import { useCivicData, computeParkingSchedule } from '../hooks/useCivicData';

export default function ParkingScreen() {
  const { theme } = useTheme();
  const civic = useCivicData();
  const { parking, loading, error } = civic;
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
  const panel     = { borderRadius: 20, borderWidth: 1, backgroundColor: `rgba(${theme.accRGB},0.05)`, borderColor: `rgba(${theme.accRGB},0.16)`, ...glassWeb };
  const panelGlow = { borderRadius: 20, borderWidth: 1, backgroundColor: `rgba(${theme.accRGB},0.07)`, borderColor: `rgba(${theme.accRGB},0.22)`, ...glassWeb };

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.title}>Parking</Text>
        <Text style={[styles.subhead, { color: theme.acc55 }]}>Alternate-side rules · Jamestown</Text>
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

        {/* @ts-ignore */}
        <View style={[styles.card, panelGlow]}>
          {loading ? (
            <View style={{ gap: 10 }}>
              <SkeletonPulse width={160} height={32} borderRadius={6} accRGB={theme.accRGB} />
              <SkeletonPulse width="90%" height={14} borderRadius={4} accRGB={theme.accRGB} />
            </View>
          ) : (
            <>
              <Text style={[styles.todaySide, { color: theme.acc, textShadowColor: `rgba(${theme.accRGB},0.4)`, textShadowRadius: 28 }]}>
                {parking.side === 'EVEN' ? 'Even side' : 'Odd side'}
              </Text>
              <Text style={styles.todayRule}>{parking.rule}</Text>
              <View style={[styles.chip, { backgroundColor: `rgba(${theme.accRGB},0.15)`, borderColor: `rgba(${theme.accRGB},0.3)` }]}>
                <Text style={[styles.chipText, { color: theme.acc }]}>
                  {parking.mode === 'daily' ? 'Daily switching active' : 'Monthly switching active'}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.halfRow}>
          {/* @ts-ignore */}
          <View style={[styles.halfCard, panel]}>
            <Ionicons name={parking.mode === 'daily' ? 'snow-outline' : 'sunny-outline'} size={18} color={theme.acc} />
            <Text style={[styles.halfLabel, { color: theme.acc45 }]}>MODE</Text>
            <Text style={styles.halfValue}>{parking.mode === 'daily' ? 'Daily (Nov–Mar)' : 'Monthly (Apr–Oct)'}</Text>
          </View>
          {/* @ts-ignore */}
          <View style={[styles.halfCard, panel]}>
            <Ionicons name="time-outline" size={18} color={theme.acc} />
            <Text style={[styles.halfLabel, { color: theme.acc45 }]}>NEXT SWITCH</Text>
            <Text style={styles.halfValue}>{parking.mode === 'daily' ? 'Daily at 10:00 AM' : '1st of next month'}</Text>
          </View>
        </View>

        {/* Weekly parking schedule */}
        <Text style={[styles.sectionLabel, { color: theme.acc45 }]}>THIS WEEK</Text>
        {schedule.map(day => (
          <View key={day.date} style={[
            styles.scheduleRow,
            day.isToday
              ? { backgroundColor: `rgba(${theme.accRGB},0.12)`, borderColor: `rgba(${theme.accRGB},0.25)`, borderWidth: 1 }
              : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1 },
          ]}>
            <Text style={[styles.scheduleDate, day.isToday && { color: theme.acc }]}>{day.date}</Text>
            <Text style={styles.scheduleDay}>{day.day}</Text>
            <View style={[styles.sideChip, {
              backgroundColor: day.side === 'EVEN' ? `rgba(${theme.accRGB},0.15)` : 'rgba(255,255,255,0.08)',
              borderColor: day.side === 'EVEN' ? `rgba(${theme.accRGB},0.3)` : 'rgba(255,255,255,0.12)',
            }]}>
              <Text style={[styles.sideChipText, { color: day.side === 'EVEN' ? theme.acc : 'rgba(255,255,255,0.45)' }]}>
                {day.side}
              </Text>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionLabel, { color: theme.acc45 }]}>EXCEPTIONS</Text>
        {/* @ts-ignore */}
        <View style={[styles.card, panel, styles.exceptionRow]}>
          <Ionicons name="alert-circle-outline" size={18} color={theme.warmWarn.text} />
          <Text style={[styles.exceptionText, { color: theme.warmWarn.text }]}>
            Snow emergency routes override alternate-side rules. Check alerts.
          </Text>
        </View>

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
  sectionLabel: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 16, paddingLeft: 2 },
  card: { padding: 20 },
  todaySide: { fontFamily: 'Syne', fontSize: 28, fontWeight: '700', lineHeight: 34, marginBottom: 8, textShadowOffset: { width: 0, height: 0 } },
  todayRule: { fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14, lineHeight: 18 },
  offSeasonText: { fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 20 },
  chip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  chipText: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
  halfRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  halfCard: { flex: 1, padding: 16, gap: 6 },
  halfLabel: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  halfValue: { fontFamily: 'Outfit', fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginBottom: 6 },
  scheduleDate: { flex: 1, fontFamily: 'Outfit', fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  scheduleDay: { flex: 1, fontFamily: 'Outfit', fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  sideChip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  sideChipText: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  exceptionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  exceptionText: { fontFamily: 'Outfit', flex: 1, fontSize: 13, lineHeight: 20 },
  updatedLine: { fontFamily: 'Outfit', fontSize: 11, textAlign: 'center', marginTop: 28 },
});
