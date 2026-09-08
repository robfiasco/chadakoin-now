import { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MapGridBackground } from './MapGridBackground';

const { width: SCREEN_W } = Dimensions.get('window');
const RING_SIZE  = Math.min(Math.round(SCREEN_W * 0.62), 240);
const DOT_RADIUS = 10;

const STATUS_MESSAGES = [
  'Scanning local feeds...',
  'Checking the weather...',
  'Tuning in to Jamestown...',
  'Loading city pulse...',
  'Almost ready...',
];

// Mirrors the bottom tab bar in app/_layout.tsx (TABS) — kept as a local
// copy since that array isn't exported and this is presentational only.
const PAGES: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Home',   icon: 'home-outline' },
  { label: 'Sports', icon: 'trophy-outline' },
  { label: 'News',   icon: 'newspaper-outline' },
  { label: 'Events', icon: 'calendar-outline' },
  { label: 'Visit',  icon: 'map-outline' },
];

function isNight() {
  const h = new Date().getHours();
  return h < 6 || h >= 20;
}

export function AppLoadingScreen({
  isAppReady = false,
  onFinished,
}: {
  isAppReady?: boolean;
  onFinished?: () => void;
}) {
  const night = isNight();

  const [statusIdx, setStatusIdx]       = useState(0);
  const [sequenceDone, setSequenceDone] = useState(false);
  const [statusReady, setStatusReady]   = useState(false);
  const [checkedCount, setCheckedCount] = useState(0);

  const screenFade = useRef(new Animated.Value(0)).current;
  const exitAnim   = useRef(new Animated.Value(1)).current;
  const orbitAnim  = useRef(new Animated.Value(0)).current;
  const textFade   = useRef(new Animated.Value(0)).current;
  const statusFade = useRef(new Animated.Value(0)).current;
  const pagesFade  = useRef(new Animated.Value(0)).current;

  // Fade in on mount, mark sequence done after intro
  useEffect(() => {
    Animated.timing(screenFade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    Animated.timing(textFade,   { toValue: 1, duration: 900, delay: 400, useNativeDriver: true }).start();
    const t = setTimeout(() => setSequenceDone(true), 1400);
    return () => clearTimeout(t);
  }, []);

  // Continuous orbital — 8s per revolution
  useEffect(() => {
    Animated.loop(
      Animated.timing(orbitAnim, { toValue: 1, duration: 8000, useNativeDriver: true })
    ).start();
  }, []);

  // Status messages + page checklist appear once sequence is done
  useEffect(() => {
    if (!sequenceDone) return;
    Animated.timing(statusFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.timing(pagesFade,  { toValue: 1, duration: 500, delay: 150, useNativeDriver: true }).start();
    const interval = setInterval(() => setStatusIdx(i => (i + 1) % STATUS_MESSAGES.length), 2400);
    // Checklist rows tick from spinner to checkmark one at a time — a
    // reassuring sense of progress. Not wired to per-tab load state (the
    // app loads its data as one batch), so this is a paced reveal rather
    // than literal per-page telemetry.
    const rowTimer = setInterval(() => {
      setCheckedCount(c => (c < PAGES.length ? c + 1 : c));
    }, 420);
    return () => { clearInterval(interval); clearInterval(rowTimer); };
  }, [sequenceDone]);

  // Exit: fade out when app is ready
  useEffect(() => {
    if (!sequenceDone || !isAppReady) return;
    setStatusReady(true);
    setCheckedCount(PAGES.length); // never exit mid-spin on a row
    const t = setTimeout(() => {
      Animated.timing(exitAnim, { toValue: 0, duration: 420, useNativeDriver: true })
        .start(() => onFinished?.());
    }, 350);
    return () => clearTimeout(t);
  }, [sequenceDone, isAppReady]);

  const orbitRotate = orbitAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const statusText = statusReady
    ? 'Ready'
    : sequenceDone ? STATUS_MESSAGES[statusIdx] : 'Initializing...';

  // Time-of-day accent — same map artwork, warmer accent by day, cooler by night
  const accent     = night ? '#5ac3e6' : '#e0a860';
  const ringColor  = night ? 'rgba(90, 195, 230, 0.6)' : 'rgba(224, 168, 96, 0.55)';
  const dotBg      = night ? '#d8eaf8' : '#fff3da';
  const dotGlow    = night ? 'rgba(180, 215, 248, 0.85)' : 'rgba(224, 168, 96, 0.85)';
  const titleClr   = night ? '#e6f3ff' : '#fff3e6';
  const subtitleClr = night ? 'rgba(155, 205, 235, 0.55)' : 'rgba(224, 178, 120, 0.6)';
  const dividerClr = night ? 'rgba(90, 195, 230, 0.28)' : 'rgba(224, 168, 96, 0.3)';
  const statusClr  = night ? 'rgba(145, 200, 232, 0.5)' : 'rgba(224, 178, 120, 0.55)';
  const rowLabelClr = night ? 'rgba(220, 238, 250, 0.85)' : 'rgba(255, 240, 225, 0.85)';
  const rowIconClr  = night ? 'rgba(160, 205, 230, 0.6)' : 'rgba(224, 178, 120, 0.65)';

  const dotWebGlow = Platform.OS === 'web'
    ? ({ boxShadow: `0 0 20px 10px ${dotGlow}` } as any)
    : {};

  return (
    <Animated.View style={[styles.container, { opacity: exitAnim, backgroundColor: '#060e18' }]}>
      <MapGridBackground night={night} />

      <Animated.View style={[styles.inner, { opacity: screenFade }]}>

        {/* Ring + orbiting body */}
        <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>

          {/* Static ring */}
          <View style={[styles.ring, {
            width: RING_SIZE, height: RING_SIZE,
            borderRadius: RING_SIZE / 2,
            borderColor: ringColor,
          }]} />

          {/* Rotating arm — dot sits at the top of the arm, traces the ring */}
          <Animated.View style={[styles.orbitArm, {
            width: RING_SIZE, height: RING_SIZE,
            transform: [{ rotate: orbitRotate }],
          }]}>
            <View style={[styles.orbitDot, dotWebGlow, {
              top:  -DOT_RADIUS,
              left: RING_SIZE / 2 - DOT_RADIUS,
              width:  DOT_RADIUS * 2,
              height: DOT_RADIUS * 2,
              borderRadius: DOT_RADIUS,
              backgroundColor: dotBg,
              shadowColor: dotGlow,
            }]} />
          </Animated.View>

          {/* Text centered inside ring */}
          <Animated.View style={[styles.textWrap, { opacity: textFade }]}>
            <Text style={[styles.title, { color: titleClr }]}>CHADAKOIN</Text>
            <Text style={[styles.title, { color: accent }]}>NOW</Text>
            <View style={[styles.divider, { backgroundColor: dividerClr }]} />
            <Text style={[styles.subtitle, { color: subtitleClr }]}>JAMESTOWN · NEW YORK</Text>
          </Animated.View>

        </View>

        {/* Status line */}
        <Animated.Text style={[styles.status, { color: statusClr, opacity: statusFade }]}>
          {statusText}
        </Animated.Text>

        {/* Page checklist */}
        <Animated.View style={[styles.pageList, { opacity: pagesFade }]}>
          {PAGES.map((page, i) => {
            const done = i < checkedCount;
            return (
              <View key={page.label} style={styles.pageRow}>
                <Ionicons name={page.icon} size={16} color={rowIconClr} style={styles.pageIcon} />
                <Text style={[styles.pageLabel, { color: rowLabelClr }]}>{page.label}</Text>
                {done ? (
                  <Ionicons name="checkmark-circle" size={16} color={accent} />
                ) : (
                  <ActivityIndicator size="small" color={rowIconClr} />
                )}
              </View>
            );
          })}
        </Animated.View>

      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  orbitArm: {
    position: 'absolute',
  },
  orbitDot: {
    position: 'absolute',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius:  14,
    elevation: 10,
  },
  textWrap: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 22,
    letterSpacing: 3,
    textAlign: 'center',
    lineHeight: 30,
  },
  divider: {
    width: 48,
    height: 1,
    marginTop: 14,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 9.5,
    letterSpacing: 2.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  status: {
    marginTop: 40,
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  pageList: {
    marginTop: 22,
    width: Math.min(SCREEN_W - 64, 300),
    gap: 8,
  },
  pageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  pageIcon: { width: 18 },
  pageLabel: {
    flex: 1,
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
  },
});
