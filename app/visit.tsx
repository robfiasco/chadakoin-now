import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedBackground } from '../components/ThemedBackground';
import { useTheme } from '../lib/ThemeContext';
import { PLACES, Place } from '../data/places';
import { openLink } from '../lib/openLink';

function openMaps(query: string) {
  openLink(`https://maps.google.com/?q=${encodeURIComponent(query)}`);
}

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

// Map visit category to one of the three theme accents so panels stay on-palette
function catAccentRGB(cat: FilterCat, accRGB: string, acc2RGB: string, acc3RGB: string): string {
  if (cat === 'eat')  return acc2RGB;
  if (cat === 'stay') return acc3RGB;
  if (cat === 'do')   return accRGB;
  if (cat === 'see')  return acc3RGB;
  return accRGB;
}

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
  lat?: number;
  lng?: number;
  image?: string;  // web-accessible path e.g. '/photo.jpg'
  imageAnchor?: 'top' | 'center';  // default center; 'top' shows upper portion of image
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
    lat: 42.09711, lng: -79.24081,
    image: '/Brazil-%20Lab.jpg',
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
    lat: 42.11282, lng: -79.21690,
    image: '/honest%20johns.jpg',
    imageAnchor: 'top',
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
    lat: 42.09467, lng: -79.24365,
    image: '/comedy_center.jpg',
  },
];

// ─── Also in Jamestown ───────────────────────────────────────────
interface AlsoEntry {
  name: string;
  category: FilterCat;
  detail: string;
  note: string;
  caveats: string[];
  lat?: number;
  lng?: number;
}

