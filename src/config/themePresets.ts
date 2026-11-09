import { ThemeColors } from '../types/wedding';

export type ThemePresetId =
  | 'champagne-luxury'
  | 'editorial-noir'
  | 'botanical-sage'
  | 'parisian-blush'
  | 'terracotta-earth'
  | 'royal-sapphire';

export interface ThemePreset {
  id: ThemePresetId;
  name: string;
  description: string;
  colors: ThemeColors;
}

export const THEME_PRESETS: Record<ThemePresetId, ThemePreset> = {
  'champagne-luxury': {
    id: 'champagne-luxury',
    name: 'Champagne Luxury (Classic Gold & Espresso)',
    description: 'Timeless luxury with warm cream canvas, deep espresso contrast, and soft champagne gold metallic accents. Perfect for black-tie or ballroom weddings.',
    colors: {
      primary: '#c5a880',
      primaryDark: '#997d59',
      primaryLight: '#e4d2bc',
      espresso: '#141210',
      charcoal: '#221f1c',
      cream: '#faf8f2',
      ivory: '#fcfbfa',
      sand: '#eae3d2',
      sandDark: '#d5cbb8',
      gold: '#c5a880',
      goldDark: '#997d59',
      goldLight: '#e4d2bc',
      wine: '#A80A4E',
      muted: '#7a7268',
    },
  },

  'editorial-noir': {
    id: 'editorial-noir',
    name: 'Editorial Noir (High-Contrast & Crimson)',
    description: 'Vogue-inspired modern aesthetic with warm alabaster foundation, midnight black structural elements, and a statement crimson red accent.',
    colors: {
      primary: '#B91C1C',
      primaryDark: '#991B1B',
      primaryLight: '#DC2626',
      espresso: '#121212',
      charcoal: '#1C1C1C',
      cream: '#F5EDE4',
      ivory: '#FAF6F0',
      sand: '#EAE1D5',
      sandDark: '#D8C7B5',
      gold: '#B91C1C',
      goldDark: '#991B1B',
      goldLight: '#DC2626',
      wine: '#831843',
      muted: '#6E6760',
    },
  },

  'botanical-sage': {
    id: 'botanical-sage',
    name: 'Botanical Sage (Garden & Antique Brass)',
    description: 'Earthy, organic romance with pale linen background, deep forest espresso, muted eucalyptus green, and warm antique brass accents.',
    colors: {
      primary: '#4E6A4B',
      primaryDark: '#3A5037',
      primaryLight: '#738E70',
      espresso: '#1A2119',
      charcoal: '#252F24',
      cream: '#F5F6F2',
      ivory: '#FAFBF8',
      sand: '#E3E6DF',
      sandDark: '#C7CBC2',
      gold: '#A3885C',
      goldDark: '#7D6743',
      goldLight: '#C7B18A',
      wine: '#44664A',
      muted: '#687367',
    },
  },

  'parisian-blush': {
    id: 'parisian-blush',
    name: 'Parisian Blush (Dusty Rose & Antique Gold)',
    description: 'Soft, romantic vintage luxury with rose-tinted alabaster canvas, deep plum noir headers, and dusty rose gold accents.',
    colors: {
      primary: '#B86F74',
      primaryDark: '#945358',
      primaryLight: '#D69499',
      espresso: '#1E1619',
      charcoal: '#2B2025',
      cream: '#FAF5F5',
      ivory: '#FCF8F8',
      sand: '#EFE2E3',
      sandDark: '#D9C2C4',
      gold: '#B8926C',
      goldDark: '#8F6F4E',
      goldLight: '#D6B492',
      wine: '#883A4A',
      muted: '#7A676B',
    },
  },

  'terracotta-earth': {
    id: 'terracotta-earth',
    name: 'Terracotta Earth (Warm Sunset & Ochre)',
    description: 'Mediterranean warmth with warm sand canvas, deep bark contrast, rich terracotta rust, and sun-drenched ochre gold highlights.',
    colors: {
      primary: '#B86546',
      primaryDark: '#934A30',
      primaryLight: '#D48669',
      espresso: '#211814',
      charcoal: '#2E221D',
      cream: '#F8F4EE',
      ivory: '#FAF7F2',
      sand: '#EAE0D3',
      sandDark: '#D1C2AF',
      gold: '#C49258',
      goldDark: '#986E3C',
      goldLight: '#DDB481',
      wine: '#8C3B2F',
      muted: '#75645A',
    },
  },

  'royal-sapphire': {
    id: 'royal-sapphire',
    name: 'Royal Sapphire (Midnight Blue & Crown Gold)',
    description: 'Regal majesty with cool porcelain canvas, midnight navy slate headers, and brilliant imperial crown gold accents.',
    colors: {
      primary: '#1E3A8A',
      primaryDark: '#172554',
      primaryLight: '#3B82F6',
      espresso: '#0B132B',
      charcoal: '#1C2541',
      cream: '#F8FAFC',
      ivory: '#FFFFFF',
      sand: '#E2E8F0',
      sandDark: '#CBD5E1',
      gold: '#D97706',
      goldDark: '#B45309',
      goldLight: '#F59E0B',
      wine: '#312E81',
      muted: '#64748B',
    },
  },
};

export const ALL_THEME_PRESETS: ThemePreset[] = Object.values(THEME_PRESETS);

export function resolveThemeColors(presetId?: ThemePresetId, overrides?: Partial<ThemeColors>): ThemeColors {
  const base = (presetId && THEME_PRESETS[presetId] ? THEME_PRESETS[presetId].colors : THEME_PRESETS['champagne-luxury'].colors);
  if (!overrides) return base;
  return { ...base, ...overrides };
}
