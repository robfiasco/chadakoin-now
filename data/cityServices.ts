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
  expiresAfter?: string; // ISO date — card hidden after this date (e.g. '2026-05-13')
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
      { label: 'Saturdays',  value: 'Apr 11 – Nov 14 · 7am – 1pm' },
      { label: 'Wednesdays', value: 'May 13 – Sep 30 · 4pm – 7pm' },
      { label: 'Sat Closures', value: 'May 30, Jul 11, Sep 12 (Saturdays after summer holidays)' },
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
    badge: 'SEP 25 – OCT 7',
    badgeColor: '#38bdf8',
    status: 'imminent',
    summary: 'BPU Fall 2026 · Sep 25 – Oct 7\nExpand to find your area',
    details: [
      { label: 'Hours',      value: '8:00 AM – 4:30 PM (Mon–Fri) · no weekend flushing' },
      { label: 'Hotline',    value: '716-661-1613 · Leave address + cross streets' },
    ],
    schedule: [
      { date: 'Sep 25', day: 'Fri', areas: '1 PM pre-flush — Falconer: Aldren, Mapleshade, Ralph, Valmeere' },
      { date: 'Sep 26', day: 'Sat', areas: '8 PM full Falconer overnight flush into Sun — north Jamestown may see discoloration too' },
      { date: 'Sep 28', day: 'Mon', areas: 'Rest of system begins · 8 AM–4:30 PM, through Fri Oct 2' },
      { date: 'Sep 30', day: 'Wed', areas: 'Downtown & Fairmount Ave — early 4:30 AM start for businesses' },
      { date: 'Oct 5',  day: 'Mon', areas: 'Rest of system resumes · 8 AM–4:30 PM, through Wed Oct 7' },
    ],
    expiresAfter: '2026-10-07',
    tip: 'Before your flush day: set aside water for drinking/cooking, and check the tap before doing laundry — discolored water can stain clothes. Never add discolored water to your hot water tank. If laundry is affected, don\'t dry it — rewash with rust remover (free at BPU Customer Service, 661-1660). Discoloration clears in 12–24 hours.',
    links: [
      { label: 'Map 1 — Falconer, E. Ellicott, Jamestown, W. Ellicott, Celoron', url: 'https://www.jamestownnybpu.gov/DocumentCenter/View/4047/Fall-2026-Flushing-Map---Falconer-E-Ellicott-Jamestown-W-Ellicott-Celoron-PDF' },
      { label: 'Map 2 — Celoron, W. Ellicott, Lakewood, Busti, N. Harmony', url: 'https://www.jamestownnybpu.gov/DocumentCenter/View/4048/Fall-2026-Flushing-Map---Celoron-W-Ellicott-Lakewood-Busti-N-Harmony-PDF' },
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
    id: 'roigrants',
    icon: 'cash-outline',
    title: 'ROI Jamestown Business Grants',
    badge: 'DEADLINE SEP 30',
    badgeColor: '#f59e0b',
    status: 'active',
    summary: 'CDBG-funded · Up to $50k · Deadline Wed Sep 30, 4 PM',
    details: [
      { label: 'Deadline',      value: 'Wed, Sep 30, 2026 · 4:00 PM' },
      { label: 'Funding',       value: 'Up to $50,000 · CDBG-funded' },
      { label: 'Eligible uses', value: 'Renovations, accessibility upgrades, roof/HVAC/mechanical, signage, permanently installed equipment' },
      { label: 'Priority areas', value: 'Downtown CBD, primary corridors, job-creating sites' },
      { label: 'Contact',       value: 'Aili Makuch, Economic Development Coordinator · (716) 338-0040 · makuch@jamestownny.gov' },
    ],
    tip: 'For Jamestown commercial property and business owners — covers renovations, build-outs, and equipment. Apply before the Sep 30 deadline.',
    links: [
      { label: 'Program details & application', url: 'https://www.jamestownny.gov/15803-2/' },
    ],
    expiresAfter: '2026-09-30',
  },
  {
    id: 'safestreets',
    icon: 'shield-checkmark-outline',
    title: 'Safe Streets Priority Survey',
    badge: 'SHARE YOUR INPUT',
    badgeColor: '#fb923c',
    status: 'active',
    summary: 'City Safe Streets for All plan · Pick your top 3 project priorities',
    details: [
      { label: 'What it is',  value: 'City-wide street safety planning under a federal USDOT Safe Streets for All grant' },
      { label: 'Your input',  value: 'Select your 3 highest-priority projects from 10 proposed street improvement locations' },
      { label: 'Public meeting', value: 'Aug 26 · James Prendergast Library, 5–6:30 PM (already held — survey still open)' },
    ],
    tip: 'No survey deadline has been published — take a few minutes to weigh in on which streets get prioritized while it’s still open.',
    links: [
      { label: 'Take the survey', url: 'https://www.surveymonkey.com/r/FDJ93DK' },
      { label: 'Project details', url: 'https://www.jamestownny.gov/safe-streets-4-all/' },
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
