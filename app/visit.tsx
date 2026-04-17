import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, TextInput, Linking,
} from 'react-native';
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

type FilterCat = 'all' | 'eat' | 'stay' | 'do' | 'see' | 'cannabis';

const FILTERS: { key: FilterCat; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'eat',      label: 'Eat'      },
  { key: 'stay',     label: 'Stay'     },
  { key: 'do',       label: 'Do'       },
  { key: 'see',      label: 'See'      },
  { key: 'cannabis', label: '🌿 21+'   },
];

// Per-category accent colors — consistent across all themes
const CAT_COLOR: Record<string, string> = {
  eat:      '#fbbf24',  // amber
  stay:     '#60a5fa',  // blue
  do:       '#2dd4bf',  // teal
  see:      '#a78bfa',  // purple
  cannabis: '#34d399',  // green
};

function mapCategory(place: Place): FilterCat {
  const cats = place.categories;
  if (cats.includes('stay'))     return 'stay';
  if (cats.includes('arts'))     return 'see';
  if (cats.includes('activity')) return 'do';
  if (cats.includes('cannabis')) return 'cannabis';
  return 'eat'; // coffee, food, drinks
}

// ─── Local Favorites (Editor's Picks) ────────────────────────────
interface LocalFav {
  name: string;
  category: FilterCat;
  detail: string;
  website?: string;
  rgb: string;
  visited: boolean;
  quote: string;
  lat?: number;
  lng?: number;
  image?: string;
  imageAnchor?: 'top' | 'center';
}

