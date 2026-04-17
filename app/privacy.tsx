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

function Bold({ label, children }: { label: string; children: string }) {
  return (
    <Text style={s.body}>
      <Text style={s.bold}>{label} </Text>
      {children}
    </Text>
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
          Chadakoin Now is built by Rob Fiasco under the business name Chadakoin Digital. This policy explains what the app does and doesn't do with your data. It's short because the app doesn't do much with your data.
        </Body>

        <Section title="What we don't do">
          <Bullet>We don't have user accounts. You don't sign up, log in, or create a profile.</Bullet>
          <Bullet>We don't ask for your name, email, phone number, or location.</Bullet>
          <Bullet>We don't sell, share, or rent data about you to anyone.</Bullet>
          <Bullet>We don't track you across other apps or websites.</Bullet>
          <Bullet>We don't use advertising networks inside the app.</Bullet>
        </Section>

        <Section title="What the app does collect">
          <Bold label="Notifications (Android).">
            If you enable push notifications for parking changes, recycling pickup, news, or events, your device receives a notification token from Google's Firebase Cloud Messaging service. We use this only to send the notifications you opted in to. You can turn notifications off anytime in Settings or your phone's system settings.
          </Bold>
          <Bold label="Analytics.">
            We use analytics software to understand how many people use the app and which screens get the most attention. Analytics data is aggregated — we see things like "200 people opened the News tab this week," not "Rob opened the News tab at 9:14 PM." The analytics tool may collect your device type, OS version, country-level location (derived from your IP, not GPS), and which screens you visit. We don't receive your IP address or anything that personally identifies you.
          </Bold>
          <Text style={[s.body, { marginTop: 12 }]}>
            <Text style={s.bold}>That's it.</Text>
            {' '}No precise location. No microphone. No camera. No contacts. No accounts.
          </Text>
        </Section>

        <Section title="Where the app's content comes from">
          <Body>
            News headlines, event listings, and business information come from public sources — RSS feeds from local publications, public APIs, and content we've curated ourselves. We don't collect information about you when you view this content.
          </Body>
        </Section>

        <Section title="Directions and maps">
          <Body>
            When you tap "Directions" on a business or event, the app opens your phone's native maps app. At that point, whatever data you share is between you and the maps app. We don't see where you go or what you do there.
          </Body>
        </Section>

        <Section title="Feedback">
          <Body>
            If you use the feedback form to send a message, we receive what you type. We use it only to read and respond. We don't add you to any mailing list.
          </Body>
        </Section>

        <Section title="Children">
          <Body>
            The app is intended for general audiences. We don't knowingly collect information from children under 13.
          </Body>
        </Section>

        <Section title="Changes to this policy">
          <Body>
            If we ever start collecting something new — user accounts, location, whatever — we'll update this policy and note the change in the app.
          </Body>
        </Section>

        <Section title="Contact">
          <Body>Questions about this policy can go to rob@robfiasco.dev.</Body>
        </Section>

        <Text style={s.footer}>
          Chadakoin Now is built by Rob Fiasco, operating as Chadakoin Digital, Jamestown, NY.
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
