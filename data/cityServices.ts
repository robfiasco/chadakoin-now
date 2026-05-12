export interface ServiceDetail {
  label: string;
  value: string;
}

export interface ScheduleEntry {
  date: string;   // e.g. "May 1"
  day: string;    // e.g. "Fri" or "Sat–Sun"
  areas: string;
  warn?: string;  // optional warning note
}

export type ServiceStatus = 'active' | 'imminent' | 'coming-up' | 'year-round';

export interface CityService {
  id: string;
  icon: string;        // Ionicons name
  title: string;
  badge: string;
  badgeColor: string;  // hex — drives stripe + gradient
  status: ServiceStatus;
  summary: string;
  defaultExpanded?: boolean;
  details: ServiceDetail[];
  schedule?: ScheduleEntry[];
  tip?: string;
  links?: { label: string; url: string }[];
}

export const CITY_SERVICES: CityService[] = [
  {
    id: 'yardwaste',
    icon: 'leaf-outline',
    title: 'Yard Waste Site',
    badge: 'OPEN NOW',
    badgeColor: '#4DD9AC',
    status: 'active',
    defaultExpanded: true,
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
    badge: 'MAY 12–13',
    badgeColor: '#38bdf8',
    status: 'imminent',
    summary: 'BPU Spring 2026 · May 12–13\nExpand to find your area',
    details: [
      { label: 'Hours',      value: '8:00 AM – 4:30 PM (Mon–Fri)' },
      { label: 'Hotline',    value: '716-661-1613 · Leave address + cross streets' },
    ],
    schedule: [
      { date: 'May 12',   day: 'Tue',     areas: 'SW Jamestown — Baker, State, Chautauqua Ave · Busti north' },
      { date: 'May 13',   day: 'Wed',     areas: 'SE Jamestown — Barrows, Sciota, Virginia Blvd, Collins' },
    ],
    tip: 'Before your flush day: set aside water for drinking/cooking, and check the tap before doing laundry — discolored water can stain clothes. Never add discolored water to your hot water tank. If laundry is affected, don\'t dry it — rewash with rust remover (free at BPU Customer Service, 661-1660). Discoloration clears in 12–24 hours.',
    links: [
      { label: 'Map 1 — Falconer, E. Ellicott, Jamestown, W. Ellicott, Celoron', url: 'https://www.jamestownnybpu.gov/DocumentCenter/View/3976/BPU-Spring-2026-Water-Main-Flushing-1' },
      { label: 'Map 2 — Celoron, W. Ellicott, Lakewood, Busti, N. Harmony', url: 'https://www.jamestownnybpu.gov/DocumentCenter/View/3978/BPU-Spring-2026-Water-Main-Flushing-2' },
    ],
  },
  {
    id: 'bulktrash',
    icon: 'trash-outline',
    title: 'Bulk Trash & Electronics',
    badge: 'DATE TBD',
    badgeColor: '#a78bfa',
    status: 'coming-up',
    summary: 'Amnesty Day · City residents only\nFree drop-off',
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
    summary: 'Curbside pickup · October – November\nTwo phases',
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
    id: 'citycouncil',
    icon: 'people-outline',
    title: 'City Council Meetings',
    badge: 'MONTHLY',
    badgeColor: '#60a5fa',
    status: 'year-round',
    summary: '2nd & 4th Monday · City Hall, 7:30 PM\nPublic welcome — all meetings open',
    details: [
      { label: 'Regular Meetings', value: '2nd and 4th Monday of each month · 7:30 PM' },
      { label: 'Location',         value: 'Municipal Building, 2nd Floor · 200 E 3rd St' },
      { label: 'Committee Meetings', value: 'Typically the week before regular meetings — check agenda' },
      { label: 'Agendas & Minutes', value: 'Posted at jamestownny.gov ahead of each meeting' },
      { label: 'Public Comment',   value: 'Public participation allowed at regular meetings' },
    ],
    tip: 'Agendas are posted a few days before each meeting. Minutes from previous meetings are available on the city website.',
    links: [
      { label: 'Agendas, minutes & meeting info', url: 'https://www.jamestownny.gov/government/city-council' },
    ],
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
