import { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_W } = Dimensions.get('window');
const RING_SIZE  = Math.min(Math.round(SCREEN_W * 0.70), 272);
const DOT_RADIUS = 11;

const STATUS_MESSAGES = [
  'Scanning local feeds...',
  'Checking the weather...',
  'Tuning in to Jamestown...',
  'Loading city pulse...',
  'Almost ready...',
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

  const screenFade = useRef(new Animated.Value(0)).current;
  const exitAnim   = useRef(new Animated.Value(1)).current;
  const orbitAnim  = useRef(new Animated.Value(0)).current;
  const textFade   = useRef(new Animated.Value(0)).current;
  const statusFade = useRef(new Animated.Value(0)).current;

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

  // Status messages appear once sequence is done
  useEffect(() => {
    if (!sequenceDone) return;
    Animated.timing(statusFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    const interval = setInterval(() => setStatusIdx(i => (i + 1) % STATUS_MESSAGES.length), 2400);
    return () => clearInterval(interval);
  }, [sequenceDone]);

  // Exit: fade out when app is ready
  useEffect(() => {
    if (!sequenceDone || !isAppReady) return;
    setStatusReady(true);
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

  // Time-of-day color palette
  const bg         = night
    ? ['#050d1e', '#08152a', '#050d1e'] as const
    : ['#a8ccdf', '#c4deee', '#a8ccdf'] as const;
  const ringColor  = night ? 'rgba(0, 200, 230, 0.75)' : 'rgba(55, 135, 195, 0.55)';
  const dotBg      = night ? '#d8eaf8' : '#fffbe0';
  const dotGlow    = night ? 'rgba(180, 215, 248, 0.85)' : 'rgba(255, 228, 60, 0.85)';
  const titleClr   = night ? '#e6f3ff' : '#163248';
  const subtitleClr = night ? 'rgba(155, 205, 235, 0.55)' : 'rgba(22, 60, 95, 0.45)';
  const dividerClr = night ? 'rgba(0, 200, 230, 0.28)' : 'rgba(35, 95, 150, 0.2)';
  const statusClr  = night ? 'rgba(145, 200, 232, 0.5)' : 'rgba(22, 60, 95, 0.42)';

  const dotWebGlow = Platform.OS === 'web'
    ? ({ boxShadow: `0 0 20px 10px ${dotGlow}` } as any)
    : {};

  return (
    <Animated.View style={[styles.container, { opacity: exitAnim }]}>
      <LinearGradient colors={bg} style={StyleSheet.absoluteFill} />

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
            <Text style={[styles.title, { color: titleClr }]}>NOW</Text>
            <View style={[styles.divider, { backgroundColor: dividerClr }]} />
            <Text style={[styles.subtitle, { color: subtitleClr }]}>JAMESTOWN · NEW YORK</Text>
          </Animated.View>

        </View>

        {/* Status line */}
        <Animated.Text style={[styles.status, { color: statusClr, opacity: statusFade }]}>
          {statusText}
        </Animated.Text>

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
    marginTop: 52,
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
