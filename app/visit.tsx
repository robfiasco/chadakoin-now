import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedBackground } from '../components/ThemedBackground';
import { useTheme } from '../lib/ThemeContext';
import { PLACES, Place } from '../data/places';
import { openLink } from '../lib/openLink';

type FilterCat = 'all' | 'stay' | 'eat' | 'do' | 'see';

function mapCategory(place: Place): FilterCat {
  const cats = place.categories;
  if (cats.includes('stay'))     return 'stay';
  if (cats.includes('arts'))     return 'see';
  if (cats.includes('activity')) return 'do';
  return 'eat';
}

function categoryLabel(cat: FilterCat): string {
  if (cat === 'stay') return 'Stay';
  if (cat === 'eat')  return 'Eat';
  if (cat === 'do')   return 'Do';
  if (cat === 'see')  return 'See';
  return '';
}

function hexToRGB(hex: string): string {
  const h = hex.replace('#', '');
  return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
}

const CAT_COLOR: Record<FilterCat, string> = {
  all:  '#fff',
  stay: '#5B8DB8',
  eat:  '#F5A623',
  do:   '#9B6DFF',
  see:  '#FF6B8A',
};

const FILTERS: { key: FilterCat; label: string }[] = [
  { key: 'all',  label: 'All'  },
  { key: 'stay', label: 'Stay' },
  { key: 'eat',  label: 'Eat'  },
  { key: 'do',   label: 'Do'   },
  { key: 'see',  label: 'See'  },
];

// ─── Local Favorites ─────────────────────────────────────────────
interface LocalFav {
  name: string;
  category: FilterCat;
  detail: string;
  website?: string;
  gradientStart: string;
  gradientEnd: string;
  borderColor: string;
  rgb: string;
  visited: boolean;
  quote: string;
}

const LOCAL_FAVORITES: LocalFav[] = [
  {
    name: 'Labyrinth Press Co.',
    category: 'eat',
    detail: 'Eat · Drink · Tue–Sat 8am–9pm',
    website: 'https://www.labpressco.com/',
    gradientStart: 'rgba(0,212,200,0.1)',
    gradientEnd:   'rgba(0,212,200,0.03)',
    borderColor:   'rgba(0,212,200,0.2)',
    rgb: '0,212,200',
    visited: true,
    quote: "Don't let the vegan menu scare you off — this is genuinely one of the best restaurants in Jamestown. The Brazil Lounge has a serious cocktail menu, a great local beer selection, and the patio in summer is hard to beat.",
  },
  {
    name: "Honest John's Pizzeria",
    category: 'eat',
    detail: 'Eat · Jamestown, NY',
    website: 'https://honestjohns.pizza/',
    gradientStart: 'rgba(245,166,35,0.1)',
    gradientEnd:   'rgba(245,166,35,0.03)',
    borderColor:   'rgba(245,166,35,0.2)',
    rgb: '245,166,35',
    visited: true,
    quote: "Jamestown has no shortage of great pizza and wings, and Honest John's holds its own. The subs are solid too if you're in that mood.",
  },
  {
    name: 'National Comedy Center',
    category: 'see',
    detail: 'See · Wed–Sun, 10am–5pm',
    website: 'https://comedycenter.org',
    gradientStart: 'rgba(155,109,255,0.1)',
    gradientEnd:   'rgba(155,109,255,0.03)',
    borderColor:   'rgba(155,109,255,0.2)',
    rgb: '155,109,255',
    visited: true,
    quote: "I've been three times and would go back. Comedy is my thing, so take that for what it's worth — but this is genuinely the best museum I've ever been to. If you visit Jamestown and skip it, you made a mistake.",
  },
];

// ─── Also in Jamestown ───────────────────────────────────────────
interface AlsoEntry {
  name: string;
  category: FilterCat;
  detail: string;
  note: string;
  caveats: string[];
}

