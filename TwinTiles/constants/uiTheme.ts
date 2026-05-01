// One UI palette per game theme. Adding a theme = add a palette here, add an
// entry in AVAILABLE_THEMES, and (optionally) add cage tints.

export const accents = {
  star: '#FCC419',
  success: '#40C057',
  successDeep: '#2F9E44',
  danger: '#FA5252',
  warning: '#F08C00',
};

export type PaletteName =
  | 'classic'
  | 'ink'
  | 'storm'
  | 'sunset'
  | 'forest'
  | 'neon';

export type UITheme = {
  name: PaletteName;
  isDark: boolean;

  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceSunken: string;

  primary: string;
  primaryDeep: string;
  primarySoft: string;
  onPrimary: string;          // text/icon color to use on top of `primary`

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;

  border: string;
  borderStrong: string;
  cageBorder: string;

  cageTints: string[];
  chapter: Record<number, string>;

  star: string;
  success: string;
  successDeep: string;
  danger: string;
  warning: string;
};

// ─── Classic (cool blue, light) ─────────────────────────────────────────────
const classic: UITheme = {
  name: 'classic',
  isDark: false,

  background: '#EAF4FB',
  surface: '#FFFFFF',
  surfaceMuted: '#DCEAF5',
  surfaceSunken: '#C2DAEC',

  primary: '#2572A8',
  primaryDeep: '#0D2C6B',
  primarySoft: '#9AE6ED',
  onPrimary: '#FFFFFF',

  textPrimary: '#0D2C6B',
  textSecondary: '#1A5A99',
  textMuted: '#5C7FA3',
  textDisabled: '#9DB7CF',

  border: '#BFD5E7',
  borderStrong: '#7FA9C9',
  cageBorder: '#0D2C6B',

  cageTints: [
    'rgba(13,  44,  107, 0.10)',
    'rgba(81,  171, 201, 0.18)',
    'rgba(50,  141, 186, 0.22)',
    'rgba(13,  44,  107, 0.20)',
    'rgba(111, 199, 217, 0.25)',
    'rgba(26,  90,  153, 0.15)',
  ],
  chapter: {
    1: '#7FC2E0',
    2: '#51ABC9',
    3: '#2572A8',
    4: '#0D2C6B',
  },
  ...accents,
};

// ─── Ink (warm grayscale, light) ────────────────────────────────────────────
const ink: UITheme = {
  name: 'ink',
  isDark: false,

  background: '#F8F6F1',
  surface: '#FFFFFF',
  surfaceMuted: '#EFEAE0',
  surfaceSunken: '#E0DACB',

  primary: '#2A2A2A',
  primaryDeep: '#0F0F0F',
  primarySoft: '#D9D5CB',
  onPrimary: '#F8F6F1',

  textPrimary: '#1A1A1A',
  textSecondary: '#4A4A4A',
  textMuted: '#7B7A7A',
  textDisabled: '#B5B3AD',

  border: '#D5CFC1',
  borderStrong: '#7B7A7A',
  cageBorder: '#1A1A1A',

  cageTints: [
    'rgba(48, 47, 47, 0.08)',
    'rgba(48, 47, 47, 0.14)',
    'rgba(48, 47, 47, 0.20)',
    'rgba(48, 47, 47, 0.11)',
    'rgba(48, 47, 47, 0.17)',
    'rgba(48, 47, 47, 0.23)',
  ],
  chapter: {
    1: '#B5B3AD',
    2: '#7B7A7A',
    3: '#4A4A4A',
    4: '#1A1A1A',
  },
  ...accents,
};

// ─── Storm (electric blue on deep slate, dark) ──────────────────────────────
const storm: UITheme = {
  name: 'storm',
  isDark: true,

  background: '#0E1726',
  surface: '#1F2A3D',
  surfaceMuted: '#172234',
  surfaceSunken: '#101826',

  primary: '#5DADE2',
  primaryDeep: '#3A8AC2',
  primarySoft: '#2C4060',
  onPrimary: '#0E1726',

  textPrimary: '#F0F4FA',
  textSecondary: '#C8D5E5',
  textMuted: '#7E94B0',
  textDisabled: '#4F6479',

  border: '#2C3B53',
  borderStrong: '#5D7796',
  cageBorder: '#5DADE2',

  cageTints: [
    'rgba(93, 173, 226, 0.10)',
    'rgba(93, 173, 226, 0.16)',
    'rgba(240, 240, 240, 0.06)',
    'rgba(93, 173, 226, 0.22)',
    'rgba(240, 240, 240, 0.10)',
    'rgba(93, 173, 226, 0.13)',
  ],
  chapter: {
    1: '#7E94B0',
    2: '#5DADE2',
    3: '#3A8AC2',
    4: '#F0F4FA',
  },
  ...accents,
  // softer danger so it doesn't burn against dark background
  danger: '#FF6B6B',
};

