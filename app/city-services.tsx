import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '../components/ThemedBackground';
import { PulsingDot } from '../components/PulsingDot';
import { CITY_SERVICES, CityService, ServiceStatus } from '../data/cityServices';
import { dark } from '../lib/colors';
import { openLink } from '../lib/openLink';
import { useCivic } from '../lib/CivicDataContext';
import { DpwWeekUpdate } from '../hooks/useCivicData';

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function buildDpwService(dpw: DpwWeekUpdate): CityService {
  const streetItems = dpw.items.filter(i => !i.isCitywideSupport);
  const citywideItems = dpw.items.filter(i => i.isCitywideSupport);

  const details = streetItems.map(item => ({
    label: item.segment ? `${item.street} (${item.segment})` : item.street,
    value: item.activity,
  }));
  if (citywideItems.length > 0) {
    details.push({
      label: 'Citywide',
      value: citywideItems.map(i => i.activity).join(' · '),
    });
  }

  const links = [{ label: 'This week’s full update', url: dpw.sourceUrl }];
  if (dpw.seasonalPdfUrl) {
    links.push({ label: 'Full 2026 seasonal construction list', url: dpw.seasonalPdfUrl });
  }

  return {
    id: 'dpw',
    icon: 'construct-outline',
    title: 'DPW — Where We Are Working',
    badge: 'THIS WEEK',
    badgeColor: dark.category.streets,
    status: 'active',
    summary: `${streetItems.length} street${streetItems.length === 1 ? '' : 's'} this week\nUpdated ${relativeTime(dpw.fetchedAt)}`,
    details,
    tip: 'Weekly update from DPW — schedules are tentative and can shift with weather.',
    links,
  };
}

type FilterOption = 'all' | ServiceStatus;

const STATUS_LABELS: Record<ServiceStatus, string> = {
  active: 'OPEN NOW',
  imminent: 'SOON', // was a hardcoded "STARTS MAY 1" that went stale the instant May passed — see badgeLabel/badge fallback below, this text is now a last-resort only
  'coming-up': 'COMING UP',
  'year-round': 'YEAR ROUND',
};

const STATUS_COLORS: Record<ServiceStatus, string> = {
  active: dark.category.recycling,    // emerald
  imminent: '#f97316',                // orange — urgent but not red
  'coming-up': dark.category.film,    // amber
  'year-round': dark.category.city,   // cyan
};

function StatusPill({ status, label }: { status: ServiceStatus; label?: string }) {
  const color = STATUS_COLORS[status];
  const pulse = status === 'active' || status === 'imminent';
  return (
    <View style={[pill.wrap, { borderColor: `${color}40`, backgroundColor: `${color}18` }]}>
      {pulse && <PulsingDot color={color} size={6} />}
      <Text style={[pill.text, { color }]}>{label ?? STATUS_LABELS[status]}</Text>
    </View>
  );
}

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Site hours (per jamestownnybpu.gov/233/Yard-Waste): Saturdays Apr 11–Nov
// 14, 7am–1pm; Wednesdays May 13–Sep 30, 4pm–7pm. Boundaries use the
// current year so this keeps working next year without edits, as long as
// BPU republishes similar month/day windows — update YARD_WASTE_SAT_CLOSURES
// annually, same as the recycling holiday lists in useCivicData.ts.
const YARD_WASTE_SAT_CLOSURES = ['2026-05-30', '2026-07-11', '2026-09-12']; // Saturdays after summer holidays

function computeYardWasteService(base: CityService): CityService {
  const now = new Date();
  const todayKey = localDateKey(now);
  const dow = now.getDay(); // 0=Sun..6=Sat, 3=Wed
  const hour = now.getHours();
  const y = now.getFullYear();

  const satSeason = now >= new Date(y, 3, 11) && now <= new Date(y, 10, 14, 23, 59, 59);
  const wedSeason = now >= new Date(y, 4, 13) && now <= new Date(y, 8, 30, 23, 59, 59);
  const openSatNow = dow === 6 && satSeason && !YARD_WASTE_SAT_CLOSURES.includes(todayKey) && hour >= 7 && hour < 13;
  const openWedNow = dow === 3 && wedSeason && hour >= 16 && hour < 19;

  if (openSatNow || openWedNow) {
    return { ...base, status: 'active', badgeLabel: 'OPEN NOW', defaultExpanded: true };
  }
  if (satSeason) {
    return { ...base, status: 'coming-up', badgeLabel: 'OPEN SAT 7AM–1PM', defaultExpanded: false };
  }
  return { ...base, status: 'coming-up', badgeLabel: 'CLOSED FOR SEASON', defaultExpanded: false };
}