const ALSO_IN_JAMESTOWN: AlsoEntry[] = [
  {
    name: 'DoubleTree by Hilton',
    category: 'stay',
    detail: 'Stay · Downtown · Limited parking',
    note: "The old Holiday Inn — now a DoubleTree. Pearl City Hops bar on-site if you need a drink without going far.",
    caveats: ['Chain', 'Limited parking'],
    lat: 42.09722, lng: -79.24344,
  },
  {
    name: 'La Quinta Inn & Suites',
    category: 'stay',
    detail: 'Stay · Near downtown · Limited parking',
    note: "Solid no-frills option. Pet friendly but no real green space nearby for dogs.",
    caveats: ['Chain', 'Limited parking', 'Pet friendly'],
    lat: 42.09605, lng: -79.24421,
  },
  {
    name: 'Holiday Inn Express & Suites',
    category: 'stay',
    detail: 'Stay · Off I-86 · Free parking',
    note: "Not walkable to downtown but right off the interstate — easy in and out if you're passing through.",
    caveats: ['Chain', 'Free parking', 'Pet friendly'],
    lat: 42.11996, lng: -79.24420,
  },
  {
    name: 'Chautauqua Harbor Hotel',
    category: 'stay',
    detail: 'Stay · Celoron · 5 min drive from downtown',
    note: "Nicest hotel in the area. Lakeside views and marina on-site. Not walkable to downtown — you'll need a car.",
    caveats: ['Not walkable', 'Celoron'],
    lat: 42.11021, lng: -79.28518,
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

// ─── Parks & History ─────────────────────────────────────────────
type ParkId = 'dow' | 'baker' | 'mccrea' | 'allen' | 'bergman' | 'jackson';

// Which theme accent each park draws from, and how strong the gradient saturation is
const PARK_ACCENT: Record<ParkId, { key: 'acc' | 'acc2' | 'acc3'; strength: number }> = {
  dow:     { key: 'acc',  strength: 0.18 },
  baker:   { key: 'acc2', strength: 0.20 },
  mccrea:  { key: 'acc3', strength: 0.16 },
  allen:   { key: 'acc2', strength: 0.14 },
  bergman: { key: 'acc',  strength: 0.12 },
  jackson: { key: 'acc3', strength: 0.20 },
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
    quote: "My dad tried to teach me to ride a bike here. It didn't go well. Named after Colonel Henry Baker, a War of 1812 veteran who donated this land in 1845 on one condition — that it always remain a public square. There's also a historical marker noting that this site was once a burial ground. Make of that what you will.",
    lat: 42.09679, lng: -79.24704,
  },
  {
    id: 'mccrea',
    name: 'McCrea Point Park',
    address: 'Chadakoin River, Jamestown',
    features: ['Boat Launch', 'Fishing', 'Riverwalk'],
    visited: true,
    hasHistory: false,
    quote: "This was right down the street from where I grew up. In the 80s and 90s it was basically just the boat landing — you went down to skip rocks or, if you were unlucky, got talked into getting into a small boat at 6am to go fishing. It's better now. The Riverwalk connects through here and the area has more going on than it used to. But honestly it's still underdeveloped. The industrial history along this stretch of the Chadakoin is deep — there's a real story here that hasn't been fully told yet. The bones are there for something special.",
    lat: 42.10136, lng: -79.25461,
  },
  {
    id: 'allen',
    name: 'Allen Park',
    address: 'W. Virginia Blvd, Jamestown',
    features: ['Strider Field', 'Bandshell', 'Splash Pad', 'Trails'],
    visited: true,
    hasHistory: false,
    quote: "Growing up on the other side of town, Allen Park always felt like a trek. Strider Field is here — I caught a few JHS football games there as a kid. It's a 35-acre park with walking trails through wooded areas, a splash pad in summer, soccer fields, and the Goranson Bandshell where the Jamestown Municipal Band plays on Wednesday nights. Honestly, I don't get up this way enough. Neither do most people who don't live nearby.",
    lat: 42.08381, lng: -79.22231,
  },
  {
    id: 'bergman',
    name: 'Bergman Park',
    address: '487 Baker St Ext, Jamestown',
    features: ['Disc Golf', 'Baseball', 'Basketball', 'Events'],
    visited: true,
    hasHistory: false,
    quote: "If you grew up in Jamestown, you've probably been to something here. Picnics, reunions, holiday events — Bergman is where a lot of that happens. The Labor Day celebration is the big one, and it's worth going to. That said, as a kid it always meant summer was ending and school was starting, so the feelings are complicated. The park also has a free 18-hole disc golf course that opened in 2022, baseball fields, basketball, and walking paths. The World Series of Cars Show is held here too if that's your thing.",
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
    quote: "I'll be honest — I grew up in Jamestown and had never heard of this park until recently. It was called Chadakoin Park for decades before being renamed in 2019 to honor three community figures who gave a lot to this city: Isabelle Jackson, a JCC faculty member and YWCA director who spent 30 years serving Jamestown, and Vivian and Lula Taylor — Vivian served 23 years on City Council and was a World War II veteran, and Lula was the first African American woman county legislator in New York State. At 152 acres it's one of the largest parks in the city. I haven't been. It's on my list.",
    lat: 42.10578, lng: -79.24903,
  },
];

function PlacePanel({ place, cat }: { place: Place & { _cat: FilterCat }; cat: FilterCat }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(80)).current;
  const isVisited = (place as any).visited === true;
  const rgb = catAccentRGB(cat, theme.accRGB, theme.acc2RGB, theme.acc3RGB);

  function toggle() {
    Animated.timing(anim, { toValue: expanded ? 80 : 120, duration: 220, useNativeDriver: false }).start();
    setExpanded(e => !e);
  }

  return (
    <View style={styles.placePanel}>
      <TouchableOpacity activeOpacity={0.88} onPress={toggle}>
        <Animated.View style={[styles.placePanelGrad, { height: anim }]}>
          <LinearGradient
            colors={[`rgba(${rgb},0)`, `rgba(${rgb},0.18)`, `rgba(${rgb},0.1)`, `rgba(${rgb},0.02)`] as any}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.parkBadgeRow}>
            {isVisited && (
              <View style={[styles.parkVisitedBadge, { backgroundColor: `rgba(${theme.accRGB},0.08)`, borderColor: `rgba(${theme.accRGB},0.15)` }]}>
                <View style={[styles.parkVisitedDot, { backgroundColor: theme.acc }]} />
                <Text style={[styles.parkVisitedText, { color: `rgba(${theme.accRGB},0.7)` }]}>Visited</Text>
              </View>
            )}
          </View>
          <View style={styles.parkNameBlock}>
            <Text style={styles.parkName}>{place.name}</Text>
            {place.address ? <Text style={[styles.parkAddress, { color: `rgba(${rgb},0.45)` }]}>{place.address}</Text> : null}
          </View>
        </Animated.View>
        <View style={[styles.placeTagsRow, { backgroundColor: `rgba(${rgb},0.08)` }]}>
          <Text style={[styles.placeMeta, { flex: 1, color: `rgba(${rgb},0.55)` }]}>
            {categoryLabel(cat)}{place.hours ? ` · ${place.hours}` : ''}
          </Text>
          {place.lat ? (
            <TouchableOpacity onPress={e => { e.stopPropagation(); openMaps(`${place.name}, ${place.address}`); }} activeOpacity={0.6} style={styles.parkNavBtn}>
              <Ionicons name="navigate-outline" size={12} color={`rgba(${rgb},0.55)`} />
            </TouchableOpacity>
          ) : null}
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={13} color={`rgba(${rgb},0.45)`} style={styles.parkChevron} />
        </View>
      </TouchableOpacity>
      {expanded && (
        <View style={[styles.placeExpanded, { backgroundColor: `rgba(${rgb},0.03)`, borderTopColor: `rgba(${rgb},0.08)` }]}>
          {place.description ? <Text style={[styles.placeDesc, { color: `rgba(${rgb},0.6)` }]}>{place.description}</Text> : null}
          {place.website ? (
            <TouchableOpacity onPress={() => openLink(place.website)} activeOpacity={0.7}>
              <Text style={[styles.placeLink, { color: theme.acc }]}>Visit website →</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

function FavPanel({ fav }: { fav: LocalFav }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(80)).current;

  function toggle() {
    Animated.timing(anim, { toValue: expanded ? 80 : 120, duration: 220, useNativeDriver: false }).start();
    setExpanded(e => !e);
  }

  return (
    <View style={styles.placePanel}>
      <TouchableOpacity activeOpacity={0.88} onPress={toggle}>
        <Animated.View style={[styles.placePanelGrad, { height: anim }]}>
          {fav.image ? (
            <Image source={{ uri: fav.image }} style={[styles.favImage, fav.imageAnchor === 'top' && styles.favImageTop]} />
          ) : null}
          <LinearGradient
            colors={fav.image
              ? [theme.bg, theme.bg, `rgba(${fav.rgb},0.4)`, 'transparent'] as any
              : [`rgba(${fav.rgb},0)`, `rgba(${fav.rgb},0.22)`, `rgba(${fav.rgb},0.12)`, `rgba(${fav.rgb},0.03)`] as any
            }
            start={fav.image ? { x: 0, y: 0.5 } : { x: 0, y: 0 }}
            end={fav.image ? { x: 1, y: 0.5 } : { x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.parkBadgeRow, { right: undefined, left: 12 }]}>
            {fav.visited && (
              <View style={[styles.parkVisitedBadge, { backgroundColor: `rgba(${theme.accRGB},0.08)`, borderColor: `rgba(${theme.accRGB},0.15)` }]}>
                <View style={[styles.parkVisitedDot, { backgroundColor: theme.acc }]} />
                <Text style={[styles.parkVisitedText, { color: `rgba(${theme.accRGB},0.7)` }]}>Visited</Text>
              </View>
            )}
          </View>
          <View style={styles.parkNameBlock}>
            <Text style={styles.parkName}>{fav.name}</Text>
          </View>
        </Animated.View>
        <View style={[styles.placeTagsRow, { backgroundColor: `rgba(${fav.rgb},0.08)` }]}>
          <Text style={[styles.placeMeta, { flex: 1, color: `rgba(${fav.rgb},0.5)` }]}>{fav.detail}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={13} color={`rgba(${fav.rgb},0.45)`} style={styles.parkChevron} />
        </View>
      </TouchableOpacity>
      {expanded && (
        <View style={[styles.placeExpanded, { backgroundColor: `rgba(${fav.rgb},0.03)`, borderTopColor: `rgba(${fav.rgb},0.08)` }]}>
          <Text style={[styles.placeDesc, { color: `rgba(${fav.rgb},0.6)`, fontStyle: 'italic' }]}>"{fav.quote}"</Text>
          <View style={styles.favLinksRow}>
            {fav.website ? (
              <TouchableOpacity onPress={() => openLink(fav.website)} activeOpacity={0.7}>
                <Text style={[styles.placeLink, { color: theme.acc }]}>Visit website</Text>
              </TouchableOpacity>
            ) : null}
            {fav.lat ? (
              <TouchableOpacity onPress={() => openMaps(`${fav.name}, Jamestown NY`)} activeOpacity={0.7} style={styles.favMapBtn}>
                <Ionicons name="navigate-outline" size={11} color={`rgba(${fav.rgb},0.7)`} />
                <Text style={[styles.favMapLabel, { color: `rgba(${fav.rgb},0.7)` }]}>Map it</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}

function AlsoPanel({ entry }: { entry: AlsoEntry }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(80)).current;
  const rgb = theme.acc3RGB;

  function toggle() {
    Animated.timing(anim, { toValue: expanded ? 80 : 120, duration: 220, useNativeDriver: false }).start();
    setExpanded(e => !e);
  }

  return (
    <View style={styles.placePanel}>
      <TouchableOpacity activeOpacity={0.88} onPress={toggle}>
        <Animated.View style={[styles.placePanelGrad, { height: anim }]}>
          <LinearGradient
            colors={[`rgba(${rgb},0)`, `rgba(${rgb},0.13)`, `rgba(${rgb},0.07)`, `rgba(${rgb},0.01)`] as any}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.parkNameBlock}>
            <Text style={styles.parkName}>{entry.name}</Text>
            <Text style={[styles.parkAddress, { color: `rgba(${rgb},0.45)` }]}>{entry.detail}</Text>
          </View>
        </Animated.View>
        <View style={[styles.placeTagsRow, { backgroundColor: `rgba(${rgb},0.07)` }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.parkTagsInner}>
            {entry.caveats.map(c => (
              <Text key={c} style={[styles.parkTag, { color: `rgba(${rgb},0.6)`, backgroundColor: `rgba(${rgb},0.08)` }]}>{c}</Text>
            ))}
          </ScrollView>
          {entry.lat ? (
            <TouchableOpacity onPress={e => { e.stopPropagation(); openMaps(`${entry.name}, Jamestown NY`); }} activeOpacity={0.6} style={styles.parkNavBtn}>
              <Ionicons name="navigate-outline" size={12} color={`rgba(${rgb},0.55)`} />
            </TouchableOpacity>
          ) : null}
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={13} color={`rgba(${rgb},0.45)`} style={styles.parkChevron} />
        </View>
      </TouchableOpacity>
      {expanded && (
        <View style={[styles.placeExpanded, { backgroundColor: `rgba(${rgb},0.03)`, borderTopColor: `rgba(${rgb},0.08)` }]}>
          <Text style={[styles.placeDesc, { color: `rgba(${rgb},0.55)`, fontStyle: 'italic' }]}>"{entry.note}"</Text>
        </View>
      )}
    </View>
  );
}

function ParkCard({ park }: { park: ParkEntry }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(80)).current;

  const pa = PARK_ACCENT[park.id];
  const rgb = pa.key === 'acc' ? theme.accRGB : pa.key === 'acc2' ? theme.acc2RGB : theme.acc3RGB;
  const s = pa.strength;
  const gradient = [
    `rgba(${rgb},0)`,
    `rgba(${rgb},${s})`,
    `rgba(${rgb},${+(s * 0.6).toFixed(2)})`,
    `rgba(${rgb},${+(s * 0.15).toFixed(2)})`,
  ];
  const a = theme.accRGB;

  function toggle() {
    Animated.timing(anim, {
      toValue: expanded ? 80 : 120,
      duration: 220,
      useNativeDriver: false,
    }).start();
    setExpanded(e => !e);
  }

  return (
    <View style={styles.parkCard}>
      <TouchableOpacity activeOpacity={0.88} onPress={toggle}>
        <Animated.View style={[styles.parkPanel, { height: anim }]}>
          <LinearGradient
            colors={gradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.parkBadgeRow}>
            {park.hasHistory && (
              <View style={[styles.parkHistoryBadge, { backgroundColor: `rgba(${a},0.1)`, borderColor: `rgba(${a},0.2)` }]}>
                <Ionicons name="time-outline" size={9} color={`rgba(${a},0.8)`} />
                <Text style={[styles.parkHistoryText, { color: `rgba(${a},0.8)` }]}>History</Text>
              </View>
            )}
            {park.visited && (
              <View style={[styles.parkVisitedBadge, { backgroundColor: `rgba(${a},0.08)`, borderColor: `rgba(${a},0.15)` }]}>
                <View style={[styles.parkVisitedDot, { backgroundColor: theme.acc }]} />
                <Text style={[styles.parkVisitedText, { color: `rgba(${a},0.7)` }]}>Visited</Text>
              </View>
            )}
          </View>
          <View style={styles.parkNameBlock}>
            <Text style={styles.parkName}>{park.name}</Text>
            <Text style={[styles.parkAddress, { color: `rgba(${a},0.35)` }]}>{park.address}</Text>
          </View>
        </Animated.View>

        <View style={[styles.parkTagsRow, { backgroundColor: `rgba(${rgb},0.1)` }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.parkTagsInner}>
            {park.features.map(f => (
              <Text key={f} style={[styles.parkTag, { color: `rgba(${rgb},0.7)`, backgroundColor: `rgba(${rgb},0.08)` }]}>{f}</Text>
            ))}
          </ScrollView>
          <TouchableOpacity
            onPress={e => { e.stopPropagation(); openMaps(`${park.name}, ${park.address}`); }}
            activeOpacity={0.6}
            style={styles.parkNavBtn}
          >
            <Ionicons name="navigate-outline" size={12} color={`rgba(${rgb},0.55)`} />
          </TouchableOpacity>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={13}
            color={`rgba(${rgb},0.45)`}
            style={styles.parkChevron}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.parkExpandedBlock, { backgroundColor: `rgba(${a},0.03)`, borderTopColor: `rgba(${a},0.08)` }]}>
          <Text style={[styles.parkQuote, { color: `rgba(${a},0.55)` }]}>"{park.quote}"</Text>
          {park.hasHistory && park.historyNote ? (
            <Text style={[styles.parkHistoryNote, { color: `rgba(${a},0.35)` }]}>{park.historyNote}</Text>
          ) : null}
          {park.hasDonate ? (
            <TouchableOpacity
              onPress={() => openLink('https://www.ywcajamestown.com/statuefund')}
              style={[styles.parkDonate, { backgroundColor: `rgba(${a},0.07)`, borderColor: `rgba(${a},0.18)` }]}
              activeOpacity={0.75}
            >
              <Ionicons name="heart-outline" size={12} color={theme.acc} />
              <Text style={[styles.parkDonateText, { color: theme.acc }]}>Support the Lucille Ball Statue Fund →</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

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
            {filteredFavorites.map(fav => <FavPanel key={fav.name} fav={fav} />)}
          </>
        )}

        {filteredFavorites.length > 0 && filteredApproved.length > 0 && (
          <View style={styles.divider} />
        )}

        {/* ── Chadakoin Approved ──────────────────────── */}
        {filteredApproved.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.acc }]}>Chadakoin Approved</Text>
            {filteredApproved.map(place => <PlacePanel key={place.id} place={place} cat={place._cat} />)}
          </>
        )}

        {filteredAlso.length > 0 && (filteredFavorites.length > 0 || filteredApproved.length > 0) && (
          <View style={styles.divider} />
        )}

        {/* ── Also in Jamestown ───────────────────────── */}
        {filteredAlso.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: `rgba(${theme.accRGB},0.4)` }]}>Also in Jamestown</Text>
            {filteredAlso.map(entry => <AlsoPanel key={entry.name} entry={entry} />)}
          </>
        )}

        {/* ── Parks & History ──────────────────────────── */}
        {active === 'all' && (
          <>
            <View style={styles.divider} />
            <Text style={[styles.sectionLabel, { color: `rgba(${theme.accRGB},0.4)` }]}>Parks & History</Text>
            {PARKS.map(park => <ParkCard key={park.id} park={park} />)}
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

  favImage:    { position: 'absolute', right: 0, top: 0, bottom: 0, width: '55%', resizeMode: 'cover', opacity: 0.55 },
  favLinksRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  favMapBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 4 },
  favMapLabel: { fontSize: 11, fontFamily: 'Outfit', fontWeight: '700', letterSpacing: 0.4 },
  favImageTop: { bottom: undefined, height: 160 },  // smaller height = less zoom, more of photo visible

  // ── Shared panel (Local Favorites, Chadakoin Approved, Also in Jamestown) ──
  placePanel:     { borderRadius: 16, overflow: 'hidden', marginBottom: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  placePanelGrad: { overflow: 'hidden', justifyContent: 'flex-end' },
  placeTagsRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingLeft: 14, paddingRight: 8 },
  placeMeta:      { fontSize: 10, fontFamily: 'Syne', fontWeight: '600', letterSpacing: 0.2 },
  placeExpanded:  { paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, gap: 10 },
  placeDesc:      { fontSize: 11, fontFamily: 'Outfit', lineHeight: 17 },
  placeLink:      { fontSize: 11, fontFamily: 'Outfit', fontWeight: '700' },

  // ── Parks & History ──────────────────────────────
  parkCard:   { marginHorizontal: -20, marginBottom: 2, overflow: 'hidden' },
  parkPanel:  { overflow: 'hidden', justifyContent: 'flex-end' },
  parkBadgeRow: { position: 'absolute', top: 10, right: 12, flexDirection: 'row', gap: 5 },
  parkHistoryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 5, paddingVertical: 2, paddingHorizontal: 7,
  },
  parkHistoryText: { fontSize: 8, fontFamily: 'Outfit', fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.6, textTransform: 'uppercase' },
  parkVisitedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 5, paddingVertical: 2, paddingHorizontal: 7,
  },
  parkVisitedDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  parkVisitedText: { fontSize: 8, fontFamily: 'Outfit', fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.6, textTransform: 'uppercase' },
  parkNameBlock:   { paddingHorizontal: 16, paddingBottom: 12 },
  parkName:        { fontSize: 15, fontFamily: 'Syne', fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  parkAddress:     { fontSize: 10, fontFamily: 'Outfit', color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  parkTagsRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingLeft: 14, paddingRight: 8 },
  parkTagsInner:   { flexDirection: 'row', gap: 6, alignItems: 'center' },
  parkTag:         { fontSize: 9, fontFamily: 'Outfit', fontWeight: '700', color: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, paddingVertical: 2, paddingHorizontal: 7, overflow: 'hidden', letterSpacing: 0.4 },
  parkNavBtn:  { paddingVertical: 8, paddingHorizontal: 12 },
  parkChevron: { paddingVertical: 8, paddingLeft: 4, paddingRight: 10 },
  parkExpandedBlock: { paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, gap: 10 },
  parkQuote:       { fontSize: 11, fontFamily: 'Outfit', color: 'rgba(255,255,255,0.45)', lineHeight: 17, fontStyle: 'italic' },
  parkHistoryNote: { fontSize: 11, fontFamily: 'Outfit', color: 'rgba(255,255,255,0.3)', lineHeight: 17 },
  parkDonate:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(100,120,255,0.08)', borderWidth: 1, borderColor: 'rgba(100,120,255,0.18)', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
  parkDonateText:  { fontSize: 11, fontFamily: 'Outfit', fontWeight: '700', color: 'rgba(140,160,255,0.85)' },
});
