// Weekly DPW "Where We Are Working" construction update — scraped from a
// plain WordPress page (no feed exists for this). Structure has been stable:
// <h1>DPW Weekly Construction Update</h1>
// <h2>Week of <start> – <end></h2>
// <ul><li><em>Street – (segment) – Activity</em></li>...</ul>
// followed by a callout linking the full seasonal PDF.

const SOURCE_URL = 'https://www.jamestownny.gov/public-works/where-we-are-working-department-of-public-works/';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6h — page updates roughly weekly

let cached = null; // { data, fetchedAt }

const KIND_RULES = [
  [/paving/i, 'paving'],
  [/reconstruct/i, 'reconstruction'],
  [/curb/i, 'curb'],
  [/storm/i, 'storm'],
  [/ditch/i, 'ditch'],
  [/patch/i, 'patching'],
  [/catch basin/i, 'catch_basin'],
  [/concrete/i, 'concrete'],
  [/prep/i, 'prep'],
];

function classifyKind(text) {
  for (const [rx, kind] of KIND_RULES) {
    if (rx.test(text)) return kind;
  }
  return 'other';
}

function stableId(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&')
    .replace(/&hellip;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#8217;|&rsquo;/g, '’')
    .trim();
}

function parseMonthDayYear(str, fallbackYear) {
  // "August 31, 2026" or "September 4, 2026" (year may be omitted on the first half)
  const m = str.trim().match(/([A-Za-z]+)\s+(\d{1,2})(?:,\s*(\d{4}))?/);
  if (!m) return null;
  const year = m[3] ? parseInt(m[3], 10) : fallbackYear;
  const d = new Date(`${m[1]} ${m[2]}, ${year}`);
  return isNaN(d.getTime()) ? null : d;
}

function parseTentativeDate(activityText, weekYear) {
  const m = activityText.match(/\b(\d{1,2})\/(\d{1,2})\b/);
  if (!m) return undefined;
  const mo = String(m[1]).padStart(2, '0');
  const day = String(m[2]).padStart(2, '0');
  return `${weekYear}-${mo}-${day}`;
}

function parseWorkItem(raw, weekYear) {
  const text = decodeEntities(raw);
  const dashMatch = text.match(/^(.+?)\s+[–-]\s+(.+)$/);
  if (!dashMatch) {
    // No "Street – Activity" shape → citywide/general support item, not tied to one street
    return {
      id: stableId(`${weekYear}|${text}`),
      street: '',
      activity: text,
      activityKind: classifyKind(text),
      isCitywideSupport: true,
    };
  }

  const street = dashMatch[1].trim();
  let rest = dashMatch[2].trim();
  let segment;
  const segMatch = rest.match(/^\(([^)]+)\)\s*[–-]?\s*(.*)$/);
  if (segMatch) {
    segment = segMatch[1].trim();
    rest = segMatch[2].trim();
  }
  const activity = rest || text;

  return {
    id: stableId(`${weekYear}|${street}|${activity}`),
    street,
    segment,
    activity,
    activityKind: classifyKind(activity),
    tentativeDate: parseTentativeDate(activity, weekYear),
    isCitywideSupport: false,
  };
}

async function scrape() {
  const res = await fetch(SOURCE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChadakoinNow/1.0)' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`DPW page fetch failed: ${res.status}`);
  const html = await res.text();

  const weekHeaderMatch = html.match(/<h2[^>]*>\s*Week of\s+([^<]+?)\s*<\/h2>/i);
  if (!weekHeaderMatch) throw new Error('DPW week header not found — page structure may have changed');
  const rawWeekLabel = decodeEntities(`Week of ${weekHeaderMatch[1]}`);

  const rangeParts = decodeEntities(weekHeaderMatch[1]).split(/[–—-]/);
  const startStr = rangeParts[0]?.trim();
  const endStr = rangeParts[1]?.trim();
  const startDate = startStr ? parseMonthDayYear(startStr, new Date().getFullYear()) : null;
  const endDate = endStr ? parseMonthDayYear(endStr, startDate ? startDate.getFullYear() : new Date().getFullYear()) : null;
  if (!startDate) throw new Error('DPW week start date unparseable');

  const weekYear = startDate.getFullYear();
  const weekStart = startDate.toISOString().split('T')[0];
  const weekEnd = (endDate ?? startDate).toISOString().split('T')[0];

  // Grab the <ul> immediately following the week header
  const afterHeader = html.slice(weekHeaderMatch.index + weekHeaderMatch[0].length);
  const listMatch = afterHeader.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i);
  if (!listMatch) throw new Error('DPW item list not found');

  const items = [...listMatch[1].matchAll(/<li[^>]*>\s*(?:<em>)?(.*?)(?:<\/em>)?\s*<\/li>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)
    .map(raw => parseWorkItem(raw, weekYear));

  const seasonalMatch = html.match(/href="([^"]+Construction-List[^"]*\.pdf)"/i);
  const seasonalPdfUrl = seasonalMatch ? seasonalMatch[1] : undefined;

  return {
    id: stableId(`${weekStart}|${SOURCE_URL}`),
    weekStart,
    weekEnd,
    fetchedAt: new Date().toISOString(),
    sourceUrl: SOURCE_URL,
    items,
    rawWeekLabel,
    seasonalPdfUrl,
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=3600');

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return res.status(200).json(cached.data);
  }

  try {
    const data = await scrape();
    cached = { data, fetchedAt: Date.now() };
    return res.status(200).json(data);
  } catch (err) {
    if (cached) return res.status(200).json(cached.data); // serve stale over nothing
    return res.status(200).json(null);
  }
}
