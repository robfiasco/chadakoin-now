import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Linking, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedBackground } from '../components/ThemedBackground';
import { useTheme } from '../lib/ThemeContext';
import { PLACES, CANNABIS_RULES, Place } from '../data/places';
import { dark } from '../lib/colors';
import { openLink } from '../lib/openLink';
import { FeatureYourBusiness } from '../components/FeatureYourBusiness';
import FeedbackScreen from './feedback';

function openMaps(query: string) {
  openLink(`https://maps.google.com/?q=${encodeURIComponent(query)}`);
}

type FilterCat = 'all' | 'eat' | 'drink' | 'stay' | 'explore' | 'cannabis';

const FILTERS: { key: FilterCat; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'eat',      label: 'Eat'      },
  { key: 'drink',    label: 'Drink'    },
  { key: 'stay',     label: 'Stay'     },
  { key: 'explore',  label: 'Explore'  },
  { key: 'cannabis', label: '🌿 21+'   },
];

// Per-category accent colors — consistent across all themes
const CAT_COLOR: Record<string, string> = {
  eat:      '#fbbf24',  // amber
  drink:    '#f97316',  // orange
  stay:     '#60a5fa',  // blue
  explore:  '#a78bfa',  // purple
  cannabis: '#34d399',  // green
};

// ─── Open Now logic ───────────────────────────────────────────────
const DAY_MAP: Record<string, number> = {
  sun: 0, sunday: 0, saturdays: 6, sat: 6, saturday: 6,
  fri: 5, friday: 5, thu: 4, thursday: 4,
  wed: 3, wednesday: 3, tue: 2, tuesday: 2, mon: 1, monday: 1,
};

function parseTimeMins(str: string, hint?: 'am' | 'pm'): number {
  const m = str.match(/(\d+)(?::(\d+))?\s*(am|pm)?/i);
  if (!m) return -1;
  let h = parseInt(m[1]);
  const mins = m[2] ? parseInt(m[2]) : 0;
  const mer = (m[3]?.toLowerCase() ?? hint) as 'am' | 'pm' | undefined;
  if (mer === 'pm' && h !== 12) h += 12;
  if (mer === 'am' && h === 12) h = 0;
  return h * 60 + mins;
}

function daysInRange(str: string): number[] {
  const s = str.trim().toLowerCase();
  if (s === 'daily') return [0,1,2,3,4,5,6];
  const parts = s.split(/[–\-]/);
  if (parts.length === 2) {
    const a = DAY_MAP[parts[0].trim()]; const b = DAY_MAP[parts[1].trim()];
    if (a === undefined || b === undefined) return [];
    const out: number[] = []; let d = a;
    while (d !== b) { out.push(d); d = (d + 1) % 7; }
    out.push(b); return out;
  }
  const single = DAY_MAP[s]; return single !== undefined ? [single] : [];
}

function isOpenNow(hours?: string): boolean | null {
  if (!hours) return null;
  if (/24.hour|24\/7|always/i.test(hours)) return true;
  if (/check website|day.of.show|varies|call/i.test(hours)) return null;

  const now = new Date();
  const dow = now.getDay();
  const cur = now.getHours() * 60 + now.getMinutes();

  // "Closes Xpm" shorthand
  const cl = hours.match(/closes?\s+(\d+(?::\d+)?\s*(?:am|pm)?)/i);
  if (cl) { const t = parseTimeMins(cl[1]); return t > 0 && cur < t; }

  const segments = hours.split(/·/).map(s => s.trim()).filter(Boolean);
  let todayCovered = false;

  for (const seg of segments) {
    if (/closed/i.test(seg)) continue;
    // Match: <days> <open>–<close>
    const m = seg.match(/^([A-Za-z–\-]+(?:\s*[A-Za-z–\-]+)*)\s+(\d[\d:]*\s*(?:am|pm)?)\s*[–\-]\s*(\d[\d:]*\s*(?:am|pm)?)/i);
    if (!m) continue;
    const days = daysInRange(m[1]);
    if (!days.includes(dow)) continue;
    todayCovered = true;
    const closeMer = /pm/i.test(m[3]) ? 'pm' : /am/i.test(m[3]) ? 'am' : undefined;
    const open  = parseTimeMins(m[2], closeMer === 'pm' && !/am|pm/i.test(m[2]) ? 'pm' : undefined);
    const close = parseTimeMins(m[3]);
    if (open < 0 || close < 0) continue;
    if (cur >= open && cur < close) return true;
  }

  return todayCovered ? false : null;
}

