export const Colors = {
  green: '#2FBF71',
  greenBright: '#49D17D',
  deepBlue: '#163A59',
  blueTeal: '#1F5673',
  navy: '#0F1A24',         // tab bar surface
  cream: '#F4EFE6',        // legacy / native fallback
  warmWhite: '#FFFFFF',
  background: '#EEF2F3',
  charcoal: '#14212B',
  amber: '#F59E0B',
  amberLight: '#FEF3C7',   // amber note background
  red: '#EF4444',
  white: '#FFFFFF',
  gray200: '#E5EBF0',
  gray300: '#D1D9E0',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
};

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
    film:       '#fbbf24',  // amber-400 — Film / Eat / State / Coming Up
    eat:        '#fbbf24',
    arts:       '#a78bfa',  // violet-400 — Arts / See / JCC
    see:        '#a78bfa',
    stay:       '#60a5fa',  // blue-400  — Stay
    do:         '#2dd4bf',  // teal-400  — Do / Activity
    shop:       '#34d399',
    breaking:   '#fb7185',
    state:      '#fbbf24',
    jcc:        '#a78bfa',
    activity:   '#2dd4bf',
  },
} as const;
