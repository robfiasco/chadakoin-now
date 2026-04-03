import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeContext';

const DISMISSED_KEY = 'a2hs_dismissed';

function detectiOS(): { isIOS: boolean; isSafari: boolean; isStandalone: boolean } {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return { isIOS: false, isSafari: false, isStandalone: false };
  }
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  // Safari on iOS: has Safari, no Chrome/CriOS/FxiOS/EdgiOS
  const isSafari = isIOS &&
    /Safari/.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  const isStandalone =
    (navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  return { isIOS, isSafari, isStandalone };
}

export function AddToHomeScreen() {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'safari' | 'other-browser' | null>(null);
  const slideAnim = useRef(new Animated.Value(120)).current;

  // Web only — skip on native
  if (Platform.OS !== 'web') return null;

  useEffect(() => {
    const { isIOS, isSafari, isStandalone } = detectiOS();
    if (!isIOS || isStandalone) return;

    const dismissedKey = localStorage.getItem(DISMISSED_KEY);
    if (dismissedKey) return;

    setMode(isSafari ? 'safari' : 'other-browser');
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 12,
    }).start();
  }, [visible]);

  function dismiss() {
    Animated.timing(slideAnim, {
      toValue: 120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setVisible(false));
    localStorage.setItem(DISMISSED_KEY, '1');
  }

  if (!visible || !mode) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: theme.tabBarBg ?? 'rgba(0,5,15,0.97)',
          borderTopColor: `rgba(${theme.accRGB},0.2)`,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {mode === 'safari' ? (
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: `rgba(${theme.accRGB},0.12)` }]}>
            <Ionicons name="phone-portrait-outline" size={20} color={theme.acc} />
          </View>
          <View style={styles.textWrap}>
            <Text style={[styles.title, { color: '#fff' }]}>Add to Home Screen</Text>
            <Text style={[styles.body, { color: `rgba(255,255,255,0.5)` }]}>
              Tap <Ionicons name="ellipsis-horizontal" size={13} color={`rgba(255,255,255,0.75)`} /> then <Ionicons name="share-outline" size={13} color={`rgba(255,255,255,0.5)`} /> then <Text style={{ color: `rgba(255,255,255,0.75)` }}>"Add to Home Screen"</Text>
            </Text>
          </View>
          <TouchableOpacity onPress={dismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={18} color={`rgba(255,255,255,0.35)`} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: `rgba(${theme.accRGB},0.12)` }]}>
            <Ionicons name="logo-safari" size={20} color={theme.acc} />
          </View>
          <View style={styles.textWrap}>
            <Text style={[styles.title, { color: '#fff' }]}>Open in Safari to install</Text>
            <Text style={[styles.body, { color: `rgba(255,255,255,0.5)` }]}>
              Safari is required to add this app to your home screen
            </Text>
          </View>
          <TouchableOpacity onPress={dismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={18} color={`rgba(255,255,255,0.35)`} />
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 28,
    zIndex: 999,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'Syne',
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    fontFamily: 'Outfit',
    fontSize: 12,
    lineHeight: 17,
  },
});
