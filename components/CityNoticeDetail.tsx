import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { dark } from '../lib/colors';
import { openLink } from '../lib/openLink';

// Shape served by /api/notices. Kept generic (sections of body text or
// bullet items) so a new seasonal notice is a server edit, not a new screen.
export interface CityNotice {
  id: string;
  category: string;
  title: string;
  summary?: string;
  badge?: string | null;
  sections: { heading: string; body?: string; items?: string[] }[];
  links?: { label: string; url: string }[];
  source?: string;
}

export const NOTICE_COLOR = '#4DD9AC';

export function CityNoticeDetail({ notice, onClose }: { notice: CityNotice; onClose: () => void }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.category}>{notice.category}</Text>
        <Text style={styles.title}>{notice.title}</Text>
        {notice.badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notice.badge}</Text>
          </View>
        ) : null}

        {notice.sections.map(s => (
          <View key={s.heading} style={styles.section}>
            <Text style={styles.heading}>{s.heading}</Text>
            {s.body ? <Text style={styles.body}>{s.body}</Text> : null}
            {s.items?.map(item => (
              <View key={item} style={styles.itemRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={[styles.body, { flex: 1 }]}>{item}</Text>
              </View>
            ))}
          </View>
        ))}

        {notice.links?.map(l => (
          <TouchableOpacity key={l.url} onPress={() => openLink(l.url)} activeOpacity={0.7} style={styles.link}>
            <Text style={styles.linkText}>{l.label}</Text>
            <Ionicons name="open-outline" size={13} color={NOTICE_COLOR} />
          </TouchableOpacity>
        ))}
        {notice.source ? <Text style={styles.source}>{notice.source}</Text> : null}
      </ScrollView>

      <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.close} accessibilityLabel="Close">
        <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b1220' },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 48 },
  category: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: NOTICE_COLOR, marginBottom: 6 },
  title: { fontFamily: 'Editorial', fontSize: 24, lineHeight: 30, color: dark.text.primary },
  badge: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: 'rgba(77,217,172,0.15)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: 'Outfit', fontSize: 10, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', color: NOTICE_COLOR },
  section: { marginTop: 22, gap: 6 },
  heading: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: dark.text.muted },
  body: { fontFamily: 'Outfit', fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.85)' },
  itemRow: { flexDirection: 'row', gap: 8 },
  bullet: { fontFamily: 'Outfit', fontSize: 14, lineHeight: 21, color: NOTICE_COLOR },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 26, paddingVertical: 4 },
  linkText: { fontFamily: 'Outfit', fontSize: 14, fontWeight: '600', color: NOTICE_COLOR },
  source: { fontFamily: 'Outfit', fontSize: 11, color: dark.text.subtle, marginTop: 10 },
  close: { position: 'absolute', top: 52, right: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 6 },
});
