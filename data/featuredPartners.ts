// Paid Featured partners on the Visit tab — a subset of places that
// already exist in data/places.ts. This is deliberately separate from
// `Place.featured` (an editorial boost used to sort the browse list) so
// paid placement and editorial curation never get conflated: buying a
// Featured slot never adds or forces a Visit listing, it only buys equal
// visibility for a place that's already hand-curated.
//
// No payment/subscription backend exists — bump this list by hand when a
// partner signs up or a subscription ends, same manual-update pattern as
// FEATURED_SLOTS_FILLED used to be. Keep it at or under FEATURED_SLOTS
// (lib/adPricing.ts) — extras beyond that cap are ignored defensively at
// render time, but shouldn't happen by policy.

export interface FeaturedPartner {
  placeId: string;    // must match a Place.id in data/places.ts
  tagline?: string;   // optional override for the Featured card's blurb
}

export const FEATURED_PARTNERS: FeaturedPartner[] = [];
