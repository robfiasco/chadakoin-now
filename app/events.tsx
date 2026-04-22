import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedBackground } from '../components/ThemedBackground';
import { SkeletonPulse } from '../components/SkeletonPulse';
import { useTheme } from '../lib/ThemeContext';
import { EventItem } from '../hooks/useCivicData';
import { useCivic } from '../lib/CivicDataContext';
import { dark } from '../lib/colors';
import { openLink } from '../lib/openLink';

// ── Category colors & icons ───────────────────────────────────────
type IoniconName = keyof typeof Ionicons.glyphMap;

function categoryColor(cat: string): string {
  const c = cat.toLowerCase();
  if (/music|concert|jazz|band|blues|rock/i.test(c))       return dark.category.music;
  if (/film|cinema|movie|screen/i.test(c))                 return dark.category.film;
  if (/arts?|theater|theatre|gallery|exhibit/i.test(c))    return dark.category.arts;
  if (/sport|athletic|hockey|basketball|soccer/i.test(c))  return dark.category.activity;
  if (/jcc|library|education/i.test(c))                    return dark.category.jcc;
  if (/civic|lecture|forum|summit/i.test(c))               return dark.category.city;
  if (/entertain/i.test(c))                                return dark.category.film;
  return dark.category.community;
}

function categoryIcon(cat: string): IoniconName {
  const c = cat.toLowerCase();
  if (/music|concert|jazz|band/i.test(c))         return 'musical-notes-outline';
  if (/film|cinema|movie/i.test(c))               return 'film-outline';
  if (/arts?|theater|theatre|gallery/i.test(c))   return 'color-palette-outline';
  if (/sport|athletic|hockey|basketball/i.test(c))return 'trophy-outline';
  if (/jcc|library|education/i.test(c))           return 'school-outline';
  if (/civic|lecture|forum/i.test(c))             return 'mic-outline';
  if (/family/i.test(c))                          return 'happy-outline';
  return 'calendar-outline';
}

// ── Date helpers ──────────────────────────────────────────────────
function formatTime(iso: string): { ampm: string; clock: string } {
  if (!iso) return { ampm: '', clock: '—' };
  const d = new Date(iso);
  const h = d.getHours(), m = d.getMinutes();
  if (h === 0 && m === 0) return { ampm: '', clock: '' }; // all-day / no time
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  const mins = m > 0 ? `:${String(m).padStart(2, '0')}` : '';
  return { ampm, clock: `${h12}${mins}` };
}

function formatDayHeader(dateStr: string): { dow: string; label: string } {
  const d = new Date(dateStr + 'T12:00:00');
  const dow = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const mon = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return { dow, label: `${dow} · ${mon} ${d.getDate()}` };
}

function formatFeaturedDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const { ampm, clock } = formatTime(iso);
  return { date: date.toUpperCase(), time: clock ? `${clock} ${ampm}` : '' };
}

// ── Filter helpers ────────────────────────────────────────────────
type FilterKey = 'weekend' | 'week' | string; // string = month name

function getWeekendRange(): [Date, Date] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay(); // 0=Sun,1=Mon,...,6=Sat
  // Find the upcoming Friday (or today if Fri/Sat/Sun)
  let fri = new Date(today);
  if (dow === 0) fri.setDate(today.getDate() - 2);       // Sun → back to Fri
  else if (dow === 6) fri.setDate(today.getDate() - 1);  // Sat → back to Fri
  else if (dow < 5) fri.setDate(today.getDate() + (5 - dow)); // Mon-Thu → next Fri
  // else dow===5 (Fri) → today
  const sun = new Date(fri);
  sun.setDate(fri.getDate() + 2);
  sun.setHours(23, 59, 59, 999);
  return [fri, sun];
}

function getWeekRange(): [Date, Date] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(today.getDate() + 7);
  end.setHours(23, 59, 59, 999);
  return [today, end];
}

function getEventMonth(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('default', { month: 'long' });
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function buildMonthFilters(): { key: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const name = MONTH_NAMES[d.getMonth()];
    return { key: name, label: name.slice(0, 3).toUpperCase() };
  });
}

