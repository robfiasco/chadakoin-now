import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '../components/ThemedBackground';
import { useTheme } from '../lib/ThemeContext';
import { THEMES, ThemeId } from '../lib/themes';

export default function SettingsScreen() {
  const { theme, themeId, setThemeId } = useTheme();

  const glassWeb = Platform.OS === 'web'
    ? { backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }
    : {};

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={[styles.subhead, { color: theme.acc55 }]}>Chadakoin Now</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={[styles.sectionLabel, { color: `rgba(${theme.accRGB},0.5)` }]}>THEME</Text>

        {THEMES.map(t => {
          const isActive = t.id === themeId;
          const cardStyle = {
            borderRadius: 20,
            borderWidth: isActive ? 1.5 : 1,
            backgroundColor: isActive
              ? `rgba(${t.accRGB},0.1)`
              : `rgba(${theme.accRGB},0.04)`,
            borderColor: isActive
              ? `rgba(${t.accRGB},0.4)`
              : `rgba(${theme.accRGB},0.12)`,
            ...glassWeb,
          };

          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => setThemeId(t.id as ThemeId)}
              activeOpacity={0.75}
              accessibilityLabel={`${t.label} theme${isActive ? ', currently active' : ''}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: isActive }}
              // @ts-ignore
              style={[styles.themeCard, cardStyle]}
            >
              <View style={styles.themeHeader}>
                <View style={styles.swatchRow}>
                  {[t.acc, t.acc2, t.acc3].map((c, i) => (
                    <View key={i} style={[styles.swatch, { backgroundColor: c }]} />
                  ))}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.themeName, { color: isActive ? t.acc : '#fff' }]}>
                    {t.label}
                  </Text>
                  <Text style={[styles.themeSub, { color: isActive ? `rgba(${t.accRGB},0.6)` : 'rgba(255,255,255,0.35)' }]}>
                    {t.sub}
                  </Text>
                </View>
                {isActive && (
                  <View style={[styles.activePill, { backgroundColor: `rgba(${t.accRGB},0.2)`, borderColor: `rgba(${t.accRGB},0.4)` }]}>
                    <Text style={[styles.activePillText, { color: t.acc }]}>Active</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.themeDesc, { color: isActive ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.35)' }]}>
                {t.description}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={() => Linking.openURL('https://chadakoindigital.com')}
          activeOpacity={0.75}
          accessibilityLabel="Feature your business on Chadakoin Now"
          accessibilityRole="link"
          // @ts-ignore
          style={[styles.ctaCard, {
            borderRadius: 20, borderWidth: 1,
            backgroundColor: `rgba(${theme.accRGB},0.06)`,
            borderColor: `rgba(${theme.accRGB},0.18)`,
            ...(Platform.OS === 'web' ? { backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' } : {}),
          }]}
        >
          <View style={styles.ctaRow}>
            <Ionicons name="storefront-outline" size={20} color={theme.acc} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.ctaTitle, { color: theme.acc }]}>Feature your business</Text>
              <Text style={[styles.ctaSub, { color: `rgba(${theme.accRGB},0.5)` }]}>
                Reach residents and visitors right in the app
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={`rgba(${theme.accRGB},0.4)`} />
          </View>
        </TouchableOpacity>

        <Text style={[styles.footer, { color: `rgba(${theme.accRGB},0.2)` }]}>
          Chadakoin Now · Built by Chadakoin Digital
        </Text>
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 40, zIndex: 10 },
  title: { fontFamily: 'Syne', fontSize: 21, fontWeight: '700', color: '#fff' },
  subhead: { fontFamily: 'Outfit', fontSize: 11, marginTop: 3, letterSpacing: 1 },
  content: { padding: 16, paddingTop: 4, paddingBottom: 48, gap: 10 },
  sectionLabel: {
    fontFamily: 'Outfit', fontSize: 9, fontWeight: '700',
    letterSpacing: 1.8, textTransform: 'uppercase',
    marginBottom: 4, paddingLeft: 2,
  },
  themeCard: { padding: 18, gap: 12 },
  themeHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  swatchRow: { flexDirection: 'row', gap: 5 },
  swatch: { width: 12, height: 12, borderRadius: 6 },
  themeName: { fontFamily: 'Syne', fontSize: 16, fontWeight: '700' },
  themeSub: { fontFamily: 'Outfit', fontSize: 11, marginTop: 2 },
  activePill: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  activePillText: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  themeDesc: { fontFamily: 'Outfit', fontSize: 13, lineHeight: 20 },
  ctaCard: { padding: 18 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ctaTitle: { fontFamily: 'Syne', fontSize: 15, fontWeight: '700', marginBottom: 3 },
  ctaSub: { fontFamily: 'Outfit', fontSize: 12, lineHeight: 17 },
  footer: { fontFamily: 'Outfit', fontSize: 11, textAlign: 'center', marginTop: 12 },
});
