import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse, ErrorBanner } from '../components/SkeletonPulse';
import { useTheme } from '../lib/ThemeContext';
import { useCivicData, EventItem } from '../hooks/useCivicData';

function formatEventDate(iso: string): { date: string; time: string } {
  if (!iso) return { date: '—', time: '' };
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return { date, time };
}

function getEventMonth(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('default', { month: 'long' });
}

export default function EventsScreen() {
  const { theme } = useTheme();
  const { events, loading, error } = useCivicData();
  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  // Derive available months from live events
  const months = Array.from(new Set(events.map(e => getEventMonth(e.startDate)))).slice(0, 4);
  const currentMonth = activeMonth ?? months[0] ?? new Date().toLocaleString('default', { month: 'long' });

  const filtered = events
    .filter(e => getEventMonth(e.startDate) === currentMonth)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());


  const glassWeb = Platform.OS === 'web'
    ? { backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }
    : {};
  const panel     = { borderRadius: 20, borderWidth: 1, backgroundColor: `rgba(${theme.accRGB},0.05)`, borderColor: `rgba(${theme.accRGB},0.16)`, ...glassWeb };
  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Text style={[styles.subhead, { color: theme.acc55 }]}>Upcoming in Jamestown</Text>
      </SafeAreaView>

      {/* Month tabs — built from live data */}
      {months.length > 0 && (
        <View style={styles.tabs}>
          {months.map(m => {
            const isActive = m === currentMonth;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.tab, isActive
                  ? { backgroundColor: `rgba(${theme.accRGB},0.15)`, borderColor: `rgba(${theme.accRGB},0.3)` }
                  : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.1)' }
                ]}
                onPress={() => setActiveMonth(m)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, { color: isActive ? theme.acc : 'rgba(255,255,255,0.35)' }]}>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {error && <ErrorBanner message={error} accRGB={theme.accRGB} />}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionLabel, { color: theme.acc45 }]}>{currentMonth.toUpperCase()} EVENTS</Text>

        {loading ? (
          [1, 2, 3].map(i => (
            // @ts-ignore
            <View key={i} style={[styles.eventCard, panel, { gap: 8 }]}>
              <SkeletonPulse width={50} height={14} borderRadius={4} accRGB={theme.accRGB} />
              <SkeletonPulse width="80%" height={16} borderRadius={4} accRGB={theme.accRGB} />
              <SkeletonPulse width="60%" height={12} borderRadius={4} accRGB={theme.accRGB} />
            </View>
          ))
        ) : filtered.length === 0 ? (
          // @ts-ignore
          <View style={[styles.eventCard, panel]}>
            <Text style={styles.emptyText}>
              {events.length === 0 ? 'No upcoming events found.' : `No events in ${currentMonth}.`}
            </Text>
          </View>
        ) : (
          filtered.map((event, i) => {
            const { date, time } = formatEventDate(event.startDate);
            return (
              // @ts-ignore
              <TouchableOpacity key={i} style={[styles.eventCard, panel]} activeOpacity={event.link ? 0.7 : 1} onPress={() => event.link && Linking.openURL(event.link)}>
                <View style={styles.eventLeft}>
                  <Text style={[styles.eventDate, { color: theme.acc }]}>{date}</Text>
                  <Text style={styles.eventTime}>{time}</Text>
                </View>
                <View style={styles.dividerV} />
                <View style={styles.eventRight}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {event.location ? (
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.3)" />
                      <Text style={styles.eventLocation}>{event.location}</Text>
                    </View>
                  ) : null}
                  {event.tags.length > 0 && (
                    <View style={styles.tags}>
                      {event.tags.slice(0, 2).map(tag => (
                        <View key={tag} style={[styles.tag, { backgroundColor: `rgba(${theme.accRGB},0.1)`, borderColor: `rgba(${theme.accRGB},0.2)` }]}>
                          <Text style={[styles.tagText, { color: theme.acc55 }]}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                {event.link && (
                  <Ionicons name="open-outline" size={12} color={`rgba(${theme.accRGB},0.3)`} style={{ alignSelf: 'flex-start', marginTop: 2 }} />
                )}
              </TouchableOpacity>
            );
          })
        )}

        <Text style={[styles.updatedLine, { color: `rgba(${theme.accRGB},0.35)` }]}>
          Refreshes every hour
        </Text>
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 40, zIndex: 10 },
  title: { fontFamily: 'Syne', fontSize: 21, fontWeight: '700', color: '#fff' },
  subhead: { fontFamily: 'Outfit', fontSize: 11, marginTop: 3, letterSpacing: 1 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12, flexWrap: 'wrap' },
  tab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  tabText: { fontFamily: 'Outfit', fontSize: 13, fontWeight: '600' },
  content: { padding: 16, paddingTop: 4, paddingBottom: 32 },
  sectionLabel: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 4, paddingLeft: 2 },
  eventCard: { flexDirection: 'row', gap: 14, padding: 18, marginBottom: 8, alignItems: 'flex-start' },
  eventLeft: { alignItems: 'center', minWidth: 44 },
  eventDate: { fontFamily: 'Syne', fontSize: 13, fontWeight: '700' },
  eventTime: { fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 3 },
  dividerV: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.07)' },
  eventRight: { flex: 1 },
  eventTitle: { fontFamily: 'Outfit', fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  eventLocation: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  tagText: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '600' },
  emptyText: { fontFamily: 'Outfit', color: 'rgba(255,255,255,0.3)', fontSize: 13 },
  updatedLine: { fontFamily: 'Outfit', fontSize: 11, textAlign: 'center', marginTop: 28 },
});
