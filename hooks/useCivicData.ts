import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { XMLParser } from 'fast-xml-parser';

// ─── Types ────────────────────────────────────────────────────────

export interface RecyclingWeek {
  material: string;
  dateRange: string;
  exclusions: string;
  startDate: string;   // ISO date string for sorting (YYYY-MM-DD)
  emoji: string;       // material emoji for display
}

export interface RecyclingData {
  thisWeek: RecyclingWeek;
  nextWeek: RecyclingWeek;
  upcomingWeeks: RecyclingWeek[];  // next 4 weeks beyond nextWeek
  holidayDelay: boolean;
  affectedDays: string[];
}

export interface ParkingData {
  active: boolean;
  side: 'EVEN' | 'ODD' | null;
  isWinter: boolean;
  switchTime: string;
  rule: string;
}

export interface AlertItem {
  title: string;
  description: string;
  pubDate: string;
  link: string;
}

export interface AlertsData {
  hasActiveAlerts: boolean;
  activeAlerts: AlertItem[];
}

export interface EventItem {
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  category: string;
  tags: string[];
  link?: string;
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  excerpt: string;
}

export interface PodcastEpisode {
  show: string;
  episodeNumber: string;
  title: string;
  duration: string;
  pubDate: string;
  audioUrl: string;
  pageUrl: string;
  artworkUrl: string;
}

export interface CivicData {
  loading: boolean;
  error: string | null;
  recycling: RecyclingData;
  parking: ParkingData;
  alerts: AlertsData;
  events: EventItem[];
  news: NewsItem[];
  latestEpisode: PodcastEpisode | null;
  lastUpdated: string | null;
  refresh: () => void;
}

// ─── Constants ────────────────────────────────────────────────────

const FEEDS = {
  // BPU iCalendar feed — full year recycling schedule including Metal weeks & holiday events
  recyclingICS: 'https://www.jamestownnybpu.gov/common/modules/iCalendar/iCalendar.aspx?feed=calendar&catID=24',
  // recyclingRSS (legacy, only shows ~6 weeks): 'https://www.jamestownbpu.com/RSSFeed.aspx?ModID=58&CID=Recycling-Calendar-24',
  alerts: 'https://www.jamestownbpu.com/RSSFeed.aspx?ModID=63&CID=Alerts-11',
  eventsFallback: 'https://www.jamestownbpu.com/RSSFeed.aspx?ModID=58&CID=Jamestown-Board-Meeting-Calendar-23',
  news: 'https://www.wrfalp.com/feed/',
  cityNews: 'https://www.jamestownny.gov/feed/',
  library: 'https://prendergastlibrary.org/feed/',
  lotd: 'https://rss.libsyn.com/shows/66268/destinations/266592.xml',
  regLenna: 'https://reglenna.com/events?format=json',
  chautauquaAlerts: 'https://chautauquacountyny.gov/rss.xml',
  jackson: 'https://www.roberthjackson.org/feed/',
};

const TTL = {
  recycling: 24 * 60 * 60 * 1000,   // 24h
  events:     1 * 60 * 60 * 1000,   // 1h
  alerts:     5 * 60 * 1000,        // 5min
  news:       2 * 60 * 60 * 1000,   // 2h
  lotd:      12 * 60 * 60 * 1000,   // 12h — weekly show
};

const FEDERAL_HOLIDAYS_2026 = [
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-05-25',
  '2026-06-19', '2026-07-04', '2026-09-07', '2026-10-12',
  '2026-11-11', '2026-11-26', '2026-12-25',
];

const EMPTY_WEEK: RecyclingWeek = { material: '—', dateRange: '—', exclusions: '', startDate: '', emoji: '♻️' };

const DEFAULTS: Omit<CivicData, 'refresh'> = {
  loading: true,
  error: null,
  recycling: {
    thisWeek: EMPTY_WEEK,
    nextWeek: EMPTY_WEEK,
    upcomingWeeks: [],
    holidayDelay: false,
    affectedDays: [],
  },
  parking: { active: false, side: null, isWinter: false, switchTime: '10:00 AM', rule: '' },
  alerts: { hasActiveAlerts: false, activeAlerts: [] },
  events: [],
  news: [],
  latestEpisode: null,
  lastUpdated: null,
};

