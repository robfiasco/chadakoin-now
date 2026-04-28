import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { dark } from '../lib/colors';

const ACC     = '#22d3ee';
const ACC_RGB = '34,211,238';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Body({ children }: { children: string }) {
  return <Text style={s.body}>{children}</Text>;
}

function Bullet({ children }: { children: string }) {
  return (
    <View style={s.bulletRow}>
      <Text style={s.bulletDot}>·</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen({ onClose }: { onClose: () => void }) {
  return (
    <View style={s.container}>
      <SafeAreaView edges={['top']} style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>Privacy Policy</Text>
            <Text style={s.updated}>Last updated: April 17, 2026</Text>
          </View>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={s.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <Body>
          I built Chadakoin Now. This explains what the app does — and doesn't do — with your data. It's short because there isn't much to say.
        </Body>

        <Section title="What I don't do">
          <Bullet>No user accounts. You don't sign up, log in, or create a profile.</Bullet>
          <Bullet>I don't ask for your name, email, phone number, or location.</Bullet>
          <Bullet>I don't sell, share, or rent data about you to anyone. Ever.</Bullet>
          <Bullet>I don't track you across other apps or websites.</Bullet>
          <Bullet>There are no ads in the app.</Bullet>
        </Section>

        <Section title="What I do collect">
          <Text style={[s.body, { marginTop: 12 }]}>
            <Text style={s.bold}>Analytics. </Text>
            I use analytics to understand how many people use the app and which parts get the most attention. It's aggregated — I see things like "200 people opened the News tab this week," not anything tied to you specifically. The tool may log your device type, OS version, and country (from your IP, not GPS). I don't see your IP address or anything that identifies you personally.
          </Text>
          <Text style={[s.body, { marginTop: 12 }]}>
            <Text style={s.bold}>That's it. </Text>
            No location. No microphone. No camera. No contacts. No accounts.
          </Text>
        </Section>

        <Section title="Where content comes from">
          <Body>
            News, events, and business info come from public sources — RSS feeds, public APIs, and things I've added myself. I don't collect anything about you when you browse this content.
          </Body>
        </Section>

        <Section title="Directions">
          <Body>
            Tapping "Directions" opens your phone's maps app. Whatever happens after that is between you and the maps app — I don't see any of it.
          </Body>
        </Section>

        <Section title="Feedback">
          <Body>
            If you send feedback through the app, I receive what you type. I use it to read and respond. I won't add you to any list.
          </Body>
        </Section>

        <Section title="Kids">
          <Body>
            The app is for general audiences. I don't knowingly collect data from children under 13.
          </Body>
        </Section>

        <Section title="If this changes">
          <Body>
            If I ever start collecting something new — accounts, location, anything — I'll update this policy and call it out clearly in the app. No quiet changes.
          </Body>
        </Section>

        <Section title="Questions">
          <Body>rob@robfiasco.dev</Body>
        </Section>

        <Text style={s.footer}>
          Built by Rob Fiasco · Chadakoin Digital · Jamestown, NY
        </Text>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: dark.bg },

  header: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: dark.border },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontFamily: 'Syne', fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  updated: { fontFamily: 'Outfit', fontSize: 11, color: `rgba(${ACC_RGB},0.5)`, marginTop: 4, letterSpacing: 0.5 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },

  content: { padding: 20, paddingBottom: 48, gap: 4 },

  section: { marginTop: 24 },
  sectionTitle: {
    fontFamily: 'Syne', fontSize: 15, fontWeight: '700', color: ACC,
    letterSpacing: -0.2, marginBottom: 10,
  },

  body: { fontFamily: 'Outfit', fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 22 },
  bold: { fontFamily: 'Outfit', fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },

  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  bulletDot: { fontFamily: 'Outfit', fontSize: 14, color: `rgba(${ACC_RGB},0.5)`, lineHeight: 22, width: 10, textAlign: 'center' },
  bulletText: { fontFamily: 'Outfit', fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 22, flex: 1 },

  footer: {
    fontFamily: 'Outfit', fontSize: 12, color: 'rgba(255,255,255,0.2)',
    textAlign: 'center', marginTop: 36, lineHeight: 18,
  },
});
