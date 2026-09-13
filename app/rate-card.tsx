import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '../components/ThemedBackground';
import { useTheme } from '../lib/ThemeContext';
import { dark } from '../lib/colors';
import {
  FEATURED_SLOTS, FEATURED_FLAT_MONTHLY, FEATURED_ANNUAL_PRICE, FEATURED_SCARCITY_NOTE,
  PUBLIC_FEATURED_AVAILABILITY_NOTE,
  FOUNDING_ANNUAL_PRICE, FOUNDING_TERM_NOTE, FOUNDING_RENEWAL_NOTE,
  FOUNDING_ELIGIBILITY_NOTE, FOUNDING_SCARCITY_NOTE,
  VISIT_LIST_ELIGIBILITY_NOTE, EXTENDED_PROFILE_PRICE,
  BUSINESS_STORY_PRICE, BUSINESS_STORY_CAP_NOTE,
  HOME_SPONSOR_MONTHLY, HOME_SPONSOR_ANNUAL,
  EVENT_BOOST_PRICES, EVENT_BOOST_SHORT_NOTE, EVENT_BOOST_LONG_NOTE, EVENT_BOOST_PACK_NOTE,
  FEATURED_EVENT_SLOTS, FEATURED_EVENT_SLOTS_AVAILABLE,
  BRAND_CHROME_PRICES, FOUNDING_EXTENDED_PROFILE_NOTE,
} from '../lib/adPricing';
import FeedbackScreen from './feedback';

const FOUNDER_ADDONS = [
  {
    title: 'Brand chrome on your Featured card',
    prices: BRAND_CHROME_PRICES,
    desc: "Accent color, logo, and a tag on your Featured card only — not a full-app theme.",
  },
  {
    title: 'Extended Profile',
    prices: [EXTENDED_PROFILE_PRICE],
    desc: FOUNDING_EXTENDED_PROFILE_NOTE,
  },
  {
    title: 'Event Boost pack',
    prices: [] as string[],
    desc: EVENT_BOOST_PACK_NOTE,
  },
];

function SectionBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[s.sectionBadge, { borderColor: `${color}40`, backgroundColor: `${color}18` }]}>
      <Text style={[s.sectionBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

export default function RateCardScreen({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const acc = theme.acc;
  const accRGB = theme.accRGB;

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackPreset, setFeedbackPreset] = useState({ type: 'business', message: '' });

  function inquire(message: string) {
    setFeedbackPreset({ type: 'business', message });
    setFeedbackOpen(true);
  }

  return (
    <ThemedBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={s.backBtn}>
            <Ionicons name="chevron-back" size={20} color={acc} />
            <Text style={[s.backLabel, { color: acc }]}>Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.eyebrow}>Rate card</Text>
          <Text style={s.headline}>Featured & Founders</Text>
          <Text style={s.subhead}>
            Straight pricing for Featured placement on Visit, plus the Founding offer for the first {FEATURED_SLOTS} partners.
          </Text>

          {/* ── Founding Featured ── */}
          <View style={[s.card, { borderColor: `${acc}40`, backgroundColor: `${acc}0d` }]}>
            <SectionBadge label="FOUNDING · LIMITED" color={acc} />
            <Text style={s.cardTitle}>Founding Featured</Text>
            <View style={s.priceRow}>
              <Text style={[s.priceMain, { color: acc }]}>${FOUNDING_ANNUAL_PRICE}<Text style={s.pricePer}>/yr</Text></Text>
              <Text style={s.priceSub}>prepaid</Text>
            </View>
            <View style={s.bulletList}>
              <Text style={s.bullet}>{FOUNDING_TERM_NOTE}</Text>
              <Text style={s.bullet}>{FOUNDING_RENEWAL_NOTE}</Text>
              <Text style={s.bullet}>{FOUNDING_ELIGIBILITY_NOTE}</Text>
              <Text style={s.bullet}>Included: Founding badge, Featured creative updates up to once a month, and equal Visit visibility alongside the other Founders.</Text>
              <Text style={s.bullet}>{FOUNDING_SCARCITY_NOTE}</Text>
            </View>
            <TouchableOpacity
              onPress={() => inquire(`I'm interested in Founding Featured ($${FOUNDING_ANNUAL_PRICE}/yr, first ${FEATURED_SLOTS} partners). `)}
              activeOpacity={0.85}
              style={[s.ctaBtn, { backgroundColor: acc }]}
            >
              <Text style={s.ctaBtnText}>Claim a Founding spot</Text>
              <Ionicons name="arrow-forward" size={14} color="#000" />
            </TouchableOpacity>
          </View>

          {/* ── Public Featured ── */}
          <View style={[s.card, { borderColor: dark.border, backgroundColor: dark.surface }]}>
            <SectionBadge label="PUBLIC · VISIT ONLY" color={`rgba(${accRGB},0.6)`} />
            <Text style={s.cardTitle}>Public Featured</Text>
            <View style={s.priceRow}>
              <Text style={[s.priceMain, { color: acc }]}>${FEATURED_FLAT_MONTHLY}<Text style={s.pricePer}>/mo</Text></Text>
              <Text style={s.priceSub}>or ${FEATURED_ANNUAL_PRICE}/yr</Text>
            </View>
            <View style={s.bulletList}>
              <Text style={s.bullet}>{PUBLIC_FEATURED_AVAILABILITY_NOTE}</Text>
              <Text style={s.bullet}>Straight pricing, year-round — no seasonal tiers, no intro months.</Text>
              <Text style={s.bullet}>Every active Featured partner is shown every time someone opens Visit — equal visibility, with a fair hourly hero rotation.</Text>
              <Text style={s.bullet}>Visit only — not on Home, Events, or Sports.</Text>
              <Text style={s.bullet}>{FEATURED_SCARCITY_NOTE}</Text>
            </View>
            <TouchableOpacity
              onPress={() => inquire(`I'd like to reserve a Featured slot on Visit ($${FEATURED_FLAT_MONTHLY}/mo or $${FEATURED_ANNUAL_PRICE}/yr). `)}
              activeOpacity={0.85}
              style={[s.ctaBtn, { backgroundColor: acc }]}
            >
              <Text style={s.ctaBtnText}>Feature This Business</Text>
              <Ionicons name="arrow-forward" size={14} color="#000" />
            </TouchableOpacity>
          </View>

          {/* ── Extended Profile ── */}
          <View style={[s.card, { borderColor: dark.border, backgroundColor: dark.surface }]}>
            <SectionBadge label="ANY VISIT LISTING" color={`rgba(${accRGB},0.6)`} />
            <Text style={s.cardTitle}>Extended Profile</Text>
            <View style={s.priceRow}>
              <Text style={[s.priceMain, { color: acc }]}>{EXTENDED_PROFILE_PRICE}</Text>
            </View>
            <View style={s.bulletList}>
              <Text style={s.bullet}>{VISIT_LIST_ELIGIBILITY_NOTE}</Text>
              <Text style={s.bullet}>More detail on your existing Visit listing — menu, specials, richer hours, photos, and seasonal details.</Text>
              <Text style={s.bullet}>Separate from Featured placement — this doesn't change where or how often you appear on Visit.</Text>
            </View>
            <TouchableOpacity
              onPress={() => inquire(`I'd like to add Extended Profile (${EXTENDED_PROFILE_PRICE}) to my Visit listing. `)}
              activeOpacity={0.85}
              style={[s.ctaBtn, { backgroundColor: acc }]}
            >
              <Text style={s.ctaBtnText}>Add Extended Profile</Text>
              <Ionicons name="arrow-forward" size={14} color="#000" />
            </TouchableOpacity>
          </View>

          {/* ── Business Story ── */}
          <View style={[s.card, { borderColor: dark.border, backgroundColor: dark.surface }]}>
            <SectionBadge label="ANY VISIT LISTING" color={`rgba(${accRGB},0.6)`} />
            <Text style={s.cardTitle}>Business Story</Text>
            <View style={s.priceRow}>
              <Text style={[s.priceMain, { color: acc }]}>{BUSINESS_STORY_PRICE}</Text>
            </View>
            <View style={s.bulletList}>
              <Text style={s.bullet}>{VISIT_LIST_ELIGIBILITY_NOTE}</Text>
              <Text style={s.bullet}>A Story push on your business — Home or designated story placement.</Text>
              <Text style={s.bullet}>{BUSINESS_STORY_CAP_NOTE} Hard cap — no exceptions, including for Founders.</Text>
            </View>
            <TouchableOpacity
              onPress={() => inquire(`I'd like to book a Business Story (${BUSINESS_STORY_PRICE}). `)}
              activeOpacity={0.85}
              style={[s.ctaBtn, { backgroundColor: acc }]}
            >
              <Text style={s.ctaBtnText}>Book a Business Story</Text>
              <Ionicons name="arrow-forward" size={14} color="#000" />
            </TouchableOpacity>
          </View>

          {/* ── Home "Presented by" ── */}
          <View style={[s.card, { borderColor: dark.border, backgroundColor: dark.surface }]}>
            <SectionBadge label="HOME · SINGLE SPONSOR" color={`rgba(${accRGB},0.6)`} />
            <Text style={s.cardTitle}>Home "Presented by"</Text>
            <View style={s.priceRow}>
              <Text style={[s.priceMain, { color: acc }]}>${HOME_SPONSOR_MONTHLY}<Text style={s.pricePer}>/mo</Text></Text>
              <Text style={s.priceSub}>or ${HOME_SPONSOR_ANNUAL.toLocaleString()}/yr</Text>
            </View>
            <View style={s.bulletList}>
              <Text style={s.bullet}>One sponsor only — not a Visit Featured slot, not a second logo strip.</Text>
              <Text style={s.bullet}>Placed near the top of Home, kept minimal — no coupon-style card.</Text>
              <Text style={s.bullet}>Suggested pricing — final rate at Rob's discretion.</Text>
            </View>
            <TouchableOpacity
              onPress={() => inquire(`I'm interested in the Home "Presented by" sponsor slot ($${HOME_SPONSOR_MONTHLY}/mo or $${HOME_SPONSOR_ANNUAL}/yr). `)}
              activeOpacity={0.85}
              style={[s.ctaBtn, { backgroundColor: acc }]}
            >
              <Text style={s.ctaBtnText}>Inquire about Presented by</Text>
              <Ionicons name="arrow-forward" size={14} color="#000" />
            </TouchableOpacity>
          </View>

          {/* ── Events Featured ── */}
          <View style={[s.card, { borderColor: dark.border, backgroundColor: dark.surface }]}>
            <SectionBadge label="EVENTS" color={`rgba(${accRGB},0.6)`} />
            <Text style={s.cardTitle}>Events Featured</Text>
            <View style={[s.priceRow, { flexWrap: 'wrap', gap: 8 }]}>
              {EVENT_BOOST_PRICES.map(p => (
                <View key={p} style={[s.pricePill, { borderColor: `rgba(${accRGB},0.3)`, backgroundColor: `rgba(${accRGB},0.1)` }]}>
                  <Text style={[s.pricePillText, { color: acc }]}>{p}</Text>
                </View>
              ))}
            </View>
            <View style={s.bulletList}>
              <Text style={s.bullet}>Up to {FEATURED_EVENT_SLOTS} featured events — top of Events, every filter.</Text>
              <Text style={s.bullet}>{EVENT_BOOST_SHORT_NOTE} {EVENT_BOOST_LONG_NOTE}</Text>
              <Text style={s.bullet}>A carousel, not one slot — every active paid event is shown, with a fair rotation for display order.</Text>
              <Text style={s.bullet}>Separate product from Visit's Founding/Public Featured — different cap, no shared inventory.</Text>
              {FEATURED_EVENT_SLOTS_AVAILABLE > 0 && FEATURED_EVENT_SLOTS_AVAILABLE < FEATURED_EVENT_SLOTS && (
                <Text style={s.bullet}>{FEATURED_EVENT_SLOTS_AVAILABLE}/{FEATURED_EVENT_SLOTS} spots open.</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => inquire("I'd like to feature an upcoming event on Events. ")}
              activeOpacity={0.85}
              style={[s.ctaBtn, { backgroundColor: acc }]}
            >
              <Text style={s.ctaBtnText}>Feature an Event</Text>
              <Ionicons name="arrow-forward" size={14} color="#000" />
            </TouchableOpacity>
          </View>

          {/* ── Founders-only add-ons ── */}
          <View style={[s.card, { borderColor: dark.border, backgroundColor: dark.surface }]}>
            <SectionBadge label="FOUNDERS ONLY · OG" color="#fbbf24" />
            <Text style={s.cardTitle}>Founders add-ons</Text>
            <Text style={[s.bullet, { marginBottom: 4 }]}>
              Available exclusively to Founding Featured partners — not offered to Public Featured or general listings.
            </Text>
            <View style={{ gap: 8, marginTop: 10 }}>
              {FOUNDER_ADDONS.map(item => (
                <View key={item.title} style={[s.addonCard, { borderColor: `rgba(${accRGB},0.1)` }]}>
                  <View style={s.addonTop}>
                    <Text style={s.addonTitle}>{item.title}</Text>
                    {item.prices.length > 0 && (
                      <View style={s.addonPrices}>
                        {item.prices.map(p => (
                          <View key={p} style={[s.addonPricePill, { backgroundColor: `rgba(${accRGB},0.1)`, borderColor: `rgba(${accRGB},0.2)` }]}>
                            <Text style={[s.addonPriceText, { color: acc }]}>{p}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  <Text style={s.addonDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => inquire("I'm a Founding Featured partner interested in add-ons (brand chrome / extended profile / event boost). ")}
              activeOpacity={0.75}
              style={[s.secondaryCta, { borderColor: `rgba(${accRGB},0.25)`, backgroundColor: `rgba(${accRGB},0.08)` }]}
            >
              <Text style={[s.secondaryCtaText, { color: acc }]}>Ask about add-ons</Text>
              <Ionicons name="arrow-forward" size={12} color={acc} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {feedbackOpen && (
        <View style={s.fullOverlay}>
          <FeedbackScreen
            onClose={() => setFeedbackOpen(false)}
            initialType={feedbackPreset.type}
            initialMessage={feedbackPreset.message}
          />
        </View>
      )}
    </ThemedBackground>
  );
}

const s = StyleSheet.create({
  fullOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 700, flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: dark.border,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingRight: 8 },
  backLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 14 },

  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },

  eyebrow: {
    fontFamily: 'Outfit', fontSize: 11, fontWeight: '700',
    color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8,
  },
  headline: { fontFamily: 'Syne', fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: -0.4 },
  subhead: { fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 19, marginTop: 8, marginBottom: 20 },

  card: { borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 14, gap: 10 },
  sectionBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  sectionBadgeText: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  cardTitle: { fontFamily: 'Syne', fontSize: 19, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  priceMain: { fontFamily: 'Syne', fontSize: 30, fontWeight: '700', letterSpacing: -1 },
  pricePer: { fontFamily: 'Outfit', fontSize: 14, fontWeight: '400' },
  priceSub: { fontFamily: 'Outfit', fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  pricePill: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  pricePillText: { fontFamily: 'Syne', fontSize: 13, fontWeight: '700' },

  bulletList: { gap: 8, marginTop: 2 },
  bullet: { fontFamily: 'Outfit', fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 18 },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 46, borderRadius: 12, marginTop: 6,
  },
  ctaBtnText: { fontFamily: 'Syne', fontSize: 14, fontWeight: '700', color: '#000' },

  addonCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6, backgroundColor: 'rgba(255,255,255,0.02)' },
  addonTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  addonTitle: { fontFamily: 'Syne', fontSize: 13, fontWeight: '700', color: '#fff', flex: 1 },
  addonPrices: { flexDirection: 'row', gap: 5, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' },
  addonPricePill: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  addonPriceText: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700' },
  addonDesc: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 16 },

  secondaryCta: {
    flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, marginTop: 12,
  },
  secondaryCtaText: { fontFamily: 'Outfit', fontSize: 12, fontWeight: '700' },
});
