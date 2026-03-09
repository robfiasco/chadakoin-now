import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../lib/colors';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { StatusBadge } from '../components/StatusBadge';
import { UpdatedLine } from '../components/UpdatedLine';
import { parkingData } from '../services/mockData';

export default function ParkingScreen() {
  const isEven = parkingData.today.side === 'EVEN';
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.title}>Parking</Text>
        <Text style={styles.subhead}>Alternate-side rules for Jamestown</Text>
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Today status */}
        <Card variant="primary" style={styles.todayCard}>
          <Text style={styles.todayDate}>{parkingData.today.date} · {parkingData.today.day}</Text>
          <Text style={styles.todaySide}>{parkingData.today.side} SIDE</Text>
          <Text style={styles.todayRule}>{parkingData.today.rule}</Text>
          <StatusBadge label={isEven ? 'Even Side' : 'Odd Side'} severity={isEven ? 'blue' : 'green'} />
        </Card>

        {/* Season + Switch time */}
        <View style={styles.row}>
          <Card style={[styles.halfCard, styles.mr8]}>
            <Ionicons name="snow-outline" size={20} color={Colors.blueTeal} />
            <Text style={styles.halfLabel}>Season</Text>
            <Text style={styles.halfValue}>{parkingData.season}</Text>
          </Card>
          <Card style={styles.halfCard}>
            <Ionicons name="time-outline" size={20} color={Colors.blueTeal} />
            <Text style={styles.halfLabel}>Switch Time</Text>
            <Text style={styles.halfValue}>{parkingData.switchTime}</Text>
          </Card>
        </View>

        {/* Weekly schedule */}
        <SectionHeader title="This Week" />
        {parkingData.schedule.map((day) => {
          const isToday = day.date === parkingData.today.date;
          return (
            <View
              key={day.date}
              style={[styles.scheduleRow, isToday && styles.scheduleRowToday]}
            >
              <Text style={[styles.scheduleDay, isToday && styles.scheduleTodayText]}>
                {day.date}
              </Text>
              <Text style={[styles.scheduleWeekday, isToday && styles.scheduleTodayText]}>
                {day.day}
              </Text>
              <View style={[
                styles.sideChip,
                day.side === 'EVEN' ? styles.evenChip : styles.oddChip
              ]}>
                <Text style={styles.sideChipText}>{day.side}</Text>
              </View>
            </View>
          );
        })}

        {/* Exceptions */}
        <SectionHeader title="Exceptions" />
        <Card style={styles.exceptionCard}>
          <Ionicons name="alert-circle-outline" size={18} color={Colors.amber} />
          <Text style={styles.exceptionText}>{parkingData.exceptions}</Text>
        </Card>

        <UpdatedLine text="Updated today · 6:00 AM" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: { backgroundColor: Colors.deepBlue, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.white },
  subhead: { fontSize: 13, color: Colors.gray400, marginTop: 2 },
  content: { padding: 16, paddingTop: 20 },
  todayCard: { alignItems: 'flex-start', marginBottom: 12 },
  todayDate: { fontSize: 12, color: Colors.green, fontWeight: '700', letterSpacing: 0.8 },
  todaySide: { fontSize: 40, fontWeight: '900', color: Colors.white, marginVertical: 8, letterSpacing: -1 },
  todayRule: { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 12 },
  row: { flexDirection: 'row', marginBottom: 4 },
  mr8: { marginRight: 8 },
  halfCard: { flex: 1, gap: 4 },
  halfLabel: { fontSize: 11, color: Colors.gray400, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  halfValue: { fontSize: 13, color: Colors.charcoal, fontWeight: '600' },
  scheduleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: Colors.warmWhite,
    borderRadius: 10, marginBottom: 6,
  },
  scheduleRowToday: { backgroundColor: Colors.deepBlue },
  scheduleDay: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.charcoal },
  scheduleWeekday: { flex: 1, fontSize: 13, color: Colors.gray600 },
  scheduleTodayText: { color: Colors.white },
  sideChip: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20,
  },
  evenChip: { backgroundColor: Colors.blueTeal },
  oddChip: { backgroundColor: Colors.green },
  sideChipText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  exceptionCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  exceptionText: { flex: 1, fontSize: 14, color: Colors.gray600, lineHeight: 20 },
});
