import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../lib/ThemeContext';

type IoniconName = keyof typeof Ionicons.glyphMap;

function tabIcon(active: IoniconName, inactive: IoniconName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} size={22} color={color} />
  );
}

// Separate component so useTheme() can access the ThemeProvider above it
function ThemedTabs() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBarBg ?? 'rgba(0,5,15,0.92)',
          borderTopWidth: 1,
          borderTopColor: `rgba(${theme.accRGB},0.14)`,
          elevation: 0,
          height: 68,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.acc,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.28)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 1,
        },
      }}
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
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: tabIcon('calendar', 'calendar-outline'),
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedTabs />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
