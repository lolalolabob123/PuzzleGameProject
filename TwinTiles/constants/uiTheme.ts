export const palettes = {
  blue: {
    1: '#C9F5F5', 2: '#9AE6ED', 3: '#6FC7D9',
    4: '#51ABC9', 5: '#328DBA', 6: '#2572A8',
    7: '#1A5A99', 8: '#154485', 9: '#0D2C6B',
  },
  mono: {
    1: '#302F2F', 2: '#5F5E5E', 3: '#7B7A7A', 4: '#A6A6A6',
    5: '#C7C7C7', 6: '#D9D9D9', 7: '#ECECEC', 8: '#FFFFFF',
  },
} as const;

export type PaletteName = keyof typeof palettes;

export const accents = {
  star: '#FCC419',
  success: '#40C057',
  successDeep: '#2F9E44',
  danger: '#FA5252',
  warning: '#F08C00',
};

const buildBlueTheme = (): UITheme => {
  const p = palettes.blue;
  return {
    name: 'blue',
    background: p[1],
    surface: '#FFFFFF',
    surfaceMuted: p[1],
    surfaceSunken: p[2],

    primary: p[6],
    primaryDeep: p[8],
    primarySoft: p[2],

    textPrimary: p[9],
    textSecondary: p[7],
    textMuted: p[5],
    textDisabled: p[3],

    border: p[3],
    borderStrong: p[7],
    cageBorder: p[8],

    cageTints: [
      'rgba(13,  44,  107, 0.10)',
      'rgba(81,  171, 201, 0.18)',
      'rgba(50,  141, 186, 0.22)',
      'rgba(13,  44,  107, 0.20)',
      'rgba(111, 199, 217, 0.25)',
      'rgba(26,  90,  153, 0.15)',
    ],
    chapter: {
      1: p[3], 2: p[5], 3: p[7], 4: p[9],
    },

    ...accents,
  };
};

const buildMonoTheme = (): UITheme => {
  const p = palettes.mono;
  return {
    name: 'mono',
    background: p[8],
    surface: p[8],
    surfaceMuted: p[7],
    surfaceSunken: p[6],

    primary: p[1],
    primaryDeep: p[1],
    primarySoft: p[6],

    textPrimary: p[1],
    textSecondary: p[2],
    textMuted: p[3],
    textDisabled: p[4],

    border: p[5],
    borderStrong: p[2],
    cageBorder: p[1],

    cageTints: [
      'rgba(48, 47, 47, 0.08)',
      'rgba(48, 47, 47, 0.14)',
      'rgba(48, 47, 47, 0.20)',
      'rgba(48, 47, 47, 0.11)',
      'rgba(48, 47, 47, 0.17)',
      'rgba(48, 47, 47, 0.23)',
    ],

    chapter: {
      1: p[4], 2: p[3], 3: p[2], 4: p[1],
    },

    ...accents,
  };
};

export const uiThemes: Record<PaletteName, UITheme> = {
  blue: buildBlueTheme(),
  mono: buildMonoTheme(),
};

export type UITheme = {
  name: PaletteName;

  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceSunken: string;

  primary: string;
  primaryDeep: string;
  primarySoft: string;

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