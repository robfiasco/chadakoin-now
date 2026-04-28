// v2 design system — dark palette used across all redesigned screens
export const dark = {
  bg: '#060e18',
  surface: 'rgba(15, 23, 42, 0.4)',   // slate-900/40
  border: 'rgba(30, 41, 59, 0.8)',    // slate-800/80
  text: {
    primary: '#e2e8f0',   // slate-200
    muted: '#94a3b8',     // slate-400
    subtle: '#64748b',    // slate-500
  },
  // Semantic category colors — must be consistent across all screens
  category: {
    city:       '#22d3ee',  // cyan-400  — City / Parking / Primary CTA
    parking:    '#22d3ee',
    recycling:  '#34d399',  // emerald-400 — Community / Recycling / Open Now
    community:  '#34d399',
    music:      '#fb7185',  // rose-400  — Music / Live / Breaking
    film:       '#fbbf24',  // amber-400 — Film / State / Coming Up
    arts:       '#a78bfa',  // violet-400 — Arts / JCC
    breaking:   '#fb7185',
    jcc:        '#a78bfa',
    activity:   '#2dd4bf',
  },
} as const;
