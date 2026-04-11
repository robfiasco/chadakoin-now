import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse } from '../components/SkeletonPulse';
import { useTheme } from '../lib/ThemeContext';
import { useCivicData } from '../hooks/useCivicData';
import { openLink } from '../lib/openLink';

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AlertsScreen() {
  const { theme } = useTheme();
  const civic = useCivicData();
  const { alerts, loading, error } = civic;
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
  const panel     = { borderRadius: 20, borderWidth: 1, backgroundColor: `rgba(${theme.accRGB},0.05)`, borderColor: `rgba(${theme.accRGB},0.16)`, ...glassWeb };
  const panelGlow = { borderRadius: 20, borderWidth: 1, backgroundColor: `rgba(${theme.accRGB},0.07)`, borderColor: `rgba(${theme.accRGB},0.22)`, ...glassWeb };

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={[styles.subhead, { color: theme.acc55 }]}>Jamestown advisories</Text>
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
          // @ts-ignore
          <View style={[styles.statusCard, panelGlow, { gap: 12 }]}>
            <SkeletonPulse width={40} height={40} borderRadius={20} accRGB={theme.accRGB} />
            <SkeletonPulse width={100} height={22} borderRadius={6} accRGB={theme.accRGB} />
            <SkeletonPulse width={180} height={14} borderRadius={4} accRGB={theme.accRGB} />
          </View>
        ) : (
          // @ts-ignore
          <View style={[styles.statusCard, isClear ? panelGlow : {
            borderRadius: 20, borderWidth: 1,
            backgroundColor: 'rgba(220,0,50,0.08)',
            borderColor: 'rgba(220,0,50,0.25)',
            ...glassWeb,
          }]}>
            <Ionicons
              name={isClear ? 'checkmark-circle' : 'alert-circle'}
              size={32}
              color={isClear ? theme.acc : '#ff4466'}
            />
            <Text style={[styles.statusText, { color: isClear ? theme.acc : '#ff4466' }]}>
              {isClear ? 'All Clear' : 'Active Alert'}
            </Text>
            <Text style={styles.statusMessage}>
              {isClear ? 'No active alerts for Jamestown.' : `${alerts.activeAlerts.length} active alert${alerts.activeAlerts.length > 1 ? 's' : ''}`}
            </Text>
            <View style={[styles.chip, { backgroundColor: `rgba(${theme.accRGB},0.15)`, borderColor: `rgba(${theme.accRGB},0.3)` }]}>
              <Text style={[styles.chipText, { color: theme.acc }]}>
                {isClear ? 'No active alerts' : 'Check updates below'}
              </Text>
            </View>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: theme.acc45 }]}>RECENT UPDATES</Text>
        {loading ? (
          [1, 2].map(i => (
            // @ts-ignore
            <View key={i} style={[styles.updateCard, panel, { gap: 8 }]}>
              <SkeletonPulse width={80} height={12} borderRadius={4} accRGB={theme.accRGB} />
              <SkeletonPulse width="100%" height={16} borderRadius={4} accRGB={theme.accRGB} />
              <SkeletonPulse width="80%" height={13} borderRadius={4} accRGB={theme.accRGB} />
            </View>
          ))
        ) : alerts.activeAlerts.length === 0 ? (
          // @ts-ignore
          <View style={[styles.updateCard, panel]}>
            <Text style={styles.emptyText}>No recent updates from Jamestown BPU.</Text>
          </View>
        ) : (
          alerts.activeAlerts.map((alert, i) => (
            // @ts-ignore
            <View key={i} style={[styles.alertCard, {
              borderRadius: 20, borderWidth: 1,
              backgroundColor: 'rgba(220,0,50,0.07)',
              borderColor: 'rgba(220,0,50,0.2)',
              ...glassWeb,
            }]}>
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
                  <Text style={[styles.alertLink, { color: theme.acc }]}>Read more →</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))
        )}

        <Text style={[styles.updatedLine, { color: `rgba(${theme.accRGB},0.35)` }]}>
          Refreshes every 5 minutes
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
  statusCard: { padding: 28, alignItems: 'center', gap: 10 },
  statusText: { fontFamily: 'Syne', fontSize: 22, fontWeight: '700' },
  statusMessage: { fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  chip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
  alertCard: { padding: 18, marginBottom: 8 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  alertDate: { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600', color: 'rgba(255,80,80,0.7)', flex: 1 },
  alertTitle: { fontFamily: 'Outfit', fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 6 },
  alertBody: { fontFamily: 'Outfit', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 18, marginBottom: 8 },
  alertLink: { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600' },
  updateCard: { padding: 18, marginBottom: 8 },
  emptyText: { fontFamily: 'Outfit', color: 'rgba(255,255,255,0.3)', fontSize: 13 },
  updatedLine: { fontFamily: 'Outfit', fontSize: 11, textAlign: 'center', marginTop: 28 },
});
