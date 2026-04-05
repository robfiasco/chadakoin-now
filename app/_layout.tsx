import { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import PagerView, { PagerViewHandle } from '../components/PagerViewCompat';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '../lib/ThemeContext';

import {
  Syne_400Regular,
  Syne_500Medium,
  Syne_600SemiBold,
  Syne_700Bold,
  Syne_800ExtraBold,
} from '@expo-google-fonts/syne';

import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';

// Screens imported as components so PagerView can render them natively
import HomeScreen from './index';
import SportsScreen from './sports';
import NewsScreen from './news';
import EventsScreen from './events';

SplashScreen.preventAutoHideAsync();

type IoniconName = keyof typeof Ionicons.glyphMap;

const TABS: { key: string; label: string; active: IoniconName; inactive: IoniconName }[] = [
  { key: 'home',   label: 'Home',   active: 'home',      inactive: 'home-outline'      },
  { key: 'sports', label: 'Sports', active: 'trophy',    inactive: 'trophy-outline'    },
  { key: 'news',   label: 'News',   active: 'newspaper', inactive: 'newspaper-outline' },
  { key: 'events', label: 'Events', active: 'calendar',  inactive: 'calendar-outline'  },
];

function AppLayout() {
  const { theme } = useTheme();
  const [activePage, setActivePage] = useState(0);
  const pagerRef = useRef<PagerViewHandle>(null);

  const goToPage = (index: number) => {
    pagerRef.current?.setPage(index);
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
        <View key="home"   style={{ flex: 1 }}><HomeScreen /></View>
        <View key="sports" style={{ flex: 1 }}><SportsScreen /></View>
        <View key="news"   style={{ flex: 1 }}><NewsScreen /></View>
        <View key="events" style={{ flex: 1 }}><EventsScreen /></View>
      </PagerView>

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
                <Ionicons
                  name={active ? tab.active : tab.inactive}
                  size={22}
                  color={active ? theme.acc : 'rgba(255,255,255,0.28)'}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Syne_400Regular,
    Syne_500Medium,
    Syne_600SemiBold,
    Syne_700Bold,
    Syne_800ExtraBold,
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Syne: Syne_700Bold,
    Outfit: Outfit_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppLayout />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
});
