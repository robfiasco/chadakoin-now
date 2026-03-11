import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse, ErrorBanner } from '../components/SkeletonPulse';
import { useTheme } from '../lib/ThemeContext';
import { useCivicData } from '../hooks/useCivicData';

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

        <Text style={[styles.sectionLabel, { color: theme.acc45 }]}>THIS WEEK</Text>
        {/* @ts-ignore */}
        <View style={[styles.card, panelGlow]}>
          {loading ? (
            <View style={{ gap: 10 }}>
              <SkeletonPulse width={80} height={11} borderRadius={4} accRGB={theme.accRGB} />
              <SkeletonPulse width={160} height={28} borderRadius={6} accRGB={theme.accRGB} />
              <SkeletonPulse width={120} height={28} borderRadius={6} accRGB={theme.accRGB} />
            </View>
          ) : (
            <>
              {recycling.thisWeek.dateRange ? (
                <Text style={[styles.weekRange, { color: theme.acc }]}>{recycling.thisWeek.dateRange}</Text>
              ) : null}
              <View style={styles.itemRow}>
                <Ionicons name="checkmark-circle" size={18} color={theme.acc} />
                <Text style={styles.itemText}>{recycling.thisWeek.material}</Text>
              </View>
            </>
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.acc45 }]}>NEXT WEEK</Text>
        {/* @ts-ignore */}
        <View style={[styles.card, panel]}>
          {loading ? (
            <View style={{ gap: 8 }}>
              <SkeletonPulse width={80} height={11} borderRadius={4} accRGB={theme.accRGB} />
              <SkeletonPulse width="100%" height={20} borderRadius={4} accRGB={theme.accRGB} />
            </View>
          ) : (
            <>
              {recycling.nextWeek.dateRange ? (
                <Text style={[styles.weekRange, { color: `rgba(${theme.accRGB},0.45)` }]}>{recycling.nextWeek.dateRange}</Text>
              ) : null}
              <View style={styles.itemRowLight}>
                <Ionicons name="ellipse-outline" size={13} color="rgba(255,255,255,0.3)" />
                <Text style={styles.itemTextLight}>{recycling.nextWeek.material}</Text>
              </View>
            </>
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.acc45 }]}>HOLIDAY RULE</Text>
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

        <Text style={[styles.sectionLabel, { color: theme.acc45 }]}>ROTATION</Text>
        {['Week A: Cardboard & Paper', 'Week B: Plastic, Cans & Glass'].map((r, i) => (
          // @ts-ignore
          <View key={i} style={[styles.card, panel, { marginBottom: i === 0 ? 8 : 0 }]}>
            <Text style={styles.rotationText}>{r}</Text>
          </View>
        ))}

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
  card: { padding: 20, marginBottom: 0 },
  weekRange: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  itemText: { fontFamily: 'Syne', fontSize: 18, fontWeight: '700', color: '#fff' },
  itemRowLight: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  itemTextLight: { fontFamily: 'Outfit', fontSize: 15, color: 'rgba(255,255,255,0.65)' },
  infoText: { fontFamily: 'Outfit', flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },
  rotationText: { fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  delayBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 8 },
  delayText: { fontFamily: 'Outfit', fontSize: 12, color: '#f59e0b', flex: 1, lineHeight: 17 },
  updatedLine: { fontFamily: 'Outfit', fontSize: 11, textAlign: 'center', marginTop: 28 },
});
