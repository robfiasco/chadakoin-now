import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { reloadWidgetTimelines } from '../modules/widget-reload';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { XMLParser } from 'fast-xml-parser';
import { fetchSourceHealth } from './useSourceHealth';
import { apiUrl } from '../lib/api';

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
  // Set when the live BPU fetch failed and this is the last successful
  // fetch instead — lets the UI show "as of Xh ago" rather than pretending
  // this is current.
  stale?: boolean;
  staleAsOf?: number | null;
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
  // Set when the live BPU fetch failed and this is the last successful
  // fetch instead — a safety-relevant feed (water main breaks, boil-water
  // notices) should never silently fall back to "no alerts" on a network
  // blip, so failures resurface the last known state with its age.
  stale?: boolean;
  staleAsOf?: number | null;
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
  // Which feed this event's fields ultimately came from after merge — 'city'
  // always wins on a cross-source duplicate (see fetchEvents' `sourced`
  // priority order). Not rendered in the UI; exists so a duplicate's
  // provenance is inspectable without re-deriving it from `tags`.
  source?: string;
}

// Most events don't list an end time — assume a typical event runs a few
// hours so it doesn't vanish from the app the instant its start time
// passes while it's realistically still going on.
const DEFAULT_EVENT_DURATION_MS = 3 * 60 * 60 * 1000;

export function eventEndTime(e: EventItem): number {
  if (e.endDate) return new Date(e.endDate).getTime();
  return new Date(e.startDate).getTime() + DEFAULT_EVENT_DURATION_MS;
}

// Replaces a plain `startDate >= now` check — that dropped an event the
// moment it started even if it (or its assumed duration) was still
// ongoing, which made multi-hour events disappear from the app mid-way
// through instead of once they actually ended.
export function isEventUpcomingOrOngoing(e: EventItem, now: Date = new Date()): boolean {
  return eventEndTime(e) >= now.getTime();
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

export type DpwActivityKind =
  | 'paving' | 'reconstruction' | 'curb' | 'storm' | 'ditch'
  | 'patching' | 'catch_basin' | 'concrete' | 'prep' | 'other';

export interface DpwWorkItem {
  id: string;
  street: string;
  segment?: string;
  activity: string;
  activityKind: DpwActivityKind;
  tentativeDate?: string;
  isCitywideSupport?: boolean;
}

export interface DpwWeekUpdate {
  id: string;
  weekStart: string;
  weekEnd: string;
  fetchedAt: string;
  sourceUrl: string;
  items: DpwWorkItem[];
  rawWeekLabel?: string;
  seasonalPdfUrl?: string;
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
  dpw: DpwWeekUpdate | null;
  lastUpdated: string | null;
  refresh: () => void;
}

const FEEDS = {
  recyclingICS: 'https://www.jamestownnybpu.gov/common/modules/iCalendar/iCalendar.aspx?feed=calendar&catID=24',
  // jamestownbpu.com (the old domain) now 301s to jamestownnybpu.gov over a
  // 3-hop chain that briefly downgrades to plain http:// mid-redirect —
  // fragile enough to intermittently fail. Fetch the final host directly.
  alerts: 'https://www.jamestownnybpu.gov/RSSFeed.aspx?ModID=63&CID=Alerts-11',
  eventsFallback: 'https://www.jamestownnybpu.gov/RSSFeed.aspx?ModID=58&CID=Jamestown-Board-Meeting-Calendar-23',
  news: 'https://www.wrfalp.com/feed/',
  cityNews: 'https://www.jamestownny.gov/feed/',
  wgrzSports: 'https://www.wgrz.com/feeds/syndication/rss/sports',
  wgrzWNY:         'https://www.wgrz.com/feeds/syndication/rss/news/local/wny',
  wgrzSouthernTier: 'https://www.wgrz.com/feeds/syndication/rss/news/local/southern-tier',
  wnyNewsNow:      'https://wnynewsnow.com/category/jamestown/feed/',
  // WRFA-down fallback — Media One Radio Group daily Jamestown/Chautauqua roundups
  wjtn: 'https://wjtn.com/news-and-closings/local-news-headlines/feed.xml',
  library: 'https://prendergastlibrary.org/feed/',
  lotd: 'https://rss.libsyn.com/shows/66268/destinations/266592.xml',
  regLenna: 'https://reglenna.com/events?format=json',
  chautauquaAlerts: 'https://chautauquacountyny.gov/rss.xml',
  jackson: 'https://www.roberthjackson.org/feed/',
  fenton: 'https://fentonhistorycenter.org/?post_type=mec-events&feed=rss2',
  mychq: 'https://mychq.org/wp-json/tribe/events/v1/events',
  jcc: 'https://www.jccjayhawks.com/composite?print=rss',
  // Official City of Jamestown calendar (WordPress + All-in-One Event
  // Calendar plugin). This ICS export is the highest-priority events
  // source — see fetchCityEvents. Do NOT swap this for the site's
  // "related events" widget scrape; that widget is known to show
  // mis-mapped titles/times that don't match the real event permalinks.
  cityEvents: 'https://www.jamestownny.gov/?plugin=all-in-one-event-calendar&controller=ai1ec_exporter_controller&action=export_events&no_html=true',
};

// Chautauqua County towns close enough to Jamestown to be relevant —
// mychq.org covers the whole county, so this keeps the feed local.
const LOCAL_TOWNS = new Set([
  'jamestown', 'lakewood', 'falconer', 'celoron', 'busti', 'ashville',
  'bemus point', 'mayville', 'frewsburg', 'gerry', 'chautauqua', 'stow',
]);

const TTL = {
  recycling: 24 * 60 * 60 * 1000,   // 24h
  events:     1 * 60 * 60 * 1000,   // 1h
  alerts:     3 * 60 * 60 * 1000,   // 3h — same slow BPU feed as dpw; 5min was hammering it
  news:       2 * 60 * 60 * 1000,   // 2h
  lotd:      12 * 60 * 60 * 1000,   // 12h — weekly show
  dpw:        3 * 60 * 60 * 1000,   // 3h — page updates roughly weekly
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
  dpw: null,
  lastUpdated: null,
};

// Routes RSS/JSON requests through our own Vercel API endpoint.
// Web needs it for CORS; native needs it because many news sources
// (WordPress, WGRZ, etc.) reject non-browser user agents and the
// edge function adds proper headers. Both platforms go through proxy.
function proxyUrl(url: string): string {
  // apiUrl() is the single place that knows the native host — a local
  // copy of that constant here drifted out of sync once already.
  return apiUrl(`/api/proxy?url=${encodeURIComponent(url)}`);
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

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: ' ', hellip: '…', mdash: '—', ndash: '–',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  lt: '<', gt: '>', quot: '"', apos: "'",
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    // Entities used to be DELETED rather than decoded, which quietly ate
    // characters mid-headline: "&#x2019;" dropped the apostrophe out of
    // "Sheriff's", and "&hellip;" left a dangling space behind ("...lean ").
    // Decode what we recognise, numeric included, and only then drop the
    // leftovers.
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? (name.toLowerCase() === 'amp' ? '&' : m))
    // Unknown entities only — anything recognised was handled above.
    .replace(/&[a-zA-Z]+;/g, '')
    // Zero-width and BOM characters survive every \s-based cleanup below
    // (JS \s does not match U+200B/U+FEFF), so a headline carrying one
    // renders with an invisible gap — e.g. 'lean ' with no visible cause.
    .replace(/[​-‍﻿]/g, '')
    .replace(/\s{2,}/g, ' ')
    // Tidy spacing the decode can leave behind: a space pushed up against
    // closing punctuation, or a trailing ellipsis separated from its word.
    .replace(/\s+([,.;:!?…])/g, '$1')
    // Padding inside typographic quotes — “ lean ” → “lean”. Only the
    // curly forms: for a straight " the direction is ambiguous, and
    // stripping the space before one would weld it to the previous word.
    .replace(/([“‘])\s+/g, '$1')
    .replace(/\s+([”’])/g, '$1')
    .trim();
}