// Nov 3, 2026 General Election — badge text advances through the calendar
// instead of staying a static "REGISTER BY OCT 24" that goes stale the
// moment that date passes (same staleness bug this whole pass started
// from — see computeYardWasteService above). Dates are local-device
// calendar dates (localDateKey), same ET assumption every other computed
// card in this file already makes — this app's whole audience is in
// Jamestown, NY. No unit test harness in this repo to force dates against,
// so the 4 phases are spelled out here instead:
//   < Oct 24            "REGISTER BY OCT 24" — registration must be
//                        RECEIVED by this date (not postmarked).
//   Oct 24 – Nov 1       "EARLY VOTING OPEN" — the actual early-voting
//                        window (confirmed against the county's own
//                        early-voting page: Sat/Sun 9am-5pm, Mon/Tue
//                        noon-8pm, Wed-Fri 10am-6pm, repeating).
//   Nov 2 (no voting)    "VOTE TOMORROW" — early voting sites are closed
//                        the day before an election; Election Day hasn't
//                        started yet either.
//   >= Nov 3             "VOTE TODAY" — polls are open 6am-9pm. The card
//                        itself expires after Nov 3 (expiresAfter on the
//                        data entry), so this label is only ever seen on
//                        Election Day itself, never stale afterward.
function computeElection2026Service(base: CityService): CityService {
  const todayKey = localDateKey(new Date());
  let badgeLabel = 'REGISTER BY OCT 24';
  if (todayKey >= '2026-11-03') badgeLabel = 'VOTE TODAY';
  else if (todayKey >= '2026-11-02') badgeLabel = 'VOTE TOMORROW';
  else if (todayKey >= '2026-10-24') badgeLabel = 'EARLY VOTING OPEN';
  return { ...base, badgeLabel };
}

// Flushing's own remaining window this fall is Mon Oct 5 – Wed Oct 7,
// 8am–4:30pm (confirmed against jamestownnybpu.gov's own flushing-dates
// post) — on the two days the card is still visible for (expiresAfter is
// Oct 7), call out that it's happening today instead of the static
// "SEP 25 – OCT 7" date-range badge.
function computeWatermainService(base: CityService): CityService {
  const todayKey = localDateKey(new Date());
  if (todayKey === '2026-10-06' || todayKey === '2026-10-07') {
    return { ...base, badgeLabel: 'FLUSHING TODAY' };
  }
  return base;
}

