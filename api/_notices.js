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

const NOTICES = [
  {
    id: 'leaf-collection-2026',
    category: 'Leaf Collection',
    title: 'Leaf collection',
    summary: 'Rake leaves to the terrace behind the curb, not the street',
    startsOn: '2026-10-26',
    expiresAfter: '2026-11-20',
    // Each entry applies from its `from` date until the next one's.
    badges: [
      { from: '2026-10-26', label: 'Starts Mon' },
      { from: '2026-11-02', label: 'Phase 1 underway' },
      { from: '2026-11-09', label: 'Phase 2 underway' },
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
        body: 'BPU Yard Waste Site, 1001 Monroe St · Saturdays 7am–1pm through Nov 14.',
      },
    ],
    links: [{ label: 'City schedule', url: LEAF_SOURCE }],
    source: 'City of Jamestown DPW · Oct 20, 2026',
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
    const d = new Date(String(raw));
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
    res.status(200).json({ notices });
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ notices: [] });
  }
}
