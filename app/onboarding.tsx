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

type Role = 'local' | 'visitor';

interface Slide {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  gradStart: string;
  gradEnd: string;
  title: string;
  body: string;
  bullets: string[];
}

const LOCAL_SLIDES: Slide[] = [
  {
    icon: 'home-outline',
    iconColor: ACC,
    gradStart: `rgba(${ACC_RGB},0.15)`,
    gradEnd: 'transparent',
    title: 'Your city, always current',
    body: "Everything you need to stay on top of life in Jamestown — in one place.",
    bullets: [
      'Snow emergency & weather alerts on Home',
      'Your recycling schedule (never miss pickup)',
      'Local news from Jamestown outlets',
      'Sabres, JCC Jayhawks, and regional sports',
      'Events and things happening this month',
    ],
  },
  {
    icon: 'notifications-outline',
    iconColor: '#a78bfa',
    gradStart: 'rgba(167,139,250,0.15)',
    gradEnd: 'transparent',
    title: 'Built for people who live here',
    body: "I got tired of opening five apps just to know what was going on in my own city. So I built the one I wanted.\n\nIf something's wrong, missing, or could be better — the feedback button is in Settings. I read everything.",
    bullets: [
      'City services info in Settings',
      'Feedback goes straight to me',
      'Free, no account required',
    ],
  },
];

