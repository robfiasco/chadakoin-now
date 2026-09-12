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

export const FEATURED_INTRO_MONTHS = 3;
export const FEATURED_INTRO_PRICE = 59;
export const FEATURED_OFFSEASON_PRICE = 79;
export const FEATURED_PEAK_PRICE = 129;
export const FEATURED_ANNUAL_PRICE = 899;

// Straight public pricing for Visit's equal-visibility Featured block — no
// seasonal tiers. The seasonal/intro numbers above stay in place for
// Events, Sports, and Settings, which are out of scope for this change.
export const FEATURED_FLAT_MONTHLY = 99;

// Peak season: May 1 – Sep 30. Off-season: Oct 1 – Apr 30. Informational
// copy currently lists both tiers rather than switching on the current
// date, but this is exposed in case a surface wants to highlight "current"
// season dynamically later.
export function isPeakSeason(date: Date = new Date()): boolean {
  const month = date.getMonth() + 1; // 1-12
  return month >= 5 && month <= 9;
}

export const FEATURED_INTRO_NOTE = `for your first ${FEATURED_INTRO_MONTHS} months`;
export const FEATURED_SEASONAL_NOTE =
  `Then $${FEATURED_OFFSEASON_PRICE}/mo off-season (Oct–Apr) · $${FEATURED_PEAK_PRICE}/mo peak season (May–Sep)`;
export const FEATURED_ANNUAL_NOTE = 'Prepay annually — locks your slot for 12 months';
export const FEATURED_SCARCITY_NOTE = FEATURED_SLOTS_FULL
  ? `All ${FEATURED_SLOTS} slots filled — join the waitlist`
  : `${FEATURED_SLOTS_AVAILABLE}/${FEATURED_SLOTS} slots available`;
export const FEATURED_WAITLIST_NOTE =
  'Slots are first come, first served. If full, you’ll be added to the waitlist and notified within 48 hours when one opens.';

export const EVENT_BOOST_PRICES = ['$25 / 2 wks', '$45 / 30 days'];
export const EXTENDED_PROFILE_PRICE = '$19 / mo';
export const BUSINESS_STORY_PRICES = ['$25 / 48 hrs', '$49 / 7 days'];

export const AD_BADGE_LABEL = 'ADVERTISE HERE';
