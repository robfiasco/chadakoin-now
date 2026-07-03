import { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Platform } from 'react-native';

const TARGET_TITLE_1 = 'CHADAKOIN';
const TARGET_TITLE_2 = 'NOW';
const TARGET_SUB     = 'JAMESTOWN · NEW YORK';
const CHARS          = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@%&';
const PHASE1_STEPS = 22;  // CHADAKOIN resolves first
const TOTAL_STEPS  = 33;  // then NOW resolves

const PILL_MESSAGES = [
  'Scanning local feeds...',
  'Checking the weather...',
  'Tuning in to Jamestown...',
  'Loading city pulse...',
  'Almost ready...',
];

const CIRCLE     = 234;
const MID_RING   = 272;
const OUTER_RING = 314;
const ARC_RING   = OUTER_RING + 10;

// Glowing dot positions on outer ring (degrees from top, clockwise)
const DOT_ANGLES = [35, 165, 258];
const DOT_SIZE   = 11;

function dotPos(angleDeg: number, r: number, size: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return {
    position: 'absolute' as const,
    left:  r + r * Math.cos(rad) - size / 2,
    top:   r + r * Math.sin(rad) - size / 2,
    width: size,
    height: size,
  };
}

export function AppLoadingScreen({
  isAppReady = false,
  onFinished,
}: {
  isAppReady?: boolean;
  onFinished?: () => void;
}) {
  const [title1, setTitle1]               = useState('');
  const [title2, setTitle2]               = useState('');
  const [subText, setSubText]             = useState('');
  const [titleColor, setTitleColor]       = useState('#e8f6ff');
  const [sequenceDone, setSequenceDone]   = useState(false);
  const [pillIdx, setPillIdx]             = useState(0);
  const [statusReady, setStatusReady]     = useState(false);

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0.4)).current;
  const ringAnim  = useRef(new Animated.Value(0.2)).current;
  const spinAnim  = useRef(new Animated.Value(0)).current;
  const dotSpin   = useRef(new Animated.Value(0)).current;
  const pillFade  = useRef(new Animated.Value(0)).current;

  const isWaiting = sequenceDone && !isAppReady;

  // Ambient glow pulse
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1,   duration: 2400, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.3, duration: 2400, useNativeDriver: true }),
    ])).start();
  }, []);

  // Outer ring pulse — offset phase from glow so they don't move in sync
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(ringAnim, { toValue: 0.55, duration: 1800, useNativeDriver: true }),
      Animated.timing(ringAnim, { toValue: 0.15, duration: 1800, useNativeDriver: true }),
    ])).start();
  }, []);

  // Spinning sweep arc
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 3400, useNativeDriver: true })
    ).start();
  }, []);

  // Dot nodes orbit (very slow — ~20s per revolution)
  useEffect(() => {
    Animated.loop(
      Animated.timing(dotSpin, { toValue: 1, duration: 20000, useNativeDriver: true })
    ).start();
  }, []);

  // Pill fade in after scramble resolves
  useEffect(() => {
    if (!sequenceDone) return;
    Animated.timing(pillFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [sequenceDone]);

  // Two-phase scramble: CHADAKOIN locks first, then NOW, then teal flash payoff
  useEffect(() => {
    let step = 0;
    const rnd = () => CHARS[Math.floor(Math.random() * CHARS.length)];
    const scramble = (target: string, frac: number) =>
      target.split('').map((ch, idx) => {
        if (ch === '·') return ch;
        return idx < frac * target.length ? target[idx] : rnd();
      }).join('');

    const interval = setInterval(() => {
      // Phase 1: CHADAKOIN scrambles and locks; NOW hidden; subtitle scrambles
      if (step <= PHASE1_STEPS) {
        const f1 = step / PHASE1_STEPS;
        setTitle1(scramble(TARGET_TITLE_1, f1));
        setTitle2('');
        setSubText(scramble(TARGET_SUB, step / TOTAL_STEPS));
      }
      // Phase 2: CHADAKOIN locked; NOW scrambles; subtitle finishes
      else if (step <= TOTAL_STEPS) {
        const f2 = (step - PHASE1_STEPS) / (TOTAL_STEPS - PHASE1_STEPS);
        setTitle1(TARGET_TITLE_1);
        setTitle2(scramble(TARGET_TITLE_2, f2));
        setSubText(scramble(TARGET_SUB, step / TOTAL_STEPS));
      }

      step++;

      if (step > TOTAL_STEPS) {
        clearInterval(interval);
        setTitle1(TARGET_TITLE_1);
        setTitle2(TARGET_TITLE_2);
        setSubText(TARGET_SUB);

        // Teal flash payoff — 3 quick pulses then settle to white
        let flashes = 0;
        const flash = setInterval(() => {
          setTitleColor(flashes % 2 === 0 ? '#00e5ff' : '#e8f6ff');
          flashes++;
          if (flashes >= 6) {
            clearInterval(flash);
            setTitleColor('#e8f6ff');
            setSequenceDone(true);
          }
        }, 110);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Cycle pill messages while waiting on data
  useEffect(() => {
    if (!isWaiting) return;
    const interval = setInterval(() => {
      setPillIdx(i => (i + 1) % PILL_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isWaiting]);

  // Exit sequence
  useEffect(() => {
    if (!sequenceDone || !isAppReady) return;
    setStatusReady(true);
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0,    duration: 380, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.04, duration: 380, useNativeDriver: true }),
      ]).start(() => onFinished?.());
    }, 420);
    return () => clearTimeout(timer);
  }, [sequenceDone, isAppReady]);

  const spin   = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const dotRot = dotSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const pillText = statusReady ? 'Ready' : isWaiting ? PILL_MESSAGES[pillIdx] : 'Initializing...';

  const outerRingGlow = Platform.OS === 'web'
    ? ({ boxShadow: '0 0 20px 5px rgba(0,210,235,0.28), inset 0 0 14px rgba(0,210,235,0.07)' } as any)
    : {};
  const dotGlow = Platform.OS === 'web'
    ? ({ boxShadow: '0 0 10px 5px rgba(0,218,255,0.65)' } as any)
    : {};
  const arcGlow = Platform.OS === 'web'
    ? ({ filter: 'drop-shadow(0 0 6px rgba(0,218,255,0.7))' } as any)
    : {};
  const pillGlow = Platform.OS === 'web'
    ? ({ boxShadow: 'inset 0 0 20px rgba(0,200,230,0.04), 0 1px 0 rgba(255,255,255,0.06)' } as any)
    : {};
  const innerCircleWeb = Platform.OS === 'web'
    ? ({ backdropFilter: 'blur(6px)' } as any)
    : {};

  return (
    <Animated.View style={[
      styles.container,
      { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
    ]}>

      {/* Web: dot-grid background */}
      {Platform.OS === 'web' && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.webGrid as any]} />
      )}

      {/* Ambient glow behind circle */}
      <Animated.View style={[styles.glow, { opacity: glowAnim }]} />

      {/* All rings centered on same point */}
      <View style={styles.ringStack}>

        {/* Outer ring — pulses independently */}
        <Animated.View style={[styles.outerRing, outerRingGlow, { opacity: ringAnim }]} />

        {/* Mid ring (faint) */}
        <View style={styles.midRing} />

        {/* Spinning sweep arc */}
        <Animated.View style={[styles.spinArc, arcGlow, { transform: [{ rotate: spin }] }]} />

        {/* Dot nodes on outer ring — orbit slowly */}
        <Animated.View style={[styles.dotLayer, { transform: [{ rotate: dotRot }] }]}>
          {DOT_ANGLES.map((angle, i) => (
            <View key={i} style={[styles.dot, dotPos(angle, OUTER_RING / 2, DOT_SIZE), dotGlow]} />
          ))}
        </Animated.View>

        {/* Inner glass circle */}
        <View style={[styles.innerCircle, innerCircleWeb]}>
          {Platform.OS === 'web' && (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.meshOverlay as any]} />
          )}
          <Text style={[styles.titleLine1, { color: titleColor }]} numberOfLines={1}>{title1 || ' '}</Text>
          <Text style={[styles.titleLine2, { color: titleColor }]} numberOfLines={1}>{title2 || ' '}</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle} numberOfLines={1}>{subText || ' '}</Text>
        </View>

      </View>

      {/* Pill badge below the circle */}
      <Animated.View style={[styles.pill, pillGlow, { opacity: pillFade }]}>
        <Text style={styles.pillText}>{pillText}</Text>
      </Animated.View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webGrid: {
    backgroundImage: 'radial-gradient(circle, rgba(0,200,230,0.022) 1px, transparent 1px)',
    backgroundSize: '44px 44px',
  } as any,
  glow: {
    position: 'absolute',
    width: OUTER_RING + 220,
    height: OUTER_RING + 220,
    borderRadius: (OUTER_RING + 220) / 2,
    backgroundColor: 'rgba(0, 195, 225, 0.11)',
  },

  // Ring container
  ringStack: {
    width: OUTER_RING,
    height: OUTER_RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: OUTER_RING,
    height: OUTER_RING,
    borderRadius: OUTER_RING / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 210, 238, 1.0)',
  },
  midRing: {
    position: 'absolute',
    width: MID_RING,
    height: MID_RING,
    borderRadius: MID_RING / 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 238, 0.13)',
  },
  spinArc: {
    position: 'absolute',
    width: ARC_RING,
    height: ARC_RING,
    borderRadius: ARC_RING / 2,
    borderWidth: 2,
    borderColor: 'rgba(0, 218, 255, 0.07)',
    borderTopColor: 'rgba(0, 222, 255, 0.92)',
  },

  // Dot nodes
  dotLayer: {
    position: 'absolute',
    width: OUTER_RING,
    height: OUTER_RING,
  },
  dot: {
    borderRadius: DOT_SIZE / 2,
    backgroundColor: 'rgba(0, 222, 255, 0.95)',
  },

  // Inner glass circle
  innerCircle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(3, 12, 24, 0.87)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 238, 0.17)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  meshOverlay: {
    backgroundImage:
      'radial-gradient(ellipse at 60% 32%, rgba(0,200,232,0.10) 0%, transparent 58%), ' +
      'linear-gradient(130deg, rgba(0,200,232,0.05) 1px, transparent 1px), ' +
      'linear-gradient(-50deg, rgba(0,200,232,0.05) 1px, transparent 1px), ' +
      'linear-gradient(rgba(0,200,232,0.025) 1px, transparent 1px)',
    backgroundSize: 'cover, 36px 62px, 36px 62px, 36px 36px',
  } as any,

  titleLine1: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 20,
    letterSpacing: 3,
    color: '#e8f6ff',
    textAlign: 'center',
  },
  titleLine2: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 20,
    letterSpacing: 3,
    color: '#e8f6ff',
    textAlign: 'center',
    marginTop: 2,
  },
  divider: {
    width: 56,
    height: 1,
    backgroundColor: 'rgba(0, 210, 238, 0.28)',
    marginTop: 12,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(155, 215, 238, 0.52)',
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  // Pill badge
  pill: {
    marginTop: 34,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: 'rgba(5, 15, 30, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  pillText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: 'rgba(185, 225, 242, 0.68)',
    letterSpacing: 0.4,
  },
});
