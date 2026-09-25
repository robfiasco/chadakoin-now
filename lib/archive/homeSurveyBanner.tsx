// Archived: dismissible "YOUR INPUT NEEDED" survey banner that sat at the
// top of Home. Used for the City Safe Streets Survey (SurveyMonkey link,
// closed Sep 25 2026). Not wired into the app — kept as a reusable pattern
// for the next time there's a short-lived city survey/CTA to surface on
// Home. To reuse: swap the copy/link/dismiss-key below, wire the state +
// effect into app/index.tsx, and drop the JSX block back in above the
// widget promo banner.

import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

const DISMISS_KEY = 'safe_streets_survey_dismissed_v1';
const SURVEY_URL = 'https://www.surveymonkey.com/r/FDJ93DK';

export function useHomeSurveyBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DISMISS_KEY).then(v => {
      if (!v) setVisible(true);
    });
  }, []);

  function dismiss() {
    AsyncStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  return { visible, dismiss };
}

export function HomeSurveyBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <View style={styles.surveyBanner}>
      <View style={styles.surveyBannerHeader}>
        <View style={styles.surveyBannerBadge}>
          <Ionicons name="megaphone" size={11} color="#fb923c" />
          <Text style={styles.surveyBannerBadgeText}>YOUR INPUT NEEDED</Text>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, lineHeight: 16 }}>✕</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.surveyBannerTitle}>City Safe Streets Survey</Text>
      <Text style={styles.surveyBannerBody}>Help prioritize street safety projects — review the proposed locations and pick your top 3.</Text>
      <TouchableOpacity
        onPress={() => Linking.openURL(SURVEY_URL)}
        activeOpacity={0.85}
        style={styles.surveyBannerBtn}
      >
        <Text style={styles.surveyBannerBtnText}>Take the Survey</Text>
        <Ionicons name="arrow-forward" size={13} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  surveyBanner: { backgroundColor: 'rgba(251,146,60,0.13)', borderWidth: 1, borderColor: 'rgba(251,146,60,0.4)', borderRadius: 16, padding: 14, marginTop: 12, gap: 8 },
  surveyBannerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  surveyBannerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(251,146,60,0.22)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  surveyBannerBadgeText: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: '#fb923c' },
  surveyBannerTitle: { fontFamily: 'Syne', fontSize: 15, fontWeight: '700', color: '#fff' },
  surveyBannerBody: { fontFamily: 'Outfit', fontSize: 12, color: '#64748b', lineHeight: 17 }, // matches dark.text.subtle in lib/colors.ts
  surveyBannerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 11, marginTop: 4, backgroundColor: '#fb923c' },
  surveyBannerBtnText: { fontFamily: 'Syne', fontSize: 13, fontWeight: '700', color: '#000' },
});
