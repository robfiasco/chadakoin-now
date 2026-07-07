import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { XMLParser } from 'fast-xml-parser';
import { fetchSourceHealth } from './useSourceHealth';

export interface RecyclingWeek {
  material: string;
  dateRange: string;
  exclusions: string;
  note?: string;
  startDate: string;   // ISO date string for sorting (YYYY-MM-DD)
  emoji: string;       // material emoji for display
}

export interface RecyclingData {
  thisWeek: RecyclingWeek;
  nextWeek: RecyclingWeek;
  upcomingWeeks: RecyclingWeek[];  // next 4 weeks beyond nextWeek
  holidayDelay: boolean;
  affectedDays: string[];
  upcomingHoliday: { name: string; date: string } | null;
}

export interface ParkingData {
  active: boolean;
  side: 'EVEN' | 'ODD' | null;
  isWinter: boolean; // true = Nov–Mar daily mode, false = Apr–Oct monthly mode
  mode: 'daily' | 'monthly';
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
  endDate?: string;
  location: string;
  category: string;
  tags: string[];
  link?: string;
  imageUrl?: string;
  note?: string;
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  excerpt: string;
  source?: string;
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

const FEEDS = {
  recyclingICS: 'https://www.jamestownnybpu.gov/common/modules/iCalendar/iCalendar.aspx?feed=calendar&catID=24',
  alerts: 'https://www.jamestownbpu.com/RSSFeed.aspx?ModID=63&CID=Alerts-11',
  eventsFallback: 'https://www.jamestownbpu.com/RSSFeed.aspx?ModID=58&CID=Jamestown-Board-Meeting-Calendar-23',
  news: 'https://www.wrfalp.com/feed/',
  cityNews: 'https://www.jamestownny.gov/feed/',
  wgrzSports: 'https://www.wgrz.com/feeds/syndication/rss/sports',
  wgrzWNY:         'https://www.wgrz.com/feeds/syndication/rss/news/local/wny',
  wgrzSouthernTier: 'https://www.wgrz.com/feeds/syndication/rss/news/local/southern-tier',
  spectrumWNY:     'https://spectrumlocalnews.com/nys/buffalo/rss/local-news.rss',
  wnyNewsNow:      'https://wnynewsnow.com/category/jamestown/feed/',
  // WRFA-down fallback — Media One Radio Group daily Jamestown/Chautauqua roundups
  wjtn: 'https://wjtn.com/news-and-closings/local-news-headlines/feed.xml',
  library: 'https://prendergastlibrary.org/feed/',
  lotd: 'https://rss.libsyn.com/shows/66268/destinations/266592.xml',
  regLenna: 'https://reglenna.com/events?format=json',
  chautauquaAlerts: 'https://chautauquacountyny.gov/rss.xml',
  jackson: 'https://www.roberthjackson.org/feed/',
  fenton: 'https://fentonhistorycenter.org/?post_type=mec-events&feed=rss2',
};

const TTL = {
  recycling: 24 * 60 * 60 * 1000,   // 24h
  events:     1 * 60 * 60 * 1000,   // 1h
  alerts:     5 * 60 * 1000,        // 5min
  news:       2 * 60 * 60 * 1000,   // 2h
  lotd:      12 * 60 * 60 * 1000,   // 12h — weekly show
};

// BPU only observes 6 holidays for collection delay (per 2026 Recycling Calendar):
// New Year's Day, Memorial Day, Independence Day, Labor Day, Thanksgiving, Christmas
// Update annually
const BPU_HOLIDAYS_2026 = [
  '2026-01-01', '2026-05-25', '2026-07-04',
  '2026-09-07', '2026-11-26', '2026-12-25',
];

const BPU_HOLIDAYS_2027 = [
  '2027-01-01', '2027-05-31', '2027-07-05',  // Jul 4 = Sunday → observed Mon Jul 5
  '2027-09-06', '2027-11-25', '2027-12-24',  // Dec 25 = Saturday → observed Fri Dec 24
];

const FEDERAL_HOLIDAYS = [...BPU_HOLIDAYS_2026, ...BPU_HOLIDAYS_2027];

const HOLIDAY_NAMES: Record<string, string> = {
  '2026-01-01': "New Year's Day",
  '2026-05-25': 'Memorial Day',
  '2026-07-04': 'Independence Day',
  '2026-09-07': 'Labor Day',
  '2026-11-26': 'Thanksgiving',
  '2026-12-25': 'Christmas',
  '2027-01-01': "New Year's Day",
  '2027-05-31': 'Memorial Day',
  '2027-07-05': 'Independence Day',
  '2027-09-06': 'Labor Day',
  '2027-11-25': 'Thanksgiving',
  '2027-12-24': 'Christmas',
};

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
    upcomingHoliday: null,
  },
  parking: { active: true, side: null, isWinter: false, mode: 'monthly' as const, switchTime: '1st of month', rule: '' },
  alerts: { hasActiveAlerts: false, activeAlerts: [] },
  events: [],
  news: [],
  latestEpisode: null,
  lastUpdated: null,
};

// Routes RSS/JSON requests through our own Vercel API endpoint.
// Web needs it for CORS; native needs it because many news sources
// (WordPress, WGRZ, etc.) reject non-browser user agents and the
// edge function adds proper headers. Both platforms go through proxy.
const NATIVE_API_HOST = 'https://now.chadakoindigital.com';
function proxyUrl(url: string): string {
  const path = `/api/proxy?url=${encodeURIComponent(url)}`;
  return Platform.OS === 'web' ? path : `${NATIVE_API_HOST}${path}`;
}

// Web goes through the Vercel proxy which has its own timeouts.
// Native uses AbortController + setTimeout (portable across Hermes/RN — AbortSignal.timeout
// is missing in some RN fetch polyfills and throws synchronously, killing parallel fetches).
const FEED_TIMEOUT_MS = 15000;
function feedFetch(url: string): Promise<Response> {
  if (Platform.OS === 'web') return fetch(url);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FEED_TIMEOUT_MS);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
}

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
    .replace(/&apos;/g, "'")
    .replace(/&#x[0-9a-fA-F]+;/g, '')
    .replace(/&#\d+;/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Bump to bust stale cached data across all clients
const CACHE_PREFIX = 'civic_v30_';

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

// Returns cached data regardless of age — for stale-while-revalidate patterns
async function getStaleCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const { data } = JSON.parse(raw);
    return (data as T) ?? null;
  } catch {
    return null;
  }
}

async function setCache(key: string, data: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
}

// Jamestown alternate-side rules:
//   Nov 1 – Mar 31 (daily):   even date → even side, odd date → odd side, move by 10:00 AM
//   Apr 1 – Oct 31 (monthly): even month → even side, odd month → odd side, same all month
function computeParking(): ParkingData {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const isWinter = month >= 11 || month <= 3;

  if (isWinter) {
    const side: 'EVEN' | 'ODD' = day % 2 === 0 ? 'EVEN' : 'ODD';
    return {
      active: true,
      side,
      isWinter: true,
      mode: 'daily',
      switchTime: '10:00 AM',
      rule: 'Even date → even side. Odd date → odd side. Move by 10:00 AM.',
    };
  }

  const side: 'EVEN' | 'ODD' = month % 2 === 0 ? 'EVEN' : 'ODD';
  return {
    active: true,
    side,
    isWinter: false,
    mode: 'monthly',
    switchTime: '1st of month',
    rule: 'Even month → even side. Odd month → odd side. Side stays the same all month.',
  };
}

// Compute 7-day schedule from today's week.
// Daily mode (Nov–Mar): side flips by date. Monthly mode (Apr–Oct): same side all month.
export function computeParkingSchedule() {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function sideForDate(d: Date): 'EVEN' | 'ODD' {
    const m = d.getMonth() + 1;
    if (m >= 11 || m <= 3) return d.getDate() % 2 === 0 ? 'EVEN' : 'ODD';
    return m % 2 === 0 ? 'EVEN' : 'ODD';
  }

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date: `${MONTHS[d.getMonth()]} ${d.getDate()}`,
      day: DAYS[d.getDay()],
      side: sideForDate(d),
      isToday: d.toDateString() === today.toDateString(),
    };
  });
}