function mapCategory(place: Place): FilterCat {
  const cats = place.categories;
  if (cats.includes('stay'))                          return 'stay';
  if (cats.includes('cannabis'))                      return 'cannabis';
  if (cats.includes('arts') || cats.includes('activity')) return 'explore';
  if (cats.includes('drinks')) return 'drink';
  return 'eat'; // food, coffee, mixed eat+drink
}

// ─── Local Favorites (Editor's Picks) ────────────────────────────
interface LocalFav {
  name: string;
  category: FilterCat;
  detail: string;
  website?: string;
  orderUrl?: string;
  hours?: string;     // standard format consumed by isOpenNow()
  rgb: string;
  visited: boolean;
  quote: string;
  lat?: number;
  lng?: number;
  image?: any;
  imageAnchor?: 'top' | 'center';
  imageFit?: 'cover' | 'contain'; // default 'cover'
}

const LOCAL_FAVORITES: LocalFav[] = [
  {
    name: 'Pit Stop Pops',
    category: 'drink',
    detail: 'Drink · Mon–Thu 12–6pm · Fri–Sat 12–9pm',
    orderUrl: 'https://www.doordash.com/store/pit-stop-pops-jamestown-42331609/105610547/',
    hours: 'Mon–Thu 12pm–6pm · Fri–Sat 12pm–9pm · Sun Closed',
    rgb: '225,6,0',
    visited: false,
    quote: "Pit lane pick-me-up. Dirty sodas tuned for max flavor — smooth, fizzy, podium-worthy. Race-ready refreshment on E 2nd St.",
    image: Platform.OS === 'web' ? { uri: '/psp.jpg' } : require('../assets/psp.jpg'),
  },
  {
    name: 'Labyrinth Press Co.',
    category: 'eat',
    detail: 'Eat · Drink · Tue–Sat 8am–9pm',
    website: 'https://www.labpressco.com/',
    hours: 'Tue–Sat 8am–9pm',
    rgb: '0,212,200',
    visited: true,
    quote: "Don't let the vegan menu scare you off — this is genuinely one of the best restaurants in Jamestown. The Brazil Lounge has a serious cocktail menu, a great local beer selection, and the patio in summer is hard to beat.",
    lat: 42.09711, lng: -79.24081,
    image: Platform.OS === 'web' ? { uri: '/Brazil-%20Lab.jpg' } : require('../assets/brazil-lab.jpg'),
  },
  {
    name: 'National Comedy Center',
    category: 'explore',
    detail: 'Explore · Wed–Sun, 10am–5pm',
    website: 'https://comedycenter.org',
    hours: 'Wed–Sun 10am–5pm',
    rgb: '155,109,255',
    visited: true,
    quote: "I've been three times and would go back. Comedy is my thing, so take that for what it's worth — but this is genuinely the best museum I've ever been to. If you visit Jamestown and skip it, you made a mistake.",
    lat: 42.09467, lng: -79.24365,
    image: Platform.OS === 'web' ? { uri: '/comedy_center.jpg' } : require('../assets/comedy_center.jpg'),
  },
];

// ─── Also in Jamestown (hotels / lodging) ────────────────────────
interface AlsoEntry {
  name: string;
  detail: string;
  note: string;
  caveats: string[];
  lat?: number;
  lng?: number;
}

const ALSO_IN_JAMESTOWN: AlsoEntry[] = [
  {
    name: 'DoubleTree by Hilton',
    detail: 'Stay · Downtown · Limited parking',
    note: "The old Holiday Inn — now a DoubleTree. Pearl City Hops bar on-site if you need a drink without going far.",
    caveats: ['Chain', 'Limited parking'],
    lat: 42.09722, lng: -79.24344,
  },
  {
    name: 'La Quinta Inn & Suites',
    detail: 'Stay · Near downtown · Limited parking',
    note: "Solid no-frills option. Pet friendly but no real green space nearby for dogs.",
    caveats: ['Chain', 'Pet friendly'],
    lat: 42.09605, lng: -79.24421,
  },
  {
    name: 'Holiday Inn Express & Suites',
    detail: 'Stay · Off I-86 · Free parking',
    note: "Not walkable to downtown but right off the interstate — easy in and out if you're passing through.",
    caveats: ['Chain', 'Free parking'],
    lat: 42.11996, lng: -79.24420,
  },
];

// ─── Parks & History ──────────────────────────────────────────────
type ParkId = 'dow' | 'baker' | 'mccrea' | 'allen' | 'bergman' | 'jackson';

