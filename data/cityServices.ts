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
  // Overrides the generic STATUS_LABELS[status] text in StatusPill — for a
  // card whose status needs more precision than the shared 4-value enum
  // gives (e.g. yard waste: "OPEN SAT 7AM–1PM" vs. a flat "OPEN NOW" that's
  // wrong half the week). Computed at render time; see city-services.tsx.
  badgeLabel?: string;
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
    badge: 'MONDAYS',
    badgeLabel: 'MONDAYS', // badge (above) is a dead legacy field — StatusPill actually reads badgeLabel
    badgeColor: '#60a5fa',
    status: 'year-round',
    summary: 'Work sessions & last-Monday voting · 7:30 PM · Municipal Bldg',
    details: [
      { label: 'Work Sessions',    value: '7:30 PM · Police Training Room, 4th Floor, Municipal Building, 200 E 3rd St · Typically the first two Mondays of the month' },
      { label: 'Voting Sessions',  value: '7:30 PM · City Council Chambers, 2nd Floor, Municipal Building · Typically the last Monday of the month' },
      { label: 'Committees',       value: 'Before work sessions, none on voting-session days — Housing 6:30 PM (Police Training Rm) · Finance 7 PM (Mayor’s Conf Rm) · Public Safety 7 PM (Police Training Rm) · Public Works 7 PM (DOD Conf Rm)' },
      { label: 'This month',       value: 'Oct 2026: work sessions Oct 5 & 19, voting Oct 26 — no meeting Oct 12. Dates vary — check the city calendar.' },
      { label: 'Agendas & Minutes', value: 'Posted at jamestownny.gov ahead of each meeting' },
      { label: 'Public Comment',   value: 'Public participation allowed at regular meetings' },
    ],
    tip: 'Work sessions are livestreamed on jamestownny.gov. Agendas are posted a few days before each meeting.',
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
    id: 'election2026',
    icon: 'checkbox-outline',
    title: 'Nov 3 General Election',
    badge: 'REGISTER BY OCT 24',
    badgeColor: '#818cf8',
    status: 'active',
    summary: 'Register by Sat Oct 24 · Early voting Oct 24–Nov 1 · Election Day Tue Nov 3, 6am–9pm',
    details: [
      { label: 'Register',          value: 'NY registration (mail or in person) must be RECEIVED by Oct 24, 2026' },
      { label: 'Early voting',      value: 'Sat 10/24 & Sun 10/25 9am–5pm · Mon 10/26 & Tue 10/27 noon–8pm · Wed 10/28–Fri 10/30 10am–6pm · Sat 10/31 & Sun 11/1 9am–5pm (none Mon 11/2) · Any county site' },
      { label: 'Jamestown site',    value: 'Robert H. Jackson Center, Prendergast Ave entrance, 305 E 4th St' },
      { label: 'Also nearby',       value: 'Celoron Community Center, 47 Dunham Ave, Celoron (new)' },
      { label: 'Election Day',      value: 'Tue Nov 3, polls 6am–9pm at your assigned poll site' },
      { label: 'Early mail ballot', value: 'Application must be received by the county board by Oct 24 (10 days before); in person by Nov 2' },
      { label: 'Board of Elections', value: '716-753-4580 · vote@chqgov.com · 7 N Erie St, Mayville' },
    ],
    tip: 'Early voting lets you skip Election Day lines — any county site works, not just your assigned precinct.',
    links: [
      { label: 'Registration & voting deadlines', url: 'https://elections.ny.gov/registration-and-voting-deadlines' },
      { label: 'Early voting sites & hours', url: 'https://chautauquacountyny.gov/board-of-elections/Early-Voting-Information' },
      { label: 'Request a mail ballot', url: 'https://chautauquacountyny.gov/board-elections/requesting-ballot' },
    ],
    expiresAfter: '2026-11-03',
  },
  {
    id: 'safestreets',
    icon: 'shield-checkmark-outline',
    title: 'Safe Streets Priority Survey',
    badge: 'SURVEY CLOSED',
    badgeLabel: 'SURVEY CLOSED', // badge (above) is a dead legacy field — StatusPill actually reads badgeLabel, see city-services.tsx
    badgeColor: '#fb923c',
    status: 'coming-up',
    summary: 'City Safe Streets for All plan · Survey closed — plan moving to next steps',
    details: [
      { label: 'What it was', value: 'City-wide street safety planning under a federal USDOT Safe Streets for All grant' },
      { label: 'Your input',  value: 'Residents picked their top 3 priorities from 10 proposed street improvement locations' },
      { label: 'Public meeting', value: 'Aug 26 · James Prendergast Library, 5–6:30 PM' },
    ],
    tip: 'Priority survey has closed — follow the Road Action Plan for next steps.',
    links: [
      { label: 'Project page', url: 'https://www.jamestownny.gov/safe-streets-4-all/' },
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