// Bump to bust stale cached data across all clients
const CACHE_PREFIX = 'civic_v34_';

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

// Returns cached data regardless of age, plus when it was fetched — for
// stale-while-revalidate patterns where the UI can show "last known" data
// with its age rather than silently rendering an empty default.
async function getStaleCached<T>(key: string): Promise<{ data: T; timestamp: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (data == null) return null;
    return { data: data as T, timestamp };
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

// Shared by computeParkingSchedule below and lib/reminders.ts, so the
// winter parking reminder always agrees with what the Home/Parking screens
// display — one rule, not two copies that can drift.
export function sideForDate(d: Date): 'EVEN' | 'ODD' {
  const m = d.getMonth() + 1;
  if (m >= 11 || m <= 3) return d.getDate() % 2 === 0 ? 'EVEN' : 'ODD';
  return m % 2 === 0 ? 'EVEN' : 'ODD';
}

export function isWinterMonth(d: Date): boolean {
  const m = d.getMonth() + 1;
  return m >= 11 || m <= 3;
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

// Same parsing as parseIcsDate, but returns a plain local-time string
// ("2026-09-28T16:30:00") instead of a Date object — EventItem.startDate is
// stored as a string everywhere else in this file, and round-tripping
// through Date.toISOString() would convert to UTC and shift the displayed
// time. The city ICS feed's DTSTART values are already Eastern wall-clock
// times (as are every other source in this file), so no TZ math needed.
function icsLocalDateTimeString(raw: string): string | null {
  const clean = raw.replace(/.*:/, '').trim();
  if (clean.length < 8) return null;
  const y = clean.slice(0,4), mo = clean.slice(4,6), d = clean.slice(6,8);
  const h = clean.slice(9,11) || '00', mi = clean.slice(11,13) || '00';
  return `${y}-${mo}-${d}T${h}:${mi}:00`;
}

// myCHQ's Facebook-cross-posted event bodies commonly use a "📅 date/time"
// line immediately followed by a "📍 location" line. Used as a fallback
// when myCHQ's structured venue schema is a known-bad generic placeholder
// (see fetchMychqEvents) — the body text is the trustworthy value in that
// case, not the schema.
function extractPinLocationFromBody(html: string): string | null {
  // Preserve emoji alt text before stripping tags — myCHQ renders emoji as
  // <img alt="📍">, and a plain tag-strip would silently drop it.
  const withEmojis = html.replace(/<img[^>]*alt="([^"]*)"[^>]*\/?>/g, '$1');
  const plain = withEmojis
    .replace(/<\/(div|p)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&#8217;/g, '’').replace(/&nbsp;/g, ' ');
  const lines = plain.split('\n').map(l => l.trim()).filter(Boolean);
  const dateIdx = lines.findIndex(l => l.includes('📅'));
  if (dateIdx === -1) return null;
  const next = lines[dateIdx + 1];
  if (!next || !next.includes('📍')) return null;
  const loc = next.replace('📍', '').trim();
  return loc || null;
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

  try {
    return await fetchRecyclingICSLive();
  } catch {
    // BPU's redirect chain (or the feed itself) occasionally fails — fall
    // back to the last successful fetch with its age instead of the bare
    // "—" empty state, which looks identical to "genuinely no pickup data"
    // and previously masked which week's schedule (and holiday delay) was
    // actually showing.
    const stale = await getStaleCached<RecyclingData>('recycling');
    if (stale) return { ...stale.data, stale: true, staleAsOf: stale.timestamp };
    const { hasDelay, affectedDays, upcomingHoliday } = computeHolidayDelay();
    return {
      thisWeek: EMPTY_WEEK, nextWeek: EMPTY_WEEK, upcomingWeeks: [],
      holidayDelay: hasDelay, affectedDays, upcomingHoliday,
      stale: true, staleAsOf: null,
    };
  }
}

async function fetchRecyclingICSLive(): Promise<RecyclingData> {
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

  const now = new Date();
  // Local date, not UTC — toISOString() rolls over to tomorrow's date hours
  // before local midnight in US timezones, which broke the weekend-preview
  // logic below (both must agree on what "today" is).
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  let thisIdx = -1;
  for (let i = recyclingWeeks.length - 1; i >= 0; i--) {
    if (recyclingWeeks[i].startDate <= today) {
      thisIdx = i;
      break;
    }
  }
  // The BPU feed only publishes upcoming events — it drops each week once it's
  // passed. So "no match" doesn't mean thisIdx is a stale/completed week, it
  // means today is *before* the feed's earliest (soonest upcoming) entry —
  // that entry already IS this week, so the weekend flip below must not
  // apply to it (it would skip a real week).
  const noPastMatch = thisIdx === -1;
  if (noPastMatch && recyclingWeeks.length > 0) thisIdx = 0;

  // Saturday evening (6pm+) through end of Sunday: show next week so pickup day
  // is always in the future, not last week's already-passed collection.
  const isWeekendPreview = (now.getDay() === 6 && now.getHours() >= 18) || now.getDay() === 0;
  if (isWeekendPreview && !noPastMatch && thisIdx + 1 < recyclingWeeks.length) {
    thisIdx += 1;
  }

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

// DPW weekly construction update — served by our own scraper at /api/dpw
// (no first-party feed exists for this), so it's fetched directly rather
// than through the CORS proxy.
async function fetchDpwUpdate(): Promise<DpwWeekUpdate | null> {
  const cached = await getCached<DpwWeekUpdate>('dpw', TTL.dpw);
  if (cached) return cached;
  try {
    const path = apiUrl('/api/dpw');
    const res = await feedFetch(path);
    if (!res.ok) throw new Error(`DPW fetch failed: ${res.status}`);
    const data: DpwWeekUpdate | null = await res.json();
    if (data) await setCache('dpw', data);
    return data;
  } catch {
    return null;
  }
}

async function fetchAlerts(): Promise<AlertsData> {
  const cached = await getCached<AlertsData>('alerts', TTL.alerts);
  if (cached) return cached;

  try {
    const res = await feedFetch(proxyUrl(FEEDS.alerts));
    if (!res.ok) throw new Error(`Alerts fetch failed: ${res.status}`);
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
  } catch {
    // Water main breaks / boil-water notices are safety-relevant — a fetch
    // failure must never silently render as "no alerts." Fall back to the
    // last successful fetch, however old, rather than an empty default.
    const stale = await getStaleCached<AlertsData>('alerts');
    if (stale) return { ...stale.data, stale: true, staleAsOf: stale.timestamp };
    return { hasActiveAlerts: false, activeAlerts: [], stale: true, staleAsOf: null };
  }
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
  { title: 'World of Outlaws Pre-Race Party', startDate: '2026-07-07T16:30:00', location: 'Shawbucks, 212 W. 2nd St., Jamestown', category: 'Community', tags: ['Community', 'Racing'], note: 'Downtown car parade & live celebration · Pre-race party for World of Outlaws at Stateline Speedway' },
  { title: 'World of Outlaws: Rick Briggs Memorial', startDate: '2026-07-08T00:00:00', location: 'Stateline Speedway, Busti, NY', category: 'Sports & Recreation', tags: ['Racing', 'Sports'], note: 'Late Models · Powered by Dave Warren Powersports', link: 'https://worldofoutlaws.com/schedule/' },
  { title: 'Logan Laura - Live!', startDate: '2026-07-10T00:00:00', location: "Wicked Warren's, 119 W. 3rd St., Jamestown", category: 'Music', tags: ['Live Music'], note: 'Local acoustic duo' },
  { title: 'Brian Hanna Acoustic Set', startDate: '2026-07-17T18:00:00', endDate: '2026-07-17T21:00:00', location: 'Jamestown Wine Cellar, North Main St.', category: 'Music', tags: ['Live Music'], note: 'Free · 21+ · Acoustic' },
  { title: 'The Hallow Society Live', startDate: '2026-07-31T00:00:00', location: 'Pearl City Hops, Jamestown', category: 'Music', tags: ['Live Music', 'Family Friendly'], note: 'Kid-friendly indoor performance' },
  { title: 'Safe Streets For All Launch Party', startDate: '2026-07-08T00:00:00', location: 'James Prendergast Library, Jamestown', category: 'Community', tags: ['Community', 'Family Friendly', 'Free'], note: 'Sidewalk safety chalk party · Pretend play · Outdoor games · Free', link: 'https://prendergastlibrary.org' },
  { title: 'Scandinavian Folk Festival', startDate: '2026-07-18T00:00:00', location: 'Northwest Arena, Jamestown', category: 'Arts & Entertainment', tags: ['Festival', 'Music', 'Community'], note: 'DemBones performing classic Scandinavian folk music & ABBA arrangements · Parade' },
  { title: 'Mister Green & Stereo Death', startDate: '2026-07-18T21:00:00', endDate: '2026-07-18T23:59:00', location: 'Jamestown Wine Cellar', category: 'Music', tags: ['Live Music'], link: 'https://www.jfmny.org/events' },
  { title: 'Farmers Market Kids Week', startDate: '2026-07-25T09:00:00', endDate: '2026-07-25T13:00:00', location: '3rd St & Pine St, Downtown Jamestown', category: 'Community', tags: ['Farmers Market', 'Family Friendly', 'Community'], note: 'Christmas in July · Petting zoo · Kids DJ · Bounce house · Live cooking demos · SNAP/EBT', link: 'https://jfmny.org/' },
  { title: 'The Good, The Bad, and The Guilty', startDate: '2026-07-25T00:00:00', location: 'Northwest Arena, Jamestown', category: 'Community', tags: ['Community', 'Family Friendly'], note: 'Family-friendly indoor activity · Hosted alongside Meals on Wheels' },
  { title: 'Music on the Stoop: Mike Brunacini',  startDate: '2026-07-17T18:00:00', endDate: '2026-07-17T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: Drew & Lena',     startDate: '2026-07-22T18:00:00', endDate: '2026-07-22T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: Kallie Williams', startDate: '2026-07-29T18:00:00', endDate: '2026-07-29T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: Drew Minton',     startDate: '2026-08-05T18:00:00', endDate: '2026-08-05T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: Davis & Eng',     startDate: '2026-08-11T18:00:00', endDate: '2026-08-11T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: Mandy Andrews',        startDate: '2026-08-19T18:00:00', endDate: '2026-08-19T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: Stephen Case Foster',  startDate: '2026-08-26T18:00:00', endDate: '2026-08-26T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'WhirlyBird: Jade Giambrone',          startDate: '2026-08-28T16:00:00', endDate: '2026-08-28T18:00:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music', 'WhirlyBird'], link: 'https://labpressco.com' },
  { title: 'WhirlyBird: Oliver Burdo',            startDate: '2026-08-29T10:00:00', endDate: '2026-08-29T13:00:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music', 'WhirlyBird'], link: 'https://labpressco.com' },
  { title: 'Music on the Stoop: The Predicamint', startDate: '2026-09-04T18:00:00', endDate: '2026-09-04T20:30:00', location: 'Labyrinth Press Co., Jamestown', category: 'Music', tags: ['Labyrinth', 'Live Music'], link: 'https://labpressco.com' },
  { title: 'BPU Yard Waste Site — Last Day of Season', startDate: '2026-09-30T16:00:00', endDate: '2026-09-30T19:00:00', location: '1001 Monroe St, Jamestown', category: 'City', tags: ['BPU', 'City'], note: 'Last Wednesday of 2026 · Requires BPU Yard Waste Sticker ($20 at customer service)', link: 'https://www.jamestownnybpu.gov' },
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

  // — Fenton History Center Historic Walking Tours ——————————————————————————
  { title: 'Historic Walking Tour: Ladies of Lake View', startDate: '2026-07-11T10:00:00', location: 'Lake View Cemetery, Jamestown', category: 'Community', tags: ['Fenton History Center', 'Walking Tour', 'History'], link: 'https://www.fentonhistorycenter.org' },
  { title: 'Historic Walking Tour: Lakeview Ave.', startDate: '2026-07-18T10:00:00', location: 'Lakeview Ave., Jamestown', category: 'Community', tags: ['Fenton History Center', 'Walking Tour', 'History'], link: 'https://www.fentonhistorycenter.org' },
  { title: 'Historic Walking Tour: Allen Park', startDate: '2026-07-25T10:00:00', location: 'Allen Park, Jamestown', category: 'Community', tags: ['Fenton History Center', 'Walking Tour', 'History'], link: 'https://www.fentonhistorycenter.org' },
  { title: 'Historic Walking Tour: Lucy Downtown', startDate: '2026-08-08T10:00:00', location: 'Downtown Jamestown', category: 'Community', tags: ['Fenton History Center', 'Walking Tour', 'History', 'Lucy'], link: 'https://www.fentonhistorycenter.org' },
  { title: 'Historic Walking Tour: Churches Tour', startDate: '2026-08-08T10:00:00', location: 'Downtown Jamestown', category: 'Community', tags: ['Fenton History Center', 'Walking Tour', 'History'], link: 'https://www.fentonhistorycenter.org' },
  { title: "Historic Walking Tour: Jamestown's Industrial Past", startDate: '2026-08-15T10:00:00', location: 'Downtown Jamestown', category: 'Community', tags: ['Fenton History Center', 'Walking Tour', 'History'], link: 'https://www.fentonhistorycenter.org' },
  { title: "Historic Walking Tour: Jamestown's Hidden Alleys", startDate: '2026-08-22T10:00:00', location: 'Downtown Jamestown', category: 'Community', tags: ['Fenton History Center', 'Walking Tour', 'History'], link: 'https://www.fentonhistorycenter.org' },
  { title: 'Historic Walking Tour: Military Tour at Lake View Cemetery', startDate: '2026-08-29T10:00:00', location: 'Lake View Cemetery, Jamestown', category: 'Community', tags: ['Fenton History Center', 'Walking Tour', 'History'], link: 'https://www.fentonhistorycenter.org' },

  // City Council meeting schedule used to be hand-maintained here ("not
  // covered by any RSS/ICS feed") — it now is, via fetchCityEvents(), which
  // also goes further out than these 3 dates ever did. Removed: when a
  // hardcoded entry here exactly matches a live-fetched one (same day, same
  // title), mergeCurated's two exclusion passes both fire — the fetched
  // copy gets dropped as "superseded by curated" while the curated copy
  // gets dropped as "already covered by fetched" — and the event vanishes
  // from Events entirely. Found via the real Sep 28, 2026 Voting Session.

  // — Daniel Feather Memorial 5K (mychq lists this under a generic "Striders
  // Runner of the Year Series" title with venue "Multiple Venues", which gets
  // filtered out by the city-matching logic in fetchMychqEvents — not a
  // duplicate of anything that actually renders) ——————————————————————————
  { title: 'Daniel Feather Memorial 5K', startDate: '2026-09-05T09:30:00', location: 'Bergman Park, 487 Baker St., Jamestown', category: 'Sports & Recreation', tags: ['5K', 'Running', 'Chautauqua Striders'], note: 'Check-in 8:30am · Ron Graham Memorial 1K Kids Fun Run at 9:00am · Benefits youth programming & the Dan Feather Memorial Scholarship', link: 'https://runscore.runsignup.com/Race/NY/Jamestown/DanielFeatherMemorial5KRun' },

  { title: 'Tailgate Party ft. Special Guest Mark Kelso', startDate: '2026-09-13T11:00:00', endDate: '2026-09-13T20:00:00', location: 'The Empty Pint, Lakewood', category: 'Sports & Recreation', tags: ['Bills', 'Tailgate', 'Lakewood'], note: 'Meet Mark Kelso + autograph signing · pregame beer pong · tailgate food · halftime wing-eating contest · Buffalo merch vendor on site', link: 'https://lakewood.stbcbeer.com' },
  { title: 'Bemus Point Fall Fest', startDate: '2026-09-18T10:00:00', endDate: '2026-09-20T17:00:00', location: 'Bemus Point, NY', category: 'Festival', tags: ['Bemus Point', 'Fall Fest', 'Street Market'], note: 'Street market (70+ vendors, Fri–Sun 10–5) · Draw-a-Leaf discounts around the village · classic car cruise-in Sat 12–5 · petting zoo & face painting · beer garden Fri–Sun · last weekend for the Bemus-Stow ferry' },

  // — Chautauqua County Mobile Health Clinic stops (no RSS/ICS feed found on
  // chautauquacountyny.gov's Drupal events pages — added here like the
  // other hand-maintained entries above). Service lists differ per stop per
  // the county's own event pages — not copy-pasted identically.
  { title: 'Mobile Health Clinic — Love Elementary', startDate: '2026-10-08T10:00:00', endDate: '2026-10-08T15:00:00', location: 'Love Elementary School, 50 E 8th St, Jamestown', category: 'Health & Care', tags: ['Chautauqua County', 'Mobile Health Clinic'], note: 'Free: childhood immunizations (appt required), child development screenings, breastfeeding support, STD education, blood pressure screenings. Call 716-753-4491.', link: 'https://chautauquacountyny.gov/public-health/event/jamestown-mobile-health-clinic-love-school-1' },
  { title: 'Mobile Health Clinic — Salvation Army / Food Express', startDate: '2026-10-28T10:00:00', endDate: '2026-10-28T15:30:00', location: 'Salvation Army (Food Express), 83 S Main St, Jamestown', category: 'Health & Care', tags: ['Chautauqua County', 'Mobile Health Clinic'], note: 'Free: immunizations (appt required), Narcan/fentanyl test strips, STD education, condoms, breastfeeding support, screenings. Call 716-753-4491.', link: 'https://chautauquacountyny.gov/public-health/event/jamestown-mobile-health-clinic-food-express-4' },

  { title: 'Medicare 101 Forum', startDate: '2026-10-23T10:00:00', location: '3rd floor, The Chautauqua Center, 107 Institute St, Jamestown', category: 'Health & Care', tags: ['Chautauqua County', 'Office for the Aging', 'Medicare'], note: 'Free · "Medicare 101 and Plan Finder Basics" — how Medicare works and comparing plans. Register by Oct 21 via NY Connects: 716-753-4582 or CCNYC@chqgov.com.', link: 'https://chautauquacountyny.gov/office-aging/event/medicare-101-forum' },

  { title: 'Jamestown Energy Workshop: Save Energy, Save Dollars', startDate: '2026-11-04T10:30:00', location: 'The Chautauqua Center, 107 Institute St, Jamestown', category: 'Health & Care', tags: ['Chautauqua County', 'Office for the Aging', 'Energy'], note: 'Free · WNY Clean Energy Hub workshop on reading your utility bill and cutting energy use. Registered participants get a free energy-saving kit. Call 716-753-4582 to register.', link: 'https://chautauquacountyny.gov/office-aging/event/jamestown-energy-workshop-save-energy-save-dollars' },

  { title: 'Free Rabies Vaccination Clinic — Jamestown', startDate: '2026-11-07T10:00:00', endDate: '2026-11-07T12:00:00', location: 'Taylor Fire Training Center, 240 Harrison St, Jamestown, NY 14701', category: 'Health & Care', tags: ['Chautauqua County', 'Rabies', 'Pets'], note: 'Free · For dogs, cats & ferrets 3 months+. Pre-registration required, limited spots. Bring prior vaccination records. Dogs on leash, cats/ferrets in carriers. Questions: CCHD 716-753-4481.', link: 'https://chautauquacountyny.gov/public-health/news/free-rabies-vaccine-clinics-offered-across-chautauqua-county-fall' },

  { title: 'Tony Dolce Riverwalk Bike Path Unveiling', startDate: '2026-10-15T15:30:00', location: 'Greater Jamestown Riverwalk bike path, 8th St entrance, Jamestown', category: 'Community', tags: ['City of Jamestown', 'Riverwalk', 'Dedication'], note: 'Free · The City renames the Riverwalk bike path for the late Councilman Tony Dolce, its longest-serving council member. Hosted by Mayor Kim Ecklund.', link: 'https://www.jamestownny.gov/city-of-jamestown-to-honor-the-life-legacy-of-tony-dolce-with-riverwalk-bike-path-renaming/' },
];

async function fetchEvents(): Promise<EventItem[]> {
  const cached = await getCached<EventItem[]>('events_v2', TTL.events);
  if (cached) return cached;

  const [wrfaEvents, libraryContent, regLennaEvents, fentonEvents, mychqEvents, jccEvents, cityEvents] = await Promise.all([
    fetchWrfaEvents(),
    fetchLibraryContent(),
    fetchRegLennaEvents(),
    fetchFentonEvents(),
    fetchMychqEvents(),
    fetchJCCEvents(),
    fetchCityEvents(),
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
  const merged: (EventItem & { _source: string })[] = [];

  // Priority: City of Jamestown (authoritative) → Reg Lenna (structured) →
  // Fenton → JCC → mychq → Library → WRFA → BPU. City is first so its
  // fields win wholesale (title, start/end time, venue, description) on
  // any cross-source duplicate — see isSameEvent below, and the `merged`
  // loop, which keeps the FIRST-seen object for a given event and just
  // discards later duplicates rather than merging field-by-field.
  const sourced = [
    ...cityEvents.map(e => ({ ...e, _source: 'city' })),
    ...regLennaEvents.map(e => ({ ...e, _source: 'reglenna' })),
    ...fentonEvents.map(e => ({ ...e, _source: 'fenton' })),
    ...jccEvents.map(e => ({ ...e, _source: 'jcc' })),
    ...mychqEvents.map(e => ({ ...e, _source: 'mychq' })),
    ...libraryEvents.map(e => ({ ...e, _source: 'library' })),
    ...wrfaEvents.map(e => ({ ...e, _source: 'wrfa' })),
    ...bpuEvents.map(e => ({ ...e, _source: 'bpu' })),
  ];
  for (const e of sourced) {
    const key = dedupeKey(e);
    if (seen.has(key)) continue;
    // Fuzzy title matching is for catching the same real-world event listed
    // by two different platforms (e.g. Reg Lenna's site + mychq both listing
    // a show). Within a single source's own feed, two 2+ keyword matches are
    // just different events sharing generic words ("10,000 Maniacs" fringe
    // events vs. the main concert both contain "10000"/"maniac") — applying
    // it there dropped the real Sat concert in favor of an earlier same-day
    // VIP meet-and-greet from the same mychq feed.
    if (merged.some(m => m._source !== e._source && isSameEvent(m, e))) continue;
    seen.add(key);
    merged.push(e);
  }

  // Start-of-today, not "now" — keeps today's events visible even if their start time has passed.
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  const result: EventItem[] = merged
    .filter(e => new Date(e.startDate) >= cutoff)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .map(({ _source, ...e }) => ({ ...e, source: _source }));

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

// City of Jamestown's official calendar (ICS export from the WordPress
// All-in-One Event Calendar plugin) — the authoritative source for city
// meetings, hearings, and civic events. This is the HIGHEST-priority
// events source: see the `sourced` priority order in fetchEvents, where
// city is listed first so its fields win wholesale on any cross-source
// duplicate (title, start/end time, venue, description).
async function fetchCityEvents(): Promise<EventItem[]> {
  const cached = await getCached<EventItem[]>('cityEvents', TTL.events);
  if (cached) return cached;
  try {
    const res = await feedFetch(proxyUrl(FEEDS.cityEvents));
    if (!res.ok) throw new Error(`City ICS fetch failed: ${res.status}`);
    const text = await res.text();

    const eventRx = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
    // Captures the full property key (with params, e.g. "DTSTART;VALUE=DATE"
    // or "DTSTART;TZID=America/New_York") so callers can branch on params.
    const fieldRx = /^([A-Z][A-Z0-9\-]*(?:;[^:]+)?):(.*)/;

    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);

    const events: EventItem[] = [];
    let m;
    while ((m = eventRx.exec(text)) !== null) {
      const unfolded = m[1].replace(/\r?\n[ \t]/g, '');
      const lines = unfolded.split(/\r?\n/);

      let summary = '', dtstartKey = '', dtstart = '', dtend = '';
      let location = '', description = '', url = '';
      for (const line of lines) {
        const fm = fieldRx.exec(line);
        if (!fm) continue;
        const [, rawKey, rawVal] = fm;
        // X-ALT-DESC (rich-HTML description) is double-backslash-escaped by
        // this feed's ICS generator in a way that doesn't survive a clean
        // unescape, and is often just a wrapped flyer <img> anyway —
        // DESCRIPTION is the reliable plain-text field, so it's the only
        // one read for notes.
        const k = rawKey.split(';')[0].toUpperCase();
        const val = rawVal.replace(/\\,/g, ',').replace(/\\n/g, '\n').trim();
        if (k === 'SUMMARY')     summary = val;
        if (k === 'DTSTART')   { dtstart = val; dtstartKey = rawKey.toUpperCase(); }
        if (k === 'DTEND')      dtend = val;
        if (k === 'LOCATION')   location = val;
        if (k === 'DESCRIPTION') description = val;
        if (k === 'URL')        url = val;
      }
      if (!summary || !dtstart) continue;
      // All-day entries in this feed are holiday closures/observances
      // ("City Hall Closed", "Daylight Savings"), not events residents
      // would browse — skip them, keep only real timed meetings/events.
      if (dtstartKey.includes('VALUE=DATE')) continue;

      const start = icsLocalDateTimeString(dtstart);
      if (!start) continue;
      const end = icsLocalDateTimeString(dtend) ?? undefined;
      if (new Date(start) < cutoff) continue;

      let note = description;
      if (note.length > 400) note = note.slice(0, 400).trimEnd() + '…';

      events.push({
        title: summary,
        startDate: start,
        endDate: end,
        location: location || 'Jamestown, NY',
        category: 'Civic',
        tags: ['City of Jamestown'],
        link: url || undefined,
        note: note || undefined,
        source: 'city',
      });
    }

    await setCache('cityEvents', events);
    return events;
  } catch {
    const stale = await AsyncStorage.getItem(`${CACHE_PREFIX}cityEvents`);
    if (stale) { try { return JSON.parse(stale).data ?? []; } catch { return []; } }
    return [];
  }
}

async function fetchMychqEvents(): Promise<EventItem[]> {
  const cached = await getCached<EventItem[]>('mychq', TTL.events);
  if (cached) return cached;
  try {
    const today = new Date().toISOString().split('T')[0];
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    // per_page=100 with no end_date silently truncated to the first 100
    // events COUNTYWIDE (sorted chronologically, before local-town
    // filtering below) — on a busy week that's used up by mid-morning on
    // day 3, dropping same-day evening events (e.g. the Hispanic Heritage
    // Festival, 3pm) and everything after. Scoping to a 30-day window and
    // raising per_page keeps the whole window in a single uncapped page.
    const url = `${FEEDS.mychq}?per_page=999&start_date=${today}&end_date=${in30Days}`;
    const res = await feedFetch(proxyUrl(url));
    if (!res.ok) throw new Error('mychq fetch failed');
    const json = await res.json();

    const events: EventItem[] = (json.events ?? [])
      .filter((e: any) => LOCAL_TOWNS.has((e.venue?.city ?? '').toLowerCase().trim()))
      .map((e: any) => {
        const category = e.categories?.[0]?.name ? stripHtml(e.categories[0].name) : 'Community';
        const venueName = e.venue?.venue ? stripHtml(e.venue.venue) : '';
        const address = e.venue?.address ? stripHtml(e.venue.address) : '';
        const city = e.venue?.city ? stripHtml(e.venue.city) : '';

        // Known bug: some myCHQ events are tagged to a generic catch-all
        // "Downtown Jamestown, 19 W 3rd St" venue record that doesn't
        // reflect where the event actually is — the poster's body text
        // (cross-posted from Facebook, "📅 ... / 📍 ...") is the correct
        // source in that specific case. Only overrides for this exact
        // placeholder venue, so correctly-tagged events are untouched.
        const isGenericPlaceholderVenue = venueName === 'Downtown Jamestown' && address === '19 W 3rd St';
        const bodyLocation = isGenericPlaceholderVenue ? extractPinLocationFromBody(e.description ?? '') : null;

        const location = bodyLocation
          || [venueName, city].filter(Boolean).join(', ')
          || 'Chautauqua County';

        return {
          title: stripHtml(e.title ?? ''),
          startDate: (e.start_date ?? '').replace(' ', 'T'),
          endDate: (e.end_date ?? e.start_date ?? '').replace(' ', 'T'),
          location,
          category,
          tags: [category],
          link: e.url || undefined,
          imageUrl: e.image?.url || undefined,
          source: 'mychq',
        } as EventItem;
      })
      .filter((e: EventItem) => e.title && e.startDate);
      // No secondary cap here — per_page=100 above already bounds the fetch.
      // A hard .slice(0, 25) used to sit here and silently dropped anything
      // past the 25th chronological local-town event; on a dense weekend
      // (e.g. Labor Day, ~57 local events across 4 days) that cut off
      // headline events like the Labor Day Festival and the 10,000 Maniacs
      // concert while lower-priority items from earlier in the week stayed.

    await setCache('mychq', events);
    return events;
  } catch {
    const stale = await AsyncStorage.getItem(`${CACHE_PREFIX}mychq`);
    if (stale) { try { return JSON.parse(stale).data ?? []; } catch { return []; } }
    return [];
  }
}

const JCC_FIELD_RX: Record<string, RegExp> = {
  'ps:score':    /<ps:score[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/ps:score>|<ps:score[^>]*>([^<]*)<\/ps:score>/,
  'pubDate':     /<pubDate[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/pubDate>|<pubDate[^>]*>([^<]*)<\/pubDate>/,
  'ps:opponent': /<ps:opponent[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/ps:opponent>|<ps:opponent[^>]*>([^<]*)<\/ps:opponent>/,
  'category':    /<category[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/category>|<category[^>]*>([^<]*)<\/category>/,
  'link':        /<link[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/link>|<link[^>]*>([^<]*)<\/link>/,
};

// JCC's composite RSS feed leaves <category> blank on future schedule entries
// (only completed games get it filled in) — resolve the sport from the schedule
// URL's code instead, built from whichever items *do* have a category.
async function fetchJCCEvents(): Promise<EventItem[]> {
  const cached = await getCached<EventItem[]>('jccEvents', TTL.events);
  if (cached) return cached;
  try {
    const res = await feedFetch(proxyUrl(FEEDS.jcc));
    if (!res.ok) throw new Error('JCC events fetch failed');
    const text = await res.text();

    const blocks: string[] = [];
    const itemRx = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRx.exec(text)) !== null) blocks.push(m[1]);

    const get = (block: string, tag: string) => {
      const match = JCC_FIELD_RX[tag]?.exec(block);
      return match ? (match[1] ?? match[2] ?? '').trim() : '';
    };
    const sportCode = (link: string) => link.match(/\/sports\/([a-z0-9]+)\//)?.[1];

    const codeToSport: Record<string, string> = {};
    for (const block of blocks) {
      const code = sportCode(get(block, 'link'));
      const cat  = get(block, 'category');
      if (code && cat) codeToSport[code] = cat;
    }

    const now = new Date();
    const events: EventItem[] = [];
    for (const block of blocks) {
      if (get(block, 'ps:score').trim() !== '') continue; // has a result — not upcoming
      const opponentRaw = get(block, 'ps:opponent');
      // Home games only — skip "at Team" (away) and "vs. Team @ Venue" (neutral-site
      // tournament games, e.g. hockey at Watertown Arena — not actually at JCC)
      if (!opponentRaw || opponentRaw.toLowerCase().startsWith('at ') || opponentRaw.includes('@')) continue;

      const pubDate = get(block, 'pubDate');
      const date = pubDate ? new Date(pubDate) : null;
      if (!date || date < now) continue;

      const link = get(block, 'link');
      const code = sportCode(link);
      const sport = (code && codeToSport[code]) || get(block, 'category') || 'Athletics';
      const opponent = stripHtml(opponentRaw.replace(/^vs\.?\s+/i, ''));

      events.push({
        title: `JCC ${sport} vs. ${opponent}`,
        startDate: date.toISOString(),
        endDate: date.toISOString(),
        location: 'Jamestown Community College, Jamestown',
        category: 'Sports',
        tags: ['JCC', sport],
        link: link || 'https://www.jccjayhawks.com',
      });
    }

    events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const result = events.slice(0, 10);
    await setCache('jccEvents', result);
    return result;
  } catch {
    const stale = await AsyncStorage.getItem(`${CACHE_PREFIX}jccEvents`);
    if (stale) { try { return JSON.parse(stale).data ?? []; } catch { return []; } }
    return [];
  }
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
      .filter(item => {
        if (new Date(getItemText(item.pubDate ?? '')) < sevenDaysAgo) return false;
        // The county's own CMS marks each alert post with a literal status
        // field ("THIS IS NOT AN ACTIVE ALERT" once resolved/expired) — a
        // same-day Tornado Watch stays "active" here for a flat 7 days on
        // publish date alone, well past when the county itself closed it
        // out. Trust that field over age when it's present.
        const rawDesc = getItemText(item.description ?? '');
        if (rawDesc.includes('field-active-alert') && rawDesc.includes('NOT AN ACTIVE ALERT')) return false;
        return true;
      })
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

  // NOTE: this destructure is positional — adding or removing a feed here
  // without changing BOTH lists in step silently shifts every later
  // response onto the wrong variable.
  const [wrfaRes, cityRes, jacksonRes, wgrzSportsRes, wgrzWNYRes, wgrzSTRes, wnyNewsNowRes, wjtnRes] = await Promise.allSettled([
    feedFetch(proxyUrl(FEEDS.news)),
    feedFetch(proxyUrl(FEEDS.cityNews)),
    feedFetch(proxyUrl(FEEDS.jackson)),
    feedFetch(proxyUrl(FEEDS.wgrzSports)),
    feedFetch(proxyUrl(FEEDS.wgrzWNY)),
    feedFetch(proxyUrl(FEEDS.wgrzSouthernTier)),
    feedFetch(proxyUrl(FEEDS.wnyNewsNow)),
    feedFetch(proxyUrl(FEEDS.wjtn)),
  ]);

  // Recurring show episodes ("Oakridge Outdoors EP 145 – August 24, 2026")
  // are usually tagged [LISTEN]/[WATCH], but that tag is sometimes missing
  // on WRFA's end — catch the "EP <number>" pattern too so an untagged
  // episode post doesn't slip through as if it were a real article.
  const EPISODE_PATTERN = /\bEP\s*\d+\b/i;
  function toNewsItems(raw: string, limit: number, source: string): NewsItem[] {
    const items = getRssItems(raw);
    return items
      .filter(item => {
        const title = getItemText(item.title ?? '');
        return !title.startsWith('[LISTEN]') && !title.startsWith('[WATCH]') && !EPISODE_PATTERN.test(title);
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
        // Real WJTN headlines are short one-liners. When a story in the
        // roundup doesn't have the expected blank-line break before its
        // body, blocks[i] ends up being the whole story instead of just the
        // headline — skip it rather than render an entire radio bulletin as
        // a "headline" (this is what blew up the News tab's hero/list card).
        if (!headline || headline.length < 10 || headline.length > 200) continue;
        if (!JAMESTOWN_TERMS.test(headline) && !JAMESTOWN_TERMS.test(body)) continue;
        wjtnItems.push({ title: headline, link, pubDate, excerpt: body, source: 'WJTN' });
        if (wjtnItems.length >= lim.wjtn) break;
      }
      if (wjtnItems.length >= lim.wjtn) break;
    }
  }

  // Different outlets covering the same real story write their own
  // headlines (WJTN's "Schmidt defends use of Flock cameras..." vs WRFA's
  // "Chautauqua County DA Schmidt Speaks In Support Of Flock Cameras..."),
  // so exact-title matching alone misses the duplicate. Fuzzy-match by
  // shared significant keywords within a same-day publish window — but
  // only across *different* sources (matching within one outlet's own feed
  // was the exact bug that ate a real event from the events pipeline; see
  // isSameEvent's _source tagging for the same fix applied there).
  const NEWS_STOP_WORDS = new Set(['the','and','for','with','from','this','that','will','also','while','been','have','into','over','after','about','more','than','still','says','said','county','jamestown']);
  function newsKeywords(title: string): Set<string> {
    return new Set(
      title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
        .map(w => w.replace(/s$/, ''))
        .filter(w => w.length >= 4 && !NEWS_STOP_WORDS.has(w))
    );
  }
  function isSameStory(a: NewsItem, b: NewsItem): boolean {
    const ta = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const tb = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    // Tighter than events' isSameEvent (shared>=2): news headlines are full
    // sentences that constantly reuse generic local-news words ("county",
    // "police", "school", "board"...), so with a growing accepted-items list
    // a 2-word bar was matching almost everything against something and
    // collapsing the whole feed down to one story. Require 3+ shared words
    // and a tighter same-coverage-window (12h, not 24h).
    if (!ta || !tb || Math.abs(ta - tb) > 12 * 60 * 60 * 1000) return false;
    const kA = newsKeywords(a.title); const kB = newsKeywords(b.title);
    let shared = 0;
    for (const w of kA) { if (kB.has(w)) shared++; }
    return shared >= 3;
  }

  const seen = new Set<string>();
  const accepted: (NewsItem & { _source: string })[] = [];
  function addUnique(items: NewsItem[], source: string) {
    for (const n of items) {
      const key = n.title.toLowerCase();
      if (seen.has(key)) continue;
      if (accepted.some(a => a._source !== source && isSameStory(a, n))) continue;
      seen.add(key);
      accepted.push({ ...n, _source: source });
    }
  }

  // Priority: whichever source is added first wins a cross-source
  // duplicate — WRFA-LP leads so it's always the version shown when the
  // same story also runs on WJTN or elsewhere.
  addUnique(wrfaItems, 'wrfa');
  addUnique(cityItems, 'city');
  addUnique(jacksonItems, 'jackson');
  addUnique(wnyNewsNowItems, 'wnynewsnow');
  addUnique(wgrzSTItems, 'wgrzst');
  addUnique(wgrzSportsItems, 'wgrzsports');
  addUnique(wgrzWNYItems, 'wgrzwny');
  addUnique(wjtnItems, 'wjtn');

  // Dedup is source-priority-ordered (WRFA-LP wins ties above); final display order is purely by date, newest first
  const news: NewsItem[] = accepted
    .map(({ _source, ...rest }) => rest)
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

    const [recyclingResult, alertsResult, eventsResult, newsResult, lotdResult, libraryResult, countyAlertsResult, dpwResult] = await Promise.allSettled([
      fetchRecyclingICS(),
      fetchAlerts(),
      fetchEvents(),
      fetchNews(),
      fetchLOTD(),
      fetchLibraryContent(),
      fetchChautauquaAlerts(),
      fetchDpwUpdate(),
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

    const dpw = dpwResult.status === 'fulfilled' ? dpwResult.value : null;

    // Library, county-alerts, and DPW failures are non-critical — intentionally excluded from error banner
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
      dpw,
      lastUpdated: new Date().toISOString(),
    });

    // Push recycling data to the iOS widget via App Group shared storage
    if (Platform.OS === 'ios' && recycling.thisWeek.material !== '—') {
      try {
        const appGroup = 'group.com.chadakoindigital.chadakoinnow';
        await SharedGroupPreferences.setItem('recycling_material',       recycling.thisWeek.material,  appGroup);
        await SharedGroupPreferences.setItem('recycling_dateRange',      recycling.thisWeek.dateRange, appGroup);
        await SharedGroupPreferences.setItem('recycling_emoji',          recycling.thisWeek.emoji,     appGroup);
        await SharedGroupPreferences.setItem('recycling_next_material',  recycling.nextWeek.material,  appGroup);
        await SharedGroupPreferences.setItem('recycling_next_dateRange', recycling.nextWeek.dateRange, appGroup);
        await SharedGroupPreferences.setItem('recycling_next_emoji',     recycling.nextWeek.emoji,     appGroup);
        // Writing to SharedGroupPreferences alone doesn't wake WidgetKit —
        // without this, the home screen widget can show stale data for up
        // to a day until iOS gets around to its next scheduled refresh.
        reloadWidgetTimelines();
      } catch {}
    }
  }, []);

  // Show last known recycling data immediately (even if stale) — fresh fetch updates it in background
  useEffect(() => {
    getStaleCached<RecyclingData>('recycling').then(entry => {
      if (entry) setState(prev => ({ ...prev, recycling: { ...entry.data, stale: true, staleAsOf: entry.timestamp } }));
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  return { ...state, refresh: load };
}
