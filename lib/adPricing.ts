// Single source of truth for every advertiser-facing price and label shown
// across Visit, Events, Sports, and Settings → Featured Placement /
// Add-ons. Plain TS, no platform-specific imports — the same values power
// iOS and web since both consume this module directly. Change a number
// here and every surface updates together instead of drifting.

import { FEATURED_PARTNERS } from '../data/featuredPartners';

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

export const EVENT_BOOST_PRICES = ['$25 / 2 wks', '$45 / 30 days'];
export const EXTENDED_PROFILE_PRICE = '$19 / mo';
export const BUSINESS_STORY_PRICES = ['$25 / 48 hrs', '$49 / 7 days'];

// ─── Founders-only add-ons — OG rate card, not offered to general
// Public Featured partners. ──────────────────────────────────────────
export const BRAND_CHROME_PRICES = ['$19 / mo', '$150 / yr'];
export const FOUNDING_STORY_CREDIT_NOTE = '1×/yr included for Founders';
export const EVENT_BOOST_PACK_NOTE = '2× 30-day Event Featured boosts per year — bundle ~$90/yr, or inquire';

export const AD_BADGE_LABEL = 'ADVERTISE HERE';