const PARK_COLOR: Record<ParkId, string> = {
  dow:     '77,192,140',
  baker:   '91,141,184',
  mccrea:  '64,196,220',
  allen:   '200,168,76',
  bergman: '155,109,255',
  jackson: '220,110,90',
};

interface ParkEntry {
  id: ParkId;
  name: string;
  address: string;
  features: string[];
  quote: string;
  visited: boolean;
  hasHistory: boolean;
  historyNote?: string;
  hasDonate?: boolean;
  lat: number;
  lng: number;
}

const PARKS: ParkEntry[] = [
  {
    id: 'dow',
    name: 'Dow Park',
    address: 'W. 6th St, Jamestown',
    features: ['Playground', 'History', 'Statues'],
    visited: true,
    hasHistory: true,
    historyNote: "Underground Railroad Tableau · Catherine Harris · Silas Shearman · Bronze statues by David Poulin",
    hasDonate: true,
    quote: "I grew up going here and had no idea about any of this history until recently. The Underground Railroad Tableau honors Catherine Harris and Silas Shearman — two Jamestown residents who risked everything to shelter escaped slaves on their way to Canada. Worth knowing. Worth visiting.",
    lat: 42.09912, lng: -79.24396,
  },
  {
    id: 'baker',
    name: 'Baker Park',
    address: '4th & Clinton, Jamestown',
    features: ['Historic', 'Public Square'],
    visited: true,
    hasHistory: true,
    historyNote: "Donated by Col. Henry Baker · 1845 · Former burial ground · Remains moved to W. 5th St cemetery",
    quote: "My dad tried to teach me to ride a bike here. It didn't go well. Named after Colonel Henry Baker, a War of 1812 veteran who donated this land in 1845 on one condition — that it always remain a public square.",
    lat: 42.09679, lng: -79.24704,
  },
  {
    id: 'mccrea',
    name: 'McCrea Point Park',
    address: 'Chadakoin River, Jamestown',
    features: ['Boat Launch', 'Fishing', 'Riverwalk'],
    visited: true,
    hasHistory: false,
    quote: "This was right down the street from where I grew up. The Riverwalk connects through here and the area has more going on than it used to. The industrial history along this stretch of the Chadakoin is deep — the bones are there for something special.",
    lat: 42.10136, lng: -79.25461,
  },
  {
    id: 'allen',
    name: 'Allen Park',
    address: 'W. Virginia Blvd, Jamestown',
    features: ['Strider Field', 'Bandshell', 'Splash Pad', 'Trails'],
    visited: true,
    hasHistory: false,
    quote: "35 acres with walking trails, a splash pad, soccer fields, and the Goranson Bandshell where the Jamestown Municipal Band plays Wednesday nights. Honestly, I don't get up this way enough.",
    lat: 42.08381, lng: -79.22231,
  },
  {
    id: 'bergman',
    name: 'Bergman Park',
    address: '487 Baker St Ext, Jamestown',
    features: ['Disc Golf', 'Baseball', 'Basketball', 'Events'],
    visited: true,
    hasHistory: false,
    quote: "If you grew up in Jamestown, you've probably been to something here. The Labor Day celebration is the big one. Free 18-hole disc golf course opened in 2022.",
    lat: 42.07983, lng: -79.25810,
  },
  {
    id: 'jackson',
    name: 'Jackson-Taylor Park',
    address: '10th & Washington, Jamestown',
    features: ['Riverwalk', 'Splash Pad', 'Ball Fields', 'Basketball'],
    visited: false,
    hasHistory: true,
    historyNote: "Named for Isabelle Jackson, Vivian & Lula Taylor · Lula was the first African American woman county legislator in NY State · Renamed 2019",
    quote: "At 152 acres, one of the largest parks in the city. Named in 2019 to honor Isabelle Jackson, Vivian Taylor — 23 years on City Council, a World War II veteran — and Lula Taylor, the first African American woman county legislator in New York State. I haven't been. It's on my list.",
    lat: 42.10578, lng: -79.24903,
  },
];

// Places excluded from Browse (already in Editor's Picks)
const EDITOR_PICKS_IDS = new Set(['labyrinth-press', 'comedy-center', 'pit-stop-pops']);

// ─── "Open" badge (rendered when isOpenNow returns true) ──────────
function OpenBadge() {
  return (
    <View style={list.badge}>
      <View style={[list.badgeDot, { backgroundColor: '#34d399' }]} />
      <Text style={[list.badgeText, { color: '#34d399' }]}>OPEN</Text>
    </View>
  );
}

