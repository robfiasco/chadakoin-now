import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse } from '../components/SkeletonPulse';
import { dark } from '../lib/colors';
import { useCivic } from '../lib/CivicDataContext';
import { openLink } from '../lib/openLink';

const ACC     = '#22d3ee';  // cyan-400
const ACC_RGB = '34,211,238';

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AlertsScreen() {
  const civic = useCivic();
  const { alerts, loading } = civic;
  const isClear = !alerts.hasActiveAlerts;
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await civic.refresh();
    setRefreshing(false);
  }

  const glassWeb = Platform.OS === 'web'
    ? { backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }
    : {};

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.subhead}>Jamestown advisories</Text>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACC} colors={[ACC]} />
        }
      >

        {/* Status hero */}
        {loading ? (
          // @ts-ignore
          <View style={[styles.statusCard, glassWeb, { borderColor: dark.border }]}>
            <SkeletonPulse width={40}  height={40} borderRadius={20} accRGB={ACC_RGB} />
            <SkeletonPulse width={100} height={22} borderRadius={6}  accRGB={ACC_RGB} />
            <SkeletonPulse width={180} height={14} borderRadius={4}  accRGB={ACC_RGB} />
          </View>
        ) : (
          // @ts-ignore
          <View style={[
            styles.statusCard, glassWeb,
            isClear
              ? { borderColor: dark.border, backgroundColor: dark.surface }
              : { borderColor: 'rgba(220,0,50,0.28)', backgroundColor: 'rgba(220,0,50,0.07)' },
          ]}>
            <Ionicons
              name={isClear ? 'checkmark-circle' : 'alert-circle'}
              size={32}
              color={isClear ? ACC : '#ff4466'}
            />
            <Text style={[styles.statusText, { color: isClear ? ACC : '#ff4466' }]}>
              {isClear ? 'All Clear' : 'Active Alert'}
            </Text>
            <Text style={styles.statusMessage}>
              {isClear
                ? 'No active alerts for Jamestown.'
                : `${alerts.activeAlerts.length} active alert${alerts.activeAlerts.length > 1 ? 's' : ''}`}
            </Text>
            <View style={[styles.chip, isClear
              ? { backgroundColor: `rgba(${ACC_RGB},0.12)`, borderColor: `rgba(${ACC_RGB},0.28)` }
              : { backgroundColor: 'rgba(220,0,50,0.12)', borderColor: 'rgba(220,0,50,0.3)' },
            ]}>
              <Text style={[styles.chipText, { color: isClear ? ACC : '#ff4466' }]}>
                {isClear ? 'No active alerts' : 'Check updates below'}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionLabel}>RECENT UPDATES</Text>

        {loading ? (
          [1, 2].map(i => (
            // @ts-ignore
            <View key={i} style={[styles.updateCard, glassWeb, { gap: 8 }]}>
              <SkeletonPulse width={80}   height={12} borderRadius={4} accRGB={ACC_RGB} />
              <SkeletonPulse width="100%" height={16} borderRadius={4} accRGB={ACC_RGB} />
              <SkeletonPulse width="80%"  height={13} borderRadius={4} accRGB={ACC_RGB} />
            </View>
          ))
        ) : alerts.activeAlerts.length === 0 ? (
          // @ts-ignore
          <View style={[styles.updateCard, glassWeb]}>
            <Text style={styles.emptyText}>No recent updates from Jamestown BPU.</Text>
          </View>
        ) : (
          alerts.activeAlerts.map((alert, i) => (
            // @ts-ignore
            <View key={i} style={[styles.alertCard, glassWeb]}>
              <View style={styles.alertHeader}>
                <Ionicons name="alert-circle" size={16} color="#ff4466" />
                <Text style={styles.alertDate}>{formatDate(alert.pubDate)}</Text>
              </View>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              {alert.description ? (
                <Text style={styles.alertBody}>{alert.description}</Text>
              ) : null}
              {alert.link ? (
                <TouchableOpacity
                  onPress={() => openLink(alert.link)}
                  accessibilityLabel={`Read more about: ${alert.title}`}
                  accessibilityRole="link"
                >
                  <Text style={[styles.alertLink, { color: ACC }]}>Read more →</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))
        )}

        <Text style={styles.updatedLine}>Refreshes every 5 minutes</Text>
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  header:  { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 40, zIndex: 10 },
  title:   { fontFamily: 'Syne', fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  subhead: { fontFamily: 'Outfit', fontSize: 11, marginTop: 4, letterSpacing: 1.5, textTransform: 'uppercase', color: ACC },
  content: { padding: 16, paddingTop: 4, paddingBottom: 32, gap: 0 },

  sectionLabel: {
    fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.8,
    textTransform: 'uppercase', marginBottom: 8, marginTop: 20, paddingLeft: 2,
    color: `rgba(${ACC_RGB},0.45)`,
  },

  statusCard: {
    padding: 28, alignItems: 'center', gap: 10,
    borderRadius: 18, borderWidth: 1,
  },
  statusText:    { fontFamily: 'Syne', fontSize: 22, fontWeight: '700' },
  statusMessage: { fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  chip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },

  updateCard: {
    padding: 18, marginBottom: 8, borderRadius: 14, borderWidth: 1,
    backgroundColor: dark.surface, borderColor: dark.border,
  },
  emptyText: { fontFamily: 'Outfit', color: 'rgba(255,255,255,0.3)', fontSize: 13 },

  alertCard: {
    padding: 18, marginBottom: 8, borderRadius: 14, borderWidth: 1,
    backgroundColor: 'rgba(220,0,50,0.06)', borderColor: 'rgba(220,0,50,0.2)',
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  alertDate:   { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600', color: 'rgba(255,80,80,0.7)', flex: 1 },
  alertTitle:  { fontFamily: 'Outfit', fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 6 },
  alertBody:   { fontFamily: 'Outfit', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 18, marginBottom: 8 },
  alertLink:   { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600' },

  updatedLine: {
    fontFamily: 'Outfit', fontSize: 11, textAlign: 'center', marginTop: 28,
    color: `rgba(${ACC_RGB},0.3)`,
  },
});
