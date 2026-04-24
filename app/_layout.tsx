import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import PagerView, { PagerViewHandle } from '../components/PagerViewCompat';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '../lib/ThemeContext';
import { CivicDataProvider, useCivic } from '../lib/CivicDataContext';
import { RadioProvider } from '../lib/RadioContext';
import { AppLoadingScreen } from '../components/AppLoadingScreen';
import { onboardingResetRef } from '../lib/onboardingReset';
import { LinearGradient } from 'expo-linear-gradient';
import OnboardingScreen from './onboarding';

const ONBOARDING_KEY = 'onboarding_seen_v1';

import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  DMSans_800ExtraBold,
} from '@expo-google-fonts/dm-sans';

// Screens imported as components so PagerView can render them natively
import HomeScreen from './index';
import SportsScreen from './sports';
import NewsScreen from './news';
import EventsScreen from './events';
import VisitScreen from './visit';

SplashScreen.preventAutoHideAsync();

type IoniconName = keyof typeof Ionicons.glyphMap;

const TABS: { key: string; label: string; active: IoniconName; inactive: IoniconName }[] = [
  { key: 'home',   label: 'Home',   active: 'home',        inactive: 'home-outline'        },
  { key: 'sports', label: 'Sports', active: 'trophy',      inactive: 'trophy-outline'      },
  { key: 'news',   label: 'News',   active: 'newspaper',   inactive: 'newspaper-outline'   },
  { key: 'events', label: 'Events', active: 'calendar',    inactive: 'calendar-outline'    },
  { key: 'visit',  label: 'Visit',  active: 'map',         inactive: 'map-outline'         },
];

function AppLayout() {
  const { theme } = useTheme();
  const { loading: dataLoading } = useCivic();
  const [activePage, setActivePage] = useState(0);
  const pagerRef = useRef<PagerViewHandle>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      setShowOnboarding(val !== 'true');
    }).catch(() => setShowOnboarding(false));
  }, []);

  function handleOnboardingDone(dontShowAgain: boolean) {
    if (dontShowAgain) {
      AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch(() => {});
    }
    setShowOnboarding(false);
  }

  const goToPage = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  // Wire the shared ref so Settings can trigger onboarding immediately
  onboardingResetRef.reset = () => {
    AsyncStorage.removeItem(ONBOARDING_KEY).catch(() => {});
    setShowOnboarding(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => setActivePage(e.nativeEvent.position)}
        overdrag
      >
        <View key="home"   style={{ flex: 1 }}><HomeScreen onNavigateToTab={goToPage} /></View>
        <View key="sports" style={{ flex: 1 }}><SportsScreen /></View>
        <View key="news"   style={{ flex: 1 }}><NewsScreen /></View>
        <View key="events" style={{ flex: 1 }}><EventsScreen /></View>
        <View key="visit"  style={{ flex: 1 }}><VisitScreen /></View>
      </PagerView>

      <View>
        {/* Gradient fade above the tab bar */}
        <LinearGradient
          colors={['transparent', theme.tabBarBg ?? 'rgba(0,5,15,0.97)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          // @ts-ignore
          style={styles.tabGradient}
          pointerEvents="none"
        />
        <SafeAreaView
          edges={['bottom']}
          style={{ backgroundColor: theme.tabBarBg ?? 'rgba(0,5,15,0.92)' }}
        >
          <View style={[styles.tabBar, { borderTopColor: `rgba(${theme.accRGB},0.14)` }]}>
            {TABS.map((tab, index) => {
              const active = activePage === index;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => goToPage(index)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.tabPillBase,
                    active && {
                      backgroundColor: `rgba(${theme.accRGB},0.06)`,
                      borderWidth: 1,
                      borderColor: `rgba(${theme.accRGB},0.15)`,
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 7,
                    },
                  ]}>
                    <Ionicons
                      name={active ? tab.active : tab.inactive}
                      size={22}
                      color={active ? theme.acc : 'rgba(255,255,255,0.55)'}
                      style={active && Platform.OS === 'android' ? { elevation: 3 } : undefined}
                    />
                    <Text style={[
                      styles.tabLabel,
                      { color: active ? theme.acc : 'rgba(255,255,255,0.5)' },
                    ]}>
                      {tab.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>

      {/* Loading screen — stays until scramble + data both done, then fades out */}
      {showLoading && (
        <AppLoadingScreen
          isAppReady={!dataLoading}
          onFinished={() => setShowLoading(false)}
        />
      )}

      {/* Onboarding overlay — waits for loading screen to finish first */}
      {!showLoading && showOnboarding === true && (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 1000 }]}>
          <OnboardingScreen onDone={handleOnboardingDone} />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
    // All three aliases point to DM Sans — single typeface throughout the app
    Syne: DMSans_700Bold,        // display headers, UI chrome
    Outfit: DMSans_500Medium,    // body text, labels, meta
    Editorial: DMSans_800ExtraBold, // article headlines, hero titles
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <CivicDataProvider>
          <RadioProvider>
            <AppLayout />
          </RadioProvider>
        </CivicDataProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabGradient: {
    position: 'absolute',
    top: -32,
    left: 0,
    right: 0,
    height: 32,
    zIndex: 0,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillBase: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tabLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 9,
    letterSpacing: 0.3,
  },
});
