import { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Platform, Dimensions } from 'react-native';

const TARGET_TITLE = 'CHADAKOIN NOW';
const TARGET_SUB   = 'JAMESTOWN · NEW YORK';
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@%&';
const SCRAMBLE_STEPS = 32;

export function AppLoadingScreen({
  isAppReady = false,
  onFinished,
}: {
  isAppReady?: boolean;
  onFinished?: () => void;
}) {
  const [titleText, setTitleText]     = useState('');
  const [subText, setSubText]         = useState('');
  const [progress, setProgress]       = useState(0);
  const [sequenceDone, setSequenceDone] = useState(false);
  const [statusReady, setStatusReady] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0.5)).current;

  // Glow pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 2200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Text scramble
  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      const frac = step / SCRAMBLE_STEPS;
      const scramble = (target: string) =>
        target.split('').map((ch, idx) => {
          if (ch === ' ' || ch === '·') return ch;
          if (idx < frac * target.length) return target[idx];
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join('');

      setTitleText(scramble(TARGET_TITLE));
      setSubText(scramble(TARGET_SUB));
      setProgress(Math.min(100, frac * 100));
      step++;

      if (step > SCRAMBLE_STEPS) {
        clearInterval(interval);
        setTitleText(TARGET_TITLE);
        setSubText(TARGET_SUB);
        setProgress(100);
        setSequenceDone(true);
      }
    }, 45);
    return () => clearInterval(interval);
  }, []);

  // Exit when both conditions met
  useEffect(() => {
    if (!sequenceDone || !isAppReady) return;
    setStatusReady(true);
    const exit = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0,    duration: 550, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.04, duration: 550, useNativeDriver: true }),
      ]).start(() => onFinished?.());
    }, 2000);
    return () => clearTimeout(exit);
  }, [sequenceDone, isAppReady]);

  const { width } = Dimensions.get('window');
  const barMaxWidth = Math.min(260, width * 0.62);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

      {/* Subtle grid — web only */}
      {Platform.OS === 'web' && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.grid as any]}
        />
      )}

      {/* Radial glow */}
      <Animated.View style={[styles.glow, { opacity: glowAnim }]} />

      {/* Content */}
      <View style={styles.content}>

        {/* Title block */}
        <View style={styles.titleBlock}>
          <Text style={[styles.title, statusReady && styles.titleReady]}>
            {titleText || ' '}
          </Text>
          {!sequenceDone && (
            <Text style={styles.cursor}>_</Text>
          )}
          <Text style={styles.subtitle}>{subText || ' '}</Text>
        </View>

        {/* Progress bar */}
        <View style={[styles.barTrack, { width: barMaxWidth }]}>
          <View style={[styles.barFill, { width: (progress / 100) * barMaxWidth }]} />
        </View>

        {/* Status */}
        <Text style={[styles.status, statusReady && styles.statusReady]}>
          {statusReady ? '[ READY ]  CITY DATA LOADED' : 'LOADING CITY DATA...'}
        </Text>

      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#060e18',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  grid: {
    // Applied as inline style on web only — backgroundImage not in RN types
    backgroundImage:
      'linear-gradient(to right, rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.022) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
  } as any,
  glow: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'transparent',
    // soft radial using shadow on web; native approximation via bg
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 0 120px 60px rgba(34,211,238,0.10)' } as any)
      : { backgroundColor: 'rgba(34,211,238,0.04)' }),
  },
  content: {
    alignItems: 'center',
    gap: 28,
    paddingHorizontal: 32,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontFamily: 'DMSans_800ExtraBold',
    fontSize: 26,
    letterSpacing: 6,
    color: '#e2f8ff',
    textAlign: 'center',
    ...(Platform.OS === 'web'
      ? ({ textShadow: '0 0 14px rgba(34,211,238,0.35), 0 0 32px rgba(34,211,238,0.18)' } as any)
      : {}),
  },
  titleReady: {
    color: '#22d3ee',
    ...(Platform.OS === 'web'
      ? ({ textShadow: '0 0 18px rgba(34,211,238,0.7), 0 0 40px rgba(34,211,238,0.35)' } as any)
      : {}),
  },
  cursor: {
    position: 'absolute',
    right: -10,
    bottom: 22,
    fontFamily: 'DMSans_400Regular',
    fontSize: 20,
    color: 'rgba(34,211,238,0.7)',
  },
  subtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    letterSpacing: 4,
    color: 'rgba(180,230,255,0.5)',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  barTrack: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  barFill: {
    height: 1,
    backgroundColor: '#22d3ee',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 0 8px #22d3ee' } as any)
      : {}),
  },
  status: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  statusReady: {
    color: '#22d3ee',
    ...(Platform.OS === 'web'
      ? ({ textShadow: '0 0 10px rgba(34,211,238,0.8)' } as any)
      : {}),
  },
});