function computeHolidayDelay(): { hasDelay: boolean; affectedDays: string[]; upcomingHoliday: { name: string; date: string } | null } {
  const today = new Date();
  const dow = today.getDay();

  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);

  const weekDays = [0, 1, 2, 3].map(offset => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + offset);
    return d.toISOString().split('T')[0];
  });

  const affected = weekDays.filter(d => FEDERAL_HOLIDAYS.includes(d));

  // Look ahead 7 days for an upcoming holiday (so people can prepare)
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  const lookahead = new Date(today);
  lookahead.setDate(today.getDate() + 7);
  const lookaheadStr = lookahead.toISOString().split('T')[0];
  const nextHoliday = FEDERAL_HOLIDAYS.find(d => d > todayStr && d <= lookaheadStr && !affected.includes(d));
  const upcomingHoliday = nextHoliday ? { name: HOLIDAY_NAMES[nextHoliday] ?? 'Holiday', date: nextHoliday } : null;

  return { hasDelay: affected.length > 0, affectedDays: affected, upcomingHoliday };
}

function parseIcsDate(raw: string): Date | null {
  // ICS date formats: "20260309T120000" (datetime) or "20260309" (date-only)
  const clean = raw.replace(/.*:/,'').trim(); // strip "TZID=...:" prefix
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
    // Strip trailing URLs if they got caught in the text
    exclusions = exclusions.replace(/\s*https?:\/\/[^\s]+$/, '').trim();
  }

  let note = '';
  const noteMatch = description.match(/\*\s*([Ff]latten[^\*]+)/);
  if (noteMatch) {
    note = noteMatch[1].trim();
  }

  let material: string;
  if (lowerSummary.includes('cardboard') || lowerSummary.includes('corrugated') || lowerSummary.includes('box board') || lowerSummary.includes('boxboard')) {
    material = 'Corrugated Cardboard & Boxboard';
  } else if (lowerSummary.includes('plastic')) {
    material = 'Plastics (bottles, jugs, containers — no lids)';
  } else if (lowerSummary.includes('paper')) {
    material = 'Paper (newspaper, magazines, junk mail, envelopes, paper bags)';
  } else if (lowerSummary.includes('metal') || lowerSummary.includes('tin') || lowerSummary.includes('alumin')) {
    material = 'Metals & Cans (aluminum, tin)';
  } else if (lowerSummary.includes('glass')) {
    material = 'Glass';
  } else {
    const cut = summary.match(/^(.+?)(?:\s+(?:week|only|recycling)\b|\s*[-:—–])/i);
    material = cut ? cut[1].trim() : summary.replace(/,\s*$/, '').trim();
  }

  let dateRange = '';
  if (start && end) {
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    // DTEND in ICS is the exclusive end — same-day means it's the last day of the pickup window
    dateRange = `${fmt(start)} – ${fmt(end)}`;
  }

  const startDate = start ? start.toISOString().split('T')[0] : '';
  const emoji = recyclingEmoji(lowerSummary);

  return { material, dateRange, exclusions, note, startDate, emoji };
}

async function fetchRecyclingICS(): Promise<RecyclingData> {
  const cached = await getCached<RecyclingData>('recycling', TTL.recycling);
  if (cached) return cached;

  const res = await feedFetch(proxyUrl(FEEDS.recyclingICS));
  if (!res.ok) throw new Error(`Recycling ICS fetch failed: ${res.status}`);
  const text = await res.text();

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

    if (lower.includes('no garbage') || lower.includes('no recycling')) {
      if (start) holidayDates.push(start.toISOString().split('T')[0]);
      continue;
    }

    // Skip non-recycling BPU events (yard waste site open/close, etc.)
    const isRecycling = [
      'cardboard', 'plastic', 'paper', 'metal', 'glass', 'recycling'
    ].some(kw => lower.includes(kw));
    if (!isRecycling) continue;

    recyclingWeeks.push(parseRecyclingTitle(summary, description, start, end));
  }

  // ICS feed is in reverse chronological order
  recyclingWeeks.sort((a, b) => a.startDate.localeCompare(b.startDate));

  const today = new Date().toISOString().split('T')[0];
  let thisIdx = -1;
  for (let i = recyclingWeeks.length - 1; i >= 0; i--) {
    if (recyclingWeeks[i].startDate <= today) {
      thisIdx = i;
      break;
    }
  }
  if (thisIdx === -1 && recyclingWeeks.length > 0) thisIdx = 0;

  const thisWeek     = recyclingWeeks[thisIdx]     ?? EMPTY_WEEK;
  const nextWeek     = recyclingWeeks[thisIdx + 1] ?? EMPTY_WEEK;
  const upcomingWeeks = recyclingWeeks.slice(thisIdx + 2, thisIdx + 6);

  const thisStart = thisWeek.startDate;
  let thisEnd = '';
  if (thisStart) {
    const endD = new Date(thisStart + 'T12:00:00Z');
    endD.setDate(endD.getDate() + 6);
    thisEnd = endD.toISOString().split('T')[0];
  }
  
  const holidayDelay = thisStart ? holidayDates.some(d => d >= thisStart && d <= thisEnd) : false;
  const affectedDays = thisStart ? holidayDates.filter(d => d >= thisStart && d <= thisEnd) : [];

  const { upcomingHoliday } = computeHolidayDelay();

  const result: RecyclingData = {
    thisWeek,
    nextWeek,
    upcomingWeeks,
    holidayDelay,
    affectedDays,
    upcomingHoliday,
  };

  await setCache('recycling', result);
  return result;
}

