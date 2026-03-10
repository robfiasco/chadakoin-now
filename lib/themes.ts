export type ThemeId = 'green' | 'solar' | 'blood' | 'violet' | 'crescent';

export interface Theme {
  id: ThemeId;
  label: string;
  sub: string;
  swatchColor: string;
  bg: string;
  // Primary accent — weather, date badge, dominant glow
  acc: string;
  acc55: string;
  acc45: string;
  accRGB: string;
  // Secondary accent — recycling, positive chips, secondary data
  acc2: string;
  acc2RGB: string;
  // Tertiary accent — subtle details, dates, muted labels
  acc3: string;
  acc3RGB: string;
  orb1: string;
  orb2: string;
  warmWarn: { bg: string; text: string; borderColor: string };
  // Optional overrides
  tabBarBg?: string;    // tab bar background — defaults to rgba(0,5,15,0.92)
  bgGradient?: string;  // web-only CSS background gradient override
}

export const THEMES: Theme[] = [
  {
    id: 'green',
    label: 'Chadakoin',
    sub: 'The river through downtown',
    swatchColor: '#00d4ff',
    bg: '#020c14',
    // Primary: electric cyan
    acc: '#00d4ff',
    acc55: 'rgba(0,212,255,0.55)',
    acc45: 'rgba(0,212,255,0.45)',
    accRGB: '0,200,255',
    // Secondary: mint green
    acc2: '#2dffb4',
    acc2RGB: '45,255,180',
    // Tertiary: soft violet
    acc3: '#a78bfa',
    acc3RGB: '167,139,250',
    orb1: 'rgba(0,200,255,0.14)',
    orb2: 'rgba(45,255,180,0.1)',
    warmWarn: { bg: 'rgba(255,190,40,0.09)', text: '#ffd060', borderColor: 'rgba(255,190,40,0.2)' },
  },
  {
    id: 'solar',
    label: 'Pearl City',
    sub: 'Jamestown\'s old nickname',
    swatchColor: '#ffaa00',
    bg: '#0d0900',
    // Primary: amber
    acc: '#ffaa00',
    acc55: 'rgba(255,170,0,0.55)',
    acc45: 'rgba(255,170,0,0.45)',
    accRGB: '255,160,0',
    // Secondary: ember orange-red
    acc2: '#ff6b35',
    acc2RGB: '255,107,53',
    // Tertiary: warm gold
    acc3: '#ffe066',
    acc3RGB: '255,224,102',
    orb1: 'rgba(255,140,0,0.15)',
    orb2: 'rgba(255,107,53,0.12)',
    warmWarn: { bg: 'rgba(255,80,0,0.1)', text: '#ff8855', borderColor: 'rgba(255,80,0,0.22)' },
  },
  {
    id: 'blood',
    label: 'Steelworks',
    sub: 'Industrial heritage',
    swatchColor: '#ff4466',
    bg: '#0a0003',
    // Primary: crimson
    acc: '#ff4466',
    acc55: 'rgba(255,50,80,0.55)',
    acc45: 'rgba(255,50,80,0.45)',
    accRGB: '255,50,80',
    // Secondary: tangerine
    acc2: '#ff9f43',
    acc2RGB: '255,159,67',
    // Tertiary: soft violet
    acc3: '#c490ff',
    acc3RGB: '196,144,255',
    orb1: 'rgba(220,0,50,0.15)',
    orb2: 'rgba(255,159,67,0.1)',
    warmWarn: { bg: 'rgba(255,100,30,0.12)', text: '#ff8855', borderColor: 'rgba(255,100,30,0.22)' },
  },
  {
    id: 'violet',
    label: 'Lucy',
    sub: 'Born in Jamestown',
    swatchColor: '#bf7fff',
    bg: '#08041a',
    // Primary: soft purple
    acc: '#c490ff',
    acc55: 'rgba(200,130,255,0.55)',
    acc45: 'rgba(200,130,255,0.45)',
    accRGB: '180,80,255',
    // Secondary: electric cyan
    acc2: '#00e5ff',
    acc2RGB: '0,229,255',
    // Tertiary: rose pink
    acc3: '#ff79c6',
    acc3RGB: '255,121,198',
    orb1: 'rgba(150,50,255,0.15)',
    orb2: 'rgba(0,229,255,0.1)',
    warmWarn: { bg: 'rgba(255,180,40,0.09)', text: '#ffd060', borderColor: 'rgba(255,180,40,0.2)' },
  },
  {
    id: 'crescent',
    label: 'Crescent Tool',
    sub: 'Made in Jamestown',
    swatchColor: '#e8e8e8',
    bg: '#080808',
    acc: '#f0f0f0',
    acc55: 'rgba(240,240,240,0.55)',
    acc45: 'rgba(240,240,240,0.45)',
    accRGB: '240,240,240',
    acc2: '#b8b8b8',
    acc2RGB: '184,184,184',
    acc3: '#606060',
    acc3RGB: '96,96,96',
    orb1: 'rgba(255,255,255,0.06)',
    orb2: 'rgba(180,180,200,0.04)',
    warmWarn: { bg: 'rgba(255,200,50,0.08)', text: '#d4a820', borderColor: 'rgba(255,200,50,0.18)' },
    tabBarBg: 'rgba(6,6,6,0.97)',
    bgGradient: 'linear-gradient(180deg, #050505 0%, #101010 50%, #1c1c1c 100%)',
  },
];

export const DEFAULT_THEME_ID: ThemeId = 'green';
