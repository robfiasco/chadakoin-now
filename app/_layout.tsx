import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../lib/colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.deepBlue,
            borderTopWidth: 0,
            elevation: 0,
            height: 64,
            paddingBottom: 10,
          },
          tabBarActiveTintColor: Colors.green,
          tabBarInactiveTintColor: Colors.gray400,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="recycling"
          options={{
            title: 'Recycling',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="refresh-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="parking"
          options={{
            title: 'Parking',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="car-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="warning-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: 'Events',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}