// ─── Sunset (warm coral + saffron, light) ───────────────────────────────────
const sunset: UITheme = {
  name: 'sunset',
  isDark: false,

  background: '#FFF1E0',
  surface: '#FFF8EF',
  surfaceMuted: '#FCE3CB',
  surfaceSunken: '#F2CFA9',

  primary: '#F76C5E',
  primaryDeep: '#C44637',
  primarySoft: '#FFD7A8',
  onPrimary: '#FFFFFF',

  textPrimary: '#5A2A1A',
  textSecondary: '#8C4630',
  textMuted: '#B07A60',
  textDisabled: '#D9B69C',

  border: '#F0DFC9',
  borderStrong: '#C49072',
  cageBorder: '#C44637',

  cageTints: [
    'rgba(247, 108, 94, 0.10)',
    'rgba(255, 182, 39, 0.16)',
    'rgba(196, 70, 55, 0.18)',
    'rgba(247, 108, 94, 0.22)',
    'rgba(255, 182, 39, 0.24)',
    'rgba(196, 70, 55, 0.12)',
  ],
  chapter: {
    1: '#FFB627',
    2: '#F76C5E',
    3: '#C44637',
    4: '#5A2A1A',
  },
  ...accents,
};

// ─── Forest (emerald + earth, light) ────────────────────────────────────────
const forest: UITheme = {
  name: 'forest',
  isDark: false,

  background: '#F1ECDF',
  surface: '#FAF6EC',
  surfaceMuted: '#E4DCC6',
  surfaceSunken: '#CFC4A6',

  primary: '#2F7045',
  primaryDeep: '#1B4A2A',
  primarySoft: '#BFD8C5',
  onPrimary: '#FAF6EC',

  textPrimary: '#1F2A1F',
  textSecondary: '#3F5640',
  textMuted: '#6E7A66',
  textDisabled: '#A6AC97',

  border: '#D5CCAE',
  borderStrong: '#8C5E2A',
  cageBorder: '#1B4A2A',

  cageTints: [
    'rgba(47, 112, 69, 0.10)',
    'rgba(140, 94, 42, 0.14)',
    'rgba(47, 112, 69, 0.20)',
    'rgba(140, 94, 42, 0.22)',
    'rgba(47, 112, 69, 0.16)',
    'rgba(140, 94, 42, 0.10)',
  ],
  chapter: {
    1: '#A6AC97',
    2: '#8C5E2A',
    3: '#2F7045',
    4: '#1B4A2A',
  },
  ...accents,
};

// ─── Neon (magenta + cyan on near-black, dark) ──────────────────────────────
const neon: UITheme = {
  name: 'neon',
  isDark: true,

  background: '#0A0A0F',
  surface: '#16161E',
  surfaceMuted: '#1E1E29',
  surfaceSunken: '#0E0E14',

  primary: '#FF3CAC',
  primaryDeep: '#C71B82',
  primarySoft: '#3A2030',
  onPrimary: '#0A0A0F',

  textPrimary: '#F2F2F8',
  textSecondary: '#C8C8D6',
  textMuted: '#7E7E92',
  textDisabled: '#4A4A5A',

  border: '#2A2A38',
  borderStrong: '#5A5A70',
  cageBorder: '#00E5FF',

  cageTints: [
    'rgba(255, 60, 172, 0.12)',
    'rgba(0,   229, 255, 0.10)',
    'rgba(255, 60, 172, 0.20)',
    'rgba(0,   229, 255, 0.18)',
    'rgba(255, 60, 172, 0.08)',
    'rgba(0,   229, 255, 0.24)',
  ],
  chapter: {
    1: '#7E7E92',
    2: '#00E5FF',
    3: '#FF3CAC',
    4: '#F2F2F8',
  },
  ...accents,
  danger: '#FF5577',
};

export const uiThemes: Record<PaletteName, UITheme> = {
  classic,
  ink,
  storm,
  sunset,
  forest,
  neon,
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 32 };
export const radii = { sm: 6, md: 12, lg: 16, xl: 24, pill: 999 };

export const typography = {
  display: { fontSize: 28, fontWeight: '900' as const, letterSpacing: 0.3 },
  title: { fontSize: 20, fontWeight: '700' as const },
  body: { fontSize: 16, fontWeight: '500' as const },
  caption: { fontSize: 13, fontWeight: '600' as const },
  micro: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.5 },
};

export const shadows = {
  sm: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  md: { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8 },
};
