import { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MapGridBackground } from './MapGridBackground';
import { useTheme } from '../lib/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');

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

export function AppLoadingScreen({
  isAppReady = false,
  skipIntro = false,
  onFinished,
}: {
  isAppReady?: boolean;
  skipIntro?: boolean;
  onFinished?: () => void;
}) {
  const { theme } = useTheme();

  const [statusIdx, setStatusIdx]       = useState(0);
  const [sequenceDone, setSequenceDone] = useState(false);
  const [statusReady, setStatusReady]   = useState(false);
  const [checkedCount, setCheckedCount] = useState(0);

  const screenFade = useRef(new Animated.Value(0)).current;
  const exitAnim   = useRef(new Animated.Value(1)).current;
  const textFade   = useRef(new Animated.Value(0)).current;
  const statusFade = useRef(new Animated.Value(0)).current;
  const pagesFade  = useRef(new Animated.Value(0)).current;

  // Fade in on mount, mark sequence done after intro. Repeat web visitors
  // (skipIntro) get the branded animation collapsed to near-nothing — but
  // the overlay itself still stays up until isAppReady, below. Only the
  // cosmetic minimum-splash-time is skipped, never the actual data gate:
  // that's what used to let people through to a skeleton-filled Home when
  // "skip loading screen for repeat visitors" was implemented as skipping
  // the overlay outright instead of just its fixed intro delay.
  useEffect(() => {
    const introDuration = skipIntro ? 60 : 1400;
    Animated.timing(screenFade, { toValue: 1, duration: skipIntro ? 150 : 700, useNativeDriver: true }).start();
    Animated.timing(textFade,   { toValue: 1, duration: skipIntro ? 150 : 900, delay: skipIntro ? 0 : 400, useNativeDriver: true }).start();
    const t = setTimeout(() => setSequenceDone(true), introDuration);
    return () => clearTimeout(t);
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

  const statusText = statusReady
    ? 'READY'
    : sequenceDone ? STATUS_MESSAGES[statusIdx] : 'Initializing...';

  // Matches whichever theme the user picked in Settings, instead of a
  // fixed gold (day) / blue (night) split — same map artwork for everyone,
  // accent color now follows theme.acc like the rest of the app does.
  const accent      = theme.acc;
  const titleClr    = '#ffffff';
  const subtitleClr = `rgba(${theme.accRGB},0.85)`;
  const dividerClr  = `rgba(${theme.accRGB},0.4)`;
  const kickerClr   = `rgba(${theme.accRGB},0.55)`;
  const statusClr   = `rgba(${theme.accRGB},0.75)`;
  const rowLabelClr = 'rgba(255,255,255,0.9)';

  return (
    <Animated.View style={[styles.container, { opacity: exitAnim, backgroundColor: '#060e18' }]}>
      <MapGridBackground />

      <Animated.View style={[styles.inner, { opacity: screenFade }]}>

        <Text style={[styles.kicker, { color: kickerClr }]}>CHAUTAUQUA LAKE</Text>

        <Animated.View style={[styles.textWrap, { opacity: textFade }]}>
          <Text style={[styles.title, { color: titleClr }]}>CHADAKOIN</Text>
          <View style={styles.nowRow}>
            <Text style={[styles.title, { color: accent }]}>NOW</Text>
            <View style={[styles.accentDot, { backgroundColor: accent }]} />
          </View>
          <View style={[styles.divider, { backgroundColor: dividerClr }]} />
          <Text style={[styles.subtitle, { color: subtitleClr }]}>JAMESTOWN · NEW YORK</Text>
        </Animated.View>

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
                <Ionicons name={page.icon} size={17} color={accent} style={styles.pageIcon} />
                <Text style={[styles.pageLabel, { color: rowLabelClr }]}>{page.label}</Text>
                {done ? (
                  <Ionicons name="checkmark-circle-outline" size={19} color={accent} />
                ) : (
                  <ActivityIndicator size="small" color={accent} />
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
    paddingHorizontal: 32,
  },
  kicker: {
    marginBottom: 28,
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    letterSpacing: 3,
    textAlign: 'center',
  },
  textWrap: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 34,
    letterSpacing: 4,
    textAlign: 'center',
    lineHeight: 42,
  },
  nowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accentDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 6,
  },
  divider: {
    width: 64,
    height: 1,
    marginTop: 16,
    marginBottom: 14,
  },
  subtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    letterSpacing: 2.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  status: {
    marginTop: 44,
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  pageList: {
    marginTop: 20,
    width: Math.min(SCREEN_W - 64, 300),
    gap: 10,
  },
  pageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  pageIcon: { width: 18 },
  pageLabel: {
    flex: 1,
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
  },
});
