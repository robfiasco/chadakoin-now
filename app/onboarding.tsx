import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  Animated, LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { dark } from '../lib/colors';

const ACC     = '#22d3ee';
const ACC_RGB = '34,211,238';
const GOLD    = '#fbbf24';

type Role = 'local' | 'visitor';

interface FeatureCard {
  label: string;
  desc: string;
  wide?: boolean;
}

interface Slide {
  role: Role;
  icon: keyof typeof Ionicons.glyphMap;
  roleLabel: string;
  slideNum: string;
  titlePrefix: string;
  titleAccent: string;
  body: string;
  cards: FeatureCard[];
}

const LOCAL_SLIDES: Slide[] = [
  {
    role: 'local',
    icon: 'home-outline',
    roleLabel: 'FOR LOCALS',
    slideNum: '01',
    titlePrefix: 'Your city,\nalways\n',
    titleAccent: 'current.',
    body: 'Everything Jamestown — one place, always up to date.',
    cards: [
      { label: 'Weather',    desc: 'Forecast on your Home screen' },
      { label: 'Recycling',  desc: 'Never miss pickup day' },
      { label: 'News',       desc: 'Local outlets & feeds' },
      { label: 'Sports',     desc: 'Sabres & Jayhawks' },
      { label: 'Events',     desc: "What's happening this month", wide: true },
    ],
  },
  {
    role: 'local',
    icon: 'build-outline',
    roleLabel: 'FOR LOCALS',
    slideNum: '02',
    titlePrefix: 'Built by\nsomeone who\n',
    titleAccent: 'lives here.',
    body: "I got tired of opening five apps just to know what was going on. So I built the one I wanted.",
    cards: [
      { label: 'City services',    desc: 'Info & contacts in Settings' },
      { label: 'Feedback',         desc: 'Goes straight to me' },
      { label: 'Free',             desc: 'No account, no ads, no tracking', wide: true },
    ],
  },
];

const VISITOR_SLIDES: Slide[] = [
  {
    role: 'visitor',
    icon: 'airplane-outline',
    roleLabel: 'VISITING',
    slideNum: '01',
    titlePrefix: 'Welcome to\nJames-\n',
    titleAccent: 'town.',
    body: "The best of WNY's most underrated city, curated for your visit.",
    cards: [
      { label: 'Food & drink',  desc: 'Where locals actually eat' },
      { label: 'Events',        desc: "What's on while you're here" },
      { label: 'Attractions',   desc: 'Lucy, Reg Tory Peterson & more' },
      { label: 'Weather',       desc: '5-day forecast on Home' },
    ],
  },
  {
    role: 'visitor',
    icon: 'map-outline',
    roleLabel: 'VISITING',
    slideNum: '02',
    titlePrefix: 'Curated,\nnot\n',
    titleAccent: 'algorithmic.',
    body: "The Visit tab is places I'd actually send a friend. Filtered by what you're looking for. Hope you love it here.",
    cards: [
      { label: 'Visit tab',        desc: 'Filtered by category' },
      { label: 'No account needed', desc: 'Just open and explore', wide: true },
    ],
  },
];

interface Props {
  onDone: (dontShowAgain: boolean) => void;
}

