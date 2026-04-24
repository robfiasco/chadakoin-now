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

type FilterOption = 'all' | ServiceStatus;

const STATUS_LABELS: Record<ServiceStatus, string> = {
  active: 'OPEN NOW',
  'coming-up': 'COMING UP',
  'year-round': 'YEAR ROUND',
};

const STATUS_COLORS: Record<ServiceStatus, string> = {
  active: dark.category.recycling,    // emerald
  'coming-up': dark.category.film,    // amber
  'year-round': dark.category.city,   // cyan
};

function StatusPill({ status }: { status: ServiceStatus }) {
  const color = STATUS_COLORS[status];
  return (
    <View style={[pill.wrap, { borderColor: `${color}40`, backgroundColor: `${color}18` }]}>
      {status === 'active' && <PulsingDot color={color} size={6} />}
      <Text style={[pill.text, { color }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
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
  const [expanded, setExpanded] = useState(false);
  const rgb = hexToRgb(service.badgeColor);
  const glassWeb = Platform.OS === 'web'
    ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as any
    : {};

  return (
    // @ts-ignore
    <View style={[svc.card, glassWeb]}>
      {/* Gradient wash from badge color */}
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
          <StatusPill status={service.status} />
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={13}
            color="rgba(255,255,255,0.3)"
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[svc.expanded, { borderTopColor: `rgba(${rgb},0.1)` }]}>
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
  summary: { fontFamily: 'DMSans_500Medium', fontSize: 11, marginTop: 3, lineHeight: 16, color: 'rgba(255,255,255,0.55)' },
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
});

const FILTERS: { id: FilterOption; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active Now' },
  { id: 'coming-up', label: 'Coming Up' },
  { id: 'year-round', label: 'Year Round' },
];

export default function CityServicesScreen({ onClose }: { onClose?: () => void }) {
  const [filter, setFilter] = useState<FilterOption>('all');
  const glassWeb = Platform.OS === 'web'
    ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as any
    : {};

  const filtered = CITY_SERVICES.filter(s => filter === 'all' || s.status === filter);

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
        {/* Filter chips */}
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
