export interface ServiceDetail {
  label: string;
  value: string;
}

export type ServiceStatus = 'active' | 'coming-up' | 'year-round';

export interface CityService {
  id: string;
  icon: string;        // Ionicons name
  title: string;
  badge: string;
  badgeColor: string;  // hex — drives stripe + gradient
  status: ServiceStatus;
  summary: string;
  details: ServiceDetail[];
  tip?: string;
}

export const CITY_SERVICES: CityService[] = [
  {
    id: 'yardwaste',
    icon: 'leaf-outline',
    title: 'Yard Waste Site',
    badge: 'OPEN NOW',
    badgeColor: '#4DD9AC',
    status: 'active',
    summary: '1001 Monroe St · Sat Apr 11–Nov 14 · Wed May 13–Sep 30',
    details: [
      { label: 'Location',   value: '1001 Monroe St' },
      { label: 'Saturdays',  value: 'Apr 11 – Nov 14 · 8am – 3:30pm' },
      { label: 'Wednesdays', value: 'May 13 – Sep 30 · 8am – 3:30pm' },
      { label: 'Closed',     value: 'May 30, Jul 4, Sep 12' },
      { label: '2026 Sticker', value: '$20 · BPU Customer Service office' },
      { label: 'Accepts',    value: 'Leaves, grass, brush, twigs, branches up to 8" diameter' },
      { label: 'Note',       value: 'Residential BPU customers only. Sticker must be on rear driver-side window.' },
    ],
    tip: 'Yard waste bags: $4 each or $15 for 5. No sticker needed for curbside bag pickup.',
  },
  {
    id: 'watermain',
    icon: 'water-outline',
    title: 'Water Main Flushing',
    badge: 'MAY 1–13',
    badgeColor: '#38bdf8',
    status: 'coming-up',
    summary: 'BPU Spring 2026 · May 1–13 · Check your area',
    details: [
      { label: 'Hours',       value: '8:00 AM – 4:30 PM (Mon–Fri)' },
      { label: 'Falconer',    value: 'Pre-flush Fri May 1 @ 1 PM (Aldren, Mapleshade, Ralph, Valmeere). Full flush Sat–Sun May 2–3 @ 8 PM — also affects Jamestown north side.' },
      { label: 'May 4 Mon',   value: 'E. Ellicott' },
      { label: 'May 5 Tue',   value: 'Central Jamestown (Lafayette, Washington, Clinton, 15th–18th St area)' },
      { label: 'May 6 Wed',   value: 'Downtown & Fairmount Ave — EARLY START 4:30 AM for businesses. Also W. Third St, Harding, Fairmount (Rt 394) neighborhoods. Also Celoron (Jones & Gifford, Walden Ave area).' },
      { label: 'May 7 Thu',   value: 'W. Ellicott (Fairmount Ave, Robinson, S. Alleghany), Lakewood (E. Terrace, Fairmount, Mall Blvd area), Celoron' },
      { label: 'May 8 Fri',   value: 'S. Jamestown (Hallock, Summit, Trenton, Schuyler), Lakewood (E. Fairmount, Shadyside, Lakeview area)' },
      { label: 'May 11 Mon',  value: 'Celoron south, Town of Busti, Orr St Ext to Busti 5-Corners, W. Ellicott (Orchard Rd area)' },
      { label: 'May 12 Tue',  value: 'SW Jamestown (Baker St, State St, Chautauqua Ave), Busti north, S. Main St. Ext.' },
      { label: 'May 13 Wed',  value: 'SE Jamestown (Barrows, Sciota, Vega, Virginia Blvd, Collins, Allendae Ave area)' },
      { label: 'Hotline',     value: '716-661-1613 · Leave address + cross streets for a callback' },
      { label: 'Call notice',  value: 'BPU calls residents 2–5 days before their flushing day' },
    ],
    tip: 'Before your flush day: set aside water for drinking/cooking, and check the tap before doing laundry — discolored water can stain clothes. Never add discolored water to your hot water tank. If laundry is affected, don\'t dry it — rewash with rust remover (free at BPU Customer Service, 661-1660). Discoloration clears in 12–24 hours.',
  },
  {
    id: 'bulktrash',
    icon: 'trash-outline',
    title: 'Bulk Trash & Electronics',
    badge: 'DATE TBD',
    badgeColor: '#F5A623',
    status: 'coming-up',
    summary: 'Amnesty Day · City residents only · Free drop-off',
    details: [
      { label: '2026 Date',    value: 'Not yet announced — check back' },
      { label: 'Last held at', value: 'Jackson-Taylor Park, Lafayette St lot' },
      { label: 'Hours',        value: 'Typically 9am – 1pm' },
      { label: 'Bring ID',     value: 'NYS ID, Yard Waste sticker, or BPU bill' },
      { label: 'Not accepted', value: 'Tires, batteries, paint, chemicals, liquids' },
    ],
    tip: 'Old TVs, computers, and appliances are accepted. Good time to clear out the garage.',
  },
  {
    id: 'leafcollection',
    icon: 'cloudy-outline',
    title: 'Leaf Collection',
    badge: 'FALL 2026',
    badgeColor: '#C9A84C',
    status: 'coming-up',
    summary: 'Curbside pickup · October – November · Two phases',
    details: [
      { label: '2026 Dates', value: 'Not yet announced — typically late October' },
      { label: 'Phase 1',    value: 'Foote Ave, Martin Rd, Linwood Ave area' },
      { label: 'Phase 2',    value: 'Foote Ave, Ivy St area moving west and north' },
      { label: 'Rules',      value: 'Rake to terrace behind curb, not into street' },
      { label: 'Not collected', value: 'Brush, hedge trimmings, garden debris, branches' },
    ],
    tip: 'Remove basketball hoops from the street before collection begins. No plastic bags or trash mixed in.',
  },
  {
    id: 'syringes',
    icon: 'medkit-outline',
    title: 'Sharps / Syringe Disposal',
    badge: 'YEAR ROUND',
    badgeColor: '#FF6B8A',
    status: 'year-round',
    summary: 'UPMC Chautauqua · Emergency entrance · 24/7',
    details: [
      { label: 'Location',  value: 'UPMC Chautauqua Hospital — Security Desk, Emergency Entrance' },
      { label: 'Hours',     value: '24 hours a day, 7 days a week' },
      { label: 'Container', value: 'Must be in a sharps container or sealed puncture-proof plastic' },
    ],
    tip: 'Sealed milk jugs or soda bottles work as a sharps container — just label it clearly.',
  },
];
