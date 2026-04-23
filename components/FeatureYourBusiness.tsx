import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeContext';
import { dark } from '../lib/colors';

const INCLUDES = [
  { icon: 'chatbubble-ellipses-outline' as const, text: 'A genuine local endorsement — not ad copy' },
  { icon: 'star-outline' as const,                text: 'Featured badge + top placement' },
  { icon: 'card-outline' as const,                text: 'Your listing card with photo, quote & direct links' },
  { icon: 'calendar-outline' as const,            text: 'Monthly · renew or cancel anytime' },
  { icon: 'people-outline' as const,              text: 'Only 5 slots available' },
];

const ADDONS = [
  {
    title: 'Event Boost',
    prices: ['$25 / 2 wks', '$45 / 30 days'],
    desc: 'Listed in the app through your event date.',
  },
  {
    title: 'Extended Profile',
    prices: ['$19 / mo'],
    desc: 'Updated hours, photos & seasonal details on your listing.',
  },
  {
    title: 'Business Story',
    prices: ['$25 / 48 hrs', '$49 / 7 days'],
    desc: 'A featured post on the home screen. You write it, we post it.',
  },
];

export function FeatureYourBusiness({ onContact }: { onContact?: () => void }) {
  const { theme } = useTheme();
  const acc = theme.acc;
  const accRGB = theme.accRGB;
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[s.container, { borderColor: `rgba(${accRGB},0.18)`, backgroundColor: `rgba(${accRGB},0.04)` }]}>

      {/* ── Collapsed header row ── */}
      <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.8} style={s.collapseRow}>
        <View style={[s.badge, { backgroundColor: `rgba(${accRGB},0.1)`, borderColor: `rgba(${accRGB},0.2)`, marginBottom: 0 }]}>
          <Ionicons name="sparkles" size={10} color={acc} />
          <Text style={[s.badgeText, { color: acc }]}>FEATURED PLACEMENT</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color="rgba(255,255,255,0.3)" />
      </TouchableOpacity>

      {!expanded && (
        <Text style={[s.collapsedHint, { color: `rgba(${accRGB},0.5)` }]}>
          Reach locals and visitors where they're already looking. Tap to learn more.
        </Text>
      )}

      {expanded && <>
      <Text style={s.headline}>
        Reach locals and visitors{'\n'}where they're already looking.
      </Text>

      {/* ── Mock listing preview ── */}
      <Text style={[s.subLabel, { color: `rgba(${accRGB},0.4)` }]}>WHAT IT LOOKS LIKE</Text>
      <View style={s.mockCard}>
        {/* Mock image header */}
        <View style={s.mockImg}>
          <View style={s.mockImgInner} />
          <View style={s.mockBadgeRow}>
            <View style={s.mockCatPill}>
              <Text style={s.mockCatText}>CATEGORY</Text>
            </View>
            <View style={[s.mockOpenPill, { backgroundColor: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.3)' }]}>
              <View style={[s.mockOpenDot, { backgroundColor: '#34d399' }]} />
              <Text style={[s.mockOpenText, { color: '#34d399' }]}>OPEN NOW</Text>
            </View>
          </View>
          <View style={[s.mockFeaturedPill, { backgroundColor: `rgba(${accRGB},0.15)`, borderColor: `rgba(${accRGB},0.3)` }]}>
            <Ionicons name="star" size={8} color={acc} />
            <Text style={[s.mockFeaturedText, { color: acc }]}>FEATURED</Text>
          </View>
        </View>

        {/* Mock body */}
        <View style={s.mockBody}>
          <Text style={s.mockName}>Your Business Here</Text>
          <View style={s.mockAddrRow}>
            <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.3)" />
            <Text style={s.mockAddr}>Your address, Jamestown</Text>
          </View>
          <View style={s.mockDivider} />
          <Text style={s.mockQuote}>"A few honest sentences from me. The kind of thing locals trust."</Text>
          <View style={s.mockDivider} />
          <View style={s.mockLinks}>
            <TouchableOpacity activeOpacity={0.7} style={[s.mockLinkBtn, { borderColor: `rgba(${accRGB},0.2)` }]}>
              <Ionicons name="globe-outline" size={11} color={`rgba(${accRGB},0.6)`} />
              <Text style={[s.mockLinkText, { color: `rgba(${accRGB},0.6)` }]}>Website</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={[s.mockLinkBtn, { borderColor: `rgba(${accRGB},0.2)` }]}>
              <Ionicons name="navigate-outline" size={11} color={`rgba(${accRGB},0.6)`} />
              <Text style={[s.mockLinkText, { color: `rgba(${accRGB},0.6)` }]}>Directions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── What's included ── */}
      <Text style={[s.subLabel, { color: `rgba(${accRGB},0.4)`, marginTop: 16 }]}>WHAT'S INCLUDED</Text>
      <View style={[s.includesList, { borderColor: `rgba(${accRGB},0.1)` }]}>
        {INCLUDES.map((item, i) => (
          <View key={i}>
            {i > 0 && <View style={[s.includesDivider, { backgroundColor: `rgba(${accRGB},0.07)` }]} />}
            <View style={s.includesRow}>
              <View style={[s.includesIcon, { backgroundColor: `rgba(${accRGB},0.08)` }]}>
                <Ionicons name={item.icon} size={13} color={`rgba(${accRGB},0.6)`} />
              </View>
              <Text style={s.includesText}>{item.text}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Pricing ── */}
      <View style={[s.pricingBlock, { borderColor: `rgba(${accRGB},0.12)`, backgroundColor: `rgba(${accRGB},0.05)` }]}>
        <Text style={[s.pricingMain, { color: acc }]}>$59<Text style={s.pricingPer}>/mo</Text></Text>
        <Text style={s.pricingNote}>for your first 3 months</Text>
        <View style={[s.pricingDivider, { backgroundColor: `rgba(${accRGB},0.1)` }]} />
        <Text style={s.pricingThen}>Then $79/mo off-season (Oct–Apr) · $129/mo peak season (May–Sep)</Text>
      </View>

      {/* ── Primary CTA ── */}
      <TouchableOpacity
        onPress={onContact}
        activeOpacity={0.85}
        style={[s.ctaBtn, { backgroundColor: acc }]}
      >
        <Text style={s.ctaBtnText}>Get featured</Text>
        <Ionicons name="arrow-forward" size={14} color="#000" />
      </TouchableOpacity>

      {/* ── Waitlist note ── */}
      <Text style={[s.waitlistNote, { color: `rgba(${accRGB},0.45)` }]}>
        Slots are first come, first served. If full, you'll be added to the waitlist and notified within 48 hours when one opens.
      </Text>

      {/* ── Add-ons ── */}
      <View style={[s.addonsDivider, { backgroundColor: `rgba(${accRGB},0.1)` }]} />

      {/* ── Secondary CTA ── */}
      <TouchableOpacity onPress={onContact} activeOpacity={0.7} style={s.secondaryCta}>
        <Text style={[s.secondaryCtaLabel, { color: `rgba(${accRGB},0.55)` }]}>Not ready for a featured slot?</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[s.secondaryCtaLink, { color: acc }]}>Boost an event, add your story, or update your profile</Text>
          <Ionicons name="arrow-forward" size={12} color={acc} />
        </View>
      </TouchableOpacity>

      <Text style={[s.subLabel, { color: `rgba(${accRGB},0.4)`, marginTop: 12 }]}>ADD-ONS · ANY BUSINESS</Text>
      <View style={{ gap: 8 }}>
        {ADDONS.map((item, i) => (
          <View key={i} style={[s.addonCard, { borderColor: `rgba(${accRGB},0.1)` }]}>
            <View style={s.addonTop}>
              <Text style={s.addonTitle}>{item.title}</Text>
              <View style={s.addonPrices}>
                {item.prices.map(p => (
                  <View key={p} style={[s.addonPricePill, { backgroundColor: `rgba(${accRGB},0.1)`, borderColor: `rgba(${accRGB},0.2)` }]}>
                    <Text style={[s.addonPriceText, { color: acc }]}>{p}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Text style={s.addonDesc}>{item.desc}</Text>
          </View>
        ))}
      </View>
      </>}

    </View>
  );
}

const s = StyleSheet.create({
  container: {
    borderWidth: 1, borderRadius: 18,
    padding: 18, gap: 0,
    overflow: 'hidden',
  },
  collapseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  collapsedHint: { fontFamily: 'Outfit', fontSize: 12, lineHeight: 18, marginBottom: 4 },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  headline: {
    fontFamily: 'DMSans_700Bold', fontSize: 18,
    color: '#fff', lineHeight: 26, letterSpacing: -0.3,
    marginBottom: 16,
  },
  subLabel: {
    fontFamily: 'Outfit', fontSize: 9, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginBottom: 8,
  },

  // ── Mock card ──
  mockCard: {
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: dark.border,
    backgroundColor: dark.surface,
  },
  mockImg: {
    height: 90, backgroundColor: '#1a2332',
    position: 'relative', justifyContent: 'flex-end',
  },
  mockImgInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(100,120,150,0.15)',
  },
  mockBadgeRow: {
    position: 'absolute', top: 8, left: 10,
    flexDirection: 'row', gap: 5,
  },
  mockCatPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3,
  },
  mockCatText: {
    fontFamily: 'Outfit', fontSize: 7, fontWeight: '700',
    letterSpacing: 0.8, color: 'rgba(255,255,255,0.5)',
  },
  mockOpenPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3,
  },
  mockOpenDot: { width: 4, height: 4, borderRadius: 2 },
  mockOpenText: { fontFamily: 'Outfit', fontSize: 7, fontWeight: '700', letterSpacing: 0.8 },
  mockFeaturedPill: {
    position: 'absolute', top: 8, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3,
  },
  mockFeaturedText: { fontFamily: 'Outfit', fontSize: 7, fontWeight: '700', letterSpacing: 0.8 },

  mockBody: { padding: 12, gap: 8 },
  mockName: { fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#fff', letterSpacing: -0.2 },
  mockAddrRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mockAddr: { fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.35)' },
  mockDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 2 },
  mockQuote: { fontFamily: 'Outfit', fontSize: 10, fontStyle: 'italic', color: 'rgba(255,255,255,0.4)', lineHeight: 15 },
  mockLinks: { flexDirection: 'row', gap: 8 },
  mockLinkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 7,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  mockLinkText: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700' },

  // ── Includes ──
  includesList: {
    borderWidth: 1, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    overflow: 'hidden',
  },
  includesDivider: { height: 1, marginHorizontal: 14 },
  includesRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  includesIcon: {
    width: 30, height: 30, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  includesText: {
    fontFamily: 'Outfit', fontSize: 13,
    color: 'rgba(255,255,255,0.7)', flex: 1,
  },

  // ── Pricing ──
  pricingBlock: {
    borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 14, alignItems: 'center', gap: 4,
  },
  pricingMain: { fontFamily: 'Syne', fontSize: 32, fontWeight: '700', letterSpacing: -1 },
  pricingPer:  { fontFamily: 'Outfit', fontSize: 14, fontWeight: '400', letterSpacing: 0 },
  pricingNote: { fontFamily: 'Outfit', fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  pricingDivider: { height: 1, width: '100%', marginVertical: 8 },
  pricingThen: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 17 },

  // ── Button ──
  ctaBtn: {
    marginTop: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 46, borderRadius: 12,
  },
  ctaBtnText: { fontFamily: 'Syne', fontSize: 14, fontWeight: '700', color: '#000' },

  waitlistNote: { fontFamily: 'Outfit', fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 10 },

  addonsDivider: { height: 1, marginVertical: 20 },

  addonCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6, backgroundColor: 'rgba(255,255,255,0.02)' },
  addonTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  addonTitle: { fontFamily: 'Syne', fontSize: 13, fontWeight: '700', color: '#fff' },
  addonPrices: { flexDirection: 'row', gap: 5, flexShrink: 1, flexWrap: 'wrap', justifyContent: 'flex-end' },
  addonPricePill: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  addonPriceText: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700' },
  addonDesc: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 16 },

  // ── Secondary CTA ──
  secondaryCta: { marginTop: 14, alignItems: 'center', gap: 4 },
  secondaryCtaLabel: { fontFamily: 'Outfit', fontSize: 11 },
  secondaryCtaLink:  { fontFamily: 'Outfit', fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
});
