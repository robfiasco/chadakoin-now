import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../lib/colors';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { StatusBadge } from '../components/StatusBadge';
import { UpdatedLine } from '../components/UpdatedLine';
import { todayData, weatherData } from '../services/mockData';

const { width } = Dimensions.get('window');

// ThisWeek row component
function ThisWeekRow({ icon, label, value, valueColor }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.thisWeekRow}>
      <Ionicons name={icon} size={18} color={Colors.green} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, { color: valueColor || Colors.cream }]}>{value}</Text>
    </View>
  );
}

// QuickView card
function QuickCard({ title, value, icon, color }: {
  title: string; value: string; icon: keyof typeof Ionicons.glyphMap; color: string;
}) {
  return (
    <View style={[styles.quickCard, { borderTopColor: color }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickValue}>{value}</Text>
    </View>
  );
}

// QuickLink button
function QuickLink({ label, icon }: { label: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <TouchableOpacity style={styles.quickLink}>
      <Ionicons name={icon} size={20} color={Colors.deepBlue} />
      <Text style={styles.quickLinkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.appName}>Chadakoin Now</Text>
        <Text style={styles.appSubhead}>Jamestown info without the digging</Text>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* This Week Card */}
        <SectionHeader title="This Week" />
        <Card variant="primary" style={styles.thisWeekCard}>
          <ThisWeekRow icon="calendar-outline" label="Holiday Delay" value={todayData.holidayDelay} valueColor={Colors.green} />
          <View style={styles.divider} />
          <ThisWeekRow icon="refresh-outline" label="Recycling" value={todayData.recycling} />
          <View style={styles.divider} />
          <ThisWeekRow icon="car-outline" label="Parking" value={todayData.parking} />
          <View style={styles.divider} />
          <ThisWeekRow icon="warning-outline" label="Alerts" value={todayData.alerts} valueColor={Colors.green} />
        </Card>

        {/* Weather Card */}
        <SectionHeader title="Weather" />
        <Card style={styles.weatherCard}>
          <View style={styles.weatherTop}>
            <View>
              <Text style={styles.weatherTemp}>{weatherData.temp}</Text>
              <Text style={styles.weatherCondition}>{weatherData.condition}</Text>
            </View>
            <View style={styles.weatherRight}>
              <Text style={styles.weatherDetail}>H {weatherData.high} / L {weatherData.low}</Text>
              <Text style={styles.weatherDetail}>Precip {weatherData.precip}</Text>
              <Text style={styles.weatherDetail}>Wind {weatherData.wind}</Text>
            </View>
          </View>
          <View style={styles.weatherNote}>
            <Ionicons name="alert-circle-outline" size={14} color={Colors.amber} />
            <Text style={styles.weatherNoteText}>{weatherData.localNote}</Text>
          </View>
        </Card>

        {/* Quick View */}
        <SectionHeader title="Quick View" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
          <QuickCard title="Parking Today" value="ODD side" icon="car-outline" color={Colors.deepBlue} />
          <QuickCard title="Alerts" value="All clear" icon="checkmark-circle-outline" color={Colors.green} />
          <QuickCard title="Coming Up" value="Council Mar 11" icon="calendar-outline" color={Colors.amber} />
        </ScrollView>

        {/* Quick Links */}
        <SectionHeader title="Quick Links" />
        <View style={styles.quickLinksGrid}>
          <QuickLink label="Recycling" icon="refresh-outline" />
          <QuickLink label="Parking" icon="car-outline" />
          <QuickLink label="Alerts" icon="warning-outline" />
          <QuickLink label="Events" icon="calendar-outline" />
          <QuickLink label="Utilities" icon="flash-outline" />
          <QuickLink label="Contact" icon="call-outline" />
        </View>

        <UpdatedLine text={todayData.updatedAt} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: {
    backgroundColor: Colors.deepBlue,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  appName: { fontSize: 26, fontWeight: '800', color: Colors.white, letterSpacing: -0.5 },
  appSubhead: { fontSize: 13, color: Colors.gray400, marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 20 },
  thisWeekCard: { marginBottom: 16 },
  thisWeekRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowIcon: { marginRight: 10 },
  rowLabel: { flex: 1, fontSize: 14, color: Colors.cream, opacity: 0.7 },
  rowValue: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  weatherCard: { marginBottom: 16 },
  weatherTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  weatherTemp: { fontSize: 48, fontWeight: '300', color: Colors.charcoal, lineHeight: 52 },
  weatherCondition: { fontSize: 14, color: Colors.gray600, marginTop: 2 },
  weatherRight: { alignItems: 'flex-end', gap: 4 },
  weatherDetail: { fontSize: 13, color: Colors.gray600 },
  weatherNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.cream,
  },
  weatherNoteText: { fontSize: 12, color: Colors.amber, flex: 1 },
  quickScroll: { marginBottom: 16, marginHorizontal: -4 },
  quickCard: {
    width: 140,
    backgroundColor: Colors.warmWhite,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 4,
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quickTitle: { fontSize: 12, color: Colors.gray600, marginTop: 8, marginBottom: 4 },
  quickValue: { fontSize: 14, fontWeight: '700', color: Colors.charcoal },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  quickLink: {
    width: (width - 32 - 20) / 3,
    backgroundColor: Colors.warmWhite,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  quickLinkLabel: { fontSize: 12, fontWeight: '600', color: Colors.charcoal, textAlign: 'center' },
});