const ALSO_IN_JAMESTOWN: AlsoEntry[] = [
  {
    name: 'DoubleTree by Hilton',
    category: 'stay',
    detail: 'Stay · Downtown · Limited parking',
    note: "The old Holiday Inn — now a DoubleTree. Pearl City Hops bar on-site if you need a drink without going far.",
    caveats: ['Chain', 'Limited parking'],
  },
  {
    name: 'La Quinta Inn & Suites',
    category: 'stay',
    detail: 'Stay · Near downtown · Limited parking',
    note: "Solid no-frills option. Pet friendly but no real green space nearby for dogs.",
    caveats: ['Chain', 'Limited parking', 'Pet friendly'],
  },
  {
    name: 'Holiday Inn Express & Suites',
    category: 'stay',
    detail: 'Stay · Off I-86 · Free parking',
    note: "Not walkable to downtown but right off the interstate — easy in and out if you're passing through.",
    caveats: ['Chain', 'Free parking', 'Pet friendly'],
  },
  {
    name: 'Chautauqua Harbor Hotel',
    category: 'stay',
    detail: 'Stay · Celoron · 5 min drive from downtown',
    note: "Nicest hotel in the area. Lakeside views and marina on-site. Not walkable to downtown — you'll need a car.",
    caveats: ['Not walkable', 'Celoron'],
  },
  {
    name: 'Airbnb & VRBO',
    category: 'stay',
    detail: 'Stay · Various locations',
    note: "Short-term rentals throughout Jamestown and the Chautauqua Lake area. Good option for groups or longer stays.",
    caveats: ['Self check-in', 'Prices vary'],
  },
];

// IDs that appear in Local Favorites or Also in Jamestown — exclude from Chadakoin Approved
const EXCLUDE_FROM_APPROVED = new Set(['labyrinth-press', 'comedy-center', 'chautauqua-harbor-hotel', 'airbnb-jamestown']);

