// Jamestown local business directory
// featured: true = highlighted card (paid placement or owner's pick)
// Add your personal favorites here, mark featured: true when a business pays for placement

export type PlaceCategory = 'coffee' | 'food' | 'drinks' | 'cannabis' | 'activity' | 'arts' | 'stay';

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
    id: 'labyrinth-press',
    name: 'Labyrinth Press Co.',
    category: 'coffee',
    emoji: '☕',
    description: 'Full espresso bar, fresh vegetarian & vegan restaurant, and a seasonal outdoor patio. One of the best spots downtown for food and coffee. 🌱 Vegan-friendly.',
    address: '10-12 E. 4th St, Jamestown',
    website: 'https://www.labpressco.com/',
    hours: 'Tue–Sat 8am–9pm',
    featured: false,
  },
  {
    id: 'crown-street-roasting',
    name: 'Crown Street Roasting Co.',
    category: 'coffee',
    emoji: '☕',
    description: 'Specialty coffee roasted right here in Jamestown. Café, whole beans, and merchandise.',
    address: 'Jamestown, NY',
    website: 'https://www.crownstreetroasting.com/',
    featured: false,
  },

  // ─── Food ─────────────────────────────────────────────────────
  {
    id: 'shawbucks',
    name: "Shawbuck's Restaurant & Bar",
    category: 'food',
    emoji: '🍔',
    description: 'Casual American bar and grill in downtown Jamestown. Burgers, sandwiches, wings, and a full bar. A local go-to for lunch or dinner.',
    address: '319 Pine St, Jamestown',
    website: 'https://www.shawbucks.com/',
    hours: 'Mon–Sat 11am–10pm · Sun 11am–9pm',
    featured: false,
  },
  {
    id: 'honest-johns',
    name: "Honest John's Pizzeria",
    category: 'food',
    emoji: '🍕',
    description: 'Pizza, wings, and subs with delivery throughout Jamestown, Celeron, West Ellicott, and Falconer.',
    address: '1245 E. 2nd St, Jamestown',
    website: 'https://honestjohns.pizza/',
    hours: 'Daily 11am–10pm',
    featured: false,
  },
  {
    id: 'paces',
    name: "Pace's Pizzeria",
    category: 'food',
    emoji: '🍕',
    description: "The world's greatest pizza since 1953. Simple. Fresh. Delicious. Wine and beer selection.",
    address: '549 W 3rd St, Jamestown',
    website: 'https://paces.pizza/',
    hours: 'Wed–Sat 4pm–9pm · Sun 4pm–8pm',
    featured: false,
  },
  {
    id: 'slice-of-home',
    name: 'A Slice of Home Pizzeria',
    category: 'food',
    emoji: '🍕',
    description: 'Local Jamestown pizzeria.',
    address: 'Jamestown',
    website: 'https://asliceofhomepizzeriallc.toast.site/',
    featured: false,
  },
  {
    id: 'jamestown-farmers-market',
    name: 'Jamestown Farmers Market',
    category: 'food',
    emoji: '🥬',
    description: 'Fresh local produce, artisan goods, and community vendors. Look for Durow Farms — farm-fresh eggs, hand-tapped maple syrup, small-batch coffee, and more from a local family farm. Winter market runs 2nd & 4th Saturdays at 410 N Main St. Summer market moves to 17 W 3rd St.',
    address: '410 N Main St (winter) · 17 W 3rd St (summer)',
    website: 'https://jfmny.org/',
    hours: 'Saturdays 9am–1pm',
    featured: false,
  },

  // ─── Drinks ───────────────────────────────────────────────────
  {
    id: 'brazil-lounge',
    name: 'Brazil Lounge',
    category: 'drinks',
    emoji: '🍷',
    description: 'Upstairs craft beer and wine bar above Labyrinth Press. Vegan-friendly menu. 🌱',
    address: '10-12 E. 4th St, Jamestown',
    website: 'https://www.labpressco.com/',
    hours: 'Tue–Sat 11am–10pm',
    featured: false,
  },
  {
    id: 'wicked-warrens',
    name: "Wicked Warren's",
    category: 'drinks',
    emoji: '🍺',
    description: 'Brewery and restaurant with outstanding craft beer and wood-fired pizza.',
    address: '119 W 3rd St, Jamestown',
    website: 'https://wickedwarrens.com/jamestown',
    hours: 'Daily 11:30am–10pm',
    featured: false,
  },

  // ─── Cannabis ─────────────────────────────────────────────────
  {
    id: 'lifted',
    name: 'Lifted Dispensary',
    category: 'cannabis',
    emoji: '🌿',
    description: 'Licensed cannabis dispensary serving Jamestown.',
    address: 'Jamestown',
    website: 'https://www.liftedispensary.com/',
    hours: 'Check website for hours',
    featured: false,
  },

  // ─── Arts & Entertainment ─────────────────────────────────────
  {
    id: 'comedy-center',
    name: 'National Comedy Center',
    category: 'activity',
    emoji: '😂',
    description: "America's official museum of comedy. Interactive, immersive, and one of a kind.",
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
    hours: 'Box office open day-of-show',
    featured: false,
  },
  {
    id: 'rtpi',
    name: 'Roger Tory Peterson Institute',
    category: 'activity',
    emoji: '🐦',
    description: "Nature art, bird walks, and galleries honoring Jamestown's most famous naturalist.",
    address: '311 Curtis St, Jamestown',
    website: 'https://rtpi.org',
    hours: 'Tue–Sun 10am–4pm',
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
    hours: 'Tue–Sat 10am–4pm',
    featured: false,
  },

  // ─── Outdoors ─────────────────────────────────────────────────
  {
    id: 'chautauqua-institution',
    name: 'Chautauqua Institution',
    category: 'activity',
    emoji: '⛵',
    description: 'World-renowned arts, education, and lecture community on the shores of Chautauqua Lake. Season runs June–August.',
    address: 'Chautauqua, NY (20 min from Jamestown)',
    website: 'https://chq.org',
    featured: false,
  },
  {
    id: 'chautauqua-lake',
    name: 'Chautauqua Lake',
    category: 'activity',
    emoji: '🌊',
    description: 'Glacially-formed lake and one of the highest navigable lakes in the US. Boating, fishing, lakeside dining, and beach access in nearby Celoron.',
    address: 'Chautauqua, NY (15 min from downtown)',
    website: 'https://www.chautauqualake.org/',
    featured: false,
  },

  // ─── Stay ─────────────────────────────────────────────────────
  {
    id: 'chautauqua-harbor-hotel',
    name: 'The Chautauqua Harbor Hotel',
    category: 'stay',
    emoji: '🏨',
    description: 'Upscale lakeside hotel on the shores of Chautauqua Lake in Celoron — just minutes from downtown Jamestown. Stunning water views, a full-service marina, and a great restaurant on site.',
    address: '10 Dunham Ave, Celoron, NY',
    website: 'https://www.thechautauquaharborhotel.com/',
    hours: 'Front desk open 24 hours',
    featured: true,
    featuredNote: 'Lakeside hotel with marina views — 5 min from downtown.',
  },
  {
    id: 'airbnb-jamestown',
    name: 'Airbnb & VRBO',
    category: 'stay',
    emoji: '🏠',
    description: 'Short-term rentals throughout Jamestown and the Chautauqua Lake area. Good option for groups or longer stays.',
    address: 'Various locations',
    website: 'https://www.airbnb.com/s/Jamestown--New-York',
    featured: false,
  },
];

export const PLACE_CATEGORIES: { key: PlaceCategory; label: string; emoji: string; note?: string }[] = [
  { key: 'coffee',   label: 'Coffee',       emoji: '☕' },
  { key: 'food',     label: 'Food',         emoji: '🍽️' },
  { key: 'drinks',   label: 'Drinks',       emoji: '🍺' },
  {
    key: 'cannabis', label: 'Cannabis', emoji: '🌿',
    note: 'Recreational cannabis is legal in New York State for adults 21+. Public and in-vehicle consumption is not permitted. Laws vary — check your home state before traveling with any product.',
  },
  { key: 'activity', label: 'Things to Do', emoji: '🎯' },
  { key: 'arts',     label: 'Arts',         emoji: '🎭' },
  { key: 'stay',     label: 'Where to Stay', emoji: '🏨' },
];

export function getFeaturedPlaces(): Place[] {
  return PLACES.filter(p => p.featured);
}

export function getPlacesByCategory(cat: PlaceCategory): Place[] {
  return PLACES.filter(p => p.category === cat);
}