// ─── CORS proxy (web only) ────────────────────────────────────────
// Routes RSS/JSON requests through our own Expo Router API endpoint
// to avoid browser CORS restrictions. Native fetches directly.
function proxyUrl(url: string): string {
  if (Platform.OS === 'web') {
    return `/api/proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

// ─── XML parser ───────────────────────────────────────────────────
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  cdataPropName: '__cdata',
  textNodeName: '#text',
  parseTagValue: true,
});

function getRssItems(xmlText: string): any[] {
  try {
    const parsed = xmlParser.parse(xmlText);
    const raw = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];
    return Array.isArray(raw) ? raw : raw ? [raw] : [];
  } catch {
    return [];
  }
}

function getItemText(field: any): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object') return field.__cdata ?? field['#text'] ?? String(field);
  return String(field);
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ─── AsyncStorage cache helpers ───────────────────────────────────
// Bump the version suffix here to bust all stale cached data in the wild
const CACHE_PREFIX = 'civic_v14_';

async function getCached<T>(key: string, ttlMs: number): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > ttlMs) return null;
    return data as T;
  } catch {
    return null;
  }
}

async function setCache(key: string, data: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
}

// ─── Parking (computed) ───────────────────────────────────────────
function computeParking(): ParkingData {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1; // 1-indexed

  const isWinter =
    month >= 11 ||
    month < 4 ||
    (month === 4 && day === 1);

  if (!isWinter) {
    return { active: false, side: null, isWinter: false, switchTime: '10:00 AM', rule: '' };
  }

  const side: 'EVEN' | 'ODD' = day % 2 === 0 ? 'EVEN' : 'ODD';
  return {
    active: true,
    side,
    isWinter: true,
    // Date flips at midnight but drivers have until 10 AM to move their car
    switchTime: '10:00 AM',
    rule: 'Even date → even side. Odd date → odd side. Move by 10:00 AM.',
  };
}

// Compute 7-day schedule from today's week
export function computeParkingSchedule() {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date: `${MONTHS[d.getMonth()]} ${d.getDate()}`,
      day: DAYS[d.getDay()],
      side: (d.getDate() % 2 === 0 ? 'EVEN' : 'ODD') as 'EVEN' | 'ODD',
      isToday: d.toDateString() === today.toDateString(),
    };
  });
}

// ─── Holiday delay (computed) ─────────────────────────────────────
function computeHolidayDelay(): { hasDelay: boolean; affectedDays: string[] } {
  const today = new Date();
  const dow = today.getDay();

  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);

  // Mon–Thu of current week
  const weekDays = [0, 1, 2, 3].map(offset => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + offset);
    return d.toISOString().split('T')[0];
  });

  const affected = weekDays.filter(d => FEDERAL_HOLIDAYS_2026.includes(d));
  return { hasDelay: affected.length > 0, affectedDays: affected };
}

// ─── Recycling ICS fetcher ────────────────────────────────────────
// BPU iCalendar feed: full year schedule, 4 material types + holiday delay events.
// Material SUMMARY formats:
//   "Corrugated Cardboard & Box Board Only"
//   "Plastic Recycling- no plastic bags, no cat litter buckets,"
//   "Paper Recycling Week: No gift wrap, tissues/napkins, boxes or shredded paper,"
//   "Metal Recycling: Aluminum & Tin - Food and Beverage Containers ONLY."
// Holiday SUMMARY formats: "LABOR DAY - NO GARBAGE...", "CHRISTMAS DAY = NO...", etc.

function parseIcsDate(raw: string): Date | null {
  // Handles "20260309T120000" and "20260309" (date-only) forms from DTSTART/DTEND
  const clean = raw.replace(/.*:/,'').trim();    // strip "TZID=...:"
  if (clean.length >= 8) {
    const y = clean.slice(0,4), mo = clean.slice(4,6), d = clean.slice(6,8);
    const h = clean.slice(9,11)||'00', mi = clean.slice(11,13)||'00';
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:00`);
  }
  return null;
}

function recyclingEmoji(lower: string): string {
  if (lower.includes('cardboard') || lower.includes('corrugated') || lower.includes('box board')) return '📦';
  if (lower.includes('plastic')) return '🧴';
  if (lower.includes('paper')) return '📰';
  if (lower.includes('metal') || lower.includes('tin') || lower.includes('alumin')) return '🥫';
  return '♻️';
}

function parseRecyclingTitle(summary: string, description: string, start: Date | null = null, end: Date | null = null): RecyclingWeek {
  const lowerSummary = summary.toLowerCase();
  const lowerDesc = description.toLowerCase();
  
  // Extract exclusions from either summary or description (look for "no " or "No ")
  let exclusions = '';
  const searchStr = summary + ' ' + description;
  const exclusionMatch = searchStr.match(/(:|-|\.)?\s*[Nn]o\s+(.+?)(?:,?\s*$|\.\s*$)/);
  if (exclusionMatch) {
    exclusions = exclusionMatch[2].replace(/[.,]\s*$/, '').trim();
  }

  // Map to friendly material names based on SUMMARY
  let material: string;
  if (lowerSummary.includes('cardboard') || lowerSummary.includes('corrugated') || lowerSummary.includes('box board') || lowerSummary.includes('boxboard')) {
    material = 'Corrugated Cardboard & Boxboard';
  } else if (lowerSummary.includes('plastic')) {
    material = 'Plastics (bottles, jugs, containers)';
  } else if (lowerSummary.includes('paper')) {
    material = 'Paper (newspaper, mail, magazines, office paper)';
  } else if (lowerSummary.includes('metal') || lowerSummary.includes('tin') || lowerSummary.includes('alumin')) {
    material = 'Metals & Cans (aluminum, tin)';
  } else if (lowerSummary.includes('glass')) {
    material = 'Glass';
  } else {
    const cut = summary.match(/^(.+?)(?:\s+(?:week|only|recycling)\b|\s*[-:—–])/i);
    material = cut ? cut[1].trim() : summary.replace(/,\s*$/, '').trim();
  }

  // Build human-friendly date range e.g. "Mar 9 – Mar 13"
  let dateRange = '';
  if (start && end) {
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    // DTEND in ICS is exclusive (23:59:00 of end day), so same day = last day of pickup window
    dateRange = `${fmt(start)} – ${fmt(end)}`;
  }

  const startDate = start ? start.toISOString().split('T')[0] : '';
  const emoji = recyclingEmoji(lowerSummary);

  return { material, dateRange, exclusions, startDate, emoji };
}

