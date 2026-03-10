export type ThemeId = 'green' | 'solar' | 'dahlstrom' | 'violet' | 'crescent';

export interface Theme {
  id: ThemeId;
  label: string;
  sub: string;
  description: string;   // shown in Settings
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
    description: 'Named for the Chadakoin River, which flows through the heart of Jamestown connecting Chautauqua Lake to the Conewango Creek. In 1739, French explorer Baron de Longueuil traveled its banks on an expedition to the Mississippi — producing the first professional map of Chautauqua Lake and the first recorded use of the word "Chautauqua."',
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
    description: 'Jamestown earned the nickname "The Pearl City" in the early 19th century due to its massive production of pearl ash — a refined form of potash used in glassmaking. By the mid-1820s the region was one of North America\'s largest producers. Settlers burned cleared hardwood, leeched the ashes to create lye, and processed it into pearl ash. Converting timber to ash made it cheap to transport, turning land clearing into one of Jamestown\'s first profitable industries.',
    swatchColor: '#f0e0b0',
    bg: '#0a0800',
    // Primary: warm pearl/ivory — the refined crystalline product
    acc: '#f0e0b0',
    acc55: 'rgba(240,224,176,0.55)',
    acc45: 'rgba(240,224,176,0.45)',
    accRGB: '240,224,176',
    // Secondary: ember amber — the hardwood fires
    acc2: '#e89020',
    acc2RGB: '232,144,32',
    // Tertiary: ash grey — the residue
    acc3: '#a09070',
    acc3RGB: '160,144,112',
    orb1: 'rgba(232,144,32,0.14)',
    orb2: 'rgba(240,224,176,0.08)',
    warmWarn: { bg: 'rgba(232,144,32,0.1)', text: '#e89020', borderColor: 'rgba(232,144,32,0.25)' },
  },
  {
    id: 'dahlstrom',
    label: 'Dahlstrom',
    sub: 'Steel doors since 1904',
    description: 'Named for Charles Dahlstrom, a Swedish immigrant who taught himself tool-and-die making at age 12 and went on to invent the world\'s first fireproof metal door in Jamestown in 1904. His doors were later installed in the Empire State Building, Rockefeller Center, and the U.S. Capitol. The company still operates in Jamestown today.',
    swatchColor: '#5ba8d4',
    bg: '#080d12',
    // Primary: bright steel blue
    acc: '#5ba8d4',
    acc55: 'rgba(91,168,212,0.55)',
    acc45: 'rgba(91,168,212,0.45)',
    accRGB: '91,168,212',
    // Secondary: Dahlstrom brand blue
    acc2: '#3b7296',
    acc2RGB: '59,114,150',
    // Tertiary: cool steel grey
    acc3: '#8aa8b8',
    acc3RGB: '138,168,184',
    orb1: 'rgba(59,114,150,0.18)',
    orb2: 'rgba(91,168,212,0.1)',
    warmWarn: { bg: 'rgba(255,190,40,0.09)', text: '#ffd060', borderColor: 'rgba(255,190,40,0.2)' },
    tabBarBg: 'rgba(4,8,14,0.97)',
  },
  {
    id: 'violet',
    label: 'Lucy',
    sub: 'Born in Jamestown',
    description: 'A tribute to Lucille Ball, born in Jamestown on August 6, 1911, and widely considered the greatest comedian in television history. The city celebrates her legacy through the National Comedy Center and the Lucille Ball Desi Arnaz Museum. The purple and rose tones nod to the vibrant, theatrical world she helped create.',
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
    description: 'The Crescent adjustable wrench was invented and manufactured in Jamestown, and its name became the universal term for adjustable wrenches worldwide. The Jamestown factory shipped tools to every corner of the globe. This premium monochrome theme reflects the precision, craftsmanship, and industrial heritage that defined the city.',
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