export default function VisitScreen() {
  const { theme } = useTheme();
  const [active, setActive] = useState<FilterCat>('all');

  const filteredFavorites = active === 'all'
    ? LOCAL_FAVORITES
    : LOCAL_FAVORITES.filter(f => f.category === active);

  const filteredApproved = PLACES
    .filter(p => !EXCLUDE_FROM_APPROVED.has(p.id))
    .map(p => ({ ...p, _cat: mapCategory(p) }))
    .filter(p => active === 'all' || p._cat === active)
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  const filteredAlso = active === 'all'
    ? ALSO_IN_JAMESTOWN
    : ALSO_IN_JAMESTOWN.filter(a => a.category === active);

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={[styles.title, { color: '#fff' }]}>Visit Jamestown</Text>
            <Text style={[styles.subtitle, { color: theme.acc }]}>Jamestown, NY</Text>
          </View>
          {/* Approved lockup — icon only */}
          <View style={[styles.approvedLockup, { borderColor: `rgba(${theme.accRGB},0.2)`, backgroundColor: `rgba(${theme.accRGB},0.08)` }]}>
            <View style={[styles.approvedDot, { backgroundColor: theme.acc }]}>
              <Ionicons name="checkmark" size={12} color="#000" />
            </View>
          </View>
        </View>

        {/* Category filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {FILTERS.map(f => {
            const isActive = active === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setActive(f.key)}
                activeOpacity={0.7}
                style={[
                  styles.catPill,
                  isActive
                    ? [styles.catActive, { backgroundColor: theme.acc }]
                    : styles.catInactive,
                ]}
              >
                <Text style={[
                  styles.catText,
                  isActive ? { color: theme.bg } : styles.catTextInactive,
                ]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Featured Spot placeholder */}
        <Text style={[styles.sectionLabel, { color: theme.acc }]}>Featured Spot</Text>
        <View style={styles.partnerPlaceholder}>
          <Ionicons name="checkmark-circle-outline" size={24} color="rgba(0,212,200,0.5)" />
          <Text style={styles.partnerHeading}>Your business, right here</Text>
          <Text style={styles.partnerSub}>
            Featured spots are hand-picked and Chadakoin Approved. Prominent placement, seen by every visitor who opens the app.
          </Text>
          <Text style={[styles.partnerCta, { color: theme.acc, borderColor: `rgba(${theme.accRGB},0.25)` }]}>
            Get in touch →
          </Text>
        </View>

        <View style={styles.divider} />

        {/* ── Local Favorites ─────────────────────────── */}
        {filteredFavorites.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.acc }]}>Local Favorites</Text>
            {filteredFavorites.map(fav => (
              <TouchableOpacity
                key={fav.name}
                activeOpacity={fav.website ? 0.75 : 1}
                onPress={() => openLink(fav.website)}
                style={[styles.pickCard, { borderColor: fav.borderColor }]}
              >
                <LinearGradient
                  colors={[fav.gradientStart, fav.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.pickInner}
                >
                  <Text style={[styles.pickName, { color: '#fff' }]}>{fav.name}</Text>
                  <Text style={styles.pickQuote}>"{fav.quote}"</Text>
                  <Text style={styles.pickDetail}>{fav.detail}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </>
        )}

        {filteredFavorites.length > 0 && filteredApproved.length > 0 && (
          <View style={styles.divider} />
        )}

        {/* ── Chadakoin Approved ──────────────────────── */}
        {filteredApproved.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.acc }]}>Chadakoin Approved</Text>
            {filteredApproved.map(place => {
              const cat      = place._cat;
              const color    = CAT_COLOR[cat];
              const colorRGB = hexToRGB(color);
              const catStr   = categoryLabel(cat);
              const detail   = place.hours ?? place.address ?? '';
              const detailLine = catStr && detail ? `${catStr} · ${detail}` : detail;
              const isVisited  = (place as any).visited === true;
              return (
                <TouchableOpacity
                  key={place.id}
                  activeOpacity={place.website ? 0.75 : 1}
                  onPress={() => openLink(place.website)}
                  style={[styles.card, { backgroundColor: `rgba(${colorRGB},0.05)` }]}
                >
                  <View style={[styles.cardAccent, { backgroundColor: color }]} />
                  <View style={styles.cardInner}>
                    <View style={styles.nameRow}>
                      <Text style={styles.bizName} numberOfLines={1}>{place.name}</Text>
                      {isVisited && (
                        <View style={styles.visitedTag}>
                          <View style={[styles.visitedDot, { backgroundColor: theme.acc }]} />
                          <Text style={[styles.visitedText, { color: theme.acc }]}>Visited</Text>
                        </View>
                      )}
                    </View>
                    {place.description ? (
                      <Text style={styles.tagline} numberOfLines={1}>{place.description}</Text>
                    ) : null}
                    {detailLine ? (
                      <Text style={[styles.detailRow, { color: `rgba(${colorRGB},0.7)` }]}>{detailLine}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {filteredAlso.length > 0 && (filteredFavorites.length > 0 || filteredApproved.length > 0) && (
          <View style={styles.divider} />
        )}

        {/* ── Also in Jamestown ───────────────────────── */}
        {filteredAlso.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: `rgba(${theme.accRGB},0.4)` }]}>Also in Jamestown</Text>
            {filteredAlso.map(entry => (
              <View key={entry.name} style={styles.alsoCard}>
                <Text style={styles.alsoDetail}>{entry.detail}</Text>
                <Text style={styles.alsoName}>{entry.name}</Text>
                <Text style={styles.alsoNote}>{entry.note}</Text>
                {entry.caveats.length > 0 && (
                  <View style={styles.alsoCaveats}>
                    {entry.caveats.map(c => (
                      <Text key={c} style={styles.caveatTag}>{c}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </>
        )}

      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { paddingHorizontal: 20 },

  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 20, paddingBottom: 4 },
  title:    { fontSize: 21, fontFamily: 'Syne', fontWeight: '700', letterSpacing: 0.1, color: '#fff' },
  subtitle: { fontSize: 11, fontFamily: 'Outfit', letterSpacing: 1.2, marginTop: 3 },

  approvedLockup: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 20, width: 36, height: 36, flexShrink: 0 },
  approvedDot:    { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  catRow:          { flexDirection: 'row', marginBottom: 18, marginTop: 14, gap: 7 },
  catPill:         { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20 },
  catActive:       { borderWidth: 1, borderColor: 'transparent' },
  catInactive:     { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  catText:         { fontSize: 12, fontFamily: 'Outfit', fontWeight: '700' },
  catTextInactive: { color: 'rgba(255,255,255,0.45)' },

  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 4 },

  sectionLabel: { fontSize: 10, fontFamily: 'Outfit', fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginTop: 4 },

  partnerPlaceholder: {
    borderWidth: 1.5, borderColor: 'rgba(0,212,200,0.2)', borderStyle: 'dashed',
    borderRadius: 20, paddingVertical: 16, paddingHorizontal: 16,
    alignItems: 'center', gap: 6, marginBottom: 14,
  },
  partnerHeading:   { fontSize: 13, fontFamily: 'Outfit', fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  partnerSub:       { fontSize: 11, fontFamily: 'Outfit', color: 'rgba(255,255,255,0.3)', lineHeight: 16, textAlign: 'center' },
  partnerCta:       { alignSelf: 'center', fontSize: 10, fontFamily: 'Outfit', fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', borderWidth: 1, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 18, marginTop: 2 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 16 },

  // ── Local Favorites ───────────────────────────────
  pickCard:   { borderWidth: 1, borderRadius: 20, marginBottom: 10, overflow: 'hidden' },
  pickInner:  { padding: 16 },
  pickName:   { fontSize: 15, fontFamily: 'Outfit', fontWeight: '800', color: '#fff', letterSpacing: -0.4, marginBottom: 8 },
  pickQuote:  { fontSize: 11, fontFamily: 'Outfit', color: 'rgba(255,255,255,0.55)', lineHeight: 18, fontStyle: 'italic' },
  pickDetail: { fontSize: 10, fontFamily: 'Outfit', color: 'rgba(255,255,255,0.3)', marginTop: 8 },

  // ── Chadakoin Approved ────────────────────────────
  card:       { borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, marginBottom: 8, flexDirection: 'row', overflow: 'hidden' },
  cardAccent: { width: 3, flexShrink: 0, alignSelf: 'stretch', borderRadius: 0 },
  cardInner:  { flex: 1, minWidth: 0, padding: 12 },

  nameRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  bizName:   { fontSize: 14, fontFamily: 'Outfit', fontWeight: '700', color: '#fff', letterSpacing: -0.3, flex: 1 },
  tagline:   { fontSize: 11, fontFamily: 'Outfit', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' },
  detailRow: { fontSize: 10, fontFamily: 'Outfit', marginTop: 5 },

  visitedTag:  { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  visitedDot:  { width: 5, height: 5, borderRadius: 3, opacity: 0.7 },
  visitedText: { fontSize: 9, fontFamily: 'Outfit', fontWeight: '600', opacity: 0.6, letterSpacing: 0.6, textTransform: 'uppercase' },

  // ── Also in Jamestown ─────────────────────────────
  alsoCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 13,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  alsoName:   { fontSize: 13, fontFamily: 'Outfit', fontWeight: '700', color: 'rgba(255,255,255,0.65)', letterSpacing: -0.2, marginBottom: 4 },
  alsoDetail: { fontSize: 10, fontFamily: 'Outfit', color: 'rgba(255,255,255,0.25)', marginBottom: 5 },
  alsoNote:   { fontSize: 11, fontFamily: 'Outfit', color: 'rgba(255,255,255,0.4)', lineHeight: 16, fontStyle: 'italic' },
  alsoCaveats:{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  caveatTag:  {
    fontSize: 8, fontFamily: 'Outfit', fontWeight: '700',
    color: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 5, paddingVertical: 2, paddingHorizontal: 7,
    letterSpacing: 0.6, textTransform: 'uppercase', overflow: 'hidden',
  },
});
