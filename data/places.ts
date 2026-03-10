// Jamestown local business directory
// featured: true = highlighted card (paid placement or owner's pick)
// Add your personal favorites here, mark featured: true when a business pays for placement

export type PlaceCategory = 'coffee' | 'food' | 'drinks' | 'activity' | 'arts' | 'stay';

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  emoji: string;
  description: string;
  address: string;
  website?: string;
  hours?: string;
  featured: boolean;
  featuredNote?: string;  // custom tagline shown on featured card
}

export const PLACES: Place[] = [
  // ─── Coffee ───────────────────────────────────────────────────
  {
    id: 'shawbucks',
    name: 'Shawbucks',
    category: 'coffee',
    emoji: '☕',
    description: 'Local coffee shop and bar, home of Trivia Nights.',
    address: 'Downtown Jamestown',
    featured: false,
  },

  // ─── Food ─────────────────────────────────────────────────────
  {
    id: 'pearl-city-hops',
    name: 'Pearl City Hops',
    category: 'drinks',
    emoji: '🍺',
    description: 'Craft brewery named for Jamestown\'s historic nickname.',
    address: 'Jamestown',
    website: 'https://pearlcityhops.com',
    featured: false,
  },

  // ─── Arts & Entertainment ─────────────────────────────────────
  {
    id: 'comedy-center',
    name: 'National Comedy Center',
    category: 'activity',
    emoji: '😂',
    description: 'America\'s official museum of comedy. Interactive, immersive, and one of a kind.',
    address: '203 W 2nd St, Jamestown',
    website: 'https://comedycenter.org',
    hours: 'Wed–Sun 10am–5pm',
    featured: true,
    featuredNote: 'The only museum of its kind in America.',
  },
  {
    id: 'reg-lenna',
    name: 'Reg Lenna Center for the Arts',
    category: 'arts',
    emoji: '🎭',
    description: 'Historic theater in downtown Jamestown. Shows, concerts, films, and community events.',
    address: '116 E 3rd St, Jamestown',
    website: 'https://reglenna.com',
    featured: false,
  },
  {
    id: 'rtpi',
    name: 'Roger Tory Peterson Institute',
    category: 'activity',
    emoji: '🐦',
    description: 'Nature art, bird walks, and galleries honoring Jamestown\'s most famous naturalist.',
    address: '311 Curtis St, Jamestown',
    website: 'https://rtpi.org',
    featured: false,
  },
  {
    id: 'fenton-history',
    name: 'Fenton History Center',
    category: 'activity',
    emoji: '🏛️',
    description: 'Local history, rotating exhibits, and the beautiful Victorian-era Reuben Fenton mansion.',
    address: '67 Washington St, Jamestown',
    website: 'https://fentonhistorycenter.org',
    featured: false,
  },

  // ─── Outdoors ─────────────────────────────────────────────────
  {
    id: 'chautauqua-institution',
    name: 'Chautauqua Institution',
    category: 'activity',
    emoji: '⛵',
    description: 'World-renowned arts, education, and lecture community on the shores of Chautauqua Lake.',
    address: 'Chautauqua, NY (20 min from Jamestown)',
    website: 'https://chq.org',
    featured: false,
  },
  {
    id: 'chautauqua-lake',
    name: 'Chautauqua Lake',
    category: 'activity',
    emoji: '🌊',
    description: 'Glacially-formed lake, one of the highest navigable lakes in the US. Boating, fishing, and lakeside dining.',
    address: 'Chautauqua, NY',
    featured: false,
  },
];

export const PLACE_CATEGORIES: { key: PlaceCategory; label: string; emoji: string }[] = [
  { key: 'coffee',   label: 'Coffee',       emoji: '☕' },
  { key: 'food',     label: 'Food',         emoji: '🍽️' },
  { key: 'drinks',   label: 'Drinks',       emoji: '🍺' },
  { key: 'activity', label: 'Things to Do', emoji: '🎯' },
  { key: 'arts',     label: 'Arts',         emoji: '🎭' },
  { key: 'stay',     label: 'Stay',         emoji: '🏨' },
];

export function getFeaturedPlaces(): Place[] {
  return PLACES.filter(p => p.featured);
}

export function getPlacesByCategory(cat: PlaceCategory): Place[] {
  return PLACES.filter(p => p.category === cat);
}
