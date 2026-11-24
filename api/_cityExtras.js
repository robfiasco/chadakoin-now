// City events the City of Jamestown has announced but not put on its
// All-in-One Event Calendar ICS feed. The proxy appends these to that feed
// so they reach Events (and Home's next-event card) without an app rebuild:
// the client's curated list (hooks/useCivicData.ts) is compiled into the
// native bundle, but the city ICS is fetched live through /api/proxy.
//
// Underscore prefix: Vercel doesn't count this as a function (Hobby cap).

export const CITY_EVENTS_URL =
  'https://www.jamestownny.gov/?plugin=all-in-one-event-calendar&controller=ai1ec_exporter_controller&action=export_events&no_html=true';

const EXTRAS = [
  {
    uid: 'chadakoin-now-2026-christmas-parade@chadakoindigital.com',
    // If the city later posts it, their copy wins and this one is skipped.
    // Both words are required, so the "Gingerbread & Candy Land Holiday
    // Parade" entry doesn't count as a match.
    alreadyListed: /SUMMARY:[^\r\n]*christmas[^\r\n]*parade/i,
    day: '20261205',
    // Stop sending it once the day is over (Eastern date).
    lastDay: '2026-12-05',
    summary: 'Jamestown Christmas Parade & Tree Lighting',
    dtstart: '20261205T180000',
    dtend: '20261205T200000',
    location: 'City Hall / Tracy Plaza, 200 East Third Street, Jamestown, NY 14701',
    description:
      "Floats, Santa and fireworks. The city's Christmas tree on Tracy Plaza is officially lit during the parade.",
    url: 'https://www.jamestownny.gov/holiday-season-takes-shape-as-jamestowns-annual-christmas-tree-is-set-to-arrive-at-city-hall/',
  },
];

// ICS text escaping (RFC 5545 §3.3.11). The client unescapes "\,".
function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

function easternToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

function toVevent(e) {
  return [
    'BEGIN:VEVENT',
    `UID:${e.uid}`,
    `DTSTART;TZID=America/New_York:${e.dtstart}`,
    `DTEND;TZID=America/New_York:${e.dtend}`,
    `SUMMARY:${esc(e.summary)}`,
    `LOCATION:${esc(e.location)}`,
    `DESCRIPTION:${esc(e.description)}`,
    `URL:${e.url}`,
    'END:VEVENT',
  ].join('\r\n');
}

// Returns the body with any still-relevant extras added just before
// END:VCALENDAR. Anything that doesn't look like a calendar comes back
// unchanged, so an upstream error page is never altered.
export function withCityExtras(body) {
  if (typeof body !== 'string') return body;
  const endIdx = body.lastIndexOf('END:VCALENDAR');
  if (endIdx === -1) return body;

  const today = easternToday();
  const add = EXTRAS.filter(e => {
    if (today > e.lastDay) return false;
    if (body.includes(e.uid)) return false;
    // Match the city's own listing only on the same day.
    const listedSameDay = body.split('BEGIN:VEVENT').some(
      block => e.alreadyListed.test(block) && block.includes(e.day),
    );
    return !listedSameDay;
  });
  if (add.length === 0) return body;

  return body.slice(0, endIdx) + add.map(toVevent).join('\r\n') + '\r\n' + body.slice(endIdx);
}