async function fetchAlerts(): Promise<AlertsData> {
  const cached = await getCached<AlertsData>('alerts', TTL.alerts);
  if (cached) return cached;

  const res = await feedFetch(proxyUrl(FEEDS.alerts));
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

// Known events that don't appear in any feed. Keep sorted by startDate.
// Generates one compact entry per weekday through end of summer — expires naturally
function generateMobileMarketEvents(): EventItem[] {
  const items: EventItem[] = [];
  const cur = new Date('2026-06-10'); // First Wednesday
  const end = new Date('2026-08-28');
  while (cur <= end) {
    const dow = cur.getDay();
    const d = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`;
    if (dow === 3) {
      items.push({ title: 'Mobile Market', startDate: `${d}T11:00:00`, endDate: `${d}T14:30:00`, location: 'Prendergast Library', category: 'Community', tags: ['Mobile Market'], note: 'Prendergast 11am · Silvertree (Crane) 1:30pm · SNAP/EBT · Double Up Food Bucks', link: 'https://www.jfmny.org' });
    } else if (dow === 4) {
      items.push({ title: 'Mobile Market', startDate: `${d}T11:00:00`, endDate: `${d}T15:30:00`, location: 'The Chautauqua Center', category: 'Community', tags: ['Mobile Market'], note: 'Chautauqua Ctr 11am · Silvertree (Methodist) 12:30pm · Chautauqua Opp 2:30pm · SNAP/EBT', link: 'https://www.jfmny.org' });
    } else if (dow === 5) {
      items.push({ title: 'Mobile Market', startDate: `${d}T11:00:00`, endDate: `${d}T13:30:00`, location: 'TRC Community Health Center', category: 'Community', tags: ['Mobile Market'], note: 'TRC Health 11am · Silvertree (Carlson) 12:30pm · SNAP/EBT', link: 'https://www.jfmny.org' });
    }
    cur.setDate(cur.getDate() + 1);
  }
  return items;
}

const CURATED_EVENTS: EventItem[] = [
  ...generateMobileMarketEvents(),
  {
    title: 'Free Screening: Nathan-ism',
    startDate: '2026-06-06T18:00:00',
    endDate:   '2026-06-06T21:00:00',
    location: 'Robert H. Jackson Center, 305 E. 4th St., Jamestown',
    category: 'Community',
    tags: ['Jackson Center', 'Film'],
    link: 'https://www.roberthjackson.org/events/',
  },

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
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-03-14T09:00:00',
    endDate:   '2026-03-14T13:00:00',
    location: "St. Luke's Episcopal Church, 410 N Main St, Jamestown",
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-03-28T09:00:00',
    endDate:   '2026-03-28T13:00:00',
    location: "St. Luke's Episcopal Church, 410 N Main St, Jamestown",
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-04-11T09:00:00',
    endDate:   '2026-04-11T13:00:00',
    location: "St. Luke's Episcopal Church, 410 N Main St, Jamestown",
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-04-25T09:00:00',
    endDate:   '2026-04-25T13:00:00',
    location: "St. Luke's Episcopal Church, 410 N Main St, Jamestown",
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-05-09T09:00:00',
    endDate:   '2026-05-09T13:00:00',
    location: "St. Luke's Episcopal Church, 410 N Main St, Jamestown",
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-05-23T09:00:00',
    endDate:   '2026-05-23T13:00:00',
    location: "St. Luke's Episcopal Church, 410 N Main St, Jamestown",
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-06-06T09:00:00',
    endDate:   '2026-06-06T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-06-13T09:00:00',
    endDate:   '2026-06-13T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-06-20T09:00:00',
    endDate:   '2026-06-20T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-06-27T09:00:00',
    endDate:   '2026-06-27T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-07-04T09:00:00',
    endDate:   '2026-07-04T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market ArtFest',
    startDate: '2026-07-11T09:00:00',
    endDate:   '2026-07-11T15:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community', 'Arts'],
    link: 'https://jfmny.org/',
    note: 'Art-focused market · Pottery, paintings, prints & more · Sketch group with Chautauqua Art Gallery · SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-07-18T09:00:00',
    endDate:   '2026-07-18T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-07-25T09:00:00',
    endDate:   '2026-07-25T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-08-01T09:00:00',
    endDate:   '2026-08-01T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-08-08T09:00:00',
    endDate:   '2026-08-08T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-08-15T09:00:00',
    endDate:   '2026-08-15T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-08-22T09:00:00',
    endDate:   '2026-08-22T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-08-29T09:00:00',
    endDate:   '2026-08-29T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-09-05T09:00:00',
    endDate:   '2026-09-05T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-09-12T09:00:00',
    endDate:   '2026-09-12T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-09-19T09:00:00',
    endDate:   '2026-09-19T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-09-26T09:00:00',
    endDate:   '2026-09-26T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-10-03T09:00:00',
    endDate:   '2026-10-03T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-10-10T09:00:00',
    endDate:   '2026-10-10T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-10-17T09:00:00',
    endDate:   '2026-10-17T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-10-24T09:00:00',
    endDate:   '2026-10-24T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-10-31T09:00:00',
    endDate:   '2026-10-31T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-11-07T09:00:00',
    endDate:   '2026-11-07T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-11-14T09:00:00',
    endDate:   '2026-11-14T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },
  {
    title: 'Jamestown Farmers Market',
    startDate: '2026-11-21T09:00:00',
    endDate:   '2026-11-21T13:00:00',
    location: '3rd St & Pine St, Downtown Jamestown',
    category: 'Community',
    tags: ['Farmers Market', 'Community'],
    link: 'https://jfmny.org/',
    note: 'SNAP/EBT accepted',
  },

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
    title: 'The Folsom Prison Experience',
    startDate: '2026-04-19T19:30:00',
    endDate:   '2026-04-19T22:00:00',
    location: 'Reg Lenna Center, Jamestown',
    category: 'Music',
    tags: ['Reg Lenna', 'Concert', 'Johnny Cash'],
    link: 'https://reglenna.com',
    imageUrl: 'https://images.squarespace-cdn.com/content/v1/5d8668f1f6d3ed5360d8f8f2/6d5fc67e-f58e-42d8-af1d-0ced94d02e2a/Folsom+Event+New+Web.jpg?format=2500w',
  },
  {
    title: '50th Annual Banff Centre Mountain Film Festival',
    startDate: '2026-04-24T19:00:00',
    endDate:   '2026-04-25T22:00:00',
    location: 'Reg Lenna Center, Jamestown',
    category: 'Arts & Entertainment',
    tags: ['RTPI', 'Reg Lenna', 'Festival'],
    link: 'https://rtpi.org/programs/',
    imageUrl: 'https://rtpi.org/wp-content/uploads/2025/12/WT-NA-Horiz-16-9-2560x1440_25-1680x945.jpg',
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
  {
    title: 'Lecture: King Carl XVI Gustaf of Sweden Visited Jamestown 50 Years Ago',
    startDate: '2026-05-19T19:00:00',
    endDate: '2026-05-19T21:00:00',
    location: 'Fenton History Center, Jamestown',
    category: 'Lecture',
    tags: ['Fenton', 'History'],
    link: 'https://fentonhistorycenter.org',
  },
  {
    title: 'Plant Bingo at Labyrinth Press Co.',
    startDate: '2026-05-19T19:00:00',
    endDate: '2026-05-19T21:00:00',
    location: 'Labyrinth Press Co., Jamestown',
    category: 'Community',
    tags: ['Labyrinth', 'Events'],
    link: 'https://labpressco.com',
  },
  {
    title: 'Young Adult Book Club',
    startDate: '2026-05-20T17:30:00',
    endDate: '2026-05-20T18:30:00',
    location: 'Labyrinth Press Co., Jamestown',
    category: 'Community',
    tags: ['Labyrinth'],
    link: 'https://labpressco.com',
  },
  {
    title: 'Craft & Sip Thursdays @ The Lab',
    startDate: '2026-05-21T19:00:00',
    endDate: '2026-05-21T22:00:00',
    location: 'Labyrinth Press Co., Jamestown',
    category: 'Community',
    tags: ['Labyrinth'],
    link: 'https://labpressco.com',
  },
  {
    title: 'Craft & Sip Thursdays @ The Lab',
    startDate: '2026-05-28T19:00:00',
    endDate: '2026-05-28T22:00:00',
    location: 'Labyrinth Press Co., Jamestown',
    category: 'Community',
    tags: ['Labyrinth'],
    link: 'https://labpressco.com',
  },
  {
    title: 'Craft & Sip Thursdays @ The Lab',
    startDate: '2026-06-04T19:00:00',
    endDate: '2026-06-04T22:00:00',
    location: 'Labyrinth Press Co., Jamestown',
    category: 'Community',
    tags: ['Labyrinth'],
    link: 'https://labpressco.com',
  },
  {
    title: 'Book Club: Who Is Government? By Michael Lewis',
    startDate: '2026-06-13T15:30:00',
    endDate: '2026-06-13T17:00:00',
    location: 'Labyrinth Press Co., Jamestown',
    category: 'Community',
    tags: ['Labyrinth'],
    link: 'https://labpressco.com',
  },
  {
    title: 'Merry Mushroom – Paint Your Own Pottery Night',
    startDate: '2026-06-18T16:30:00',
    endDate: '2026-06-18T21:30:00',
    location: 'Labyrinth Press Co., Jamestown',
    category: 'Community',
    tags: ['Labyrinth'],
    link: 'https://labpressco.com',
  },

  // Music on the Stoop — Summer Patio Music Series at Labyrinth Press Co.
  { title: 'Music on the Stoop: Adam Gould',      startDate: '2026-05-29T18:00:00', endDate: '2026-05-29T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: Laura & Logan',   startDate: '2026-06-05T18:00:00', endDate: '2026-06-05T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: Marley Ohl',      startDate: '2026-06-12T18:00:00', endDate: '2026-06-12T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: Jarrod Eggleston', startDate: '2026-06-19T18:00:00', endDate: '2026-06-19T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: Miranda Wilcox',  startDate: '2026-06-26T18:00:00', endDate: '2026-06-26T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: Oliver Burdo',    startDate: '2026-06-30T18:00:00', endDate: '2026-06-30T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: Gavin Paterniti', startDate: '2026-07-07T18:00:00', endDate: '2026-07-07T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Safe Streets For All Launch Party', startDate: '2026-07-08T00:00:00', location: 'James Prendergast Library, Jamestown', category: 'Community', tags: ['Community', 'Family Friendly', 'Free'], note: 'Sidewalk safety chalk party · Pretend play · Outdoor games · Free', link: 'https://prendergastlibrary.org' },
  { title: 'Scandinavian Folk Festival', startDate: '2026-07-18T00:00:00', location: 'Northwest Arena, Jamestown', category: 'Arts & Entertainment', tags: ['Festival', 'Music', 'Community'], note: 'DemBones performing classic Scandinavian folk music & ABBA arrangements · Parade' },
  { title: 'Mister Green & Stereo Death', startDate: '2026-07-18T21:00:00', endDate: '2026-07-18T23:59:00', location: 'Jamestown Wine Cellar', category: 'Music', tags: ['Live Music'], link: 'https://www.jfmny.org/events' },
  { title: 'Farmers Market Kids Week', startDate: '2026-07-25T09:00:00', endDate: '2026-07-25T13:00:00', location: '3rd St & Pine St, Downtown Jamestown', category: 'Community', tags: ['Farmers Market', 'Family Friendly', 'Community'], note: 'Christmas in July · Petting zoo · Kids DJ · Bounce house · Live cooking demos · SNAP/EBT', link: 'https://jfmny.org/' },
  { title: 'The Good, The Bad, and The Guilty', startDate: '2026-07-25T00:00:00', location: 'Northwest Arena, Jamestown', category: 'Community', tags: ['Community', 'Family Friendly'], note: 'Family-friendly indoor activity · Hosted alongside Meals on Wheels' },
  { title: 'Music on the Stoop: Mike Brunacini',  startDate: '2026-07-14T18:00:00', endDate: '2026-07-14T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: Drew & Lena',     startDate: '2026-07-22T18:00:00', endDate: '2026-07-22T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: Kallie Williams', startDate: '2026-07-29T18:00:00', endDate: '2026-07-29T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: Drew Minton',     startDate: '2026-08-05T18:00:00', endDate: '2026-08-05T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: Davis & Eng',     startDate: '2026-08-11T18:00:00', endDate: '2026-08-11T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: Mandy Andrews',   startDate: '2026-08-19T18:00:00', endDate: '2026-08-19T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'WhirlyBird: Jade Giambrone',          startDate: '2026-08-28T16:00:00', endDate: '2026-08-28T18:00:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music', 'WhirlyBird'], link: 'https://labpressco.com' },
  { title: 'WhirlyBird: Oliver Burdo',            startDate: '2026-08-29T10:00:00', endDate: '2026-08-29T13:00:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music', 'WhirlyBird'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: The Predicamint', startDate: '2026-09-04T18:00:00', endDate: '2026-09-04T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: Logan Alexander', startDate: '2026-09-11T18:00:00', endDate: '2026-09-11T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: Gavin Paterniti', startDate: '2026-09-18T18:00:00', endDate: '2026-09-18T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },

  // — Tour Chautauqua sourced events ————————————————————————————————————————
  // May 21
  {
    title: 'ArtScape Art Opening',
    startDate: '2026-05-21T17:00:00',
    endDate: '2026-05-21T19:00:00',
    location: 'Chautauqua Art Gallery / Pearl City Clay House, Jamestown',
    category: 'Arts',
    tags: ['Art', 'Opening'],
    link: 'https://www.tourchautauqua.com/events/artscape-art-opening',
  },
  {
    title: 'Third on 3rd',
    startDate: '2026-05-21T18:00:00',
    endDate: '2026-05-21T21:00:00',
    location: '3rd Street, Downtown Jamestown',
    category: 'Community',
    tags: ['Downtown', 'Live Music', 'Makers'],
    link: 'https://www.tourchautauqua.com/events/third-on-3rd',
  },

  // May 23
  {
    title: 'Skeletons & Strings at Wicked Warren\'s',
    startDate: '2026-05-23T19:00:00',
    endDate: '2026-05-23T22:00:00',
    location: 'Wicked Warren\'s, Jamestown',
    category: 'Music',
    tags: ['Live Music', 'Acoustic'],
    link: 'https://www.tourchautauqua.com/events/skeletons-and-strings-at-wicked-warrens',
  },
  {
    title: 'Kenny Anderson at Wicked Warren\'s',
    startDate: '2026-05-23T20:00:00',
    endDate: '2026-05-23T23:00:00',
    location: 'Wicked Warren\'s, Jamestown',
    category: 'Music',
    tags: ['Live Music'],
    link: 'https://www.tourchautauqua.com/events/kenny-anderson-at-wicked-warrens',
  },
  {
    title: 'Memorial Day Super Showdown at Stateline Speedway',
    startDate: '2026-05-23T18:00:00',
    endDate: '2026-05-23T22:00:00',
    location: 'Stateline Speedway, Jamestown',
    category: 'Community',
    tags: ['Racing', 'Speedway'],
    link: 'https://www.tourchautauqua.com/events/memorial-day-super-showdown-at-stateline-speedway',
  },

  // May 25
  {
    title: 'Jamestown Memorial Day Parade',
    startDate: '2026-05-25T10:00:00',
    endDate: '2026-05-25T12:00:00',
    location: 'Downtown Jamestown',
    category: 'Civic',
    tags: ['Parade', 'Memorial Day'],
    link: 'https://www.tourchautauqua.com/events/jamestown-ny-memorial-day-parade',
  },

  // May 29–31: TURN The Musical world premiere
  {
    title: 'TURN The Musical — World Premiere',
    startDate: '2026-05-29T19:30:00',
    endDate: '2026-05-29T22:00:00',
    location: 'The Spire Theater, Jamestown',
    category: 'Arts',
    tags: ['Theater', 'Musical', 'World Premiere'],
    link: 'https://www.tourchautauqua.com/events/turn-the-musical-world-premiere-at-the-spire-theater',
  },
  {
    title: 'TURN The Musical — World Premiere',
    startDate: '2026-05-30T19:30:00',
    endDate: '2026-05-30T22:00:00',
    location: 'The Spire Theater, Jamestown',
    category: 'Arts',
    tags: ['Theater', 'Musical', 'World Premiere'],
    link: 'https://www.tourchautauqua.com/events/turn-the-musical-world-premiere-at-the-spire-theater',
  },
  {
    title: 'TURN The Musical — World Premiere',
    startDate: '2026-05-31T19:30:00',
    endDate: '2026-05-31T22:00:00',
    location: 'The Spire Theater, Jamestown',
    category: 'Arts',
    tags: ['Theater', 'Musical', 'World Premiere'],
    link: 'https://www.tourchautauqua.com/events/turn-the-musical-world-premiere-at-the-spire-theater',
  },

  // May 30
  {
    title: '2nd Annual Bluebird Festival at RTPI',
    startDate: '2026-05-30T10:00:00',
    endDate: '2026-05-30T16:00:00',
    location: 'Roger Tory Peterson Institute, 311 Curtis St, Jamestown',
    category: 'Community',
    tags: ['RTPI', 'Nature', 'Festival'],
    link: 'https://www.tourchautauqua.com/events/bluebird-festival-at-rtpi',
  },
  {
    title: 'Pat Hackett at Raven & Rune',
    startDate: '2026-05-30T19:00:00',
    endDate: '2026-05-30T22:00:00',
    location: 'Raven & Rune, Jamestown',
    category: 'Music',
    tags: ['Live Music', 'Rock', 'Country'],
    link: 'https://www.tourchautauqua.com/events/pat-hackett-live-at-raven-and-rune-1',
  },
  {
    title: 'RUSH Sprint Car Invasion at Stateline Speedway',
    startDate: '2026-05-30T18:00:00',
    endDate: '2026-05-30T22:00:00',
    location: 'Stateline Speedway, Jamestown',
    category: 'Community',
    tags: ['Racing', 'Speedway'],
    link: 'https://www.tourchautauqua.com/events/rush-sprint-car-invasion-at-stateline-speedway',
  },

  // May 31
  {
    title: 'Beyond the Motorcar: James Ward Packard Lecture',
    startDate: '2026-05-31T14:00:00',
    endDate: '2026-05-31T15:30:00',
    location: 'Jamestown',
    category: 'Community',
    tags: ['Lecture', 'History'],
    link: 'https://www.tourchautauqua.com/events/beyond-the-motorcar-james-ward-packard-of-lakewood-may-lecture',
  },
  {
    title: 'The Town Pants at Wicked Warren\'s',
    startDate: '2026-05-31T19:00:00',
    endDate: '2026-05-31T22:00:00',
    location: 'Wicked Warren\'s, Jamestown',
    category: 'Music',
    tags: ['Live Music'],
    link: 'https://www.tourchautauqua.com/events/the-town-pants-at-wicked-warrens',
  },

  // ── Jamestown Pride 2026 (June 5–14) ──────────────────────────────
  {
    title: 'Miss Pearl City Gay Pride Pageant',
    startDate: '2026-06-05T19:00:00',
    endDate: '2026-06-05T22:00:00',
    location: 'Knights of Enchanted Dreams, Jamestown',
    category: 'Pride',
    tags: ['Jamestown Pride', 'LGBTQ+', 'Pageant'],
  },
  {
    title: 'Pride Month Opening Ceremony & Flag Raising',
    startDate: '2026-06-06T10:00:00',
    endDate: '2026-06-06T12:00:00',
    location: 'Robert H. Jackson Center, 305 E. 4th St., Jamestown',
    category: 'Pride',
    tags: ['Jamestown Pride', 'LGBTQ+', 'Community'],
  },
  {
    title: 'Live Entertainment Pre-Show: Sabrina White and Co.',
    startDate: '2026-06-10T18:00:00',
    endDate: '2026-06-10T19:00:00',
    location: 'Reg Lenna Center for the Arts, 116 E. 3rd St., Jamestown',
    category: 'Pride',
    tags: ['Jamestown Pride', 'LGBTQ+', 'Live Music'],
  },
  {
    title: 'LGBTQ+ Comedy, Drag & Dancing',
    startDate: '2026-06-12T20:00:00',
    endDate: '2026-06-12T23:59:00',
    location: 'Wicked Warren\'s, 119 W. 3rd St., Jamestown',
    category: 'Pride',
    tags: ['Jamestown Pride', 'LGBTQ+', 'Drag', '18+'],
  },
  {
    title: 'Pride Festival: Live Music & Rainbow Walk Registration',
    startDate: '2026-06-13T10:00:00',
    endDate: '2026-06-13T11:45:00',
    location: 'Winter Garden Plaza, Downtown Jamestown',
    category: 'Pride',
    tags: ['Jamestown Pride', 'LGBTQ+', 'Festival'],
  },
  {
    title: 'Pride Kickoff & Rainbow Walk',
    startDate: '2026-06-13T12:00:00',
    endDate: '2026-06-13T13:30:00',
    location: 'Winter Garden Plaza, Downtown Jamestown',
    category: 'Pride',
    tags: ['Jamestown Pride', 'LGBTQ+', 'Festival', 'Parade'],
  },
  {
    title: 'Pride Festival: Live Entertainment at Winter Garden Plaza',
    startDate: '2026-06-13T13:30:00',
    endDate: '2026-06-13T18:00:00',
    location: 'Winter Garden Plaza, Downtown Jamestown',
    category: 'Pride',
    tags: ['Jamestown Pride', 'LGBTQ+', 'Festival', 'Family Friendly'],
  },
  {
    title: 'Jtwn Pride 3rd Annual Variety Show',
    startDate: '2026-06-13T16:00:00',
    endDate: '2026-06-13T17:00:00',
    location: 'Wicked Warren\'s, 119 W. 3rd St., Jamestown',
    category: 'Pride',
    tags: ['Jamestown Pride', 'LGBTQ+', 'Variety Show'],
  },
  {
    title: 'Queens on the Patio',
    startDate: '2026-06-13T17:00:00',
    endDate: '2026-06-13T18:00:00',
    location: 'Brazil Craft Beer & Wine, 10 E. 4th St., Jamestown',
    category: 'Pride',
    tags: ['Jamestown Pride', 'LGBTQ+', 'Drag'],
  },
  {
    title: 'Pride Day Show',
    startDate: '2026-06-13T18:00:00',
    endDate: '2026-06-13T20:00:00',
    location: 'Knights of Enchanted Dreams, 104 W. 2nd St., Jamestown',
    category: 'Pride',
    tags: ['Jamestown Pride', 'LGBTQ+', 'Festival', 'Family Friendly'],
  },
  {
    title: 'Pride After Dark — Burlesque & Drag Review',
    startDate: '2026-06-13T20:30:00',
    endDate: '2026-06-13T23:59:00',
    location: 'Sneakers Bar, 100 Harrison St., Jamestown',
    category: 'Pride',
    tags: ['Jamestown Pride', 'LGBTQ+', 'Drag', 'Burlesque', '21+'],
    note: '21+ · $10 · Pearl City Sirens',
  },
  {
    title: 'Pride Sunday Service',
    startDate: '2026-06-14T10:00:00',
    endDate: '2026-06-14T11:30:00',
    location: 'St. Luke\'s Episcopal Church, 410 N. Main St., Jamestown',
    category: 'Pride',
    tags: ['Jamestown Pride', 'LGBTQ+', 'Community'],
  },

  // ── Additional community events — June/July 2026 ─────────────────
  { title: 'Resistance History of the United States: A Conversation with Tad Stoermer', startDate: '2026-06-28T14:00:00', location: 'Jamestown, NY', category: 'Lecture', tags: ['Books', 'History', 'Community'] },

  { title: 'Comedy Open Mic at Wicked Warren\'s', startDate: '2026-07-01T19:00:00', endDate: '2026-07-01T21:00:00', location: 'Wicked Warren\'s, 119 W. 3rd St., Jamestown', category: 'Arts & Entertainment', tags: ['Comedy', 'Live', 'Weekly'], note: 'Free · 8 min sets · No hate speech' },
  { title: 'Comedy Open Mic at Wicked Warren\'s', startDate: '2026-07-08T19:00:00', endDate: '2026-07-08T21:00:00', location: 'Wicked Warren\'s, 119 W. 3rd St., Jamestown', category: 'Arts & Entertainment', tags: ['Comedy', 'Live', 'Weekly'], note: 'Free · 8 min sets · No hate speech' },
  { title: 'Comedy Open Mic at Wicked Warren\'s', startDate: '2026-07-15T19:00:00', endDate: '2026-07-15T21:00:00', location: 'Wicked Warren\'s, 119 W. 3rd St., Jamestown', category: 'Arts & Entertainment', tags: ['Comedy', 'Live', 'Weekly'], note: 'Free · 8 min sets · No hate speech' },
  { title: 'Comedy Open Mic at Wicked Warren\'s', startDate: '2026-07-22T19:00:00', endDate: '2026-07-22T21:00:00', location: 'Wicked Warren\'s, 119 W. 3rd St., Jamestown', category: 'Arts & Entertainment', tags: ['Comedy', 'Live', 'Weekly'], note: 'Free · 8 min sets · No hate speech' },
  { title: 'Comedy Open Mic at Wicked Warren\'s', startDate: '2026-07-29T19:00:00', endDate: '2026-07-29T21:00:00', location: 'Wicked Warren\'s, 119 W. 3rd St., Jamestown', category: 'Arts & Entertainment', tags: ['Comedy', 'Live', 'Weekly'], note: 'Free · 8 min sets · No hate speech' },

  { title: 'Jamestown Municipal Band in Allen Park', startDate: '2026-07-01T19:00:00', endDate: '2026-07-01T20:30:00', location: 'Allen Park, Jamestown', category: 'Arts & Entertainment', tags: ['Music', 'Free', 'Outdoor', 'Family Friendly'] },

  { title: 'Cheap Skate at Northwest Arena', startDate: '2026-07-02T00:00:00', location: 'Northwest Arena, Jamestown', category: 'Sports & Recreation', tags: ['Skating', 'Family Friendly', 'Northwest Arena'] },

  // ── Prendergast Library — June/July 2026 ─────────────────────────
  { title: 'Summer Reading Kickoff / Community Block Party', startDate: '2026-06-27T11:00:00', endDate: '2026-06-27T14:00:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Community', tags: ['Library', 'Summer Reading'], link: 'https://prendergastlibrary.org' },

  { title: 'Books & Brews', startDate: '2026-07-01T17:30:00', endDate: '2026-07-01T18:30:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Community', tags: ['Library', 'Adults'], link: 'https://prendergastlibrary.org' },
  { title: 'Summer Music Series: "Ice Age"', startDate: '2026-07-03T16:30:00', endDate: '2026-07-03T18:30:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Arts & Entertainment', tags: ['Library', 'Music', 'Summer Series'], link: 'https://prendergastlibrary.org' },

  { title: 'Curiosity Club: 5th Annual CHQ Book Read — Unearth Your Story w/ Pat Pihl', startDate: '2026-07-06T17:30:00', endDate: '2026-07-06T18:30:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Community', tags: ['Library', 'Adults', 'Book Club'], link: 'https://prendergastlibrary.org' },
  { title: 'Books & Brews', startDate: '2026-07-08T17:30:00', endDate: '2026-07-08T18:30:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Community', tags: ['Library', 'Adults'], link: 'https://prendergastlibrary.org' },
  { title: 'All-Ages Drumming', startDate: '2026-07-09T11:00:00', endDate: '2026-07-09T12:00:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Arts & Entertainment', tags: ['Library', 'All Ages', 'Music'], link: 'https://prendergastlibrary.org' },
  { title: 'Meet & Make #1: UV Dino Keychains', startDate: '2026-07-09T17:30:00', endDate: '2026-07-09T18:30:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Arts & Entertainment', tags: ['Library', 'Crafts'], link: 'https://prendergastlibrary.org' },
  { title: 'Summer Music Series: "Ice Age: The Melt Down"', startDate: '2026-07-10T16:30:00', endDate: '2026-07-10T18:30:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Arts & Entertainment', tags: ['Library', 'Music', 'Summer Series'], link: 'https://prendergastlibrary.org' },
  { title: 'All-Ages Crafting: Dinoprint Molds & Bookmarks', startDate: '2026-07-11T13:30:00', endDate: '2026-07-11T15:30:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Arts & Entertainment', tags: ['Library', 'All Ages', 'Crafts'], link: 'https://prendergastlibrary.org' },

  { title: 'Curiosity Club: Unearth Your Story w/ Pat Pihl', startDate: '2026-07-13T17:30:00', endDate: '2026-07-13T18:30:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Community', tags: ['Library', 'Adults', 'Book Club'], link: 'https://prendergastlibrary.org' },
  { title: 'All-Ages Drumming', startDate: '2026-07-16T11:00:00', endDate: '2026-07-16T12:00:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Arts & Entertainment', tags: ['Library', 'All Ages', 'Music'], link: 'https://prendergastlibrary.org' },
  { title: 'Summer Movie Series: "Ice Age: Dawn of the Dinosaurs" in 4D', startDate: '2026-07-17T16:30:00', endDate: '2026-07-17T18:00:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Arts & Entertainment', tags: ['Library', 'Film', 'Summer Series'], link: 'https://prendergastlibrary.org' },

  { title: 'Curiosity Club: Unearth Your Story w/ Pat Pihl', startDate: '2026-07-20T17:30:00', endDate: '2026-07-20T18:30:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Community', tags: ['Library', 'Adults', 'Book Club'], link: 'https://prendergastlibrary.org' },
  { title: 'All-Ages Drumming', startDate: '2026-07-23T11:00:00', endDate: '2026-07-23T12:00:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Arts & Entertainment', tags: ['Library', 'All Ages', 'Music'], link: 'https://prendergastlibrary.org' },
  { title: 'Summer Music Series: "Ice Age: Continental Drift"', startDate: '2026-07-24T16:30:00', endDate: '2026-07-24T18:30:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Arts & Entertainment', tags: ['Library', 'Music', 'Summer Series'], link: 'https://prendergastlibrary.org' },
  { title: 'Meet & Make #2: Dino Vinyl Stickers', startDate: '2026-07-25T13:30:00', endDate: '2026-07-25T14:30:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Arts & Entertainment', tags: ['Library', 'Crafts'], link: 'https://prendergastlibrary.org' },

  { title: 'Dino Perler Bead Magnets', startDate: '2026-07-26T17:30:00', endDate: '2026-07-26T18:30:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Arts & Entertainment', tags: ['Library', 'Crafts'], link: 'https://prendergastlibrary.org' },
  { title: 'Curiosity Club: Unearth Your Story w/ Pat Pihl', startDate: '2026-07-27T17:30:00', endDate: '2026-07-27T18:30:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Community', tags: ['Library', 'Adults', 'Book Club'], link: 'https://prendergastlibrary.org' },
  { title: 'All-Ages Drumming', startDate: '2026-07-30T11:00:00', endDate: '2026-07-30T12:00:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Arts & Entertainment', tags: ['Library', 'All Ages', 'Music'], link: 'https://prendergastlibrary.org' },
  { title: 'Summer Music Series: "Ice Age: Collision Point"', startDate: '2026-07-31T16:30:00', endDate: '2026-07-31T18:30:00', location: 'Prendergast Library, 509 Cherry St., Jamestown', category: 'Arts & Entertainment', tags: ['Library', 'Music', 'Summer Series'], link: 'https://prendergastlibrary.org' },
];

async function fetchEvents(): Promise<EventItem[]> {
  const cached = await getCached<EventItem[]>('events_v2', TTL.events);
  if (cached) return cached;

  const [wrfaEvents, libraryContent, regLennaEvents, fentonEvents] = await Promise.all([
    fetchWrfaEvents(),
    fetchLibraryContent(),
    fetchRegLennaEvents(),
    fetchFentonEvents(),
  ]);
  const libraryEvents = libraryContent.events;

  let bpuEvents: EventItem[] = [];
  try {
    const res = await feedFetch(proxyUrl(FEEDS.eventsFallback));
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

  function dedupeKey(e: EventItem): string {
    return e.title.toLowerCase().replace(/\s+/g, '') +
      (e.startDate?.split('T')[0] ?? '');
  }

  const STOP_WORDS = new Set(['the','and','for','with','from','this','that','will','hold','held','may','june','july']);
  function titleKeywords(e: EventItem): Set<string> {
    return new Set(
      e.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
        .map(w => w.replace(/s$/, '')) // strip trailing 's' so "wrfa's" → "wrfa", "fairs" → "fair"
        .filter(w => w.length >= 4 && !STOP_WORDS.has(w))
    );
  }
  function isSameEvent(a: EventItem, b: EventItem): boolean {
    if (a.startDate?.split('T')[0] !== b.startDate?.split('T')[0]) return false;
    const kA = titleKeywords(a); const kB = titleKeywords(b);
    let shared = 0;
    for (const w of kA) { if (kB.has(w)) shared++; }
    return shared >= 2;
  }

  const seen = new Set<string>();
  const merged: EventItem[] = [];

  // Priority: Reg Lenna (structured) → Fenton → Library → WRFA → BPU
  for (const e of [...regLennaEvents, ...fentonEvents, ...libraryEvents, ...wrfaEvents, ...bpuEvents]) {
    const key = dedupeKey(e);
    if (seen.has(key)) continue;
    if (merged.some(m => isSameEvent(m, e))) continue; // fuzzy same-day title match
    seen.add(key);
    merged.push(e);
  }

  // Start-of-today, not "now" — keeps today's events visible even if their start time has passed.
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  const result = merged
    .filter(e => new Date(e.startDate) >= cutoff)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  await setCache('events_v2', result);
  return result;
}

// Always merge curated events on top of fetched results — never cached out
function mergeCurated(fetched: EventItem[]): EventItem[] {
  function key(e: EventItem) {
    return e.title.toLowerCase().replace(/\s+/g, '') + (e.startDate?.split('T')[0] ?? '');
  }
  const STOP_WORDS = new Set(['the','and','for','with','from','this','that','will','hold','held','may','june','july','free']);
  function titleKeywords(e: EventItem): Set<string> {
    return new Set(
      e.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
        .filter(w => w.length >= 4 && !STOP_WORDS.has(w))
    );
  }
  function fuzzyMatchesCurated(fetched: EventItem, curated: EventItem): boolean {
    if (fetched.startDate?.split('T')[0] !== curated.startDate?.split('T')[0]) return false;
    const kF = titleKeywords(fetched); const kC = titleKeywords(curated);
    let shared = 0;
    for (const w of kC) { if (kF.has(w)) shared++; }
    return shared >= 2;
  }

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  const fresh = CURATED_EVENTS.filter(e => new Date(e.startDate) >= cutoff);
  const seen = new Set(fetched.map(key));
  // Drop fetched events superseded by a curated entry (curated has better time/location)
  const filtered = fetched.filter(f => !fresh.some(c => fuzzyMatchesCurated(f, c)));
  const combined = [
    ...fresh.filter(e => !seen.has(key(e))),
    ...filtered,
  ];
  return combined.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

async function fetchFentonEvents(): Promise<EventItem[]> {
  const cached = await getCached<EventItem[]>('fenton', TTL.events);
  if (cached) return cached;
  try {
    const res = await feedFetch(proxyUrl(FEEDS.fenton));
    if (!res.ok) throw new Error('Fenton fetch failed');
    const text = await res.text();
    const items = getRssItems(text);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    function mecISO(dateStr: string, hourStr: string): string {
      if (!dateStr) return '';
      let time = '00:00';
      const h = (hourStr ?? '').trim();
      const m24 = h.match(/^(\d{1,2}):(\d{2})/);
      if (m24) { time = `${m24[1].padStart(2, '0')}:${m24[2]}`; }
      else {
        const m12 = h.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
        if (m12) {
          let hh = parseInt(m12[1]);
          const mm = m12[2] ?? '00';
          if (/pm/i.test(m12[3]) && hh !== 12) hh += 12;
          if (/am/i.test(m12[3]) && hh === 12) hh = 0;
          time = `${String(hh).padStart(2, '0')}:${mm}`;
        }
      }
      return `${dateStr}T${time}:00`;
    }

    const events: EventItem[] = items
      .map(item => {
        const startDate = mecISO(
          getItemText(item['mec:startDate'] ?? ''),
          getItemText(item['mec:startHour'] ?? ''),
        );
        if (!startDate) return null;
        const endDate = mecISO(
          getItemText(item['mec:endDate'] ?? item['mec:startDate'] ?? ''),
          getItemText(item['mec:endHour'] ?? item['mec:startHour'] ?? ''),
        );
        const locRaw = item['mec:location'];
        const location = typeof locRaw === 'object'
          ? (getItemText(locRaw['mec:address'] ?? locRaw['mec:title'] ?? '') || 'Fenton History Center, Jamestown')
          : (getItemText(locRaw ?? '') || 'Fenton History Center, Jamestown');
        return {
          title: stripHtml(getItemText(item.title)),
          startDate,
          endDate: endDate || startDate,
          location,
          category: 'Lecture',
          tags: ['Fenton', 'History'],
          link: getItemText(item.link) || 'https://fentonhistorycenter.org/events',
        } as EventItem;
      })
      .filter((e): e is EventItem => e !== null && new Date(e.startDate) >= today);

    await setCache('fenton', events);
    return events;
  } catch {
    const stale = await AsyncStorage.getItem(`${CACHE_PREFIX}fenton`);
    if (stale) { try { return JSON.parse(stale).data ?? []; } catch { return []; } }
    return [];
  }
}


async function fetchRegLennaEvents(): Promise<EventItem[]> {
  // Use own cache key so failures don't erase previous successful results
  const cached = await getCached<EventItem[]>('reglenna', TTL.events);
  if (cached) return cached;

  try {
    const res = await feedFetch(proxyUrl(FEEDS.regLenna));
    if (!res.ok) throw new Error('Reg Lenna fetch failed');
    const json = await res.json();

    const items: any[] = json.upcoming ?? json.items ?? [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = items
      .filter(item => new Date(item.startDate) >= today)
      .slice(0, 15)
      .map(item => {
        // Squarespace event JSON may include assetUrl or thumbnailUrl
        const imageUrl: string | undefined =
          item.assetUrl ?? item.thumbnailUrl ?? item.imageUrl ?? undefined;

        return {
          title: stripHtml(item.title ?? ''),
          startDate: new Date(item.startDate).toISOString(),
          endDate: item.endDate ? new Date(item.endDate).toISOString() : new Date(item.startDate).toISOString(),
          location: item.location?.addressTitle ?? item.location?.addressLine1 ?? 'Reg Lenna Center, Jamestown',
          category: 'Arts & Entertainment',
          tags: ['Reg Lenna'],
          link: item.fullUrl ? `https://reglenna.com${item.fullUrl}` : undefined,
          ...(imageUrl ? { imageUrl } : {}),
        };
      });

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

