// Home "Presented by" — a single, high-dollar sponsor slot on the Home
// screen. Deliberately separate from Visit Featured: it's one sponsor,
// not five, shown near the top of Home rather than in the Visit block,
// and kept visually much quieter than the Visit/Events/Sports ad cards.
//
// No payment backend exists — set this by hand when a sponsor signs up.
// Leave it null until then; Home shows a discreet inquire prompt instead.

export interface HomeSponsor {
  name: string;
  website?: string;
}

export const HOME_SPONSOR: HomeSponsor | null = null;
