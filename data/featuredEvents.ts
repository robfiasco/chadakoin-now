// Paid Events Featured — a carousel of up to FEATURED_EVENT_SLOTS at the
// top of Events, equal visibility for every filter. Separate product from
// Visit Featured/Founding: different cap, different inventory, no shared
// slots. Self-contained records (not references into the auto-scraped
// events feed) since a paid event isn't necessarily on any RSS source
// Rob already scrapes — Rob fills these in by hand when someone books.
//
// No payment backend exists — bump this list by hand when a booking
// starts or ends. Keep it at or under FEATURED_EVENT_SLOTS
// (lib/adPricing.ts).

export interface FeaturedEvent {
  title: string;
  when: string;        // display string, e.g. "Sat, Sep 20 · 7:00 PM"
  location?: string;
  link?: string;
  tagline?: string;     // optional short paid blurb
}

export const FEATURED_EVENTS: FeaturedEvent[] = [];