async function fetchRecyclingICS(): Promise<RecyclingData> {
  const cached = await getCached<RecyclingData>('recycling', TTL.recycling);
  if (cached) return cached;

  const res = await fetch(proxyUrl(FEEDS.recyclingICS));
  if (!res.ok) throw new Error(`Recycling ICS fetch failed: ${res.status}`);
  const text = await res.text();

  // Parse VEVENT blocks from ICS
  const eventRx = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
  const fieldRx = /^([A-Z\-]+(?:;[^:]+)?):(.*)/;

  const recyclingWeeks: RecyclingWeek[] = [];
  const holidayDates: string[] = [];
  let m;

  while ((m = eventRx.exec(text)) !== null) {
    const block = m[1];

    // Unfold ICS line continuations (lines starting with space/tab continue previous line)
    const unfolded = block.replace(/\r?\n[ \t]/g, '');
    const lines = unfolded.split(/\r?\n/);

    let summary = '', dtstart = '', dtend = '', description = '';
    for (const line of lines) {
      const fm = fieldRx.exec(line);
      if (!fm) continue;
      const [, key, val] = fm;
      const k = key.split(';')[0].toUpperCase();
      if (k === 'SUMMARY')     summary     = val.replace(/\\,/g, ',').replace(/\\n/g, ' ').trim();
      if (k === 'DTSTART')     dtstart     = val.trim();
      if (k === 'DTEND')       dtend       = val.trim();
      if (k === 'DESCRIPTION') description = val.replace(/\\,/g, ',').replace(/\\n/g, ' ').trim();
    }

    if (!summary || !dtstart) continue;

    const lower = summary.toLowerCase();
    const start = parseIcsDate(dtstart);
    const end   = parseIcsDate(dtend);

    // Holiday delay events ("NO GARBAGE OR RECYCLING")
    if (lower.includes('no garbage') || lower.includes('no recycling')) {
      if (start) holidayDates.push(start.toISOString().split('T')[0]);
      continue;
    }

    // Skip non-recycling BPU events (yard waste site open/close, etc.)
    const isRecycling = [
      'cardboard', 'plastic', 'paper', 'metal', 'glass', 'recycling'
    ].some(kw => lower.includes(kw));
    if (!isRecycling) continue;

    // Pass both summary and description
    recyclingWeeks.push(parseRecyclingTitle(summary, description, start, end));
  }

  // Sort chronologically (ICS is in reverse order)
  recyclingWeeks.sort((a, b) => a.startDate.localeCompare(b.startDate));

  // Find this week's entry: most recent startDate <= today
  const today = new Date().toISOString().split('T')[0];
  let thisIdx = -1;
  for (let i = recyclingWeeks.length - 1; i >= 0; i--) {
    if (recyclingWeeks[i].startDate <= today) {
      thisIdx = i;
      break;
    }
  }
  // If today is past the last week's start but within the window, use that
  if (thisIdx === -1 && recyclingWeeks.length > 0) thisIdx = 0;

  const thisWeek     = recyclingWeeks[thisIdx]     ?? EMPTY_WEEK;
  const nextWeek     = recyclingWeeks[thisIdx + 1] ?? EMPTY_WEEK;
  const upcomingWeeks = recyclingWeeks.slice(thisIdx + 2, thisIdx + 6);

  // Holiday delay: is there a holiday date within this pickup's 7-day week?
  const thisStart = thisWeek.startDate;
  let thisEnd = '';
  if (thisStart) {
    const endD = new Date(thisStart + 'T12:00:00Z');
    endD.setDate(endD.getDate() + 6);
    thisEnd = endD.toISOString().split('T')[0];
  }
  
  const holidayDelay = thisStart ? holidayDates.some(d => d >= thisStart && d <= thisEnd) : false;
  const affectedDays = thisStart ? holidayDates.filter(d => d >= thisStart && d <= thisEnd) : [];

  const result: RecyclingData = {
    thisWeek,
    nextWeek,
    upcomingWeeks,
    holidayDelay,
    affectedDays,
  };

  await setCache('recycling', result);
  return result;
}

// ─── Alerts fetcher ───────────────────────────────────────────────
async function fetchAlerts(): Promise<AlertsData> {
  const cached = await getCached<AlertsData>('alerts', TTL.alerts);
  if (cached) return cached;

  const res = await fetch(proxyUrl(FEEDS.alerts));
  if (!res.ok) throw new Error('Alerts fetch failed');
  const text = await res.text();
  const items = getRssItems(text);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const activeAlerts: AlertItem[] = items
    .filter(item => {
      const pub = new Date(getItemText(item.pubDate));
      return pub >= sevenDaysAgo;
    })
    .map(item => ({
      title: stripHtml(getItemText(item.title)),
      description: stripHtml(getItemText(item.description ?? item['content:encoded'] ?? '')),
      pubDate: getItemText(item.pubDate),
      link: getItemText(item.link),
    }));

  const result: AlertsData = {
    hasActiveAlerts: activeAlerts.length > 0,
    activeAlerts,
  };

  await setCache('alerts', result);
  return result;
}

