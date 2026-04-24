import React, { useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Linking, Switch, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { onboardingResetRef } from '../lib/onboardingReset';
import { ThemedBackground } from '../components/ThemedBackground';
import { useTheme } from '../lib/ThemeContext';
import PrivacyPolicyScreen from './privacy';
import TermsOfUseScreen from './terms';
import FeedbackScreen from './feedback';
import { THEMES, Theme, ThemeId } from '../lib/themes';
import { dark } from '../lib/colors';
import { FeatureYourBusiness } from '../components/FeatureYourBusiness';

const NOTIFICATIONS: { id: string; label: string; sub: string }[] = [
  { id: 'parking',   label: 'Parking reminders',   sub: 'Alternate-side · Nov–Mar only' },
  { id: 'recycling', label: 'Recycling reminders',  sub: 'Day-before pickup alerts' },
  { id: 'news',      label: 'Breaking news',        sub: 'Jamestown & Chautauqua County' },
  { id: 'events',    label: 'Events & activities',  sub: 'New events added nearby' },
];

type IoniconName = keyof typeof Ionicons.glyphMap;
const ABOUT_ROWS: { id: string; label: string; icon: IoniconName }[] = [
  { id: 'feedback', label: 'Send feedback',  icon: 'chatbubble-outline'    },
  { id: 'intro',    label: 'Onboarding',        icon: 'play-circle-outline' },
  { id: 'privacy',  label: 'Privacy policy', icon: 'shield-outline'        },
  { id: 'terms',    label: 'Terms of use',   icon: 'document-text-outline' },
];

export default function SettingsScreen() {
  const { theme, themeId, setThemeId } = useTheme();
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('general');
  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATIONS.map(n => [n.id, false]))
  );

  // Theme description sheet
  const [descTheme, setDescTheme] = useState<Theme | null>(null);
  const slideAnim   = useRef(new Animated.Value(400)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  function openDesc(t: Theme) {
    setDescTheme(t);
    Animated.parallel([
      Animated.timing(slideAnim,   { toValue: 0, duration: 320, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }

  function closeDesc() {
    Animated.parallel([
      Animated.timing(slideAnim,   { toValue: 400, duration: 240, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
      Animated.timing(backdropAnim, { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => setDescTheme(null));
  }

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

        {/* Coming soon pill — notifications require Android app */}
        <View style={styles.comingSoonRow}>
          <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.25)" />
          <Text style={styles.comingSoonText}>Notifications coming with the Android app</Text>
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

                  {/* Tapping the label opens the description sheet */}
                  <TouchableOpacity
                    onPress={() => openDesc(t)}
                    hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                    activeOpacity={0.6}
                    style={styles.themeLabelRow}
                  >
                    <Text style={[styles.themeTileLabel, { color: isActive ? t.acc : 'rgba(255,255,255,0.55)' }]}>
                      {t.label}
                    </Text>
                    <Ionicons
                      name="information-circle-outline"
                      size={12}
                      color={isActive ? `rgba(${t.accRGB},0.5)` : 'rgba(255,255,255,0.2)'}
                    />
                  </TouchableOpacity>

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
                onPress={
                  row.id === 'privacy'   ? () => setPrivacyOpen(true)  :
                  row.id === 'terms'     ? () => setTermsOpen(true)    :
                  row.id === 'feedback'  ? () => setFeedbackOpen(true) :
                  row.id === 'intro'     ? () => onboardingResetRef.reset()
                                         : () => {}
                }
              >
                <Ionicons name={row.icon} size={16} color={`rgba(${theme.accRGB},0.5)`} />
                <Text style={styles.aboutLabel}>{row.label}</Text>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.2)" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ── Made in Jamestown ──────────────────────────── */}
        <View style={[styles.card, styles.madeCard, { borderColor: dark.border }]}>
          <Text style={[styles.madeTitle, { color: theme.acc }]}>Made in Jamestown</Text>
          <Text style={styles.madeBody}>
            Jamestown didn't have an app like this. I built one.
          </Text>
          <Text style={styles.madeBody}>
            Every summer, visitors come to Jamestown. I want them to easily find the best spots, know what's happening, and leave telling their friends how much there is to see and do here. That's good for all of us.
          </Text>
          <Text style={styles.madeBody}>
            For residents, great local info already exists — it's just scattered. The local paper runs around $27/month. A lot of businesses are Facebook-only, which means if you're not on it, you might never know what they have to offer.
          </Text>
          <Text style={styles.madeBody}>
            Chadakoin Now is free. Local news, sports scores, city services, events, and more — one place, no subscription required.
          </Text>
        </View>

        {/* ── Feature CTA ────────────────────────────────── */}
        <FeatureYourBusiness onContact={() => { setFeedbackType('business'); setFeedbackOpen(true); }} />

        <Text style={styles.footer}>v1.0.2 · Built by Chadakoin Digital in Jamestown, NY</Text>
        <Text style={styles.sources}>Data sources: Sabres via NHL · JCC via jccjayhawks.com · MLB via MLB Stats API · Weather via NWS</Text>
      </ScrollView>

      {feedbackOpen && (
        <View style={styles.fullOverlay}>
          <FeedbackScreen onClose={() => { setFeedbackOpen(false); setFeedbackType('general'); }} initialType={feedbackType} />
        </View>
      )}
      {privacyOpen && (
        <View style={styles.fullOverlay}>
          <PrivacyPolicyScreen onClose={() => setPrivacyOpen(false)} />
        </View>
      )}
      {termsOpen && (
        <View style={styles.fullOverlay}>
          <TermsOfUseScreen onClose={() => setTermsOpen(false)} />
        </View>
      )}

      {/* ── Theme description bottom sheet ─────────────── */}
      {/* In-tree overlay so it renders inside the app container on web */}
      {!!descTheme && (
        <View style={styles.sheetContainer}>
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.sheetBackdrop, { opacity: backdropAnim }]}
            pointerEvents="none"
          />
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeDesc} />

          <Animated.View style={[styles.sheetCard, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.sheetHandle} />
            <View style={[styles.sheetSwatch, { backgroundColor: descTheme.acc }]} />
            <TouchableOpacity onPress={closeDesc} style={styles.sheetClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
            <Text style={[styles.sheetName, { color: descTheme.acc }]}>{descTheme.label}</Text>
            <Text style={styles.sheetSub}>{descTheme.sub}</Text>
            <Text style={styles.sheetBody}>{descTheme.description}</Text>
          </Animated.View>
        </View>
      )}
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  header:  { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 40 },
  title:   { fontFamily: 'DMSans_700Bold', fontSize: 28, color: '#fff', letterSpacing: -0.5, lineHeight: 36 },
  subhead: { fontFamily: 'Outfit', fontSize: 11, marginTop: 4, letterSpacing: 1 },
  content: { padding: 16, paddingTop: 4, paddingBottom: 48, gap: 12 },

  sectionLabel: {
    fontFamily: 'Outfit', fontSize: 10, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginTop: 4, marginBottom: 2, marginLeft: 4,
  },

  card: { borderWidth: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: dark.surface },
  rowDivider: { height: 1, marginHorizontal: 16 },

  toggleRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  toggleLabel:{ fontFamily: 'Syne', fontSize: 14, fontWeight: '700', color: '#fff' },
  toggleSub:  { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },

  themeGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  themeTile:      { width: '47.5%', borderWidth: 1, borderRadius: 12, padding: 12, gap: 8, position: 'relative' },
  themeDotsRow:   { flexDirection: 'row', gap: 5 },
  themeDot:       { width: 10, height: 10, borderRadius: 5 },
  themeLabelRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  themeTileLabel: { fontFamily: 'Syne', fontSize: 12, fontWeight: '700' },
  themeActiveDot: { position: 'absolute', top: 10, right: 10, width: 6, height: 6, borderRadius: 3 },

  aboutRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  aboutLabel: { fontFamily: 'Outfit', fontSize: 14, color: 'rgba(255,255,255,0.8)', flex: 1 },

  ctaCard: { padding: 18, borderRadius: 16, borderWidth: 1, marginTop: 4 },
  ctaRow:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ctaTitle:{ fontFamily: 'Syne', fontSize: 15, fontWeight: '700', marginBottom: 3 },
  ctaSub:  { fontFamily: 'Outfit', fontSize: 12, lineHeight: 17 },

  madeCard:  { padding: 20, gap: 12 },
  madeTitle: { fontFamily: 'Editorial', fontSize: 20, lineHeight: 26, marginBottom: 2 },
  madeBody:  { fontFamily: 'Outfit', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },

  footer:  { fontFamily: 'Outfit', fontSize: 11, textAlign: 'center', marginTop: 8, color: 'rgba(255,255,255,0.15)' },
  sources: { fontFamily: 'Outfit', fontSize: 10, textAlign: 'center', marginTop: 6, color: 'rgba(255,255,255,0.1)', lineHeight: 16 },

  fullOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 9999, elevation: 9999, flex: 1 },

  comingSoonRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'center', marginTop: -4, marginBottom: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  comingSoonText: {
    fontFamily: 'Outfit', fontSize: 11,
    color: 'rgba(255,255,255,0.25)', letterSpacing: 0.3,
  },

  // Bottom sheet — in-tree absolute overlay (no Modal portal)
  sheetContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 200,
  },
  sheetBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheetCard: {
    backgroundColor: '#0f172a',   // slate-900
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(30,41,59,0.8)',
    padding: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginTop: 32, marginBottom: 20,
  },
  sheetSwatch: {
    height: 3, borderRadius: 2, marginBottom: 20, opacity: 0.6,
  },
  sheetClose: {
    position: 'absolute', top: 20, right: 20,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  sheetName: {
    fontFamily: 'Syne', fontSize: 22, fontWeight: '800',
    letterSpacing: -0.5, marginBottom: 4,
  },
  sheetSub: {
    fontFamily: 'Outfit', fontSize: 12, fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.35)', marginBottom: 16,
  },
  sheetBody: {
    fontFamily: 'Outfit', fontSize: 14, color: 'rgba(255,255,255,0.65)',
    lineHeight: 22,
  },
});
