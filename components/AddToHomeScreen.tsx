import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeContext';

// Bump key so previously-dismissed users see the new one-click flow
const DISMISSED_KEY = 'a2hs_dismissed_v2';

type Mode = 'install' | 'safari' | 'other-browser' | null;

function isStandalone(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  return (
    (navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) &&
    /Safari/.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|Brave/.test(ua);
}

export function AddToHomeScreen() {
  const { theme } = useTheme();
  const [mode, setMode] = useState<Mode>(null);
  const deferredPrompt = useRef<any>(null);
  const slideAnim = useRef(new Animated.Value(120)).current;

  if (Platform.OS !== 'web') return null;

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Brave / Chrome / Edge: intercept the native install prompt
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setMode('install');
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // iOS Safari: show Add to Home Screen instructions
    // Other iOS browsers: tell them to switch to Safari
    if (isIOS()) setMode(isIOSSafari() ? 'safari' : 'other-browser');

    // Auto-dismiss once installed
    const onInstalled = () => dismiss();
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!mode) return;
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 12,
    }).start();
  }, [mode]);

  async function handleInstall() {
    const prompt = deferredPrompt.current;
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    deferredPrompt.current = null;
    if (outcome === 'accepted') dismiss();
  }

  function dismiss() {
    Animated.timing(slideAnim, {
      toValue: 120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setMode(null));
    localStorage.setItem(DISMISSED_KEY, '1');
  }

  if (!mode) return null;

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
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: `rgba(${theme.accRGB},0.12)` }]}>
          <Ionicons name="phone-portrait-outline" size={20} color={theme.acc} />
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: '#fff' }]}>
            {mode === 'install' ? 'Install Chadakoin Now' :
             mode === 'safari'  ? 'Add to Home Screen' :
                                  'Open in Safari to install'}
          </Text>
          <Text style={[styles.body, { color: 'rgba(255,255,255,0.5)' }]}>
            {mode === 'install'       ? 'Full app experience — no App Store needed' :
             mode === 'safari'        ? 'Tap the Share button ↗, then "Add to Home Screen"' :
                                        'Safari is required to add this app to your home screen'}
          </Text>
        </View>
        {mode === 'install' && (
          <TouchableOpacity
            onPress={handleInstall}
            activeOpacity={0.8}
            style={[styles.installBtn, { backgroundColor: theme.acc }]}
          >
            <Text style={styles.installBtnText}>Install</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={dismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={18} color="rgba(255,255,255,0.35)" />
        </TouchableOpacity>
      </View>
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
    paddingBottom: 32,
    zIndex: 1000,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  textWrap: { flex: 1, gap: 2 },
  title: { fontFamily: 'DMSans_700Bold', fontSize: 14 },
  body: { fontFamily: 'Outfit', fontSize: 12, lineHeight: 17 },
  installBtn: {
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, flexShrink: 0,
  },
  installBtnText: { fontFamily: 'DMSans_700Bold', fontSize: 13, color: '#000' },
});
