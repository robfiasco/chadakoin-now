// Seasonal city notices for the Home "Today in Jamestown" strip.
//
// Served from here (not bundled) so adding, editing, or retiring a notice is
// a deploy, not an App Store build. Each notice is gated to an Eastern
// calendar-date window (startsOn..expiresAfter, both inclusive) and its
// badge text is picked server-side from `badges`, so the client just renders
// whatever comes back.
//
// Underscore-prefixed so Vercel doesn't count it as its own function (the
// Hobby plan caps a deployment at 12): app-config.js serves it, and
// vercel.json rewrites /api/notices there, so the public URL is unchanged.

const LEAF_SOURCE = 'https://www.jamestownny.gov/city-of-jamestown-announces-2026-leaf-collection-schedule/';

const HEAP_OTDA = 'https://otda.ny.gov/programs/heap/';
const HEAP_WRFA = 'https://www.wrfalp.com/heap-accepting-applications-starting-nov-2/';

const COUNCIL_SOURCE = 'https://www.wrfalp.com/city-council-to-vote-on-creating-digital-services-division-at-bpu/';

// Bundled City Services cards (data/cityServices.ts ids) that a server notice
// now supersedes. Not date-gated: the bundled copy stays stale after the
// notice expires, so it should stay hidden too.
const HIDDEN_SERVICES = ['leafcollection'];

const HOLIDAY_LIGHTS_RULES = 'https://www.jamestownny.gov/holidaylights';

const AMNESTY_SOURCE = 'https://www.jamestownny.gov/city-of-jamestown-announces-november-amnesty-days-for-bulk-trash-electronics-recycling/';

const HALLOWEEN_SOURCE ='https://www.jamestownny.gov/city-of-jamestown-announces-5th-annual-riverwalk-trick-or-treat-trail-halloween-trick-or-treating-hours/';