// ─── Curated seed events ──────────────────────────────────────────
// Known Jamestown events that may not appear in any feed.
// Add new entries here as they're confirmed. Keep sorted by startDate.
const CURATED_EVENTS: EventItem[] = [

  {
    title: 'V Boys Basketball — Far West Regionals vs. Fairport',
    startDate: '2026-03-13T17:00:00',
    endDate: '2026-03-13T19:00:00',
    location: 'Buffalo State Sports Arena, Buffalo',
    category: 'Sports',
    tags: ['JPS', 'Athletics'],
    link: 'https://www.jpsny.org/calendar',
  },
  {
    title: 'Turn the Chadakoin River Green',
    startDate: '2026-03-14T12:00:00',
    endDate: '2026-03-14T14:00:00',
    location: 'Chadakoin River, downtown Jamestown',
    category: 'Community',
    tags: ["St. Patrick's Day", 'Annual'],
  },
  {
    title: 'Educator Seminar: Evidence Comes in All Forms',
    startDate: '2026-03-13T08:00:00',
    endDate: '2026-03-13T15:00:00',
    location: 'Robert H. Jackson Center, Jamestown',
    category: 'Education',
    tags: ['Jackson Center'],
    link: 'https://www.roberthjackson.org/events/',
  },
  {
    title: 'Living Voices: The New American',
    startDate: '2026-03-17T09:00:00',
    endDate: '2026-03-18T14:15:00',
    location: 'Robert H. Jackson Center, Jamestown',
    category: 'Arts & Education',
    tags: ['Jackson Center', 'Theater'],
    link: 'https://www.roberthjackson.org/events/',
  },
  {
    title: '25 Years of Asking Questions: What Makes a Life Matter?',
    startDate: '2026-03-18T18:00:00',
    endDate: '2026-03-18T19:00:00',
    location: 'Robert H. Jackson Center, Jamestown',
    category: 'Lecture',
    tags: ['Jackson Center'],
    link: 'https://www.roberthjackson.org/events/',
  },
  {
    title: 'The Ethics and Philosophy of Prosecution',
    startDate: '2026-04-10T12:00:00',
    endDate: '2026-04-10T13:00:00',
    location: 'Robert H. Jackson Center, Jamestown',
    category: 'Lecture',
    tags: ['Jackson Center'],
    link: 'https://www.roberthjackson.org/events/',
  },
  // ─── Jamestown Farmers Market (2nd & 4th Saturdays) ──────────
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-03-14T09:00:00',
    endDate:   '2026-03-14T13:00:00',
    location: '410 N Main St, Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-03-28T09:00:00',
    endDate:   '2026-03-28T13:00:00',
    location: '410 N Main St, Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-04-11T09:00:00',
    endDate:   '2026-04-11T13:00:00',
    location: '410 N Main St, Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-04-25T09:00:00',
    endDate:   '2026-04-25T13:00:00',
    location: '410 N Main St, Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-05-09T09:00:00',
    endDate:   '2026-05-09T13:00:00',
    location: '17 W 3rd St, Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-05-23T09:00:00',
    endDate:   '2026-05-23T13:00:00',
    location: '17 W 3rd St, Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-06-13T09:00:00',
    endDate:   '2026-06-13T13:00:00',
    location: '17 W 3rd St, Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-06-27T09:00:00',
    endDate:   '2026-06-27T13:00:00',
    location: '17 W 3rd St, Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
  },

  // ─── Fenton History Center ────────────────────────────────────

  {
    title: 'Trivia Night at Shawbucks',
    startDate: '2026-03-18T19:00:00',
    endDate:   '2026-03-18T21:00:00',
    location: 'Shawbucks, Jamestown',
    category: 'Community',
    tags: ['Fenton', 'Community'],
    link: 'https://fentonhistorycenter.org/events2/',
  },
  {
    title: 'Trivia Night at Shawbucks',
    startDate: '2026-03-25T19:00:00',
    endDate:   '2026-03-25T21:00:00',
    location: 'Shawbucks, Jamestown',
    category: 'Community',
    tags: ['Fenton', 'Community'],
    link: 'https://fentonhistorycenter.org/events2/',
  },
  {
    title: 'Vets Finding Vets — Fenton Canteen',
    startDate: '2026-04-11T10:00:00',
    endDate:   '2026-04-11T12:00:00',
    location: 'Fenton History Center, Jamestown',
    category: 'Community',
    tags: ['Fenton', 'Community'],
    link: 'https://fentonhistorycenter.org/events2/',
  },
  // ─── Roger Tory Peterson Institute ───────────────────────────
  {
    title: 'Exhibition Opening: Art That Matters to the Planet',
    startDate: '2026-03-27T17:00:00',
    endDate:   '2026-03-27T19:00:00',
    location: 'The Lodge at RTPI, Jamestown',
    category: 'Arts',
    tags: ['RTPI', 'Arts'],
    link: 'https://rtpi.org/programs/',
  },
  {
    title: '50th Annual Banff Centre Mountain Film Festival',
    startDate: '2026-04-24T19:00:00',
    endDate:   '2026-04-25T22:00:00',
    location: 'Reg Lenna Center, Jamestown',
    category: 'Arts & Entertainment',
    tags: ['RTPI', 'Reg Lenna', 'Festival'],
    link: 'https://rtpi.org/programs/',
  },
  {
    title: 'Jennifer Anderson Gallery Talk & Drypoint Demo',
    startDate: '2026-04-25T11:00:00',
    endDate:   '2026-04-25T12:00:00',
    location: 'The Lodge at RTPI, Jamestown',
    category: 'Arts',
    tags: ['RTPI', 'Arts'],
    link: 'https://rtpi.org/programs/',
  },
  {
    title: 'Spark Bird Project Celebration',
    startDate: '2026-05-01T13:00:00',
    endDate:   '2026-05-01T14:00:00',
    location: 'Online (Zoom)',
    category: 'Community',
    tags: ['RTPI'],
    link: 'https://rtpi.org/programs/',
  },
  {
    title: '2026 Plein Air Festival',
    startDate: '2026-09-17T09:00:00',
    endDate:   '2026-09-19T17:00:00',
    location: 'The Lodge at RTPI, Jamestown',
    category: 'Arts',
    tags: ['RTPI', 'Arts', 'Festival'],
    link: 'https://rtpi.org/programs/',
  },
  {
    title: "Jamestown's 78th Annual Easter Egg Hunt",
    startDate: '2026-03-28T10:00:00',
    endDate: '2026-03-28T12:00:00',
    location: 'Allen Park Soccer Fields, Jamestown',
    category: 'Community',
    tags: ['Annual', 'Family'],
  },
];