// ── Day grouping ──────────────────────────────────────────────────
interface DayGroup { dateKey: string; label: string; dow: string; events: EventItem[] }

function groupByDay(events: EventItem[]): DayGroup[] {
  const map = new Map<string, EventItem[]>();
  for (const e of events) {
    const key = e.startDate.split('T')[0];
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return [...map.entries()].map(([key, evts]) => {
    const { dow, label } = formatDayHeader(key);
    return { dateKey: key, label, dow, events: evts };
  });
}

// ── Featured event card ───────────────────────────────────────────
function FeaturedCard({ event }: { event: EventItem }) {
  const { theme } = useTheme();
  const color = categoryColor(event.category);
  const icon  = categoryIcon(event.category);
  const { date, time } = formatFeaturedDate(event.startDate);

  return (
    <TouchableOpacity
      onPress={() => openLink(event.link)}
      activeOpacity={0.75}
      style={feat.card}
    >
      {/* Gradient header */}
      <View style={feat.header}>
        {event.imageUrl ? (
          <>
            <Image
              source={{ uri: event.imageUrl }}
              style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.25 }, { translateY: 22 }] }]}
              resizeMode="cover"
            />
            {/* Dark gradient overlay so pills remain readable over photos */}
            <LinearGradient
              colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.15)', 'transparent'] as any}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)'] as any}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </>
        ) : (
          <>
            <LinearGradient
              colors={[`${color}44`, `${color}18`, 'transparent'] as any}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name={icon} size={100} color={`${color}10`} style={feat.bgIcon} />
          </>
        )}

        {/* Date + time pills */}
        <View style={feat.topRow}>
          <View style={feat.pill}>
            <Text style={feat.pillText}>{date}</Text>
          </View>
          {time ? (
            <View style={feat.pill}>
              <Text style={feat.pillText}>{time}</Text>
            </View>
          ) : null}
        </View>

        {/* Category pill */}
        <View style={[feat.catPill, { backgroundColor: `${color}22`, borderColor: `${color}44` }]}>
          <View style={[feat.catDot, { backgroundColor: color }]} />
          <Text style={[feat.catText, { color }]}>{event.category.toUpperCase()}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={feat.body}>
        <Text style={feat.title} numberOfLines={2}>{event.title}</Text>
        {event.location ? (
          <View style={feat.venueRow}>
            <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.35)" />
            <Text style={feat.venue} numberOfLines={1}>{event.location}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const feat = StyleSheet.create({
  card:   {
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border,
    borderRadius: 18, overflow: 'hidden', marginBottom: 12,
  },
  header: { height: 160, justifyContent: 'space-between', padding: 14 },
  bgIcon: { position: 'absolute', right: -14, bottom: -14 },
  topRow: { flexDirection: 'row', gap: 6, alignSelf: 'flex-end' },
  pill:   {
    backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 7, paddingHorizontal: 10, paddingVertical: 5,
  },
  pillText: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.8 },
  catPill:  {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4,
  },
  catDot:   { width: 5, height: 5, borderRadius: 3 },
  catText:  { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  body:   { padding: 16, gap: 8 },
  title:  { fontFamily: 'Syne', fontSize: 19, fontWeight: '700', color: '#fff', letterSpacing: -0.3, lineHeight: 25 },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  venue:  { fontFamily: 'Outfit', fontSize: 12, color: 'rgba(255,255,255,0.4)', flex: 1 },
});

// ── Day header ────────────────────────────────────────────────────
function DayHeader({ label, dow }: { label: string; dow: string }) {
  const { theme } = useTheme();
  const isToday = dow === new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
    && label.includes(String(new Date().getDate()));

  return (
    <View style={dh.row}>
      <Text style={[dh.dow, { color: theme.acc }]}>
        {isToday ? 'TODAY' : dow}
      </Text>
      <Text style={dh.date}>{label.split('·')[1]?.trim() ?? ''}</Text>
      <LinearGradient
        colors={[`rgba(${theme.accRGB},0.2)`, 'transparent'] as any}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={dh.line}
      />
    </View>
  );
}

const dh = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 4 },
  dow:  { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', letterSpacing: 1.8, minWidth: 40 },
  date: { fontFamily: 'Syne', fontSize: 16, fontWeight: '700', color: '#fff' },
  line: { flex: 1, height: 1 },
});