const NOTICES = [
  // Listed first: soonest and shortest-lived.
  {
    id: 'amnesty-day-2026-11-21',
    category: 'Bulk Trash',
    title: 'Amnesty Day at Bergman Park',
    summary: 'Free bulk trash & electronics drop-off · Sat Nov 21, 8am–noon',
    startsOn: '2026-11-15',
    expiresAfter: '2026-11-21',
    badges: [
      { from: '2026-11-15', label: 'This Saturday' },
      { from: '2026-11-21', label: 'Today 8am–noon' },
    ],
    sections: [
      { heading: 'When & where', body: 'Sat Nov 21, 8am–12pm, Bergman Park. Rain, snow or shine.' },
      {
        heading: 'Who',
        body: 'City of Jamestown residents and property owners. Bring a NYS license or ID with a city address, a city yard waste sticker, or a current BPU bill.',
      },
      { heading: 'Accepted', body: 'Bulk trash and electronics for recycling. Free.' },
      {
        heading: 'Not accepted',
        items: [
          'Batteries, propane tanks',
          'Yard waste',
          'Paint, liquids or chemicals of any kind',
          'Hazardous materials',
          'Automotive fluids (motor oil, antifreeze)',
        ],
      },
      { heading: 'Questions', body: 'Department of Development · 716-483-7542' },
    ],
    links: [{ label: 'City announcement', url: AMNESTY_SOURCE }],
    source: 'City of Jamestown · Nov 5, 2026',
  },
  {
    id: 'holiday-lights-2026',
    category: 'Community',
    title: 'Holiday Light & Décor Contest',
    summary: 'Nominate a decorated Jamestown home by Dec 11',
    startsOn: '2026-11-12',
    expiresAfter: '2027-01-08',
    badges: [
      { from: '2026-11-12', label: 'Nominate by Dec 11' },
      { from: '2026-12-12', label: 'Voting Dec 21–31' },
      // Voting is over; the card stays up until winners are named Jan 8.
      { from: '2027-01-01', label: 'Winners Jan 8' },
    ],
    sections: [
      {
        heading: 'Nominate · Nov 16 – Dec 11',
        body: 'The city’s 3rd annual contest. Nominate your own home or someone else’s by email (lights@jamestownny.gov) or mail, with photos.',
      },
      {
        heading: 'Who can enter',
        body: 'Residential properties inside City of Jamestown limits. The display must be visible from a public street or sidewalk.',
      },
      {
        heading: 'Categories (up to 2 per home)',
        items: [
          'Creativity Unwrapped',
          'Timeless Holiday Charm',
          'Light Up the Neighborhood',
          'Theme Masterpiece',
          'Ultimate Showstopper',
          'Hall of Fame (2024 and 2025 winners)',
        ],
      },
      {
        heading: 'What’s next',
        items: [
          'Finalists picked Dec 14–18',
          'Public online voting Dec 21–31',
          'Winners announced Jan 8, 2027',
        ],
      },
    ],
    links: [{ label: 'Contest rules', url: HOLIDAY_LIGHTS_RULES }],
    source: 'City of Jamestown · Nov 12, 2026',
  },
  {
    id: 'council-2026-10-26',
    category: 'City Council',
    title: 'Public hearing: BPU Digital Services Division',
    summary: 'Mon Oct 26 · 5:45pm public hearing, 7:30pm voting session',
    startsOn: '2026-10-26',
    expiresAfter: '2026-10-26',
    badges: [{ from: '2026-10-26', label: 'Tonight 5:45pm' }],
    sections: [
      {
        heading: '5:45pm · Public hearing',
        body: 'On the local law creating a BPU division to own and operate the open-access fiber network. Council Chambers, 2nd floor of City Hall.',
      },
      {
        heading: '6pm · Budget presentations',
        body: 'DPW, Parks and Development. Police Training Room, 4th floor.',
      },
      { heading: '7:30pm · Voting session', body: 'Council Chambers, 2nd floor.' },
      { heading: 'Watch', body: 'All meetings are livestreamed on jamestownny.gov.' },
    ],
    links: [{ label: 'WRFA story', url: COUNCIL_SOURCE }],
    source: 'WRFA · Oct 2026',
  },
  // Listed first: it's the sooner, shorter-lived of the two.
  {
    id: 'halloween-hours-2026',
    category: 'Halloween',
    title: 'Trick-or-treat hours',
    summary: 'Citywide trick-or-treating is Sat Oct 31, 5–7 p.m.',
    startsOn: '2026-10-26',
    expiresAfter: '2026-10-31',
    badges: [
      { from: '2026-10-26', label: 'Sat 5–7pm' },
      { from: '2026-10-31', label: 'Tonight 5–7pm' },
    ],
    sections: [
      { heading: 'Hours', body: 'Sat Oct 31, 5–7 p.m., citywide.' },
      { heading: 'Drivers', body: 'Watch for children and pedestrians.' },
      { heading: 'Weather', body: 'Any weather change is announced by the City of Jamestown.' },
    ],
    links: [{ label: 'City announcement', url: HALLOWEEN_SOURCE }],
    source: 'City of Jamestown · Oct 6, 2026',
  },
  {
    id: 'leaf-collection-2026',
    category: 'Leaf Collection',
    title: 'Leaf collection',
    summary: 'Rake leaves to the terrace behind the curb, not the street',
    startsOn: '2026-10-26',
    expiresAfter: '2026-11-20',
    // Each entry applies from its `from` date until the next one's.
    badges: [
      // A date, not "Mon": "Starts Mon" read as today on a Monday.
      { from: '2026-10-26', label: 'Starts Nov 2' },
      { from: '2026-11-02', label: 'Phase 1 now' },
      { from: '2026-11-09', label: 'Phase 2 now' },
    ],
    sections: [
      {
        heading: 'Phase 1 · Starts Mon Nov 2',
        body: 'Begins in the Foote Ave and Ivy St area and proceeds west and north, clockwise, toward Washington St.',
      },
      {
        heading: 'Phase 2 · Expected Mon Nov 9',
        body: 'Begins in the Foote Ave, Martin Rd and Linwood Ave area and proceeds east and north, counterclockwise, toward the east side of Washington St and the Fluvanna Ave area.',
      },
      {
        heading: 'Prepare your leaves',
        items: [
          'Rake leaves to the terrace behind the curb, not into the street.',
          'Piles must be free of trash, brush, branches, plastic bags and containers, or they will not be collected.',
          'Remove basketball hoops from the public right-of-way.',
        ],
      },
      {
        heading: 'Timing',
        body: 'Dates are approximate and depend on weather and leaf volume. A second round may follow, time and weather permitting.',
      },
      {
        heading: 'Drop-off',
        body: 'The BPU Yard Waste Site closed for the season Nov 14. Use curbside leaf collection instead: rake leaves to the terrace behind the curb.',
      },
    ],
    links: [{ label: 'City schedule', url: LEAF_SOURCE }],
    source: 'City of Jamestown DPW · Oct 20, 2026',
  },
  {
    id: 'heap-2026',
    category: 'Assistance',
    title: 'Heating help (HEAP) is open',
    summary: 'NY Home Energy Assistance Program applications are open now.',
    startsOn: '2026-10-26',
    expiresAfter: '2026-11-30',
    badges: [
      { from: '2026-10-26', label: 'Opens Nov 2' },
      { from: '2026-11-02', label: 'Apply now' },
    ],
    sections: [
      {
        heading: 'Automatic for many',
        body: 'Most SNAP and Public Assistance households get HEAP automatically, with no application needed.',
      },
      {
        heading: 'Who can apply',
        body: 'Other households can apply now. A family of four qualifies with gross income up to $6,852/month ($82,230/yr).',
      },
      {
        heading: 'Higher benefits this year',
        items: [
          'Heating with oil, kerosene or propane: up $90 to $990.',
          'Heating with wood, pellets or coal: up $65 to $700.',
        ],
      },
    ],
    links: [
      { label: 'NYS OTDA HEAP page', url: HEAP_OTDA },
      { label: 'WRFA story', url: HEAP_WRFA },
    ],
    source: 'NYS OTDA · WRFA',
  },
];

function easternDateKey(d) {
  return d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

// ?now= lets the date windows be tested ahead of time. Ignored on
// production so the live endpoint can't be fed a fake date.
function resolveNow(req) {
  const raw = req.query?.now;
  if (raw && process.env.VERCEL_ENV !== 'production') {
    // A bare YYYY-MM-DD parses as UTC midnight, which is the previous day in
    // Eastern time; pin it to Eastern noon so ?now=2026-12-01 means Dec 1.
    const str = String(raw);
    const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(str) ? `${str}T12:00:00-05:00` : str);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

function currentBadge(badges, today) {
  let label = null;
  for (const b of badges ?? []) if (today >= b.from) label = b.label;
  return label;
}

export function noticesHandler(req, res) {
  try {
    const today = easternDateKey(resolveNow(req));
    const notices = NOTICES
      .filter(n => today >= n.startsOn && today <= n.expiresAfter)
      .map(({ badges, startsOn, expiresAfter, ...n }) => ({ ...n, badge: currentBadge(badges, today) }));

    // Short TTL: windows and badges flip at Eastern midnight.
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.status(200).json({ notices, hiddenServices: HIDDEN_SERVICES });
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ notices: [], hiddenServices: HIDDEN_SERVICES });
  }
}