async function fetchChautauquaAlerts(): Promise<AlertItem[]> {
  try {
    const res = await feedFetch(proxyUrl(FEEDS.chautauquaAlerts));
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

function parseEpisodeTitle(raw: string): { number: string; name: string } {
  const m = raw.match(/Episode\s+(\d+)\s*[-–]+\s*(.+)/i);
  if (m) return { number: m[1], name: m[2].trim() };
  return { number: '', name: raw.trim() };
}

async function fetchLOTD(): Promise<PodcastEpisode | null> {
  const cached = await getCached<PodcastEpisode>('lotd', TTL.lotd);
  if (cached) return cached;

  const res = await feedFetch(proxyUrl(FEEDS.lotd));
  if (!res.ok) throw new Error('LOTD fetch failed');
  const text = await res.text();
  const items = getRssItems(text);
  if (items.length === 0) return null;

  const item = items[0];
  const rawTitle = getItemText(item.title ?? '');
  const { number, name } = parseEpisodeTitle(rawTitle);

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

// WRFA articles often embed the event date in natural language titles
// ("Lecture Set For March 18", "Exhibition Opens Saturday"). Extract it
// before falling back to pubDate so events sort to the right month.
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

  // Month without day — place on 1st so it sorts to the right month rather than pubDate
  const monthOnlyPattern = new RegExp(
    `\\b(?:in|this|next|for)\\s+(${Object.keys(MONTHS).join('|')})\\.?\\b`, 'i'
  );
  const monthOnlyMatch = t.match(monthOnlyPattern);
  if (monthOnlyMatch) {
    const month = MONTHS[monthOnlyMatch[1].toLowerCase().replace('.', '')];
    if (month) {
      const d = new Date(year, month - 1, 1, 12, 0, 0);
      if (d < new Date()) d.setFullYear(d.getFullYear() + 1);
      if (d > pub) return d.toISOString();
    }
  }

  const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let wi = 0; wi < WEEKDAYS.length; wi++) {
    if (t.includes(WEEKDAYS[wi])) {
      const pubDay = pub.getDay();
      let diff = wi - pubDay;
      if (diff <= 0) diff += 7; // always forward
      const d = new Date(pub);
      d.setDate(pub.getDate() + diff);
      d.setHours(12, 0, 0, 0);
      return d.toISOString();
    }
  }

  if (t.includes('tonight')) {
    const d = new Date(pub); d.setHours(19, 0, 0, 0); return d.toISOString();
  }
  if (t.includes('tomorrow')) {
    const d = new Date(pub); d.setDate(pub.getDate() + 1); d.setHours(12, 0, 0, 0); return d.toISOString();
  }

  return pubDateStr;
}

const EVENT_KEYWORDS = /presents|to host|to perform|concert|exhibit|show|festival|expo|fair|forum|lecture|ceremony|opening|workshop|audition|celebration|annual|invites|parade|ribbon|groundbreaking|memorial|tribute|gala|reception|fundraiser|benefit|tournament|race|run|walk|market|sale|auction|screening|premiere|debut|launch|rally|vigil|conference|summit|symposium|performance|recital|competition|showcase/i;

// NOT_EVENT catches headlines that look event-like but are actually news articles,
// calls for submissions, or announcements about someone else's event
const NOT_EVENT = /calling for|call for|seeks? (volunteers?|presenters?|applicants?)|applications? (now )?open|(now )?accepting|crime (is |are )?(down|up)|statistics|report|survey|deadline|nominations|seeking|to headline|headlines?|announces?|announced|set to (perform|appear|headline)|coming to jamestown|confirmed for|tickets? (now |go )?on sale|lineup (announced|revealed|set)|rock and roll rundown|rundown|morning show|afternoon show|evening show|weekend show|daily show|begins season|opens season|kicks off season|returns (to|for)|at a new location|new location|mobile market/i;

async function fetchWrfaEvents(): Promise<EventItem[]> {
  try {
    const res = await feedFetch(proxyUrl(FEEDS.news));
    if (!res.ok) return [];
    const text = await res.text();
    const items = getRssItems(text);

    // 14-day lookback: an article published last week may still be about an upcoming event
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

async function fetchLibraryContent(): Promise<{ events: EventItem[]; news: NewsItem[] }> {
  try {
    const res = await feedFetch(proxyUrl(FEEDS.library));
    if (!res.ok) return { events: [], news: [] };
    const text = await res.text();
    const items = getRssItems(text);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const articleCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // wider window: library posts infrequently

    const recentItems = items.filter(item =>
      new Date(getItemText(item.pubDate ?? '')) >= articleCutoff
    );

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

async function fetchNews(): Promise<NewsItem[]> {
  // Health check runs before cache so stale WRFA stories get filtered when source is down
  const { wrfaUp } = await fetchSourceHealth();

  const cached = await getCached<NewsItem[]>('news', TTL.news);
  if (cached) {
    if (wrfaUp) return cached;
    // When WRFA is down, filter it out — but if that leaves too few items, do a fresh fetch instead
    const filtered = cached.filter(n => n.source !== 'WRFA-LP');
    if (filtered.length >= 5) return filtered;
    // Fall through to fresh fetch so WJTN and boosted limits kick in
  }

  const [wrfaRes, cityRes, jacksonRes, wgrzSportsRes, wgrzWNYRes, wgrzSTRes, spectrumRes, wnyNewsNowRes, wjtnRes] = await Promise.allSettled([
    feedFetch(proxyUrl(FEEDS.news)),
    feedFetch(proxyUrl(FEEDS.cityNews)),
    feedFetch(proxyUrl(FEEDS.jackson)),
    feedFetch(proxyUrl(FEEDS.wgrzSports)),
    feedFetch(proxyUrl(FEEDS.wgrzWNY)),
    feedFetch(proxyUrl(FEEDS.wgrzSouthernTier)),
    feedFetch(proxyUrl(FEEDS.spectrumWNY)),
    feedFetch(proxyUrl(FEEDS.wnyNewsNow)),
    feedFetch(proxyUrl(FEEDS.wjtn)),
  ]);

  function toNewsItems(raw: string, limit: number, source: string): NewsItem[] {
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
        source,
      }));
  }

  // When WRFA is down, boost limits on other local sources to keep the feed full
  const lim = wrfaUp
    ? { city: 5, jackson: 4, wgrzST: 8, wgrzGeo: 5, wnyNewsNow: 8, wjtn: 6 }
    : { city: 8, jackson: 6, wgrzST: 10, wgrzGeo: 7, wnyNewsNow: 10, wjtn: 10 };

  const wrfaItems = wrfaUp && wrfaRes.status === 'fulfilled' && wrfaRes.value.ok
    ? toNewsItems(await wrfaRes.value.text(), 15, 'WRFA-LP')
    : [];

  const cityItems = cityRes.status === 'fulfilled' && cityRes.value.ok
    ? toNewsItems(await cityRes.value.text(), lim.city, 'City of Jamestown')
    : [];

  const jacksonItems = jacksonRes.status === 'fulfilled' && jacksonRes.value.ok
    ? toNewsItems(await jacksonRes.value.text(), lim.jackson, 'Jackson Center')
    : [];

  const JAMESTOWN_TERMS = /jamestown|jcc|chautauqua|falconer|lakewood|celoron|frewsburg|ellicott/i;
  function toWGRZItems(raw: string, source: string, limit = lim.wgrzGeo): NewsItem[] {
    const items = getRssItems(raw);
    return items
      .filter(item => {
        const title = getItemText(item.title ?? '');
        const desc  = getItemText(item.description ?? '');
        return JAMESTOWN_TERMS.test(title) || JAMESTOWN_TERMS.test(desc);
      })
      .slice(0, limit)
      .map(item => ({
        title:   stripHtml(getItemText(item.title)),
        link:    getItemText(item.link),
        pubDate: getItemText(item.pubDate),
        excerpt: stripHtml(getItemText(item.description ?? '')).slice(0, 140),
        source,
      }));
  }

  const wgrzSportsItems = wgrzSportsRes.status === 'fulfilled' && wgrzSportsRes.value.ok
    ? toWGRZItems(await wgrzSportsRes.value.text(), 'WGRZ')
    : [];

  const wgrzWNYItems = wgrzWNYRes.status === 'fulfilled' && wgrzWNYRes.value.ok
    ? toWGRZItems(await wgrzWNYRes.value.text(), 'WGRZ')
    : [];

  const wgrzSTItems = wgrzSTRes.status === 'fulfilled' && wgrzSTRes.value.ok
    ? toWGRZItems(await wgrzSTRes.value.text(), 'WGRZ', lim.wgrzST)
    : [];

  const spectrumItems = spectrumRes.status === 'fulfilled' && spectrumRes.value.ok
    ? toWGRZItems(await spectrumRes.value.text(), 'Spectrum News')
    : [];

  const wnyNewsNowItems = wnyNewsNowRes.status === 'fulfilled' && wnyNewsNowRes.value.ok
    ? toNewsItems(await wnyNewsNowRes.value.text(), lim.wnyNewsNow, 'WNY News Now')
    : [];

  // WJTN: always-on at reduced limit; boosted when WRFA is down
  const wjtnItems: NewsItem[] = [];
  if (wjtnRes.status === 'fulfilled' && wjtnRes.value.ok) {
    const wjtnRaw = await wjtnRes.value.text();
    // Each WJTN post is a daily roundup — split the description block into individual stories
    const rssItems = getRssItems(wjtnRaw).slice(0, 3);
    for (const item of rssItems) {
      const link    = getItemText(item.link);
      const pubDate = getItemText(item.pubDate);
      const html    = getItemText(item.description ?? '');
      const plain = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      const blocks = plain.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
      for (let i = 0; i + 1 < blocks.length; i += 2) {
        const headline = blocks[i].replace(/\.{2,}/g, ' ').replace(/\s+/g, ' ').trim();
        const body     = blocks[i + 1];
        if (!headline || headline.length < 10) continue;
        if (!JAMESTOWN_TERMS.test(headline) && !JAMESTOWN_TERMS.test(body)) continue;
        wjtnItems.push({ title: headline, link, pubDate, excerpt: body, source: 'WJTN' });
        if (wjtnItems.length >= lim.wjtn) break;
      }
      if (wjtnItems.length >= lim.wjtn) break;
    }
  }

  const seen = new Set<string>();
  const addUnique = (items: NewsItem[]) =>
    items.filter(n => {
      const key = n.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  // Merge all sources then sort by date so newest always tops — no source gets permanent priority
  const news: NewsItem[] = addUnique([
    ...wrfaItems,
    ...cityItems,
    ...jacksonItems,
    ...wnyNewsNowItems,
    ...wgrzSTItems,
    ...wgrzSportsItems,
    ...wgrzWNYItems,
    ...spectrumItems,
    ...wjtnItems,
  ])
    .sort((a, b) => {
      const ta = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const tb = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 20);

  // Don't cache empty results — would mask transient failures for hours
  if (news.length > 0) await setCache('news', news);
  return news;
}

export function useCivicData(): CivicData {
  // Parking is pure date math — compute it immediately so it's never skeleton-gated
  const [state, setState] = useState<Omit<CivicData, 'refresh'>>(() => ({
    ...DEFAULTS,
    parking: computeParking(),
  }));

  const load = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const parking = computeParking();
    const { hasDelay, affectedDays, upcomingHoliday } = computeHolidayDelay();

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
      : { ...DEFAULTS.recycling, holidayDelay: hasDelay, affectedDays, upcomingHoliday };

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

    const allNews: NewsItem[] = newsResult.status === 'fulfilled' ? newsResult.value : [];
    const libraryNews: NewsItem[] = libraryResult.status === 'fulfilled' ? (libraryResult.value as any).news ?? [] : [];
    const seenTitles = new Set(allNews.map((n: NewsItem) => n.title.toLowerCase()));
    const news: NewsItem[] = [
      ...allNews,
      ...libraryNews.filter((n: NewsItem) => !seenTitles.has(n.title.toLowerCase())),
    ];

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

    // Push recycling data to the iOS widget via App Group shared storage
    if (Platform.OS === 'ios' && recycling.thisWeek.material !== '—') {
      try {
        const appGroup = 'group.com.chadakoindigital.chadakoinnow';
        await SharedGroupPreferences.setItem('recycling_material',  recycling.thisWeek.material,  appGroup);
        await SharedGroupPreferences.setItem('recycling_dateRange', recycling.thisWeek.dateRange, appGroup);
        await SharedGroupPreferences.setItem('recycling_emoji',     recycling.thisWeek.emoji,     appGroup);
      } catch {}
    }
  }, []);

  // Show last known recycling data immediately (even if stale) — fresh fetch updates it in background
  useEffect(() => {
    getStaleCached<RecyclingData>('recycling').then(stale => {
      if (stale) setState(prev => ({ ...prev, recycling: stale }));
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  return { ...state, refresh: load };
}
