import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '../components/ThemedBackground';
import { dark } from '../lib/colors';

type IoniconName = keyof typeof Ionicons.glyphMap;

const GREEN = '#34d399';
const BLUE  = '#22d3ee';
const AMBER = '#fbbf24';

const STATS = [
  { label: 'Local multiplier', value: '3–4×', sub: 'vs. ~1× at a chain' },
  { label: 'Extra local impact', value: '$48', sub: 'from a $20 local spend' },
];

type Stop = {
  name: string;
  dot: string;
  icon: IoniconName;
  action: string;
  detail: string;
  badge?: string;
};

const STOPS: Stop[] = [
  {
    name: 'Good Neighbors Bookstore',
    dot: GREEN, icon: 'book-outline',
    action: 'You buy a book instead of ordering from Amazon',
    detail: 'Your $20 stays in Jamestown. Owner lives here, pays local rent, employs local staff. That same $20 on Amazon is gone before you close the tab.',
  },
  {
    name: 'Brazil Lounge / Labyrinth',
    dot: GREEN, icon: 'musical-notes-outline',
    action: 'Owner grabs a drink after closing',
    detail: 'Local staff get paid. Tips go to someone who lives on your block. The bar buys from a local distributor when possible. Dollar still here.',
  },
  {
    name: 'Jamestown Public Market',
    dot: GREEN, icon: 'nutrition-outline',
    action: 'Bartender shops at the farmers market Saturday morning',
    detail: 'Produce money goes directly to Chautauqua County farmers. No middleman, no distribution center, no corporate cut. As local as it gets.',
  },
  {
    name: 'Local farm, Chautauqua County',
    dot: GREEN, icon: 'leaf-outline',
    action: 'Farmer buys supplies from a local hardware store',
    detail: "Farm revenue pays for seed, equipment, repairs — often from local vendors. That dollar just made its fourth stop and it's still in the county.",
  },
  {
    name: 'National Comedy Center',
    dot: BLUE, icon: 'mic-outline',
    action: 'A visitor from Buffalo drives down for the weekend',
    detail: "Their admission, their dinner downtown, their hotel stay — that's outside money entering Jamestown. The Comedy Center is one of the city's best dollar importers. Then those dollars start circulating locally too.",
    badge: 'Brings dollars in',
  },
  {
    name: 'Jamestown community',
    dot: GREEN, icon: 'home-outline',
    action: 'It all comes back around',
    detail: 'Every stop on this trail is a Jamestown resident with more money in their pocket, a local business that can stay open, and a city with more resources to work with.',
  },
];

type RippleCard = {
  icon: IoniconName;
  title: string;
  body: string;
};

const RIPPLE: RippleCard[] = [
  {
    icon: 'briefcase-outline',
    title: 'More jobs that pay a living wage',
    body: 'Local businesses employ Jamestown residents at higher rates than chains. More local spending means more positions, more hours, more stability for families here.',
  },
  {
    icon: 'business-outline',
    title: 'A stronger tax base for the city',
    body: 'Local business revenue generates sales tax, property tax, and income tax that stays in Jamestown — funding road repairs, emergency services, and city infrastructure.',
  },
  {
    icon: 'school-outline',
    title: 'Better-funded schools',
    body: "A healthier local economy means more resources for Jamestown's public schools. That's better programs, better staffing, better outcomes for kids growing up here.",
  },
  {
    icon: 'heart-outline',
    title: 'A city worth staying in',
    body: "When local businesses thrive, downtown stays alive. New businesses open. People have reasons to stay — and reasons to come back. That's how a city turns around.",
  },
];

const glassWeb: any = Platform.OS === 'web'
  ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }
  : {};

