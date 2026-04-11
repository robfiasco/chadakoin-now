import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse } from '../components/SkeletonPulse';
import { useTheme } from '../lib/ThemeContext';
import { useCivicData, EventItem } from '../hooks/useCivicData';

const DAY_COLORS = ['#00D4C8', '#9B6DFF', '#FF6B8A', '#F5A623', '#5B8DB8'];

function accentForDate(iso: string): string {
  const day = new Date(iso).getDate();
  return DAY_COLORS[day % DAY_COLORS.length];
}

function hexToRGB(hex: string): string {
  const h = hex.replace('#', '');
  return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
}

function getEventMonth(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('default', { month: 'long' });
}

function formatParts(iso: string): { day: string; dayNum: string; time: string } {
  if (!iso) return { day: '', dayNum: '—', time: '' };
  const d = new Date(iso);
  return {
    day:    d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    dayNum: String(d.getDate()),
    time:   d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Show current month + 5 more (6 total)
function buildMonthRange(): string[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return MONTH_NAMES[d.getMonth()];
  });
}

export default function EventsScreen() {
  const { theme } = useTheme();
  const civic = useCivicData();
  const { events, loading, error } = civic;
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const monthRange = buildMonthRange();

  // Only show events that haven't started yet
  const upcoming = events.filter(e => new Date(e.startDate) >= now);
  const eventMonths = new Set(upcoming.map(e => getEventMonth(e.startDate)));
  const currentMonth = activeMonth ?? (eventMonths.has(monthRange[0]) ? monthRange[0] : [...eventMonths][0] ?? monthRange[0]);

  const filtered = upcoming
    .filter(e => getEventMonth(e.startDate) === currentMonth)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  async function onRefresh() {
    setRefreshing(true);
    await civic.refresh();
    setRefreshing(false);
  }

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Text style={[styles.subhead, { color: theme.acc55 }]}>Upcoming in Jamestown</Text>

        {/* Month tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthsRow}>
          {monthRange.map(m => {
            const hasEvents = eventMonths.has(m);
            const isActive  = m === currentMonth;
            return (
              <TouchableOpacity
                key={m}
                activeOpacity={hasEvents ? 0.7 : 1}
                onPress={() => hasEvents && setActiveMonth(m)}
                style={[
                  styles.monthPill,
                  isActive  ? [styles.monthActive,   { backgroundColor: theme.acc }] :
                  hasEvents ? styles.monthInactive :
                              styles.monthEmpty,
                ]}
              >
                <Text style={[
                  styles.monthText,
                  isActive  ? [styles.monthTextActive,   { color: theme.bg }] :
                  hasEvents ? styles.monthTextInactive :
                              styles.monthTextEmpty,
                ]}>
                  {m.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>


      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.acc} colors={[theme.acc]} />
        }
      >
        <Text style={[styles.sectionLabel, { color: theme.acc }]}>{currentMonth.toUpperCase()} EVENTS</Text>

        {loading ? (
          [1,2,3].map(i => (
            <View key={i} style={[styles.card, { borderColor: 'rgba(255,255,255,0.07)', marginBottom: 8 }]}>
              <View style={[styles.cardAccent, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
              <View style={[styles.cardInner, { gap: 10 }]}>
                <SkeletonPulse width={38} height={50} borderRadius={6} accRGB={theme.accRGB} />
                <View style={{ flex: 1, gap: 6 }}>
                  <SkeletonPulse width="70%" height={13} borderRadius={4} accRGB={theme.accRGB} />
                  <SkeletonPulse width="45%" height={10} borderRadius={4} accRGB={theme.accRGB} />
                </View>
              </View>
            </View>
          ))
        ) : filtered.length === 0 ? (
          <View style={[styles.card, { borderColor: 'rgba(255,255,255,0.07)' }]}>
            <View style={[styles.cardAccent, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
            <View style={styles.cardInner}>
              <Text style={styles.emptyText}>
                {events.length === 0 ? 'No upcoming events found.' : `No events in ${currentMonth}.`}
              </Text>
            </View>
          </View>
        ) : (
          filtered.map((event, i) => {
            const accent = accentForDate(event.startDate);
            const accentRGB = hexToRGB(accent);
            const { day, dayNum, time } = formatParts(event.startDate);
            const isToday = event.startDate.startsWith(todayStr);
            return (
              <View
                key={i}
                style={[styles.card, { borderColor: 'rgba(255,255,255,0.07)' }]}
              >
                <View style={[styles.cardAccent, { backgroundColor: accent }]} />
                <View style={styles.cardInner}>
                  {/* Date column */}
                  <View style={styles.dateCol}>
                    <Text style={styles.dateDayLabel}>{day}</Text>
                    <Text style={[styles.dateNum, { color: accent }]}>{dayNum}</Text>
                    {isToday && (
                      <Text style={[styles.todayPill, { backgroundColor: theme.acc, color: theme.bg }]}>Today</Text>
                    )}
                    <Text style={styles.dateTime} numberOfLines={1}>{time}</Text>
                  </View>

                  {/* Vertical divider */}
                  <View style={styles.dividerV} />

                  {/* Event body */}
                  <View style={styles.eventBody}>
                    <Text style={styles.eventName} numberOfLines={2}>{event.title}</Text>
                    {event.location ? (
                      <Text style={styles.eventLoc} numberOfLines={1}>{event.location}</Text>
                    ) : null}
                    {event.tags.length > 0 && (
                      <View style={styles.tagsRow}>
                        {event.tags.slice(0, 3).map(tag => (
                          <Text
                            key={tag}
                            style={[styles.tag, {
                              color: `rgba(${accentRGB},0.8)`,
                              backgroundColor: `rgba(${accentRGB},0.08)`,
                              borderColor: `rgba(${accentRGB},0.2)`,
                            }]}
                          >
                            {tag.toUpperCase()}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}

        <Text style={[styles.updatedLine, { color: `rgba(${theme.accRGB},0.25)` }]}>
          {civic.lastUpdated
            ? `Updated ${new Date(civic.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Loading…'}
        </Text>
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  header:   { paddingHorizontal: 20, paddingBottom: 0, paddingTop: 40, zIndex: 10 },
  title:    { fontFamily: 'Syne', fontSize: 21, fontWeight: '700', color: '#fff' },
  subhead:  { fontFamily: 'Outfit', fontSize: 11, marginTop: 3, letterSpacing: 1 },

  // Month tabs
  monthsRow:         { flexDirection: 'row', gap: 6, marginTop: 12, marginBottom: 16 },
  monthPill:         { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  monthActive:       {},
  monthInactive:     { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  monthEmpty:        { borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', opacity: 0.4 },
  monthText:         { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700' },
  monthTextActive:   {},
  monthTextInactive: { color: 'rgba(255,255,255,0.4)' },
  monthTextEmpty:    { color: 'rgba(255,255,255,0.15)' },

  content:      { padding: 16, paddingTop: 4, paddingBottom: 32 },
  sectionLabel: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginTop: 4 },

  // Card
  card:      { borderWidth: 1, borderRadius: 16, marginBottom: 8, flexDirection: 'row', overflow: 'hidden' },
  cardAccent:{ width: 3, flexShrink: 0, alignSelf: 'stretch', borderRadius: 0 },
  cardInner: { flexDirection: 'row', gap: 12, padding: 12, paddingLeft: 10, flex: 1 },

  // Date column
  dateCol:      { width: 44, flexShrink: 0, alignItems: 'center' },
  dateDayLabel: { fontFamily: 'Outfit', fontSize: 8, fontWeight: '600', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.6 },
  dateNum:      { fontFamily: 'Syne', fontSize: 17, fontWeight: '800', lineHeight: 20 },
  dateTime:     { fontFamily: 'Outfit', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4, textAlign: 'center' },
  todayPill:    { fontFamily: 'Outfit', fontSize: 8, fontWeight: '800', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.4, overflow: 'hidden' },

  // Divider
  dividerV: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 2, flexShrink: 0 },

  // Event body
  eventBody: { flex: 1, minWidth: 0 },
  eventName: { fontFamily: 'Outfit', fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: -0.2, lineHeight: 18, marginBottom: 4 },
  eventLoc:  { fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 6 },
  tagsRow:   { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  tag:       { fontFamily: 'Outfit', fontSize: 8, fontWeight: '700', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, letterSpacing: 0.6, textTransform: 'uppercase', borderWidth: 1 },

  emptyText:   { fontFamily: 'Outfit', color: 'rgba(255,255,255,0.3)', fontSize: 13 },
  updatedLine: { fontFamily: 'Outfit', fontSize: 11, textAlign: 'center', marginTop: 28 },
});
