import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';

interface Props {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  accRGB?: string;
}

export function SkeletonPulse({ width = '100%', height = 16, borderRadius = 6, style, accRGB = '255,255,255' }: Props) {
  const opacity = useRef(new Animated.Value(0.12)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.28, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(opacity, { toValue: 0.12, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: `rgba(${accRGB},1)`,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ErrorBanner shown when data fetch partially fails
export function ErrorBanner({ message, accRGB }: { message: string; accRGB: string }) {
  return (
    <View style={[styles.banner, { backgroundColor: `rgba(${accRGB},0.08)`, borderColor: `rgba(${accRGB},0.2)` }]}>
      <View style={styles.bannerDot} />
      <Animated.Text style={[styles.bannerText, { color: `rgba(${accRGB},0.6)` }]}>
        {message}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
  },
  bannerText: {
    fontFamily: 'Outfit',
    fontSize: 11,
    flex: 1,
  },
});
