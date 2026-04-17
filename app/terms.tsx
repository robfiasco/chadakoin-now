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

function Bullet({ label, children }: { label?: string; children: string }) {
  return (
    <View style={s.bulletRow}>
      <Text style={s.bulletDot}>·</Text>
      <Text style={s.bulletText}>
        {label ? <Text style={s.bold}>{label} </Text> : null}
        {children}
      </Text>
    </View>
  );
}

export default function TermsOfUseScreen({ onClose }: { onClose: () => void }) {
  return (
    <View style={s.container}>
      <SafeAreaView edges={['top']} style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>Terms of Use</Text>
            <Text style={s.updated}>Last updated: April 17, 2026</Text>
          </View>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={s.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <Body>
          Thanks for using Chadakoin Now. By using the app, you agree to these terms. They're short and written like a normal person wrote them.
        </Body>

        <Section title="Who made this">
          <Body>I'm Rob Fiasco. I built Chadakoin Now under the name Chadakoin Digital, based in Jamestown, NY.</Body>
        </Section>

        <Section title="What the app does">
          <Body>
            Chadakoin Now is a local information app for Jamestown, NY — weather, news, events, places to visit, city services. Content comes from public RSS feeds, public APIs, and things I've added myself.
          </Body>
        </Section>

        <Section title="Accuracy">
          <Body>
            A lot of what's in the app comes from outside sources I don't control. I try to keep things current, but:
          </Body>
          <View style={{ marginTop: 10 }}>
            <Bullet label="Events">can change or get cancelled. Check with the venue before you go.</Bullet>
            <Bullet label="Business hours and addresses">can change. Call ahead if it matters.</Bullet>
            <Bullet label="News">comes from third-party publishers. I link to their stories but don't verify them.</Bullet>
            <Bullet label="City services info">comes from the City of Jamestown and the BPU. If there's a conflict, their information is the official version.</Bullet>
          </View>
          <Text style={[s.body, { marginTop: 12 }]}>
            Don't make important decisions based solely on what you see here. If hours, prices, or dates matter, verify them directly.
          </Text>
        </Section>

        <Section title="How businesses get listed">
          <Text style={[s.body, { marginBottom: 10 }]}>
            The Visit section lists local businesses. Two things to know:
          </Text>
          <Text style={s.body}>
            <Text style={s.bold}>Editor's Picks. </Text>
            These are places I've personally visited and think are worth recommending. They reflect my own experience — not paid endorsement. If I haven't been there or didn't like it, it's not listed.
          </Text>
          <Text style={[s.body, { marginTop: 10 }]}>
            <Text style={s.bold}>Featured placement. </Text>
            Some businesses pay to be featured. Featured listings are always clearly marked. Paying doesn't make something an Editor's Pick, and Editor's Picks are never for sale.
          </Text>
          <Text style={[s.body, { marginTop: 10 }]}>
            Own a business and want a correction or removal? Email rob@robfiasco.dev.
          </Text>
        </Section>

        <Section title="What this app isn't">
          <Body>Chadakoin Now is an information app. It's not:</Body>
          <View style={{ marginTop: 10 }}>
            <Bullet>A booking, reservation, or ticketing service</Bullet>
            <Bullet>An emergency service or authoritative source for civic information</Bullet>
            <Bullet>A review platform or comparison tool</Bullet>
            <Bullet>A substitute for contacting a business directly</Bullet>
          </View>
        </Section>

        <Section title="Your use">
          <Body>Use the app however you want, for any lawful purpose. Please don't:</Body>
          <View style={{ marginTop: 10 }}>
            <Bullet>Scrape or repurpose the app's content to build a competing service</Bullet>
            <Bullet>Use the app in any way that breaks the law</Bullet>
          </View>
        </Section>

        <Section title="Ownership">
          <Body>
            The app's design, code, editorial content, and the Chadakoin Now name belong to me. Business names, logos, and third-party content belong to their respective owners.
          </Body>
        </Section>

        <Section title="No warranty">
          <Body>
            The app is provided as-is. I can't promise it will always work perfectly or that every piece of information is accurate. To the extent the law allows, I'm not liable for damages that come from using the app or relying on its content.
          </Body>
        </Section>

        <Section title="If these change">
          <Body>
            I may update these terms from time to time. I'll update the date at the top when I do. Continued use means you're good with the changes.
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
