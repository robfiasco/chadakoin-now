import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  Animated, LayoutChangeEvent, ImageBackground, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { dark } from '../lib/colors';

const BG_POOL = Platform.OS === 'web'
  ? [{ uri: '/jamestown.jpg' }, { uri: '/alley.jpg' }, { uri: '/lake.png' }]
  : [require('../public/jamestown.jpg'), require('../public/alley.jpg'), require('../public/lake.png')];

// Shuffle once per session: [0] = picker, [1] = slide 0, [2] = slide 1
function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const BG_IMAGES = shuffled(BG_POOL);

const ACC     = '#22d3ee';
const ACC_RGB = '34,211,238';
const GOLD    = '#fbbf24';

type Role = 'local' | 'visitor';

interface FeatureCard { label: string; desc: string; wide?: boolean; }

interface Slide {
  role: Role;
  icon: keyof typeof Ionicons.glyphMap;
  roleLabel: string;
  titlePrefix: string;
  titleAccent: string;
  body: string;
  cards: FeatureCard[];
}

const LOCAL_SLIDES: Slide[] = [
  {
    role: 'local', icon: 'home-outline', roleLabel: 'FOR LOCALS',
    titlePrefix: 'Your city, always ',
    titleAccent: 'current.',
    body: 'Everything Jamestown — one place, always up to date.',
    cards: [
      { label: 'Weather',   desc: 'Forecast on your Home screen' },
      { label: 'Recycling', desc: "See what's getting picked up this week" },
      { label: 'News',      desc: 'Local outlets & feeds' },
      { label: 'Sports',    desc: 'Sabres, Jayhawks, MLB & more' },
      { label: 'Events',    desc: "What's happening now", wide: true },
    ],
  },
  {
    role: 'local', icon: 'build-outline', roleLabel: 'FOR LOCALS',
    titlePrefix: 'Built by someone who ',
    titleAccent: 'lives here.',
    body: "I got tired of opening five apps just to know what was going on. So I built the one I wanted.",
    cards: [
      { label: 'City services', desc: 'Info & contacts in Settings' },
      { label: 'Feedback',      desc: 'Goes straight to me' },
      { label: 'Free',          desc: 'No account, no ads, no tracking', wide: true },
    ],
  },
];

const VISITOR_SLIDES: Slide[] = [
  {
    role: 'visitor', icon: 'airplane-outline', roleLabel: 'VISITING',
    titlePrefix: 'Welcome to ',
    titleAccent: 'Jamestown.',
    body: "The best of WNY's most underrated city, curated for your visit.",
    cards: [
      { label: 'Food & drink', desc: 'Where locals actually eat' },
      { label: 'Events',       desc: "What's on while you're here" },
      { label: 'Attractions',  desc: 'Lucy, Roger Tory Peterson & more' },
      { label: 'Weather',      desc: '5-day forecast on Home' },
    ],
  },
  {
    role: 'visitor', icon: 'map-outline', roleLabel: 'VISITING',
    titlePrefix: 'Curated, not ',
    titleAccent: 'algorithmic.',
    body: "The Visit tab is places I'd actually send a friend. Filtered by what you're looking for. Hope you love it here.",
    cards: [
      { label: 'Visit tab',         desc: 'Filtered by category' },
      { label: 'No account needed', desc: 'Just open and explore', wide: true },
    ],
  },
];

interface Props { onDone: (dontShowAgain: boolean) => void; }