// ── Event list card ───────────────────────────────────────────────
function EventCard({ event }: { event: EventItem }) {
  const color = categoryColor(event.category);
  const { ampm, clock } = formatTime(event.startDate);

  return (
    <TouchableOpacity
      onPress={() => openLink(event.link)}
      activeOpacity={0.75}
      style={ec.card}
    >
      <View style={[ec.bar, { backgroundColor: color }]} />
      <View style={ec.inner}>
        {/* Time column */}
        {clock ? (
          <View style={ec.timeCol}>
            <Text style={[ec.timeAmpm, { color: `${color}99` }]}>{ampm}</Text>
            <Text style={[ec.timeClock, { color }]}>{clock}</Text>
          </View>
        ) : <View style={ec.timeCol} />}

        {/* Content */}
        <View style={ec.body}>
          <Text style={ec.title} numberOfLines={2}>{event.title}</Text>
          {event.location ? (
            <View style={ec.venueRow}>
              <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.3)" />
              <Text style={ec.venue} numberOfLines={1}>{event.location}</Text>
            </View>
          ) : null}
          <Text style={[ec.category, { color }]}>{event.category.toUpperCase()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const ec = StyleSheet.create({
  card:     {
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border,
    borderRadius: 14, overflow: 'hidden', flexDirection: 'row', marginBottom: 6,
  },
  bar:      { width: 3, flexShrink: 0 },
  inner:    { flexDirection: 'row', gap: 12, padding: 12, flex: 1, alignItems: 'flex-start' },
  timeCol:  { width: 40, flexShrink: 0, alignItems: 'center', paddingTop: 2 },
  timeAmpm: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  timeClock:{ fontFamily: 'Syne', fontSize: 15, fontWeight: '700', lineHeight: 18 },
  body:     { flex: 1, gap: 4 },
  title:    { fontFamily: 'Syne', fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: -0.2, lineHeight: 20 },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  venue:    { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.35)', flex: 1 },
  category: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
});

// ── Screen ────────────────────────────────────────────────────────
export default function EventsScreen() {
  const { theme } = useTheme();
  const civic = useCivic();
  const { events, loading } = civic;
  const [activeFilter, setActiveFilter] = useState<FilterKey>('weekend');
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await civic.refresh();
    setRefreshing(false);
  }

  const now = new Date();
  const upcoming = events.filter(e => new Date(e.startDate) >= now);

  const monthFilters = useMemo(() => buildMonthFilters(), []);
  const eventMonths = useMemo(() => new Set(upcoming.map(e => getEventMonth(e.startDate))), [upcoming]);

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'weekend', label: 'This Weekend' },
    { key: 'week',    label: 'This Week'    },
    ...monthFilters,
  ];

  const filtered = useMemo(() => {
    function getForFilter(key: FilterKey): EventItem[] {
      let result: EventItem[];
      if (key === 'weekend') {
        const [fri, sun] = getWeekendRange();
        result = upcoming.filter(e => { const d = new Date(e.startDate); return d >= fri && d <= sun; });
      } else if (key === 'week') {
        const [start, end] = getWeekRange();
        result = upcoming.filter(e => { const d = new Date(e.startDate); return d >= start && d <= end; });
      } else {
        result = upcoming.filter(e => getEventMonth(e.startDate) === key);
      }
      return result.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }

    const primary = getForFilter(activeFilter);

    // If only 1 event on this filter, automatically widen to avoid featured-only view:
    // weekend → this week → current month → next month
    if (primary.length <= 1 && activeFilter === 'weekend') {
      const week = getForFilter('week');
      if (week.length > 1) return week;
      const month = MONTH_NAMES[new Date().getMonth()];
      const mo = getForFilter(month);
      if (mo.length > 1) return mo;
    } else if (primary.length <= 1 && activeFilter === 'week') {
      const month = MONTH_NAMES[new Date().getMonth()];
      const mo = getForFilter(month);
      if (mo.length > 1) return mo;
    }

    return primary;
  }, [upcoming, activeFilter]);

  const featuredEvent = filtered[0] ?? null;
  const restEvents    = filtered.slice(1);
  const dayGroups     = groupByDay(restEvents);

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <Text style={styles.title}>Events</Text>
        <Text style={[styles.subtitle, { color: theme.acc }]}>Upcoming in Jamestown</Text>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={{ marginTop: 14 }}
        >
          {FILTERS.map(f => {
            const active = f.key === activeFilter;
            const hasEvents = f.key === 'weekend' || f.key === 'week' || eventMonths.has(f.key);
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={hasEvents ? 0.7 : 0.4}
                style={[
                  styles.chip,
                  active && {
                    backgroundColor: `rgba(${theme.accRGB},0.12)`,
                    borderColor: `rgba(${theme.accRGB},0.35)`,
                  },
                  !hasEvents && { opacity: 0.35 },
                ]}
              >
                <Text style={[styles.chipText, active && { color: theme.acc }]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
          <>
            {/* Featured skeleton */}
            <View style={sk.featCard}>
              <SkeletonPulse width="100%" height={160} borderRadius={0} accRGB={theme.accRGB} />
              <View style={{ padding: 16, gap: 8 }}>
                <SkeletonPulse width="80%" height={19} borderRadius={5} accRGB={theme.accRGB} />
                <SkeletonPulse width="50%" height={12} borderRadius={4} accRGB={theme.accRGB} />
              </View>
            </View>
            {[1, 2, 3].map(i => (
              <View key={i} style={sk.rowCard}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <SkeletonPulse width={40} height={40} borderRadius={6} accRGB={theme.accRGB} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <SkeletonPulse width="75%" height={14} borderRadius={4} accRGB={theme.accRGB} />
                    <SkeletonPulse width="45%" height={11} borderRadius={4} accRGB={theme.accRGB} />
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="calendar-outline" size={32} color="rgba(255,255,255,0.15)" style={{ marginBottom: 10 }} />
            <Text style={styles.emptyText}>
              {activeFilter === 'weekend'
                ? 'No events this weekend'
                : activeFilter === 'week'
                  ? 'No events this week'
                  : `No events in ${activeFilter}`}
            </Text>
          </View>
        ) : (
          <>
            {/* Featured */}
            {featuredEvent && (
              <>
                <View style={styles.sectionRow}>
                  <Ionicons name="star-outline" size={12} color={theme.acc} />
                  <Text style={[styles.sectionLabel, { color: theme.acc }]}>Featured</Text>
                </View>
                <FeaturedCard event={featuredEvent} />
              </>
            )}

            {/* Day groups */}
            {dayGroups.map(group => (
              <View key={group.dateKey} style={{ marginBottom: 6 }}>
                <DayHeader label={group.label} dow={group.dow} />
                {group.events.map((e, i) => <EventCard key={i} event={e} />)}
              </View>
            ))}
          </>
        )}

        <Text style={[styles.footer, { color: `rgba(${theme.accRGB},0.2)` }]}>
          {civic.lastUpdated
            ? `Updated ${new Date(civic.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Loading…'}
        </Text>
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  safe:     { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 16 },
  title:    { fontFamily: 'Syne', fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 },

  chipsRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip:     {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border,
  },
  chipText: { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },

  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 48 },

  sectionRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionLabel:{ fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },

  emptyWrap: { paddingTop: 48, alignItems: 'center' },
  emptyText: { fontFamily: 'Outfit', fontSize: 14, color: 'rgba(255,255,255,0.3)' },

  footer:   { fontFamily: 'Outfit', fontSize: 10, textAlign: 'center', marginTop: 20 },
});

const sk = StyleSheet.create({
  featCard: {
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border,
    borderRadius: 18, overflow: 'hidden', marginBottom: 12,
  },
  rowCard: {
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border,
    borderRadius: 14, padding: 14, marginBottom: 6,
  },
});