const VISITOR_SLIDES: Slide[] = [
  {
    icon: 'map-outline',
    iconColor: '#fb7185',
    gradStart: 'rgba(251,113,133,0.15)',
    gradEnd: 'transparent',
    title: 'Explore Jamestown',
    body: "The Visit tab is your guide to the city — places I've personally been and would send a friend.",
    bullets: [
      'Restaurants, bars, and coffee shops',
      'National Comedy Center & Lucy-Desi Museum',
      'Roger Tory Peterson Institute',
      'Shops, attractions, and local gems',
      'Filter by what you\'re looking for',
    ],
  },
  {
    icon: 'calendar-outline',
    iconColor: '#fbbf24',
    gradStart: 'rgba(251,191,36,0.15)',
    gradEnd: 'transparent',
    title: "What's happening while you're here",
    body: "Check the Events tab for concerts, festivals, and things to do. The Home screen shows weather so you know what to expect.\n\nHope you love it here.",
    bullets: [
      'Weekend and monthly event filters',
      'Live weather on the Home screen',
      'Local news if you want to go deeper',
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
  const roleAnim  = useRef(new Animated.Value(1)).current;  // fade out picker

  const slides = role === 'local' ? LOCAL_SLIDES : VISITOR_SLIDES;
  const isLast  = slide === slides.length - 1;

  function onLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== containerWidth) {
      setContainerWidth(w);
      slideAnim.setValue(-slide * w);
    }
  }

  function pickRole(r: Role) {
    // Fade out the picker, then show slides
    Animated.timing(roleAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setRole(r));
  }

  function goNext() {
    if (!isLast) {
      Animated.timing(slideAnim, {
        toValue: -(slide + 1) * containerWidth,
        duration: 280,
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
        duration: 280,
        useNativeDriver: true,
      }).start(() => setSlide(slide - 1));
    } else {
      // Back to role picker
      setSlide(0);
      slideAnim.setValue(0);
      Animated.timing(roleAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setRole(null));
    }
  }

  // ── Role picker ──────────────────────────────────────────────────────────
  if (role === null) {
    return (
      <Animated.View style={[styles.container, { opacity: roleAnim }]} onLayout={onLayout}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.pickerOuter}>
          <View style={styles.pickerContent}>
            <View style={[styles.iconWrap, { backgroundColor: `${ACC}15`, borderColor: `${ACC}30` }]}>
              <Ionicons name="location-outline" size={32} color={ACC} />
            </View>

            <Text style={styles.pickerEyebrow}>Welcome to</Text>
            <Text style={styles.pickerTitle}>Chadakoin Now</Text>
            <Text style={styles.pickerSub}>Your guide to Jamestown, NY</Text>

            <Text style={styles.pickerPrompt}>Are you…</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => pickRole('local')}
              style={styles.roleCard}
            >
              <LinearGradient
                colors={[`rgba(${ACC_RGB},0.12)`, 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.roleIconWrap, { backgroundColor: `${ACC}18`, borderColor: `${ACC}30` }]}>
                <Ionicons name="home-outline" size={24} color={ACC} />
              </View>
              <View style={styles.roleText}>
                <Text style={[styles.roleTitle, { color: ACC }]}>A Jamestown local</Text>
                <Text style={styles.roleDesc}>I live here — show me what matters day to day</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={`${ACC}70`} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => pickRole('visitor')}
              style={styles.roleCard}
            >
              <LinearGradient
                colors={['rgba(251,191,36,0.10)', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.roleIconWrap, { backgroundColor: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.25)' }]}>
                <Ionicons name="airplane-outline" size={24} color="#fbbf24" />
              </View>
              <View style={styles.roleText}>
                <Text style={[styles.roleTitle, { color: '#fbbf24' }]}>Just visiting</Text>
                <Text style={styles.roleDesc}>Show me what to do, see, and eat while I'm here</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(251,191,36,0.5)" />
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>Chadakoin Now · Built in Jamestown, NY</Text>
        </SafeAreaView>
      </Animated.View>
    );
  }

  // ── Tailored slides ──────────────────────────────────────────────────────
  const sl = slides[slide];

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Animated.View style={[
        styles.strip,
        { width: containerWidth * slides.length, transform: [{ translateX: slideAnim }] },
      ]}>
        {slides.map((s, i) => (
          <View key={i} style={[styles.slide, { width: containerWidth }]}>
            <LinearGradient
              colors={[s.gradStart, s.gradEnd] as any}
              start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <SafeAreaView edges={['top']} style={styles.slideInner}>
              <View style={[styles.iconWrap, { backgroundColor: `${s.iconColor}15`, borderColor: `${s.iconColor}30` }]}>
                <Ionicons name={s.icon} size={32} color={s.iconColor} />
              </View>

              {/* Role badge */}
              <View style={[styles.roleBadge, role === 'local'
                ? { backgroundColor: `rgba(${ACC_RGB},0.12)`, borderColor: `rgba(${ACC_RGB},0.25)` }
                : { backgroundColor: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.25)' }
              ]}>
                <Ionicons
                  name={role === 'local' ? 'home-outline' : 'airplane-outline'}
                  size={11}
                  color={role === 'local' ? ACC : '#fbbf24'}
                />
                <Text style={[styles.roleBadgeText, { color: role === 'local' ? ACC : '#fbbf24' }]}>
                  {role === 'local' ? 'For locals' : 'For visitors'} · {i + 1} of {slides.length}
                </Text>
              </View>

              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.body}>{s.body}</Text>

              <View style={styles.bullets}>
                {s.bullets.map((b, bi) => (
                  <View key={bi} style={styles.bulletRow}>
                    <Ionicons name="checkmark-circle" size={14} color={`${s.iconColor}90`} />
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            </SafeAreaView>
          </View>
        ))}
      </Animated.View>

      {/* Bottom bar */}
      <SafeAreaView edges={['bottom']} style={styles.bottom}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === slide
                  ? { backgroundColor: sl.iconColor, width: 20 }
                  : { backgroundColor: 'rgba(255,255,255,0.2)', width: 6 },
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
              trackColor={{ false: 'rgba(255,255,255,0.08)', true: `rgba(${ACC_RGB},0.45)` }}
              thumbColor={dontShow ? ACC : 'rgba(255,255,255,0.35)'}
            />
          </View>
        )}

        <View style={styles.btnRow}>
          <TouchableOpacity onPress={goBack} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>

          <TouchableOpacity onPress={goNext} activeOpacity={0.85} style={[styles.nextBtn, { backgroundColor: sl.iconColor }]}>
            <Text style={styles.nextBtnText}>{isLast ? 'Got it' : 'Next'}</Text>
            <Ionicons
              name={isLast ? 'checkmark' : 'arrow-forward'}
              size={16}
              color={dark.bg}
            />
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

  // ── Role picker ──────────────────────────────────────────────
  pickerOuter: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  pickerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  pickerEyebrow: {
    fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4,
  },
  pickerTitle: {
    fontFamily: 'Syne', fontSize: 32, fontWeight: '800',
    color: '#fff', letterSpacing: -0.5, lineHeight: 36, marginBottom: 6,
  },
  pickerSub: {
    fontFamily: 'Outfit', fontSize: 15, color: 'rgba(255,255,255,0.5)',
    marginBottom: 40,
  },
  pickerPrompt: {
    fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 14,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  roleIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  roleText: { flex: 1, gap: 3 },
  roleTitle: {
    fontFamily: 'Syne', fontSize: 16, fontWeight: '700',
  },
  roleDesc: {
    fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.45)',
    lineHeight: 18,
  },

  // ── Slides ───────────────────────────────────────────────────
  strip: {
    flex: 1,
    flexDirection: 'row',
  },
  slide: {
    flex: 1,
    overflow: 'hidden',
  },
  slideInner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 16,
  },

  iconWrap: {
    width: 72, height: 72, borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },

  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 14,
  },
  roleBadgeText: {
    fontFamily: 'Outfit', fontSize: 10, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },

  title: {
    fontFamily: 'Syne', fontSize: 26, fontWeight: '800',
    color: '#fff', letterSpacing: -0.5, lineHeight: 32,
    marginBottom: 14,
  },
  body: {
    fontFamily: 'Outfit', fontSize: 15, color: 'rgba(255,255,255,0.65)',
    lineHeight: 24,
  },

  bullets: { marginTop: 18, gap: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bulletText: { fontFamily: 'Outfit', fontSize: 14, color: 'rgba(255,255,255,0.7)', flex: 1 },

  // ── Bottom bar ───────────────────────────────────────────────
  bottom: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: dark.bg,
    gap: 14,
  },

  dots: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center' },
  dot:  { height: 6, borderRadius: 3 },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  toggleLabel: {
    fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.55)',
  },

  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
    color: 'rgba(255,255,255,0.15)', paddingBottom: 4,
  },
});
