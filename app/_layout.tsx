import { useEffect, useRef } from 'react';
import { PanResponder, View } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

SplashScreen.preventAutoHideAsync();

type IoniconName = keyof typeof Ionicons.glyphMap;

function tabIcon(active: IoniconName, inactive: IoniconName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} size={22} color={color} />
  );
}

const TAB_ROUTES = ['/', '/sports', '/news', '/events'] as const;

// Separate component so useTheme() can access the ThemeProvider above it
function ThemedTabs() {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const panResponder = useRef(
    PanResponder.create({
      // Only claim gesture when movement is clearly horizontal (not a scroll)
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) * 2 && Math.abs(gs.dx) > 20,
      onPanResponderRelease: (_, gs) => {
        if (Math.abs(gs.dx) < 50) return;
        const current = TAB_ROUTES.indexOf(pathnameRef.current as any);
        if (current === -1) return;
        if (gs.dx < 0 && current < TAB_ROUTES.length - 1) {
          router.navigate(TAB_ROUTES[current + 1]);
        } else if (gs.dx > 0 && current > 0) {
          router.navigate(TAB_ROUTES[current - 1]);
        }
      },
    })
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
    <Tabs
      screenOptions={() => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBarBg ?? 'rgba(0,5,15,0.92)',
          borderTopWidth: 1,
          borderTopColor: `rgba(${theme.accRGB},0.14)`,
          elevation: 0,
          paddingTop: 8,
          paddingBottom: 12,
        },
        tabBarActiveTintColor: theme.acc,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.28)',
        tabBarLabelStyle: {
          fontFamily: 'Outfit_600SemiBold',
          fontSize: 11,
          marginTop: 1,
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabIcon('home', 'home-outline'),
        }}
      />
      <Tabs.Screen name="recycling" options={{ href: null }} />
      <Tabs.Screen name="parking" options={{ href: null }} />
      <Tabs.Screen name="alerts" options={{ href: null }} />
      <Tabs.Screen
        name="sports"
        options={{
          title: 'Sports',
          tabBarIcon: tabIcon('trophy', 'trophy-outline'),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          tabBarIcon: tabIcon('newspaper', 'newspaper-outline'),
        }}
      />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: tabIcon('calendar', 'calendar-outline'),
        }}
      />
    </Tabs>
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
    // Alias 'Syne' and 'Outfit' so existing fontFamily references keep working
    Syne: Syne_700Bold,
    Outfit: Outfit_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedTabs />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