const pill = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, flexShrink: 0 },
  text: { fontFamily: 'Outfit', fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
});

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function ServiceCard({ service }: { service: CityService }) {
  const [expanded, setExpanded] = useState(service.defaultExpanded ?? false);
  const rgb = hexToRgb(service.badgeColor);
  const glassWeb = Platform.OS === 'web'
    ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as any
    : {};

  return (
    // @ts-ignore
    <View style={[svc.card, glassWeb]}>
      <LinearGradient
        colors={[`rgba(${rgb},0.14)`, `rgba(${rgb},0.04)`, 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={[svc.stripe, { backgroundColor: service.badgeColor }]} />
      <TouchableOpacity activeOpacity={0.85} onPress={() => setExpanded(e => !e)}>
        <View style={svc.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={svc.title}>{service.title}</Text>
            <Text style={[svc.summary, { color: `rgba(${rgb},0.65)` }]}>{service.summary}</Text>
          </View>
          {/* badgeLabel (computed, e.g. yardwaste/election2026) wins when set;
              otherwise fall back to the entry's own `badge` text (e.g.
              watermain's "SEP 25 – OCT 7", dpw's "THIS WEEK") instead of
              skipping straight to the generic STATUS_LABELS[status] text,
              which was wrong for every card that doesn't set badgeLabel. */}
          <StatusPill status={service.status} label={service.badgeLabel ?? service.badge} />
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={13}
            color="rgba(255,255,255,0.3)"
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[svc.expanded, { borderTopColor: `rgba(${rgb},0.1)` }]}>
          {service.primaryLink && (
            <TouchableOpacity
              style={[svc.primaryCta, { backgroundColor: service.badgeColor }]}
              activeOpacity={0.85}
              onPress={() => openLink(service.primaryLink!.url)}
            >
              <Text style={svc.primaryCtaText}>{service.primaryLink.label}</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </TouchableOpacity>
          )}
          {service.details.length > 0 && (
            <View style={svc.detailGrid}>
              {service.details.map(d => (
                <View key={d.label} style={svc.detailRow}>
                  <Text style={svc.detailLabel}>{d.label}</Text>
                  <Text style={svc.detailValue}>{d.value}</Text>
                </View>
              ))}
            </View>
          )}
          {service.schedule && (
            <View style={[svc.scheduleBlock, { borderColor: `rgba(${rgb},0.12)` }]}>
              <Text style={[svc.scheduleHeader, { color: `rgba(${rgb},0.5)` }]}>FLUSH SCHEDULE</Text>
              {service.schedule.map((entry, i) => (
                <View
                  key={entry.date}
                  style={[
                    svc.scheduleRow,
                    i < service.schedule!.length - 1 && { borderBottomWidth: 1, borderBottomColor: `rgba(${rgb},0.08)` },
                  ]}
                >
                  <View style={[svc.scheduleDateBadge, { backgroundColor: `rgba(${rgb},0.1)` }]}>
                    <Text style={[svc.scheduleDateText, { color: `rgba(${rgb},0.9)` }]}>{entry.date}</Text>
                    <Text style={[svc.scheduleDayText, { color: `rgba(${rgb},0.5)` }]}>{entry.day}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={svc.scheduleAreas}>{entry.areas}</Text>
                    {entry.warn && (
                      <View style={svc.scheduleWarnRow}>
                        <Ionicons name="warning-outline" size={10} color="#f59e0b" />
                        <Text style={svc.scheduleWarnText}>{entry.warn}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
          {service.tip && (
            <View style={[svc.tip, { backgroundColor: `rgba(${rgb},0.06)`, borderColor: `rgba(${rgb},0.18)` }]}>
              <Ionicons name="information-circle-outline" size={14} color={`rgba(${rgb},0.6)`} style={{ marginTop: 1 }} />
              <Text style={svc.tipText}>{service.tip}</Text>
            </View>
          )}
          {service.links && service.links.length > 0 && (
            <View style={svc.linksBlock}>
              <Text style={[svc.linksHeader, { color: `rgba(${rgb},0.45)` }]}>MAPS & DOCUMENTS</Text>
              {service.links.map(link => (
                <TouchableOpacity
                  key={link.url}
                  style={[svc.linkRow, { borderColor: `rgba(${rgb},0.15)`, backgroundColor: `rgba(${rgb},0.06)` }]}
                  activeOpacity={0.7}
                  onPress={() => openLink(link.url)}
                >
                  <Ionicons name="map-outline" size={13} color={`rgba(${rgb},0.7)`} style={{ marginTop: 1 }} />
                  <Text style={[svc.linkText, { color: `rgba(${rgb},0.85)` }]}>{link.label}</Text>
                  <Ionicons name="open-outline" size={12} color={`rgba(${rgb},0.4)`} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const svc = StyleSheet.create({
  card: {
    backgroundColor: dark.surface,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  stripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, zIndex: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontFamily: 'Editorial', fontSize: 16, fontWeight: '700', color: '#fff', lineHeight: 21 },
  // @ts-ignore — hyphens is web-only but React Native ignores unknown props safely
  summary: { fontFamily: 'DMSans_500Medium', fontSize: 11, marginTop: 3, lineHeight: 16, color: 'rgba(255,255,255,0.55)', hyphens: 'none' },
  expanded: { borderTopWidth: 1, paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  detailGrid: { gap: 10 },
  detailRow: { flexDirection: 'row', gap: 12 },
  detailLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.4)', minWidth: 80, flexShrink: 0, lineHeight: 17 },
  detailValue: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.75)', flex: 1, lineHeight: 17 },
  tip: { flexDirection: 'row', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12 },
  tipText: { fontFamily: 'DMSans_500Medium', fontSize: 12, flex: 1, lineHeight: 18, color: 'rgba(255,255,255,0.6)' },

  scheduleBlock: { borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  scheduleHeader: { fontFamily: 'DMSans_600SemiBold', fontSize: 9, letterSpacing: 1.5, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 },
  scheduleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  scheduleDateBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 5, alignItems: 'center', width: 58 },
  scheduleDateText: { fontFamily: 'DMSans_700Bold', fontSize: 11, lineHeight: 14 },
  scheduleDayText: { fontFamily: 'DMSans_500Medium', fontSize: 10, lineHeight: 14 },
  scheduleAreas: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 17 },
  scheduleWarnRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  scheduleWarnText: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: '#f59e0b', lineHeight: 15 },

  linksBlock: { gap: 6 },
  linksHeader: { fontFamily: 'DMSans_600SemiBold', fontSize: 9, letterSpacing: 1.5, marginBottom: 2 },
  linkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  linkText: { fontFamily: 'DMSans_500Medium', fontSize: 12, flex: 1, lineHeight: 17 },

  // Filled, not outlined like linkRow — the one obvious "do this now"
  // action on a card gets more visual weight than the reference-link list
  // below it. Solid badgeColor fill + white text, so this reads as a
  // button, not another list row.
  primaryCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 12, marginBottom: 12 },
  primaryCtaText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#fff' },
});

const FILTERS: { id: FilterOption; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active Now' },
  { id: 'coming-up', label: 'Coming Up' },
  { id: 'year-round', label: 'Year Round' },
];

export default function CityServicesScreen({ onClose }: { onClose?: () => void }) {
  const { dpw } = useCivic();
  const [filter, setFilter] = useState<FilterOption>('all');
  const glassWeb = Platform.OS === 'web'
    ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as any
    : {};

  const servicesWithComputed = CITY_SERVICES.map(s => {
    if (s.id === 'yardwaste') return computeYardWasteService(s);
    if (s.id === 'election2026') return computeElection2026Service(s);
    if (s.id === 'watermain') return computeWatermainService(s);
    return s;
  });
  const allServices = dpw && dpw.items.length > 0 ? [buildDpwService(dpw), ...servicesWithComputed] : servicesWithComputed;

  // Date-only expiresAfter strings (e.g. '2026-09-30') parse as UTC midnight
  // via `new Date(...)` — in Eastern time that's 4-5 hours before local
  // midnight, so a card could expire hours early. Compare as local date
  // strings instead, which sidesteps the UTC conversion entirely.
  const todayKey = localDateKey(new Date());
  const filtered = allServices.filter(s => {
    if (s.expiresAfter && todayKey > s.expiresAfter) return false;
    return filter === 'all' || s.status === filter || (filter === 'coming-up' && s.status === 'imminent');
  });

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={cs.header}>
        <View style={cs.headerRow}>
          {onClose && (
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={cs.closeBtn}>
              <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={cs.title}>City <Text style={{ color: '#22d3ee' }}>Services</Text></Text>
            <Text style={cs.subtitle}>BPU & DPW · Jamestown, NY</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={cs.content} showsVerticalScrollIndicator={false}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={cs.chipRow}
          style={{ marginBottom: 16 }}
        >
          {FILTERS.map(f => {
            const active = filter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.7}
                // @ts-ignore
                style={[cs.chip, active && cs.chipActive, glassWeb]}
              >
                <Text style={[cs.chipText, active && cs.chipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={cs.list}>
          {filtered.length === 0 ? (
            <Text style={cs.emptyText}>No services in this category right now.</Text>
          ) : (
            filtered.map(s => <ServiceCard key={s.id} service={s} />)
          )}
        </View>

        <Text style={cs.footer}>
          Data sourced from jamestownny.gov & jamestownbpu.com
        </Text>
      </ScrollView>
    </ThemedBackground>
  );
}

const cs = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  closeBtn: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(15,23,42,0.6)', borderWidth: 1, borderColor: dark.border, marginTop: 4 },
  title: { fontFamily: 'Syne', fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  subtitle: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', color: dark.category.city, letterSpacing: 1.8, textTransform: 'uppercase', marginTop: 4 },

  chipRow: { paddingHorizontal: 16, gap: 8, flexDirection: 'row' },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, backgroundColor: dark.surface, borderColor: dark.border },
  chipActive: { backgroundColor: 'rgba(34,211,238,0.1)', borderColor: 'rgba(34,211,238,0.4)' },
  chipText: { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600', color: dark.text.subtle },
  chipTextActive: { color: dark.category.city },

  content: { paddingBottom: 48 },
  list: { paddingHorizontal: 0 },
  emptyText: { fontFamily: 'Outfit', fontSize: 14, color: dark.text.subtle, textAlign: 'center', marginTop: 32 },
  footer: { fontFamily: 'Outfit', fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 24, paddingHorizontal: 16 },
});
