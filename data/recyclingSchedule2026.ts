// Jamestown BPU 2026 recycling schedule — which material is collected each
// week. Bundled (not fetched) because BPU prints it once a year; the old
// live ICS feed via /api/proxy kept 502ing and left Recycling empty.
//
// Source: BPU 2026 Recycling Calendar PDF (CALENDAR_URL in bpuHolidays.ts),
// transcribed week by week. Key = Monday of the collection week.
//
// To roll this forward to 2027: replace RECYCLING_WEEKS with the 2027 PDF's
// weeks (and BPU_HOLIDAYS / CALENDAR_URL in bpuHolidays.ts). That's the
// whole edit — until then the app shows a "calendar not posted yet" state
// instead of guessing a week.

export type RecyclingMaterialId = 'plastic' | 'paper' | 'metal' | 'cardboard';

export interface RecyclingMaterial {
  label: string;     // app's existing display name (widget/Home match on it)
  bpuColor: string;  // color code on the printed calendar
  accepts: string;   // "what goes in", from the BPU legend
  emoji: string;
  note?: string;
}

export const RECYCLING_MATERIALS: Record<RecyclingMaterialId, RecyclingMaterial> = {
  plastic: {
    label: 'Plastics',
    bpuColor: 'yellow',
    accepts: 'rinsed & clean beverage, condiment, detergent, milk, mouthwash and shampoo containers only — no lids',
    emoji: '🧴',
  },
  paper: {
    label: 'Paper',
    bpuColor: 'red',
    accepts: 'newspaper, magazines, fliers, junk mail, envelopes, paper bags and soft-covered books only',
    emoji: '📰',
  },
  metal: {
    label: 'Metals & Cans',
    bpuColor: 'purple',
    accepts: 'aluminum & tin food and beverage containers only',
    emoji: '🥫',
  },
  cardboard: {
    label: 'Corrugated Cardboard & Boxboard',
    bpuColor: 'brown',
    accepts: 'corrugated cardboard and boxboard only',
    emoji: '📦',
    note: 'All boxes must be flattened and in the container.',
  },
};

export const RECYCLING_WEEKS: Record<string, RecyclingMaterialId> = {
  '2025-12-29': 'cardboard', // Jan 1–3
  '2026-01-05': 'metal',
  '2026-01-12': 'plastic',
  '2026-01-19': 'paper',
  '2026-01-26': 'cardboard',
  '2026-02-02': 'cardboard',
  '2026-02-09': 'plastic',
  '2026-02-16': 'cardboard',
  '2026-02-23': 'paper',
  '2026-03-02': 'metal',
  '2026-03-09': 'cardboard',
  '2026-03-16': 'plastic',
  '2026-03-23': 'paper',
  '2026-03-30': 'cardboard',
  '2026-04-06': 'plastic',
  '2026-04-13': 'paper',
  '2026-04-20': 'cardboard',
  '2026-04-27': 'plastic',
  '2026-05-04': 'metal',
  '2026-05-11': 'cardboard',
  '2026-05-18': 'plastic',
  '2026-05-25': 'cardboard',
  '2026-06-01': 'paper',
  '2026-06-08': 'cardboard',
  '2026-06-15': 'plastic',
  '2026-06-22': 'paper',
  '2026-06-29': 'cardboard',
  '2026-07-06': 'paper',
  '2026-07-13': 'metal',
  '2026-07-20': 'plastic',
  '2026-07-27': 'cardboard',
  '2026-08-03': 'paper',
  '2026-08-10': 'plastic',
  '2026-08-17': 'cardboard',
  '2026-08-24': 'paper',
  '2026-08-31': 'plastic',
  '2026-09-07': 'metal',
  '2026-09-14': 'cardboard',
  '2026-09-21': 'paper',
  '2026-09-28': 'cardboard',
  '2026-10-05': 'plastic',
  '2026-10-12': 'paper',
  '2026-10-19': 'cardboard',
  '2026-10-26': 'plastic',
  '2026-11-02': 'paper',
  '2026-11-09': 'metal',
  '2026-11-16': 'cardboard',
  '2026-11-23': 'plastic',
  '2026-11-30': 'cardboard',
  '2026-12-07': 'paper',
  '2026-12-14': 'plastic',
  '2026-12-21': 'paper',
  '2026-12-28': 'cardboard', // through Jan 2, 2027
};