// ─── Events fetcher ───────────────────────────────────────────────

async function fetchEvents(): Promise<EventItem[]> {
  const cached = await getCached<EventItem[]>('events', TTL.events);
  if (cached) return cached;

  // Fetch all sources in parallel
  const [wrfaEvents, libraryContent, regLennaEvents] = await Promise.all([
    fetchWrfaEvents(),
    fetchLibraryContent(),
    fetchRegLennaEvents(),
  ]);
  const libraryEvents = libraryContent.events;

  // BPU civic calendar fallback
  let bpuEvents: EventItem[] = [];
  try {
    const res = await fetch(proxyUrl(FEEDS.eventsFallback));
    if (res.ok) {
      const text = await res.text();
      const items = getRssItems(text);
      const today = new Date();
      bpuEvents = items
        .filter(item => new Date(getItemText(item.pubDate)) >= today)
        .slice(0, 6)
        .map(item => ({
          title: stripHtml(getItemText(item.title)),
          startDate: getItemText(item.pubDate),
          endDate: getItemText(item.pubDate),
          location: 'Jamestown, NY',
          category: 'Civic',
          tags: ['BPU'],
        }));
    }
  } catch {}

  // Merge all sources — normalized dedup key: title+date
  function dedupeKey(e: EventItem): string {
    return e.title.toLowerCase().replace(/\s+/g, '') +
      (e.startDate?.split('T')[0] ?? '');
  }

  const seen = new Set<string>();
  const merged: EventItem[] = [];

  // Priority: Reg Lenna (structured) → Library → WRFA → BPU
  for (const e of [...regLennaEvents, ...libraryEvents, ...wrfaEvents, ...bpuEvents]) {
    const key = dedupeKey(e);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(e);
    }
  }

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  const result = merged
    .filter(e => new Date(e.startDate) >= cutoff)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  await setCache('events', result);
  return result;
}