export default function OnboardingScreen({ onDone }: Props) {
  const [role, setRole] = useState<Role | null>(null);
  const [slide, setSlide] = useState(0);
  const [dontShow, setDontShow] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const roleAnim  = useRef(new Animated.Value(1)).current;

  const slides = role === 'local' ? LOCAL_SLIDES : VISITOR_SLIDES;
  const isLast  = slide === slides.length - 1;
  const accent  = role === 'visitor' ? GOLD : ACC;

  function onLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== containerWidth) {
      setContainerWidth(w);
      slideAnim.setValue(-slide * w);
    }
  }

  function pickRole(r: Role) {
    Animated.timing(roleAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      .start(() => setRole(r));
  }

  function goNext() {
    if (!isLast) {
      Animated.timing(slideAnim, {
        toValue: -(slide + 1) * containerWidth,
        duration: 260,
        useNativeDriver: true,
      }).start(() => setSlide(slide + 1));
    } else {
      onDone(dontShow);
    }
  }

  function goBack() {
    if (slide > 0) {
      Animated.timing(slideAnim, {
        toValue: -(slide - 1) * containerWidth,
        duration: 260,
        useNativeDriver: true,
      }).start(() => setSlide(slide - 1));
    } else {
      setSlide(0);
      slideAnim.setValue(0);
      Animated.timing(roleAnim, { toValue: 1, duration: 200, useNativeDriver: true })
        .start(() => setRole(null));
    }
  }

  // ── Role picker ──────────────────────────────────────────────────────────
  if (role === null) {
    return (
      <Animated.View style={[styles.container, { opacity: roleAnim }]} onLayout={onLayout}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.pickerSafe}>
          <View style={styles.pickerContent}>
            {/* Slide-number style — picker is "00" */}
            <Text style={styles.bigNum}>00</Text>

            <Text style={styles.pickerEyebrow}>Chadakoin Now</Text>
            <Text style={styles.pickerTitle}>
              {'Your guide to\nJames-\n'}
              <Text style={{ color: ACC }}>town.</Text>
            </Text>
            <Text style={styles.pickerBody}>
              Whether you've been here your whole life or just rolled in — tell us who you are.
            </Text>

            <TouchableOpacity activeOpacity={0.85} onPress={() => pickRole('local')} style={styles.roleCard}>
              <LinearGradient
                colors={[`rgba(${ACC_RGB},0.10)`, 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.roleIconWrap, { backgroundColor: `${ACC}15`, borderColor: `${ACC}28` }]}>
                <Ionicons name="home-outline" size={20} color={ACC} />
              </View>
              <View style={styles.roleTextCol}>
                <Text style={[styles.roleCardLabel, { color: ACC }]}>I live here</Text>
                <Text style={styles.roleCardDesc}>Show me what matters day to day</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={`${ACC}60`} />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} onPress={() => pickRole('visitor')} style={styles.roleCard}>
              <LinearGradient
                colors={['rgba(251,191,36,0.09)', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.roleIconWrap, { backgroundColor: 'rgba(251,191,36,0.13)', borderColor: 'rgba(251,191,36,0.22)' }]}>
                <Ionicons name="airplane-outline" size={20} color={GOLD} />
              </View>
              <View style={styles.roleTextCol}>
                <Text style={[styles.roleCardLabel, { color: GOLD }]}>Just visiting</Text>
                <Text style={styles.roleCardDesc}>Show me what to do, eat, and see</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(251,191,36,0.45)" />
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>Chadakoin Now · Built in Jamestown, NY</Text>
        </SafeAreaView>
      </Animated.View>
    );
  }

  // ── Slides ───────────────────────────────────────────────────────────────
  const sl = slides[slide];

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Animated.View style={[
        styles.strip,
        { width: containerWidth * slides.length, transform: [{ translateX: slideAnim }] },
      ]}>
        {slides.map((s, i) => (
          <View key={i} style={[styles.slide, { width: containerWidth }]}>
            <SafeAreaView edges={['top']} style={styles.slideInner}>
              {/* Top row: role label + slide number */}
              <View style={styles.topRow}>
                <View style={styles.roleLabelRow}>
                  <Ionicons name={s.icon} size={13} color={accent} />
                  <Text style={[styles.roleLabel, { color: accent }]}>{s.roleLabel}</Text>
                </View>
                <Text style={styles.bigNumSlide}>{s.slideNum}</Text>
              </View>

              {/* Title */}
              <Text style={styles.slideTitle}>
                {s.titlePrefix}
                <Text style={{ color: accent }}>{s.titleAccent}</Text>
              </Text>

              {/* Body */}
              <Text style={styles.slideBody}>{s.body}</Text>

              {/* Feature cards grid */}
              <View style={styles.cardsGrid}>
                {s.cards.map((card, ci) => (
                  <View
                    key={ci}
                    style={[
                      styles.featureCard,
                      card.wide && styles.featureCardWide,
                    ]}
                  >
                    <Text style={[styles.cardLabel, { color: accent }]}>{card.label}</Text>
                    <Text style={styles.cardDesc}>{card.desc}</Text>
                  </View>
                ))}
              </View>
            </SafeAreaView>
          </View>
        ))}
      </Animated.View>

      {/* Bottom bar */}
      <SafeAreaView edges={['bottom']} style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === slide
                  ? { backgroundColor: accent, width: 22 }
                  : { backgroundColor: 'rgba(255,255,255,0.18)', width: 6 },
              ]}
            />
          ))}
        </View>

        {isLast && (
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Don't show this again</Text>
            <Switch
              value={dontShow}
              onValueChange={setDontShow}
              trackColor={{ false: 'rgba(255,255,255,0.08)', true: `${accent}70` }}
              thumbColor={dontShow ? accent : 'rgba(255,255,255,0.3)'}
            />
          </View>
        )}

        <View style={styles.btnRow}>
          <TouchableOpacity onPress={goBack} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>

          <TouchableOpacity onPress={goNext} activeOpacity={0.85} style={[styles.nextBtn, { backgroundColor: accent }]}>
            <Text style={styles.nextBtnText}>{isLast ? 'Got it' : 'Next'}</Text>
            <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={16} color={dark.bg} />
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Chadakoin Now · Built in Jamestown, NY</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dark.bg,
    overflow: 'hidden',
  },

  // ── Role picker ──────────────────────────────────────────
  pickerSafe: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  pickerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 12,
  },
  pickerEyebrow: {
    fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10,
  },
  pickerTitle: {
    fontFamily: 'Syne', fontSize: 38, fontWeight: '800',
    color: '#fff', letterSpacing: -1, lineHeight: 44,
    marginBottom: 14,
  },
  pickerBody: {
    fontFamily: 'Outfit', fontSize: 14, color: 'rgba(255,255,255,0.45)',
    lineHeight: 21, marginBottom: 32,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  roleIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  roleTextCol: { flex: 1, gap: 2 },
  roleCardLabel: {
    fontFamily: 'Syne', fontSize: 15, fontWeight: '700',
  },
  roleCardDesc: {
    fontFamily: 'Outfit', fontSize: 12, color: 'rgba(255,255,255,0.4)',
  },

  // ── Slides ───────────────────────────────────────────────
  strip: { flex: 1, flexDirection: 'row' },
  slide: { flex: 1 },
  slideInner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 12,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
  },
  roleLabel: {
    fontFamily: 'Outfit', fontSize: 11, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  bigNum: {
    fontFamily: 'Syne', fontSize: 72, fontWeight: '800',
    color: 'rgba(255,255,255,0.07)', lineHeight: 72,
    letterSpacing: -2,
  },
  bigNumSlide: {
    fontFamily: 'Syne', fontSize: 72, fontWeight: '800',
    color: 'rgba(255,255,255,0.07)', lineHeight: 72,
    letterSpacing: -2,
  },

  slideTitle: {
    fontFamily: 'Syne', fontSize: 34, fontWeight: '800',
    color: '#fff', letterSpacing: -0.8, lineHeight: 40,
    marginBottom: 12,
  },
  slideBody: {
    fontFamily: 'Outfit', fontSize: 14, color: 'rgba(255,255,255,0.5)',
    lineHeight: 21, marginBottom: 22,
  },

  // Feature cards
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureCard: {
    width: '47.5%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  featureCardWide: {
    width: '100%',
  },
  cardLabel: {
    fontFamily: 'Syne', fontSize: 13, fontWeight: '700',
  },
  cardDesc: {
    fontFamily: 'Outfit', fontSize: 12, color: 'rgba(255,255,255,0.45)',
    lineHeight: 17,
  },

  // ── Bottom bar ───────────────────────────────────────────
  bottom: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: dark.bg,
    gap: 12,
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center' },
  dot:  { height: 6, borderRadius: 3 },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.5)',
  },

  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  nextBtn: {
    flex: 1, height: 50, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  nextBtnText: {
    fontFamily: 'Syne', fontSize: 15, fontWeight: '700', color: dark.bg,
  },

  footer: {
    fontFamily: 'Outfit', fontSize: 10, textAlign: 'center',
    color: 'rgba(255,255,255,0.12)', paddingBottom: 4,
  },
});