// ─── Editor's Pick hero card ──────────────────────────────────────
function EditorPickCard({ fav }: { fav: LocalFav }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(true);
  const catColor = CAT_COLOR[fav.category] ?? theme.acc;

  return (
    <View style={hero.card}>
      {/* Image header */}
      <View style={hero.imgWrap}>
        {fav.image ? (
          <Image
            source={fav.image}
            style={hero.img}
            contentFit={fav.imageFit ?? 'cover'}
            contentPosition={fav.imageAnchor === 'top' ? 'top' : 'center'}
          />
        ) : null}
        <LinearGradient
          colors={fav.image
            ? ['transparent', `rgba(${fav.rgb},0.25)`, dark.bg] as any
            : [`rgba(${fav.rgb},0.15)`, `rgba(${fav.rgb},0.05)`, dark.bg] as any
          }
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Category pill */}
        <View style={[hero.catPill, { backgroundColor: `${catColor}22`, borderColor: `${catColor}44` }]}>
          <Text style={[hero.catPillText, { color: catColor }]}>
            {fav.category.toUpperCase()}
          </Text>
        </View>
        {/* Editor's Pick pill */}
        <View style={hero.editorPill}>
          <Ionicons name="star" size={8} color={theme.acc} />
          <Text style={[hero.editorPillText, { color: theme.acc }]}>Editor's Pick</Text>
        </View>
      </View>

      {/* Card body */}
      <TouchableOpacity activeOpacity={0.88} onPress={() => setExpanded(e => !e)} style={hero.body}>
        <View style={hero.nameRow}>
          <Text style={hero.name}>{fav.name}</Text>
          {isOpenNow(fav.hours) === true ? <OpenBadge /> : null}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14} color="rgba(255,255,255,0.3)"
          />
        </View>
        <Text style={[hero.detail, { color: `rgba(${fav.rgb},0.6)` }]}>{fav.detail}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={[hero.expanded, { borderTopColor: `rgba(${fav.rgb},0.1)` }]}>
          <Text style={[hero.quote, { color: `rgba(${fav.rgb},0.85)` }]}>"{fav.quote}"</Text>
          <View style={hero.linksRow}>
            {fav.orderUrl ? (
              <TouchableOpacity onPress={() => openLink(fav.orderUrl!)} activeOpacity={0.7} style={[hero.linkBtn, { borderColor: `rgba(${fav.rgb},0.25)` }]}>
                <Ionicons name="bag-outline" size={12} color={`rgba(${fav.rgb},0.7)`} />
                <Text style={[hero.linkBtnText, { color: `rgba(${fav.rgb},0.7)` }]}>Order online</Text>
              </TouchableOpacity>
            ) : null}
            {fav.website ? (
              <TouchableOpacity onPress={() => openLink(fav.website!)} activeOpacity={0.7} style={[hero.linkBtn, { borderColor: `rgba(${fav.rgb},0.25)` }]}>
                <Ionicons name="globe-outline" size={12} color={`rgba(${fav.rgb},0.7)`} />
                <Text style={[hero.linkBtnText, { color: `rgba(${fav.rgb},0.7)` }]}>Website</Text>
              </TouchableOpacity>
            ) : null}
            {fav.lat ? (
              <TouchableOpacity onPress={() => openMaps(`${fav.name}, Jamestown NY`)} activeOpacity={0.7} style={[hero.linkBtn, { borderColor: `rgba(${fav.rgb},0.25)` }]}>
                <Ionicons name="navigate-outline" size={12} color={`rgba(${fav.rgb},0.7)`} />
                <Text style={[hero.linkBtnText, { color: `rgba(${fav.rgb},0.7)` }]}>Directions</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}

const hero = StyleSheet.create({
  card:    { backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border, borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
  imgWrap: { height: 130, position: 'relative', overflow: 'hidden' },
  img:     { ...StyleSheet.absoluteFillObject, opacity: 0.55 },
  catPill: { position: 'absolute', top: 10, left: 12, flexDirection: 'row', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  catPillText: { fontFamily: 'Outfit', fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  editorPill: { position: 'absolute', top: 10, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  editorPillText: { fontFamily: 'Outfit', fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  beenThereBadge: { position: 'absolute', bottom: 10, right: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  beenThereDot: { width: 5, height: 5, borderRadius: 3 },
  beenThereText: { fontFamily: 'Outfit', fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  body:    { paddingHorizontal: 14, paddingVertical: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 },
  name:    { fontFamily: 'Syne', fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2, flex: 1, marginRight: 8 },
  detail:  { fontFamily: 'Outfit', fontSize: 11, letterSpacing: 0.2 },
  expanded:{ borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  quote:   { fontFamily: 'Outfit', fontSize: 11, lineHeight: 17, fontStyle: 'italic' },
  linksRow:{ flexDirection: 'row', gap: 8 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  linkBtnText: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700' },
});

// ─── Compact list card (Places + Also + Parks) ────────────────────
function ListCard({
  name, address, color, visited, badge, children,
}: {
  name: string;
  address?: string;
  color: string;
  visited?: boolean;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={list.card}>
      <View style={[list.stripe, { backgroundColor: color }]} />
      <TouchableOpacity activeOpacity={0.85} onPress={() => setExpanded(e => !e)} style={list.row}>
        <View style={{ flex: 1 }}>
          <View style={list.nameRow}>
            <Text style={list.name}>{name}</Text>
            {badge}
          </View>
          {address ? <Text style={list.address}>{address}</Text> : null}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={13} color="rgba(255,255,255,0.25)"
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>
      {expanded && children ? (
        <View style={[list.body, { borderTopColor: `${color}1a` }]}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

const list = StyleSheet.create({
  card:    { backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border, borderRadius: 12, overflow: 'hidden', marginBottom: 6, paddingLeft: 3 },
  stripe:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  row:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name:    { fontFamily: 'Syne', fontSize: 14, fontWeight: '700', color: '#fff' },
  address: { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  badge:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(52,211,153,0.08)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  badgeDot:{ width: 4, height: 4, borderRadius: 2 },
  badgeText: { fontFamily: 'Outfit', fontSize: 8, fontWeight: '700', letterSpacing: 0.6 },
  body:    { borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
});

function PlaceListCard({ place, color }: { place: Place; color: string }) {
  const { theme } = useTheme();
  const open = isOpenNow(place.hours) === true;
  return (
    <ListCard
      name={place.name}
      address={place.address}
      color={color}
      visited={place.visited}
      badge={open ? <OpenBadge /> : undefined}
    >
      {place.description ? (
        <Text style={[lc.desc, { color: `${color}99` }]}>{place.description}</Text>
      ) : null}
      {place.hours ? (
        <Text style={lc.hours}>{place.hours}</Text>
      ) : null}
      <View style={lc.links}>
        {place.orderUrl ? (
          <TouchableOpacity onPress={() => openLink(place.orderUrl!)} activeOpacity={0.7}>
            <Text style={[lc.link, { color: theme.acc }]}>Order online →</Text>
          </TouchableOpacity>
        ) : null}
        {place.website ? (
          <TouchableOpacity onPress={() => openLink(place.website!)} activeOpacity={0.7}>
            <Text style={[lc.link, { color: theme.acc }]}>Website →</Text>
          </TouchableOpacity>
        ) : null}
        {place.lat ? (
          <TouchableOpacity onPress={() => openMaps(`${place.name}, ${place.address}`)} activeOpacity={0.7} style={lc.mapBtn}>
            <Ionicons name="navigate-outline" size={11} color="rgba(255,255,255,0.4)" />
            <Text style={lc.mapText}>Map it</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ListCard>
  );
}

function AlsoListCard({ entry }: { entry: AlsoEntry }) {
  const stayColor = CAT_COLOR.stay;
  return (
    <ListCard name={entry.name} address={entry.detail} color={stayColor}>
      <Text style={[lc.desc, { color: `${stayColor}99` }]}>{entry.note}</Text>
      <View style={lc.tagsRow}>
        {entry.caveats.map(c => (
          <View key={c} style={[lc.tag, { backgroundColor: `${stayColor}12`, borderColor: `${stayColor}28` }]}>
            <Text style={[lc.tagText, { color: `${stayColor}bb` }]}>{c}</Text>
          </View>
        ))}
      </View>
      {entry.lat ? (
        <TouchableOpacity onPress={() => openMaps(`${entry.name}, Jamestown NY`)} activeOpacity={0.7} style={lc.mapBtn}>
          <Ionicons name="navigate-outline" size={11} color="rgba(255,255,255,0.4)" />
          <Text style={lc.mapText}>Map it</Text>
        </TouchableOpacity>
      ) : null}
    </ListCard>
  );
}

function ParkListCard({ park }: { park: ParkEntry }) {
  const { theme } = useTheme();
  const rgb = PARK_COLOR[park.id];
  const color = `rgb(${rgb})`;

  return (
    <ListCard name={park.name} address={park.address} color={color} visited={park.visited}>
      <Text style={[lc.desc, { color: `rgba(${rgb},0.6)` }]}>"{park.quote}"</Text>
      <View style={lc.tagsRow}>
        {park.features.map(f => (
          <View key={f} style={[lc.tag, { backgroundColor: `rgba(${rgb},0.1)`, borderColor: `rgba(${rgb},0.2)` }]}>
            <Text style={[lc.tagText, { color: `rgba(${rgb},0.8)` }]}>{f}</Text>
          </View>
        ))}
      </View>
      {park.hasHistory && park.historyNote ? (
        <Text style={[lc.histNote, { color: `rgba(${rgb},0.4)` }]}>{park.historyNote}</Text>
      ) : null}
      {park.hasDonate ? (
        <TouchableOpacity
          onPress={() => openLink('https://www.ywcajamestown.com/statuefund')}
          style={[lc.donateBtn, { backgroundColor: `rgba(${rgb},0.07)`, borderColor: `rgba(${rgb},0.18)` }]}
          activeOpacity={0.75}
        >
          <Ionicons name="heart-outline" size={12} color={theme.acc} />
          <Text style={[lc.donateBtnText, { color: theme.acc }]}>Support the Lucille Ball Statue Fund →</Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity onPress={() => openMaps(`${park.name}, ${park.address}`)} activeOpacity={0.7} style={lc.mapBtn}>
        <Ionicons name="navigate-outline" size={11} color="rgba(255,255,255,0.4)" />
        <Text style={lc.mapText}>Map it</Text>
      </TouchableOpacity>
    </ListCard>
  );
}

const lc = StyleSheet.create({
  desc:       { fontFamily: 'Outfit', fontSize: 11, lineHeight: 16, fontStyle: 'italic' },
  hours:      { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  links:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link:       { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700' },
  mapBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapText:    { fontFamily: 'Outfit', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '700' },
  tagsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:        { borderWidth: 1, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  tagText:    { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  histNote:   { fontFamily: 'Outfit', fontSize: 10, lineHeight: 15 },
  donateBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 10 },
  donateBtnText: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', flex: 1 },
});

// ─── Screen ────────────────────────────────────────────────────────
export default function VisitScreen() {
  const { theme } = useTheme();
  const [active, setActive] = useState<FilterCat>('all');
  const [search, setSearch] = useState('');
  const [openNow, setOpenNow] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const q = search.trim().toLowerCase();

  // Editor's Picks — filtered by category and (when toggled) "open now"
  const editorPicks = useMemo(() =>
    LOCAL_FAVORITES.filter(f => {
      if (active !== 'all' && f.category !== active) return false;
      if (openNow && isOpenNow(f.hours) === false) return false;
      return true;
    }),
    [active, openNow]
  );

  // Places — filtered by category + search + open now, exclude Editor's Picks IDs.
  // Stay places get pulled out into their own section, so exclude them here.
  const browsePlaces = useMemo(() => {
    return PLACES
      .filter(p => !EDITOR_PICKS_IDS.has(p.id))
      .map(p => ({ ...p, _cat: mapCategory(p) }))
      .filter(p => p._cat !== 'stay')
      .filter(p => {
        if (active !== 'all' && p._cat !== active) return false;
        if (openNow && isOpenNow(p.hours) === false) return false;
        if (q) {
          return (
            p.name.toLowerCase().includes(q) ||
            p.address?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (active === 'all' && !q) return a.name.localeCompare(b.name);
        const featDiff = (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        return featDiff !== 0 ? featDiff : a.name.localeCompare(b.name);
      });
  }, [active, q, openNow]);

  // Stay-category places from PLACES (e.g. Chautauqua Harbor Hotel) — only for stay/all
  const showStay = active === 'all' || active === 'stay';
  const stayPlaces = useMemo(() => {
    if (!showStay) return [];
    return PLACES
      .filter(p => !EDITOR_PICKS_IDS.has(p.id))
      .map(p => ({ ...p, _cat: mapCategory(p) }))
      .filter(p => p._cat === 'stay')
      .filter(p => !q
        || p.name.toLowerCase().includes(q)
        || p.address?.toLowerCase().includes(q)
        || p.description?.toLowerCase().includes(q))
      .sort((a, b) => {
        const featDiff = (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        return featDiff !== 0 ? featDiff : a.name.localeCompare(b.name);
      });
  }, [showStay, q]);

  // Chain hotels (DoubleTree, La Quinta, etc.) — only for stay/all
  const filteredAlso = useMemo(() =>
    !showStay ? [] : q
      ? ALSO_IN_JAMESTOWN.filter(e => e.name.toLowerCase().includes(q))
      : ALSO_IN_JAMESTOWN,
    [showStay, q]
  );

  // Parks — only for do/all
  const showParks = active === 'all' || active === 'explore';
  const filteredParks = useMemo(() =>
    !showParks ? [] : q
      ? PARKS.filter(p => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q))
      : PARKS,
    [showParks, q]
  );

  const hasBrowseContent = browsePlaces.length > 0 || stayPlaces.length > 0 || filteredAlso.length > 0 || filteredParks.length > 0;

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Visit <Text style={{ color: theme.acc }}>Jamestown</Text></Text>
            <Text style={[styles.subtitle, { color: `rgba(${theme.accRGB},0.55)` }]}>Places to eat, drink, stay & explore</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Editor's Picks ──────────────────────────────── */}
        {editorPicks.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.acc }]}>Editor's Picks</Text>
            {editorPicks.map(fav => <EditorPickCard key={fav.name} fav={fav} />)}
          </>
        )}

        {/* ── Search bar + Open Now toggle ────────────────── */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <View style={[styles.searchWrap, { borderColor: dark.border, flex: 1 }]}>
            <Ionicons name="search-outline" size={15} color="rgba(255,255,255,0.3)" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search places…"
              placeholderTextColor="rgba(255,255,255,0.25)"
              style={styles.searchInput}
              clearButtonMode="while-editing"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={15} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setOpenNow(v => !v)}
            activeOpacity={0.75}
            style={[styles.openNowBtn, openNow && { backgroundColor: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.4)' }]}
          >
            <Ionicons name="time-outline" size={14} color={openNow ? '#34d399' : 'rgba(255,255,255,0.35)'} />
            <Text style={[styles.openNowText, openNow && { color: '#34d399' }]}>Open</Text>
          </TouchableOpacity>
        </View>

        {/* ── Filter chips ────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={{ marginTop: 8, marginBottom: 16 }}
        >
          {FILTERS.map(f => {
            const isActive = active === f.key;
            const catColor = f.key !== 'all' ? CAT_COLOR[f.key] : theme.acc;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setActive(f.key)}
                activeOpacity={0.7}
                style={[styles.chip, isActive && {
                  backgroundColor: `${catColor}18`,
                  borderColor: `${catColor}44`,
                }]}
              >
                <Text style={[styles.chipText, isActive && { color: catColor }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Browse ──────────────────────────────────────── */}
        {hasBrowseContent && (
          <>
            <Text style={[styles.sectionLabel, { color: `rgba(${theme.accRGB},0.45)` }]}>Browse</Text>

            {browsePlaces.map(p => (
              <PlaceListCard
                key={p.id}
                place={p}
                color={CAT_COLOR[p._cat] ?? theme.acc}
              />
            ))}

            {(stayPlaces.length > 0 || filteredAlso.length > 0) && (
              <>
                {browsePlaces.length > 0 && (
                  <Text style={[styles.groupLabel, { color: 'rgba(255,255,255,0.2)' }]}>Where to stay</Text>
                )}
                {stayPlaces.map(p => (
                  <PlaceListCard
                    key={p.id}
                    place={p}
                    color={CAT_COLOR.stay ?? theme.acc}
                  />
                ))}
                {filteredAlso.map(e => <AlsoListCard key={e.name} entry={e} />)}
              </>
            )}

            {filteredParks.length > 0 && (
              <>
                <Text style={[styles.groupLabel, { color: 'rgba(255,255,255,0.2)' }]}>Parks & history</Text>
                {filteredParks.map(p => <ParkListCard key={p.id} park={p} />)}
              </>
            )}
          </>
        )}

        {/* ── Cannabis / Shop rules ────────────────────────── */}
        {active === 'cannabis' && (
          <View style={[styles.cannabisBlock, { borderColor: `rgba(52,211,153,0.15)` }]}>
            <View style={[styles.cannabisStripe, { backgroundColor: 'rgba(52,211,153,0.7)' }]} />
            <View style={styles.cannabisInner}>
              <Text style={[styles.cannabisHeading, { color: 'rgba(52,211,153,0.9)' }]}>
                New York State · Adults 21+
              </Text>
              <View style={styles.cannabisCols}>
                <View style={styles.cannabisCol}>
                  <Text style={[styles.cannabisColLabel, { color: 'rgba(52,211,153,0.7)' }]}>You can</Text>
                  {CANNABIS_RULES.can.map((item, i) => (
                    <View key={i} style={styles.cannabisRow}>
                      <Text style={[styles.cannabisBullet, { color: 'rgba(52,211,153,0.5)' }]}>·</Text>
                      <Text style={styles.cannabisItem}>{item}</Text>
                    </View>
                  ))}
                </View>
                <View style={[styles.cannabisDividerV, { backgroundColor: 'rgba(52,211,153,0.1)' }]} />
                <View style={styles.cannabisCol}>
                  <Text style={[styles.cannabisColLabel, { color: 'rgba(255,100,100,0.7)' }]}>You can't</Text>
                  {CANNABIS_RULES.cannot.map((item, i) => (
                    <View key={i} style={styles.cannabisRow}>
                      <Text style={[styles.cannabisBullet, { color: 'rgba(255,100,100,0.5)' }]}>·</Text>
                      <Text style={styles.cannabisItem}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Text style={styles.cannabisFootnote}>{CANNABIS_RULES.note}</Text>
            </View>
          </View>
        )}

        {/* ── No results ──────────────────────────────────── */}
        {!hasBrowseContent && editorPicks.length === 0 && (
          <Text style={styles.emptyText}>No results for "{search}"</Text>
        )}

        {/* ── Footer CTA ──────────────────────────────────── */}
        <FeatureYourBusiness onContact={() => setFeedbackOpen(true)} />

      </ScrollView>

      {feedbackOpen && (
        <View style={styles.fullOverlay}>
          <FeedbackScreen onClose={() => setFeedbackOpen(false)} initialType="business" />
        </View>
      )}
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  fullOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 600, flex: 1 },
  safeArea: { paddingHorizontal: 20 },

  header:   { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 40, paddingBottom: 8 },
  title:    { fontFamily: 'Syne', fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  subtitle: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: dark.surface, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
  },
  openNowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: dark.surface, borderWidth: 1, borderColor: dark.border,
    borderRadius: 12, paddingHorizontal: 12, marginBottom: 12,
  },
  openNowText: {
    fontFamily: 'Outfit', fontSize: 12, fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
  },
  searchInput: {
    flex: 1, fontFamily: 'Outfit', fontSize: 14, color: '#fff',
  },

  chipRow: { flexDirection: 'row', gap: 8 },
  chip:    {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    backgroundColor: dark.surface, borderColor: dark.border,
  },
  chipText: { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },

  content: { paddingHorizontal: 16, paddingBottom: 48, paddingTop: 4 },

  sectionLabel: {
    fontFamily: 'Outfit', fontSize: 10, fontWeight: '700',
    letterSpacing: 1.2, textTransform: 'uppercase',
    marginBottom: 10, marginTop: 4,
  },
  groupLabel: {
    fontFamily: 'Outfit', fontSize: 10, fontWeight: '700',
    letterSpacing: 1.2, textTransform: 'uppercase',
    marginBottom: 8, marginTop: 12,
  },

  cannabisBlock: { borderTopWidth: 1, borderBottomWidth: 1, flexDirection: 'row', marginVertical: 8 },
  cannabisStripe: { width: 3, flexShrink: 0 },
  cannabisInner: { flex: 1, padding: 14, gap: 10 },
  cannabisHeading: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  cannabisCols: { flexDirection: 'row', gap: 12 },
  cannabisCol: { flex: 1, gap: 6 },
  cannabisColLabel: { fontFamily: 'Outfit', fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  cannabisRow: { flexDirection: 'row', gap: 5 },
  cannabisBullet: { fontFamily: 'Outfit', fontSize: 11, lineHeight: 16, flexShrink: 0 },
  cannabisItem: { fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 16, flex: 1 },
  cannabisDividerV: { width: 1, alignSelf: 'stretch' },
  cannabisFootnote: { fontFamily: 'Outfit', fontSize: 10, color: 'rgba(255,255,255,0.25)', lineHeight: 15 },

  emptyText: { fontFamily: 'Outfit', fontSize: 14, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 32 },

  ctaCard: { borderWidth: 1, borderRadius: 14, padding: 16, marginTop: 16 },
  ctaRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ctaTitle: { fontFamily: 'Syne', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  ctaSub:  { fontFamily: 'Outfit', fontSize: 11 },
});