// Always merge curated events on top of fetched results — never cached out
function mergeCurated(fetched: EventItem[]): EventItem[] {
  function key(e: EventItem) {
    return e.title.toLowerCase().replace(/\s+/g, '') + (e.startDate?.split('T')[0] ?? '');
  }
  const seen = new Set(fetched.map(key));
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  const fresh = CURATED_EVENTS.filter(e => new Date(e.startDate) >= cutoff);
  const combined = [
    ...fresh.filter(e => !seen.has(key(e))),
    ...fetched,
  ];
  return combined.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

// ─── Reg Lenna events ─────────────────────────────────────────────

async function fetchRegLennaEvents(): Promise<EventItem[]> {
  // Use own cache key so failures don't erase previous successful results
  const cached = await getCached<EventItem[]>('reglenna', TTL.events);
  if (cached) return cached;

  try {
    const res = await fetch(proxyUrl(FEEDS.regLenna));
    if (!res.ok) throw new Error('Reg Lenna fetch failed');
    const json = await res.json();

    const items: any[] = json.items ?? [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = items
      .filter(item => new Date(item.startDate) >= today)
      .slice(0, 15)
      .map(item => ({
        title: stripHtml(item.title ?? ''),
        startDate: new Date(item.startDate).toISOString(),
        endDate: item.endDate ? new Date(item.endDate).toISOString() : new Date(item.startDate).toISOString(),
        location: item.location?.addressTitle ?? item.location?.addressLine1 ?? 'Reg Lenna Center, Jamestown',
        category: 'Arts & Entertainment',
        tags: ['Reg Lenna'],
        link: item.fullUrl ? `https://reglenna.com${item.fullUrl}` : undefined,
      }));

    await setCache('reglenna', events);
    return events;
  } catch {
    // Return stale cache rather than empty — better to show old data than nothing
    const stale = await AsyncStorage.getItem(`${CACHE_PREFIX}reglenna`);
    if (stale) {
      try { return JSON.parse(stale).data ?? []; } catch { return []; }
    }
    return [];
  }
}

// ─── Chautauqua County alerts supplement ─────────────────────────

async function fetchChautauquaAlerts(): Promise<AlertItem[]> {
  try {
    const res = await fetch(proxyUrl(FEEDS.chautauquaAlerts));
    if (!res.ok) return [];
    const text = await res.text();
    const items = getRssItems(text);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return items
      .filter(item => new Date(getItemText(item.pubDate ?? '')) >= sevenDaysAgo)
      .slice(0, 5)
      .map(item => ({
        title: stripHtml(getItemText(item.title)),
        description: stripHtml(getItemText(item.description ?? '')),
        pubDate: getItemText(item.pubDate),
        link: getItemText(item.link),
      }));
  } catch {
    return [];
  }
}

// ─── LOTD podcast fetcher ─────────────────────────────────────────

function parseEpisodeTitle(raw: string): { number: string; name: string } {
  // "Episode 570 - Clowning Around" → { number: "570", name: "Clowning Around" }
  const m = raw.match(/Episode\s+(\d+)\s*[-–]+\s*(.+)/i);
  if (m) return { number: m[1], name: m[2].trim() };
  return { number: '', name: raw.trim() };
}

async function fetchLOTD(): Promise<PodcastEpisode | null> {
  const cached = await getCached<PodcastEpisode>('lotd', TTL.lotd);
  if (cached) return cached;

  const res = await fetch(proxyUrl(FEEDS.lotd));
  if (!res.ok) throw new Error('LOTD fetch failed');
  const text = await res.text();
  const items = getRssItems(text);
  if (items.length === 0) return null;

  const item = items[0]; // latest episode
  const rawTitle = getItemText(item.title ?? '');
  const { number, name } = parseEpisodeTitle(rawTitle);

  // Enclosure holds the audio URL
  const enclosure = item.enclosure;
  const audioUrl = enclosure?.['@_url'] ?? getItemText(enclosure?.url ?? '');

  const episode: PodcastEpisode = {
    show: 'Live On Tape Delay',
    episodeNumber: number,
    title: name,
    duration: getItemText(item['itunes:duration'] ?? ''),
    pubDate: getItemText(item.pubDate ?? ''),
    audioUrl,
    pageUrl: getItemText(item.link ?? 'https://lotdpodcast.com'),
    artworkUrl: 'https://static.libsyn.com/p/assets/f/b/a/f/fbafda2d2aff7661/LOTD_Logo_2018_Lit.jpg',
  };

  await setCache('lotd', episode);
  return episode;
}

// ─── Date extraction from article titles ─────────────────────────
// WRFA articles embed event dates in natural language titles.
// e.g. "Lecture Set For March 18", "Exhibition Opens Saturday"
// We try to extract the real event date before falling back to pubDate.

function extractEventDate(title: string, pubDateStr: string): string {
  const pub = new Date(pubDateStr);
  const t = title.toLowerCase();
  const year = pub.getFullYear();

  // Pattern: "March 18", "April 5th", "Feb. 14", etc.
  const MONTHS: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7,
    aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };
  const monthPattern = new RegExp(
    `\\b(${Object.keys(MONTHS).join('|')})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i'
  );
  const monthMatch = t.match(monthPattern);
  if (monthMatch) {
    const month = MONTHS[monthMatch[1].toLowerCase().replace('.', '')];
    const day   = parseInt(monthMatch[2], 10);
    if (month && day) {
      const d = new Date(year, month - 1, day, 12, 0, 0);
      // If the date is more than 2 months in the past, try next year
      if (d < new Date(pub.getTime() - 60 * 24 * 60 * 60 * 1000)) {
        d.setFullYear(year + 1);
      }
      return d.toISOString();
    }
  }

  // Pattern: "opens saturday", "this friday", "next thursday", etc.
  const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let wi = 0; wi < WEEKDAYS.length; wi++) {
    if (t.includes(WEEKDAYS[wi])) {
      const pubDay = pub.getDay();
      let diff = wi - pubDay;
      if (diff <= 0) diff += 7; // always look forward
      const d = new Date(pub);
      d.setDate(pub.getDate() + diff);
      d.setHours(12, 0, 0, 0);
      return d.toISOString();
    }
  }

  // Pattern: "tonight", "tomorrow"
  if (t.includes('tonight')) {
    const d = new Date(pub); d.setHours(19, 0, 0, 0); return d.toISOString();
  }
  if (t.includes('tomorrow')) {
    const d = new Date(pub); d.setDate(pub.getDate() + 1); d.setHours(12, 0, 0, 0); return d.toISOString();
  }

  return pubDateStr; // fallback to publication date
}

// ─── WRFA events supplement ───────────────────────────────────────

// Keyword list for event-like headlines
const EVENT_KEYWORDS = /presents|to host|to perform|concert|exhibit|show|festival|expo|fair|forum|lecture|ceremony|opening|workshop|audition|celebration|annual|invites|parade|ribbon|groundbreaking|memorial|tribute|gala|reception|fundraiser|benefit|tournament|race|run|walk|market|sale|auction|screening|premiere|debut|launch|rally|vigil|conference|summit|symposium|performance|recital|competition|showcase/i;

// Patterns that look event-like but aren't — news articles, calls for submissions, stats
const NOT_EVENT = /calling for|call for|seeks? (volunteers?|presenters?|applicants?)|applications? (now )?open|(now )?accepting|crime (is |are )?(down|up)|statistics|report|survey|deadline|nominations|seeking/i;

async function fetchWrfaEvents(): Promise<EventItem[]> {
  try {
    const res = await fetch(proxyUrl(FEEDS.news));
    if (!res.ok) return [];
    const text = await res.text();
    const items = getRssItems(text);

    // Look back 14 days for articles (event may still be upcoming even if article is older)
    const articleCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return items
      .filter(item => !getItemText(item.title ?? '').startsWith('[LISTEN]'))
      .filter(item => {
        const title = getItemText(item.title ?? '');
        return EVENT_KEYWORDS.test(title) && !NOT_EVENT.test(title);
      })
      .filter(item => new Date(getItemText(item.pubDate ?? '')) >= articleCutoff)
      .slice(0, 12)
      .map(item => {
        const title = stripHtml(getItemText(item.title))
          .replace(/^City of Jamestown\s+(Invites\s+Community\s+to\s+)?/i, '');
        const t = title.toLowerCase();

        let category = 'Community';
        let tags: string[] = [];

        if (/concert|perform|recital|symphony|choir|band|music|jazz|blues/i.test(t)) {
          category = 'Music'; tags = ['Music'];
        } else if (/theater|theatre|play|musical|opera|presents|penzance|stage|curtain/i.test(t)) {
          category = 'Theater'; tags = ['Theater', 'Arts'];
        } else if (/exhibit|gallery|art show|art\s+exhibition|museum/i.test(t)) {
          category = 'Arts'; tags = ['Arts'];
        } else if (/festival|expo|fair|market/i.test(t)) {
          category = 'Festival'; tags = ['Festival'];
        } else if (/parade|celebration|ceremony|annual/i.test(t)) {
          category = 'Community'; tags = ['Community'];
        } else if (/fundraiser|benefit|gala|auction/i.test(t)) {
          category = 'Fundraiser'; tags = ['Fundraiser'];
        } else if (/lecture|forum|summit|symposium/i.test(t)) {
          category = 'Civic'; tags = ['Civic'];
        } else {
          category = 'Community'; tags = ['Community'];
        }

        const pubDate = getItemText(item.pubDate);
        const startDate = extractEventDate(title, pubDate);
        return {
          title,
          startDate,
          endDate: startDate,
          location: 'Jamestown, NY',
          category,
          tags,
          link: getItemText(item.link ?? '') || undefined,
        };
      });
  } catch {
    return [];
  }
}

// ─── Library fetcher ──────────────────────────────────────────────

async function fetchLibraryContent(): Promise<{ events: EventItem[]; news: NewsItem[] }> {
  try {
    const res = await fetch(proxyUrl(FEEDS.library));
    if (!res.ok) return { events: [], news: [] };
    const text = await res.text();
    const items = getRssItems(text);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const articleCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // library posts less frequently

    const recentItems = items.filter(item =>
      new Date(getItemText(item.pubDate ?? '')) >= articleCutoff
    );

    // Events: items that sound like something happening on a date
    const events: EventItem[] = recentItems
      .filter(item => EVENT_KEYWORDS.test(getItemText(item.title ?? '')) ||
                      /vote|application|registration|appointment|block party|program|storytime/i.test(getItemText(item.title ?? '')))
      .slice(0, 6)
      .map(item => ({
        title: stripHtml(getItemText(item.title)),
        startDate: getItemText(item.pubDate),
        endDate: getItemText(item.pubDate),
        location: 'Prendergast Library, Jamestown',
        category: 'Library',
        tags: ['Library'],
      }));

    // News: top 2 items for the news strip
    const news: NewsItem[] = recentItems.slice(0, 2).map(item => ({
      title: stripHtml(getItemText(item.title)),
      link: getItemText(item.link),
      pubDate: getItemText(item.pubDate),
      excerpt: stripHtml(getItemText(item.description ?? '')).slice(0, 140),
    }));

    return { events, news };
  } catch {
    return { events: [], news: [] };
  }
}

// ─── News fetcher ─────────────────────────────────────────────────
async function fetchNews(): Promise<NewsItem[]> {
  const cached = await getCached<NewsItem[]>('news', TTL.news);
  if (cached) return cached;

  // Fetch WRFA, city, and Jackson Center in parallel
  const [wrfaRes, cityRes, jacksonRes] = await Promise.allSettled([
    fetch(proxyUrl(FEEDS.news)),
    fetch(proxyUrl(FEEDS.cityNews)),
    fetch(proxyUrl(FEEDS.jackson)),
  ]);

  function toNewsItems(res: Response | null, raw: string, limit: number): NewsItem[] {
    const items = getRssItems(raw);
    return items
      .filter(item => {
        const title = getItemText(item.title ?? '');
        return !title.startsWith('[LISTEN]') && !title.startsWith('[WATCH]');
      })
      .slice(0, limit)
      .map(item => ({
        title: stripHtml(getItemText(item.title)),
        link: getItemText(item.link),
        pubDate: getItemText(item.pubDate),
        excerpt: stripHtml(getItemText(item.description ?? '')).slice(0, 140),
      }));
  }

  const wrfaItems = wrfaRes.status === 'fulfilled' && wrfaRes.value.ok
    ? toNewsItems(wrfaRes.value, await wrfaRes.value.text(), 3)
    : [];

  const cityItems = cityRes.status === 'fulfilled' && cityRes.value.ok
    ? toNewsItems(cityRes.value, await cityRes.value.text(), 2)
    : [];

  const jacksonItems = jacksonRes.status === 'fulfilled' && jacksonRes.value.ok
    ? toNewsItems(jacksonRes.value, await jacksonRes.value.text(), 2)
    : [];

  // Merge: WRFA → city → Jackson, dedupe by title, cap at 6
  const seen = new Set(wrfaItems.map(n => n.title.toLowerCase()));
  const addUnique = (items: NewsItem[]) =>
    items.filter(n => !seen.has(n.title.toLowerCase()) && seen.add(n.title.toLowerCase()));

  const news: NewsItem[] = [
    ...wrfaItems,
    ...addUnique(cityItems),
    ...addUnique(jacksonItems),
  ].slice(0, 6);

  await setCache('news', news);
  return news;
}

// ─── Main hook ────────────────────────────────────────────────────
export function useCivicData(): CivicData {
  const [state, setState] = useState<Omit<CivicData, 'refresh'>>(DEFAULTS);

  const load = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    // Always computed fresh
    const parking = computeParking();
    const { hasDelay, affectedDays } = computeHolidayDelay();

    // Fetch all in parallel, individual failures don't block the rest
    const [recyclingResult, alertsResult, eventsResult, newsResult, lotdResult, libraryResult, countyAlertsResult] = await Promise.allSettled([
      fetchRecyclingICS(),
      fetchAlerts(),
      fetchEvents(),
      fetchNews(),
      fetchLOTD(),
      fetchLibraryContent(),
      fetchChautauquaAlerts(),
    ]);

    const recycling = recyclingResult.status === 'fulfilled'
      ? recyclingResult.value
      : { ...DEFAULTS.recycling, holidayDelay: hasDelay, affectedDays };

    // Merge BPU alerts + Chautauqua County alerts, dedupe by title
    const bpuAlerts = alertsResult.status === 'fulfilled' ? alertsResult.value : DEFAULTS.alerts;
    const countyAlerts = countyAlertsResult.status === 'fulfilled' ? (countyAlertsResult.value as AlertItem[]) : [];
    const seenAlertTitles = new Set(bpuAlerts.activeAlerts.map(a => a.title.toLowerCase()));
    const mergedAlertItems = [
      ...bpuAlerts.activeAlerts,
      ...countyAlerts.filter(a => !seenAlertTitles.has(a.title.toLowerCase())),
    ];
    const alerts: AlertsData = {
      hasActiveAlerts: mergedAlertItems.length > 0,
      activeAlerts: mergedAlertItems,
    };

    const events = mergeCurated(
      eventsResult.status === 'fulfilled' ? eventsResult.value : []
    );

    // Merge WRFA + library news, dedupe by title, cap at 5 items
    const wrfaNews = newsResult.status === 'fulfilled' ? newsResult.value : [];
    const libraryNews = libraryResult.status === 'fulfilled' ? (libraryResult.value as any).news ?? [] : [];
    const seenTitles = new Set(wrfaNews.map((n: NewsItem) => n.title.toLowerCase()));
    const news: NewsItem[] = [
      ...wrfaNews,
      ...libraryNews.filter((n: NewsItem) => !seenTitles.has(n.title.toLowerCase())),
    ].slice(0, 5);

    const latestEpisode = lotdResult.status === 'fulfilled'
      ? lotdResult.value
      : null;

    // Library and county-alerts failures are non-critical — intentionally excluded from error banner
    const anyFailed = [recyclingResult, alertsResult, eventsResult, newsResult, lotdResult]
      .some(r => r.status === 'rejected');

    setState({
      loading: false,
      error: anyFailed ? 'Could not load live data — showing last cached info.' : null,
      recycling,
      parking,
      alerts,
      events,
      news,
      latestEpisode,
      lastUpdated: new Date().toISOString(),
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  return { ...state, refresh: load };
}
