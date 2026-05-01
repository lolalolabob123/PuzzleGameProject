import type { PaletteName } from './uiTheme';

export type GameTheme = {
  id: string;
  label: string;
  palette: PaletteName;       // selects UI chrome (background, surface, text)
  tileColor: string;          // main cell surface
  tileEdgeColor: string;      // border/edge tone for definition
  shape1Color: string;        // first symbol fill
  shape2Color: string;        // second symbol fill
};

export const AVAILABLE_THEMES: GameTheme[] = [
  // ─── free themes ───
  {
    id: 'classic',
    label: 'Classic',
    palette: 'blue',
    tileColor: '#FFFFFF',
    tileEdgeColor: '#D8E8F2',
    shape1Color: '#2572A8',   // ocean blue
    shape2Color: '#F5B400',   // sunny yellow
  },
  {
    id: 'ink',
    label: 'Ink',
    palette: 'mono',
    tileColor: '#F8F6F1',     // warm cream
    tileEdgeColor: '#E5DFD3',
    shape1Color: '#1A1A1A',   // graphite
    shape2Color: '#8E8E8E',   // silver
  },
  // ─── paid themes (require shop purchase) ───
  {
    id: 'storm',
    label: 'Storm',
    palette: 'blue',
    tileColor: '#1F2A3D',     // deep slate
    tileEdgeColor: '#101826',
    shape1Color: '#5DADE2',   // electric blue
    shape2Color: '#F0F0F0',   // off-white
  },
  {
    id: 'sunset',
    label: 'Sunset',
    palette: 'blue',
    tileColor: '#FFF5EB',     // cream
    tileEdgeColor: '#F0DFC9',
    shape1Color: '#F76C5E',   // coral
    shape2Color: '#FFB627',   // saffron
  },
  {
    id: 'forest',
    label: 'Forest',
    palette: 'blue',
    tileColor: '#F4F0E6',     // bone
    tileEdgeColor: '#DDD5C2',
    shape1Color: '#2F7045',   // emerald
    shape2Color: '#8C5E2A',   // earth
  },
  {
    id: 'neon',
    label: 'Neon',
    palette: 'mono',
    tileColor: '#1B1B1F',     // near-black
    tileEdgeColor: '#0A0A0D',
    shape1Color: '#FF3CAC',   // magenta
    shape2Color: '#00E5FF',   // cyan
  },
];