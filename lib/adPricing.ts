// Single source of truth for every advertiser-facing price and label shown
// across Visit, Events, Sports, and Settings → Featured Placement /
// Add-ons. Plain TS, no platform-specific imports — the same values power
// iOS and web since both consume this module directly. Change a number
// here and every surface updates together instead of drifting.

import { FEATURED_PARTNERS } from '../data/featuredPartners';
import { FEATURED_EVENTS } from '../data/featuredEvents';

export const FEATURED_SLOTS = 5;

// Featured Placement is sold by email (the app's "Get Featured" CTAs open
// the feedback form, which sends straight to Rob via Resend) — no
// payment/subscription backend exists. FEATURED_SLOTS_FILLED now derives
// from the actual partner list (data/featuredPartners.ts) instead of being
// hand-maintained separately, so the two can't drift out of sync.
export const FEATURED_SLOTS_FILLED = FEATURED_PARTNERS.length;
export const FEATURED_SLOTS_AVAILABLE = Math.max(0, FEATURED_SLOTS - FEATURED_SLOTS_FILLED);
export const FEATURED_SLOTS_FULL = FEATURED_SLOTS_AVAILABLE === 0;

// Straight public pricing, year-round — no seasonal tiers, no intro
// months. Replaces the old $59 intro / $79-$129 seasonal model everywhere
// it used to show up (Visit, Settings) — this is the one Featured price.
export const FEATURED_FLAT_MONTHLY = 99;
export const FEATURED_ANNUAL_PRICE = 899;

export const FEATURED_ANNUAL_NOTE = 'Prepay annually — locks your slot for 12 months';
export const FEATURED_SCARCITY_NOTE = FEATURED_SLOTS_FULL
  ? `All ${FEATURED_SLOTS} slots filled — join the waitlist`
  : `${FEATURED_SLOTS_AVAILABLE}/${FEATURED_SLOTS} slots available`;
export const FEATURED_WAITLIST_NOTE =
  'Slots are first come, first served. If full, you’ll be added to the waitlist and notified within 48 hours when one opens.';
// Public Featured only opens up once the Founding five are placed (or one
// churns) — the two tiers aren't sold in parallel while Founding spots
// remain.
export const PUBLIC_FEATURED_AVAILABILITY_NOTE =
  'Opens up once the Founding five are placed, or a spot churns — not sold alongside Founding.';

// ─── Founding Featured — first FEATURED_SLOTS partners, grandfathered
// pricing. A subset of the same Visit Featured cap above, not a separate
// pool: the first five partners to sign up lock this rate in for as long
// as they keep renewing without a gap. ──────────────────────────────
export const FOUNDING_ANNUAL_PRICE = 699;
export const FOUNDING_TERM_NOTE =
  'Live when creative is ready (fall 2026) through Dec 31, 2027 — up to ~15 months for the price of 12, depending on signup date.';
export const FOUNDING_RENEWAL_NOTE =
  `Renews each calendar year at $${FOUNDING_ANNUAL_PRICE}/yr for as long as you renew without a gap — locked in, never subject to future price increases.`;
export const FOUNDING_ELIGIBILITY_NOTE =
  'Only for places already on the hand-curated Visit list. Paying does not buy or force a Visit listing.';
export const FOUNDING_SCARCITY_NOTE = `Limited to the first ${FEATURED_SLOTS} partners — hand-selected.`;

// ─── Events Featured — carousel of up to FEATURED_EVENT_SLOTS at the
// top of Events, equal visibility every filter. Separate product from
// Visit Featured/Founding — no shared inventory or caps. ──────────────
// $25 tier matches how businesses actually promote a one-off event: runs
// through the event date, with a 7–14 day floor/ceiling so a same-day
// booking isn't a token 1-day placement and a far-off booking isn't
// parked in the carousel for months. $45/30 days is for a series,
// residency, or festival-month run rather than a single date.
export const EVENT_BOOST_PRICES = ['$25 / event', '$45 / 30 days'];
export const EVENT_BOOST_SHORT_NOTE = 'Runs through your event date — min 7 days, max 14.';
export const EVENT_BOOST_LONG_NOTE = 'For a series, residency, or festival month.';
export const FEATURED_EVENT_SLOTS = 3;
export const FEATURED_EVENT_SLOTS_FILLED = FEATURED_EVENTS.length;
export const FEATURED_EVENT_SLOTS_AVAILABLE = Math.max(0, FEATURED_EVENT_SLOTS - FEATURED_EVENT_SLOTS_FILLED);

// Gate shared by Extended Profile and Business Story below: both are
// standalone products open to any Visit-listed business (not just the
// five Featured partners), but still require an existing hand-curated
// Visit listing — off-list businesses can't buy either.
export const VISIT_LIST_ELIGIBILITY_NOTE =
  'Available only to businesses already on the hand-curated Visit list — not for off-list businesses.';

export const EXTENDED_PROFILE_PRICE = '$19 / mo';

// Replaces the old $25/48hr · $49/7day Story SKUs — a single price, hard
// capped once per calendar year per business (no exceptions, including
// for Founders — see Founders add-ons below).
export const BUSINESS_STORY_PRICE = '$99 / 30 days';
export const BUSINESS_STORY_CAP_NOTE = 'Once per calendar year, per business.';

// ─── Home "Presented by" — a single sponsor slot, separate from Visit
// Featured entirely. Suggested pricing; Rob can edit before it ships. ──
export const HOME_SPONSOR_MONTHLY = 299;
export const HOME_SPONSOR_ANNUAL = 2499;

// ─── Founders-only add-ons — OG rate card, not offered to general
// Public Featured partners. ──────────────────────────────────────────
export const BRAND_CHROME_PRICES = ['$19 / mo', '$150 / yr'];
export const FOUNDING_EXTENDED_PROFILE_NOTE = 'First 3 months free for Founders (standard $19/mo after).';
export const EVENT_BOOST_PACK_NOTE = '2× 30-day Event Featured boosts per year — bundle ~$90/yr, or inquire';

export const AD_BADGE_LABEL = 'ADVERTISE HERE';
