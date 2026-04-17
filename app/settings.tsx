import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Linking, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackground } from '../components/ThemedBackground';
import { useTheme } from '../lib/ThemeContext';
import { THEMES, ThemeId } from '../lib/themes';
import { dark } from '../lib/colors';

const NOTIFICATIONS: { id: string; label: string; sub: string }[] = [
  { id: 'parking',   label: 'Parking reminders',   sub: 'Alternate-side alerts' },
  { id: 'recycling', label: 'Recycling reminders',  sub: 'Day-before pickup alerts' },
  { id: 'news',      label: 'Breaking news',        sub: 'Jamestown & Chautauqua County' },
  { id: 'events',    label: 'Events & activities',  sub: 'New events added nearby' },
  { id: 'lotd',      label: 'LOTD podcast drops',   sub: 'New episodes' },
  { id: 'cdir',      label: 'Chadakoin In Review',  sub: 'Weekly community digest' },
];

type IoniconName = keyof typeof Ionicons.glyphMap;
const ABOUT_ROWS: { id: string; label: string; icon: IoniconName }[] = [
  { id: 'news',     label: "What's new",     icon: 'sparkles-outline'      },
  { id: 'feedback', label: 'Send feedback',  icon: 'chatbubble-outline'    },
  { id: 'privacy',  label: 'Privacy policy', icon: 'shield-outline'        },
  { id: 'terms',    label: 'Terms of use',   icon: 'document-text-outline' },
];

export default function SettingsScreen() {
  const { theme, themeId, setThemeId } = useTheme();
  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATIONS.map(n => [n.id, false]))
  );

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={[styles.subhead, { color: theme.acc55 }]}>Chadakoin Now</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Notifications ──────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: `rgba(${theme.accRGB},0.45)` }]}>Notifications</Text>
        <View style={[styles.card, { borderColor: dark.border }]}>
          {NOTIFICATIONS.map((n, i) => (
            <View key={n.id}>
              {i > 0 && <View style={[styles.rowDivider, { backgroundColor: dark.border }]} />}
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>{n.label}</Text>
                  <Text style={styles.toggleSub}>{n.sub}</Text>
                </View>
                <Switch
                  value={notifs[n.id]}
                  onValueChange={v => setNotifs(prev => ({ ...prev, [n.id]: v }))}
                  trackColor={{ false: 'rgba(255,255,255,0.08)', true: `rgba(${theme.accRGB},0.45)` }}
                  thumbColor={notifs[n.id] ? theme.acc : 'rgba(255,255,255,0.35)'}
                />
              </View>
            </View>
          ))}
        </View>

        {/* ── Appearance ─────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: `rgba(${theme.accRGB},0.45)` }]}>Appearance</Text>
        <View style={[styles.card, { borderColor: dark.border, padding: 12 }]}>
          <View style={styles.themeGrid}>
            {THEMES.map(t => {
              const isActive = t.id === themeId;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setThemeId(t.id as ThemeId)}
                  activeOpacity={0.75}
                  accessibilityLabel={`${t.label} theme${isActive ? ', currently active' : ''}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isActive }}
                  style={[styles.themeTile, {
                    backgroundColor: isActive ? `rgba(${t.accRGB},0.12)` : 'rgba(255,255,255,0.03)',
                    borderColor: isActive ? `rgba(${t.accRGB},0.35)` : 'rgba(255,255,255,0.07)',
                  }]}
                >
                  <View style={styles.themeDotsRow}>
                    {[t.acc, t.acc2, t.acc3].map((c, i) => (
                      <View key={i} style={[styles.themeDot, { backgroundColor: c }]} />
                    ))}
                  </View>
                  <Text style={[styles.themeTileLabel, { color: isActive ? t.acc : 'rgba(255,255,255,0.55)' }]}>
                    {t.label}
                  </Text>
                  {isActive && (
                    <View style={[styles.themeActiveDot, { backgroundColor: t.acc }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── About ──────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: `rgba(${theme.accRGB},0.45)` }]}>About</Text>
        <View style={[styles.card, { borderColor: dark.border }]}>
          {ABOUT_ROWS.map((row, i) => (
            <View key={row.id}>
              {i > 0 && <View style={[styles.rowDivider, { backgroundColor: dark.border }]} />}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.aboutRow}
                onPress={() => {}}
              >
                <Ionicons name={row.icon} size={16} color={`rgba(${theme.accRGB},0.5)`} />
                <Text style={styles.aboutLabel}>{row.label}</Text>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.2)" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ── Feature CTA ────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => Linking.openURL('https://chadakoindigital.com/featured')}
          activeOpacity={0.75}
          accessibilityLabel="Feature your business on Chadakoin Now"
          accessibilityRole="link"
          style={[styles.ctaCard, {
            backgroundColor: `rgba(${theme.accRGB},0.06)`,
            borderColor: `rgba(${theme.accRGB},0.18)`,
          }]}
        >
          <View style={styles.ctaRow}>
            <Ionicons name="storefront-outline" size={20} color={theme.acc} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.ctaTitle, { color: theme.acc }]}>Feature your business</Text>
              <Text style={[styles.ctaSub, { color: `rgba(${theme.accRGB},0.5)` }]}>
                chadakoindigital.com/featured
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={`rgba(${theme.accRGB},0.4)`} />
          </View>
        </TouchableOpacity>

        <Text style={styles.footer}>
          v0.1.0 · Built by Chadakoin Digital in Jamestown, NY
        </Text>

      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  header:  { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 40 },
  title:   { fontFamily: 'Syne', fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  subhead: { fontFamily: 'Outfit', fontSize: 11, marginTop: 4, letterSpacing: 1 },
  content: { padding: 16, paddingTop: 4, paddingBottom: 48, gap: 12 },

  sectionLabel: {
    fontFamily: 'Outfit', fontSize: 10, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginTop: 4, marginBottom: 2, marginLeft: 4,
  },

  card: {
    borderWidth: 1, borderRadius: 16, overflow: 'hidden',
    backgroundColor: dark.surface,
  },

  rowDivider: { height: 1, marginHorizontal: 16 },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  toggleLabel: { fontFamily: 'Syne', fontSize: 14, fontWeight: '700', color: '#fff' },
  toggleSub:   { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },

  themeGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  themeTile:      { width: '47.5%', borderWidth: 1, borderRadius: 12, padding: 12, gap: 8, position: 'relative' },
  themeDotsRow:   { flexDirection: 'row', gap: 5 },
  themeDot:       { width: 10, height: 10, borderRadius: 5 },
  themeTileLabel: { fontFamily: 'Syne', fontSize: 12, fontWeight: '700' },
  themeActiveDot: { position: 'absolute', top: 10, right: 10, width: 6, height: 6, borderRadius: 3 },

  aboutRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  aboutLabel: { fontFamily: 'Outfit', fontSize: 14, color: 'rgba(255,255,255,0.8)', flex: 1 },

  ctaCard:  { padding: 18, borderRadius: 16, borderWidth: 1, marginTop: 4 },
  ctaRow:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ctaTitle: { fontFamily: 'Syne', fontSize: 15, fontWeight: '700', marginBottom: 3 },
  ctaSub:   { fontFamily: 'Outfit', fontSize: 12, lineHeight: 17 },

  footer: {
    fontFamily: 'Outfit', fontSize: 11, textAlign: 'center',
    marginTop: 8, color: 'rgba(255,255,255,0.15)',
  },
});