export default function OnboardingScreen({ onDone }: Props) {
  const [role, setRole]               = useState<Role | null>(null);
  const [pickerVisible, setPickerVisible] = useState(true);
  const [slide, setSlide]             = useState(0);
  const [dontShow, setDontShow]       = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pickerAnim = useRef(new Animated.Value(1)).current;

  // Background crossfade: [0]=picker, [1]=slide0, [2]=slide1
  const [bgFrom, setBgFrom] = useState(0);
  const [bgTo,   setBgTo]   = useState(0);
  const bgAnim = useRef(new Animated.Value(1)).current;

  function crossfadeTo(index: number) {
    setBgFrom(bgTo);
    setBgTo(index);
    bgAnim.setValue(0);
    Animated.timing(bgAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }

  const slides = role === 'local' ? LOCAL_SLIDES : VISITOR_SLIDES;
  const isLast = slide === slides.length - 1;
  const accent = role === 'visitor' ? GOLD : ACC;

  function onLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== containerWidth) {
      setContainerWidth(w);
      slideAnim.setValue(-slide * w);
    }
  }

  function pickRole(r: Role) {
    setRole(r);
    crossfadeTo(1);
    Animated.timing(pickerAnim, { toValue: 0, duration: 220, useNativeDriver: true })
      .start(() => setPickerVisible(false));
  }

  function goBackToPicker() {
    setPickerVisible(true);
    setSlide(0);
    slideAnim.setValue(0);
    pickerAnim.setValue(0);
    crossfadeTo(0);
    Animated.timing(pickerAnim, { toValue: 1, duration: 220, useNativeDriver: true })
      .start(() => setRole(null));
  }

  function goNext() {
    if (!isLast) {
      crossfadeTo(slide + 2); // slide+1 maps to BG index slide+2
      Animated.timing(slideAnim, {
        toValue: -(slide + 1) * containerWidth,
        duration: 260, useNativeDriver: true,
      }).start(() => setSlide(slide + 1));
    } else {
      onDone(dontShow);
    }
  }

  function goBack() {
    if (slide > 0) {
      crossfadeTo(slide); // going back: slide-1 maps to BG index slide
      Animated.timing(slideAnim, {
        toValue: -(slide - 1) * containerWidth,
        duration: 260, useNativeDriver: true,
      }).start(() => setSlide(slide - 1));
    } else {
      goBackToPicker();
    }
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      {/* ── Crossfading background — one image per screen ── */}
      <ImageBackground source={BG_IMAGES[bgFrom]} resizeMode="cover" style={StyleSheet.absoluteFill} />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgAnim }]} pointerEvents="none">
        <ImageBackground source={BG_IMAGES[bgTo]} resizeMode="cover" style={StyleSheet.absoluteFill} />
      </Animated.View>
      <LinearGradient
        colors={['rgba(0,5,15,0.40)', 'rgba(0,5,15,0.80)', 'rgba(0,5,15,0.97)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* ── Slides (rendered as soon as role is set) ── */}
      {role !== null && (
        <View style={{ flex: 1 }}>
          <Animated.View style={[
            styles.strip,
            { width: containerWidth * slides.length, transform: [{ translateX: slideAnim }] },
          ]}>
            {slides.map((s, i) => (
              <View key={i} style={[styles.slide, { width: containerWidth }]}>
                <SafeAreaView edges={['top']} style={styles.slideInner}>
                  <View style={styles.roleLabelRow}>
                    <Ionicons name={s.icon} size={12} color={accent} />
                    <Text style={[styles.roleLabel, { color: accent }]}>{s.roleLabel}</Text>
                  </View>
                  <Text style={styles.slideTitle}>
                    {s.titlePrefix}
                    <Text style={{ color: accent }}>{s.titleAccent}</Text>
                  </Text>
                  <Text style={styles.slideBody}>{s.body}</Text>
                  <View style={styles.cardsGrid}>
                    {s.cards.map((card, ci) => (
                      <View key={ci} style={[styles.featureCard, card.wide && styles.featureCardWide]}>
                        <Text style={[styles.cardLabel, { color: accent }]}>{card.label}</Text>
                        <Text style={styles.cardDesc}>{card.desc}</Text>
                      </View>
                    ))}
                  </View>
                </SafeAreaView>
              </View>
            ))}
          </Animated.View>

          <SafeAreaView edges={['bottom']} style={styles.bottom}>
            <View style={styles.dots}>
              {slides.map((_, i) => (
                <View key={i} style={[
                  styles.dot,
                  i === slide
                    ? { backgroundColor: accent, width: 22 }
                    : { backgroundColor: 'rgba(255,255,255,0.18)', width: 6 },
                ]} />
              ))}
            </View>
            {isLast && (
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Don't show this again</Text>
                <Switch
                  value={dontShow} onValueChange={setDontShow}
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
      )}

      {/* ── Picker overlay — fades out over the already-visible slides ── */}
      {pickerVisible && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: pickerAnim }]}>
          <SafeAreaView edges={['top', 'bottom']} style={styles.pickerSafe}>
            <View style={styles.pickerTop}>
              <View style={styles.lockup}>
                <View style={styles.lockupIcon}>
                  <Text style={styles.lockupC}>C</Text>
                  <Text style={styles.lockupN}>N</Text>
                </View>
                <Text style={styles.lockupText}>
                  Chadakoin <Text style={{ color: ACC }}>Now</Text>
                </Text>
              </View>
            </View>

            <View style={styles.pickerMiddle}>
              <Text style={styles.pickerHeadline}>
                {'Welcome to\nJamestown, New York.'}
              </Text>
              <Text style={styles.pickerBody}>Let's tailor your view of the city.</Text>

              <View style={styles.pickerRows}>
                <TouchableOpacity activeOpacity={0.8} onPress={() => pickRole('local')} style={styles.roleRow}>
                  <View style={[styles.roleRowIcon, { backgroundColor: `${ACC}18` }]}>
                    <Ionicons name="home-outline" size={18} color={ACC} />
                  </View>
                  <View style={styles.roleRowText}>
                    <Text style={styles.roleRowLabel}>I live in Jamestown</Text>
                    <Text style={styles.roleRowSub}>Daily local feed</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
                </TouchableOpacity>

                <View style={styles.roleRowDivider} />

                <TouchableOpacity activeOpacity={0.8} onPress={() => pickRole('visitor')} style={styles.roleRow}>
                  <View style={[styles.roleRowIcon, { backgroundColor: 'rgba(251,191,36,0.15)' }]}>
                    <Ionicons name="airplane-outline" size={18} color={GOLD} />
                  </View>
                  <View style={styles.roleRowText}>
                    <Text style={styles.roleRowLabel}>I'm just visiting</Text>
                    <Text style={styles.roleRowSub}>Must-do highlights</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={() => onDone(false)} activeOpacity={0.6} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip setup</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Animated.View>
      )}
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
    flex: 1, paddingHorizontal: 24,
    justifyContent: 'space-between', paddingBottom: 24,
  },
  // extra top padding compensates for Dynamic Island on web (SafeAreaView unreliable in mobile Safari)
  pickerTop: { paddingTop: Platform.OS === 'web' ? 56 : 16 },
  lockup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lockupIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#0f0b08',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 1,
  },
  lockupC: { fontFamily: Platform.OS === 'web' ? 'Cormorant Garamond' : 'Georgia', fontSize: 18, fontWeight: '500', color: '#4a6fa5', lineHeight: 22 },
  lockupN: { fontFamily: Platform.OS === 'web' ? 'Cormorant Garamond' : 'Georgia', fontSize: 18, fontWeight: '500', color: '#d1d5db', lineHeight: 22 },
  lockupText: { fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: '#fff' },
  pickerMiddle: { flex: 1, justifyContent: 'center', paddingVertical: 16 },
  pickerHeadline: {
    fontFamily: 'DMSans_600SemiBold', fontSize: 28,
    color: '#fff', lineHeight: 36, marginBottom: 10,
  },
  pickerBody: {
    fontFamily: 'DMSans_400Regular', fontSize: 15,
    color: 'rgba(255,255,255,0.45)', marginBottom: 32,
  },
  pickerRows: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, backgroundColor: 'rgba(0,5,15,0.55)', overflow: 'hidden',
  },
  roleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 16,
  },
  roleRowDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 16 },
  roleRowIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  roleRowText: { flex: 1 },
  roleRowLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: '#fff', marginBottom: 2 },
  roleRowSub: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  skipBtn: { alignSelf: 'center', paddingVertical: 8 },
  skipText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.3)' },

  // ── Slides ───────────────────────────────────────────────
  strip: { flex: 1, flexDirection: 'row' },
  slide: { flex: 1 },
  slideInner: { flex: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 12, justifyContent: 'flex-end' },
  roleLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 },
  roleLabel: {
    fontFamily: 'Outfit', fontSize: 11, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  slideTitle: {
    fontFamily: 'DMSans_700Bold', fontSize: 22,
    color: '#fff', letterSpacing: -0.3, lineHeight: 32, marginBottom: 10,
  },
  slideBody: {
    fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.5)',
    lineHeight: 20, marginBottom: 20,
  },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureCard: {
    width: '47.5%', backgroundColor: 'rgba(0,5,15,0.45)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12, padding: 14, gap: 4,
  },
  featureCardWide: { width: '100%' },
  cardLabel: { fontFamily: 'Syne', fontSize: 13, fontWeight: '700' },
  cardDesc: { fontFamily: 'Outfit', fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 17 },

  // ── Bottom bar ───────────────────────────────────────────
  bottom: {
    paddingHorizontal: 24, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,5,15,0.75)', gap: 12,
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center' },
  dot:  { height: 6, borderRadius: 3 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.5)' },
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
  nextBtnText: { fontFamily: 'Syne', fontSize: 15, fontWeight: '700', color: dark.bg },
  footer: {
    fontFamily: 'Outfit', fontSize: 10, textAlign: 'center',
    color: 'rgba(255,255,255,0.12)', paddingBottom: 4,
  },
});
