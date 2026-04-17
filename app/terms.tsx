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
          Thanks for using Chadakoin Now. By using the app, you agree to these terms. They're short and written in plain English.
        </Body>

        <Section title="Who we are">
          <Body>Chadakoin Now is built by Rob Fiasco, operating as Chadakoin Digital in Jamestown, NY.</Body>
        </Section>

        <Section title="What the app does">
          <Body>
            Chadakoin Now is a local information app for Jamestown, NY. It shows weather, local news, events, places to visit, city services, and other local content. The app pulls content from public RSS feeds, APIs, and information we've curated ourselves.
          </Body>
        </Section>

        <Section title="Information accuracy">
          <Body>
            Most of the information in the app comes from outside sources that we don't control. We do our best to keep things current, but:
          </Body>
          <View style={{ marginTop: 10 }}>
            <Bullet label="Events">can change or be cancelled. Check with the venue before you go.</Bullet>
            <Bullet label="Business hours and addresses">can change. Call ahead if it matters.</Bullet>
            <Bullet label="News">comes from third-party publishers. We link to their stories but don't verify them.</Bullet>
            <Bullet label="City services information">comes from the City of Jamestown and the BPU. In a conflict, the city's information is the official version.</Bullet>
          </View>
          <Text style={[s.body, { marginTop: 12 }]}>
            Don't make consequential decisions based solely on what you see in the app. If hours, prices, or dates matter, verify them directly with the business or venue.
          </Text>
        </Section>

        <Section title="How businesses get listed">
          <Text style={[s.body, { marginBottom: 10 }]}>The app lists businesses in the Visit section. Two things to know:</Text>
          <Text style={s.body}>
            <Text style={s.bold}>Editorial content. </Text>
            Some businesses appear because Rob personally visited them and thinks they're worth recommending. These are called "Editor's Picks." They reflect personal experience, not paid endorsement. If Rob didn't like a place, it's simply not listed.
          </Text>
          <Text style={[s.body, { marginTop: 10 }]}>
            <Text style={s.bold}>Featured placement. </Text>
            Some businesses appear in a "Featured" section because they've paid for the placement. Featured listings are always clearly marked. Featured placement does not become an Editor's Pick, and Editor's Picks are never for sale.
          </Text>
          <Text style={[s.body, { marginTop: 10 }]}>
            If you own or represent a business and want to request a correction or removal, email rob@robfiasco.dev.
          </Text>
        </Section>

        <Section title="What the app isn't">
          <Body>Chadakoin Now is an information app. It is not:</Body>
          <View style={{ marginTop: 10 }}>
            <Bullet>A booking, reservation, or ticketing service</Bullet>
            <Bullet>An emergency service or authoritative source for civic information</Bullet>
            <Bullet>A review platform or comparison tool</Bullet>
            <Bullet>A substitute for contacting businesses directly</Bullet>
          </View>
        </Section>

        <Section title="Your use of the app">
          <Body>You can use Chadakoin Now however you want, for any lawful purpose. Don't:</Body>
          <View style={{ marginTop: 10 }}>
            <Bullet>Attempt to reverse engineer, scrape, or repurpose the app's content for a competing service</Bullet>
            <Bullet>Use the app in any way that violates the law</Bullet>
          </View>
        </Section>

        <Section title="Content ownership">
          <Body>
            The app's design, code, editorial content, and Chadakoin Now name are owned by Rob Fiasco / Chadakoin Digital. Business names, logos, trademarks, and third-party content belong to their respective owners.
          </Body>
        </Section>

        <Section title="No warranty">
          <Body>
            The app is provided as-is. We don't promise it will always work, be accurate, or meet your needs. To the extent allowed by law, we're not liable for any damages that arise from using the app or relying on its content.
          </Body>
        </Section>

        <Section title="Changes to these terms">
          <Body>
            We may update these terms from time to time. When we do, we'll update the date at the top. Continued use of the app means you accept the updated terms.
          </Body>
        </Section>

        <Section title="Contact">
          <Body>Questions, corrections, or concerns: rob@robfiasco.dev</Body>
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
