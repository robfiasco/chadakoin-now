import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
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

  const tx = drift.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? [14, 0] : [0, 14],
  });
  const ty = drift.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? [16, 0] : [0, 16],
  });

  // blur works on web via filter CSS; on native, orbs are just soft transparent circles
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
        },
        // @ts-ignore — web-only CSS property
        webBlur,
        { transform: [{ translateX: tx }, { translateY: ty }] },
      ]}
    />
  );
}

export function ThemedBackground({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Orb
        color={theme.orb1}
        width={400} height={250}
        top={-60} right={-80}
        duration={12000}
      />
      <Orb
        color={theme.orb2}
        width={280} height={200}
        bottom={120} left={-60}
        duration={9000}
        delay={3000}
        reverse
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
});