export default function DollarTrailScreen({ onClose }: { onClose: () => void }) {
  return (
    <ThemedBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={s.backBtn}>
            <Ionicons name="chevron-back" size={20} color={BLUE} />
            <Text style={s.backLabel}>Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Eyebrow + headline */}
          <Text style={s.eyebrow}>The dollar trail</Text>
          <Text style={s.headline}>One dollar.{'\n'}Six stops.{'\n'}Still in Jamestown.</Text>
          <Text style={s.subhead}>
            Follow a single dollar as it moves through real local businesses — and see how much ground it covers before it ever leaves.
          </Text>

          {/* Stats row */}
          <View style={s.statsRow}>
            {STATS.map(st => (
              <View key={st.label} style={[s.statCard, glassWeb]}>
                <Text style={s.statLabel}>{st.label}</Text>
                <Text style={s.statValue}>{st.value}</Text>
                <Text style={s.statSub}>{st.sub}</Text>
              </View>
            ))}
          </View>

          {/* Legend */}
          <View style={s.legend}>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: GREEN }]} />
              <Text style={s.legendText}>Keeps dollar local</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: BLUE }]} />
              <Text style={s.legendText}>Brings dollars in</Text>
            </View>
          </View>

          {/* Trail */}
          <View style={s.trail}>
            {STOPS.map((stop, i) => {
              const isLast = i === STOPS.length - 1;
              return (
                <View key={stop.name} style={s.stopRow}>
                  {/* Left: connector + dot */}
                  <View style={s.stopLeft}>
                    <View style={[s.stopDot, { backgroundColor: stop.dot }]}>
                      <Ionicons name={stop.icon} size={13} color="#060e18" />
                    </View>
                    {!isLast && <View style={s.connector} />}
                  </View>

                  {/* Right: content */}
                  {/* @ts-ignore */}
                  <View style={[s.stopCard, glassWeb]}>
                    <View style={s.stopNameRow}>
                      <Text style={[s.stopName, { color: stop.dot }]} numberOfLines={1}>{stop.name}</Text>
                      {stop.badge && (
                        <View style={[s.badge, { borderColor: `${BLUE}40`, backgroundColor: `${BLUE}18` }]}>
                          <Text style={[s.badgeText, { color: BLUE }]}>{stop.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.stopAction}>"{stop.action}"</Text>
                    <Text style={s.stopDetail}>{stop.detail}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Ripple effect */}
          <Text style={s.rippleHeading}>What this actually means for residents</Text>
          <Text style={s.rippleIntro}>
            When dollars stay local, the effects show up in real, tangible ways for people who live here.
          </Text>

          <View style={s.rippleGrid}>
            {RIPPLE.map(card => (
              // @ts-ignore
              <View key={card.title} style={[s.rippleCard, glassWeb]}>
                <View style={[s.rippleIconWrap, { backgroundColor: `${AMBER}18` }]}>
                  <Ionicons name={card.icon} size={18} color={AMBER} />
                </View>
                <Text style={s.rippleTitle}>{card.title}</Text>
                <Text style={s.rippleBody}>{card.body}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedBackground>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: dark.border,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 4, paddingRight: 8,
  },
  backLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: BLUE },

  scroll: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20 },

  eyebrow: {
    fontFamily: 'Outfit', fontSize: 11, fontWeight: '700',
    color: BLUE, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10,
  },
  headline: {
    fontFamily: 'Editorial', fontSize: 32, color: '#e2e8f0',
    lineHeight: 38, marginBottom: 14,
  },
  subhead: {
    fontFamily: 'Outfit', fontSize: 14, color: dark.text.muted,
    lineHeight: 21, marginBottom: 28,
  },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: dark.surface, borderWidth: 1,
    borderColor: dark.border, borderRadius: 14, padding: 14, gap: 4,
  },
  statLabel: { fontFamily: 'Outfit', fontSize: 10, color: dark.text.subtle, letterSpacing: 0.8, textTransform: 'uppercase' },
  statValue: { fontFamily: 'DMSans_800ExtraBold', fontSize: 26, color: GREEN },
  statSub: { fontFamily: 'Outfit', fontSize: 10, color: dark.text.muted },

  legend: { flexDirection: 'row', gap: 20, marginBottom: 24 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: 'Outfit', fontSize: 12, color: dark.text.muted },

  trail: { marginBottom: 36 },

  stopRow: { flexDirection: 'row', gap: 14, marginBottom: 0 },

  stopLeft: { alignItems: 'center', width: 28 },
  stopDot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  connector: { flex: 1, width: 2, backgroundColor: dark.border, minHeight: 20, marginVertical: 4 },

  stopCard: {
    flex: 1, backgroundColor: dark.surface, borderWidth: 1,
    borderColor: dark.border, borderRadius: 14, padding: 14, marginBottom: 12, gap: 6,
  },
  stopNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  stopName: { fontFamily: 'DMSans_700Bold', fontSize: 13, flexShrink: 1 },
  badge: {
    borderWidth: 1, borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 2, flexShrink: 0,
  },
  badgeText: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  stopAction: {
    fontFamily: 'DMSans_500Medium', fontSize: 13,
    color: dark.text.primary, fontStyle: 'italic', lineHeight: 18,
  },
  stopDetail: {
    fontFamily: 'Outfit', fontSize: 12, color: dark.text.muted, lineHeight: 18,
  },

  rippleHeading: {
    fontFamily: 'DMSans_700Bold', fontSize: 18, color: dark.text.primary, marginBottom: 10,
  },
  rippleIntro: {
    fontFamily: 'Outfit', fontSize: 13, color: dark.text.muted, lineHeight: 19, marginBottom: 20,
  },
  rippleGrid: { gap: 12 },
  rippleCard: {
    backgroundColor: dark.surface, borderWidth: 1,
    borderColor: dark.border, borderRadius: 14, padding: 16, gap: 8,
  },
  rippleIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start',
  },
  rippleTitle: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: dark.text.primary },
  rippleBody: { fontFamily: 'Outfit', fontSize: 13, color: dark.text.muted, lineHeight: 19 },
});
