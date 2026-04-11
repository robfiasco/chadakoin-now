import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/ThemeContext';

interface OrbProps {
  color: string;
  width: number;
  height: number;
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
  duration: number;
  delay?: number;
  reverse?: boolean;
}

function Orb({ color, width, height, top, bottom, left, right, duration, delay = 0, reverse = false }: OrbProps) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const tx = drift.interpolate({ inputRange: [0, 1], outputRange: reverse ? [14, 0] : [0, 14] });
  const ty = drift.interpolate({ inputRange: [0, 1], outputRange: reverse ? [16, 0] : [0, 16] });

  // Web: CSS blur for soft glow. Native: slightly higher opacity compensates for no blur.
  const webBlur = Platform.OS === 'web' ? { filter: 'blur(60px)' } : {};

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width,
          height,
          borderRadius: 999,
          backgroundColor: color,
          top,
          bottom,
          left,
          right,
          // Slightly boost opacity on native since there's no blur spreading the color
          opacity: Platform.OS === 'web' ? 1 : 1.6,
        },
        // @ts-ignore — web-only CSS property
        webBlur,
        { transform: [{ translateX: tx }, { translateY: ty }] },
      ]}
    />
  );
}

// Parse colors from a CSS linear-gradient string for use with expo-linear-gradient.
// e.g. "linear-gradient(180deg, #050505 0%, #101010 50%, #1c1c1c 100%)" → ['#050505','#101010','#1c1c1c']
function parseCSSGradientColors(gradient: string): string[] | null {
  const matches = gradient.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g);
  return matches && matches.length >= 2 ? matches : null;
}

export function ThemedBackground({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  // Web: use the CSS gradient override if provided
  const webBg = Platform.OS === 'web' && theme.bgGradient
    ? { background: theme.bgGradient }
    : {};

  // Native: use LinearGradient if the theme specifies a gradient, otherwise flat bg
  const nativeGradientColors = Platform.OS !== 'web' && theme.bgGradient
    ? parseCSSGradientColors(theme.bgGradient)
    : null;

  // Orbs only on web — on native there's no CSS blur, so they render as hard circles
  const content = (
    <>
      {/* Ambient top glow behind header — theme accent at ~18% opacity */}
      <LinearGradient
        colors={[`rgba(${theme.accRGB},0.18)`, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        // @ts-ignore
        style={styles.ambientGlow}
        pointerEvents="none"
      />
      {Platform.OS === 'web' && (
        <>
          <Orb color={theme.orb1} width={400} height={250} top={-60} right={-80} duration={12000} />
          <Orb color={theme.orb2} width={280} height={200} bottom={120} left={-60} duration={9000} delay={3000} reverse />
        </>
      )}
      {children}
    </>
  );

  if (nativeGradientColors) {
    return (
      <LinearGradient
        colors={nativeGradientColors as any}
        locations={nativeGradientColors.length === 3 ? [0, 0.5, 1] : undefined}
        style={styles.container}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    // @ts-ignore
    <View style={[styles.container, { backgroundColor: theme.bg }, webBg]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    zIndex: 0,
  },
});