const LOCAL_FAVORITES: LocalFav[] = [
  {
    name: 'Labyrinth Press Co.',
    category: 'eat',
    detail: 'Eat · Drink · Tue–Sat 8am–9pm',
    website: 'https://www.labpressco.com/',
    rgb: '0,212,200',
    visited: true,
    quote: "Don't let the vegan menu scare you off — this is genuinely one of the best restaurants in Jamestown. The Brazil Lounge has a serious cocktail menu, a great local beer selection, and the patio in summer is hard to beat.",
    lat: 42.09711, lng: -79.24081,
    image: '/Brazil-%20Lab.jpg',
  },
  {
    name: "Honest John's Pizzeria",
    category: 'eat',
    detail: 'Eat · Daily 11am–10pm',
    website: 'https://honestjohns.pizza/',
    rgb: '245,166,35',
    visited: true,
    quote: "Jamestown has no shortage of great pizza and wings, and Honest John's holds its own. The subs are solid too if you're in that mood.",
    lat: 42.11282, lng: -79.21690,
    image: '/honest%20johns.jpg',
    imageAnchor: 'top',
  },
  {
    name: 'National Comedy Center',
    category: 'see',
    detail: 'See · Wed–Sun, 10am–5pm',
    website: 'https://comedycenter.org',
    rgb: '155,109,255',
    visited: true,
    quote: "I've been three times and would go back. Comedy is my thing, so take that for what it's worth — but this is genuinely the best museum I've ever been to. If you visit Jamestown and skip it, you made a mistake.",
    lat: 42.09467, lng: -79.24365,
    image: '/comedy_center.jpg',
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
  {
    name: 'Chautauqua Harbor Hotel',
    detail: 'Stay · Celoron · 5 min drive',
    note: "Nicest hotel in the area. Lakeside views and marina on-site. Not walkable to downtown — you'll need a car.",
    caveats: ['Not walkable', 'Celoron'],
    lat: 42.11021, lng: -79.28518,
  },
  {
    name: 'Airbnb & VRBO',
    detail: 'Stay · Various locations',
    note: "Short-term rentals throughout Jamestown and the Chautauqua Lake area. Good option for groups or longer stays.",
    caveats: ['Prices vary'],
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
const EDITOR_PICKS_IDS = new Set(['labyrinth-press', 'comedy-center', 'honest-johns']);

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
            source={{ uri: fav.image }}
            style={[hero.img, fav.imageAnchor === 'top' && hero.imgTop]}
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
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14} color="rgba(255,255,255,0.3)"
          />
        </View>
        <Text style={[hero.detail, { color: `rgba(${fav.rgb},0.6)` }]}>{fav.detail}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={[hero.expanded, { borderTopColor: `rgba(${fav.rgb},0.1)` }]}>
          <Text style={[hero.quote, { color: `rgba(${fav.rgb},0.6)` }]}>"{fav.quote}"</Text>
          <View style={hero.linksRow}>
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
  imgWrap: { height: 130, position: 'relative' },
  img:     { ...StyleSheet.absoluteFillObject, resizeMode: 'cover', opacity: 0.55 },
  imgTop:  { resizeMode: 'cover', top: 0 },
  catPill: { position: 'absolute', top: 10, left: 12, flexDirection: 'row', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  catPillText: { fontFamily: 'Outfit', fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  editorPill: { position: 'absolute', top: 10, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  editorPillText: { fontFamily: 'Outfit', fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  beenThereBadge: { position: 'absolute', bottom: 10, right: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  beenThereDot: { width: 5, height: 5, borderRadius: 3 },
  beenThereText: { fontFamily: 'Outfit', fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  body:    { paddingHorizontal: 14, paddingVertical: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
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
  name, address, color, visited, children,
}: {
  name: string;
  address?: string;
  color: string;
  visited?: boolean;
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
  return (
    <ListCard
      name={place.name}
      address={place.address}
      color={color}
      visited={place.visited}
    >
      {place.description ? (
        <Text style={[lc.desc, { color: `${color}99` }]}>{place.description}</Text>
      ) : null}
      {place.hours ? (
        <Text style={lc.hours}>{place.hours}</Text>
      ) : null}
      <View style={lc.links}>
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
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const q = search.trim().toLowerCase();

  // Editor's Picks — filtered by category
  const editorPicks = useMemo(() =>
    LOCAL_FAVORITES.filter(f => active === 'all' || f.category === active),
    [active]
  );

  // Places — filtered by category + search, exclude Editor's Picks IDs
  const browsePlaces = useMemo(() => {
    return PLACES
      .filter(p => !EDITOR_PICKS_IDS.has(p.id))
      .map(p => ({ ...p, _cat: mapCategory(p) }))
      .filter(p => {
        if (active !== 'all' && p._cat !== active) return false;
        if (q) {
          return (
            p.name.toLowerCase().includes(q) ||
            p.address?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }, [active, q]);

  // Also in Jamestown — only for stay/all
  const showAlso = active === 'all' || active === 'stay';
  const filteredAlso = useMemo(() =>
    !showAlso ? [] : q
      ? ALSO_IN_JAMESTOWN.filter(e => e.name.toLowerCase().includes(q))
      : ALSO_IN_JAMESTOWN,
    [showAlso, q]
  );

  // Parks — only for do/all
  const showParks = active === 'all' || active === 'do';
  const filteredParks = useMemo(() =>
    !showParks ? [] : q
      ? PARKS.filter(p => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q))
      : PARKS,
    [showParks, q]
  );

  const hasBrowseContent = browsePlaces.length > 0 || filteredAlso.length > 0 || filteredParks.length > 0;

  return (
    <ThemedBackground>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Visit Jamestown</Text>
            <Text style={[styles.subtitle, { color: theme.acc }]}>Jamestown, NY</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Search bar ──────────────────────────────────── */}
        <View style={[styles.searchWrap, { borderColor: dark.border }]}>
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

        {/* ── Filter chips ────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={{ marginBottom: 16 }}
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

        {/* ── Editor's Picks ──────────────────────────────── */}
        {editorPicks.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.acc }]}>Editor's Picks</Text>
            {editorPicks.map(fav => <EditorPickCard key={fav.name} fav={fav} />)}
          </>
        )}

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

            {filteredAlso.length > 0 && (
              <>
                {browsePlaces.length > 0 && (
                  <Text style={[styles.groupLabel, { color: 'rgba(255,255,255,0.2)' }]}>Where to stay</Text>
                )}
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

  header:   { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 20, paddingBottom: 8 },
  title:    { fontFamily: 'Syne', fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontFamily: 'Outfit', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: dark.surface, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
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
