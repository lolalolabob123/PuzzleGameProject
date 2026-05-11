import type { PaletteName } from './uiTheme';

export type GameTheme = {
  id: string;
  label: string;
  palette: PaletteName;
  tileColor: string;
  tileEdgeColor: string;
  shape1Color: string;
  shape2Color: string;
};

export const AVAILABLE_THEMES: GameTheme[] = [
  //free themes
  {
    id: 'classic',
    label: 'Classic',
    palette: 'classic',
    tileColor: '#FFFFFF',
    tileEdgeColor: '#D8E8F2',
    shape1Color: '#2572A8',
    shape2Color: '#F5B400',
  },
  {
    id: 'ink',
    label: 'Ink',
    palette: 'ink',
    tileColor: '#F8F6F1',
    tileEdgeColor: '#E5DFD3',
    shape1Color: '#1A1A1A',
    shape2Color: '#8E8E8E',
  },
  //paid themes
  {
    id: 'storm',
    label: 'Storm',
    palette: 'storm',
    tileColor: '#1F2A3D',
    tileEdgeColor: '#101826',
    shape1Color: '#5DADE2',
    shape2Color: '#F0F0F0',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    palette: 'sunset',
    tileColor: '#FFF5EB',
    tileEdgeColor: '#F0DFC9',
    shape1Color: '#F76C5E',
    shape2Color: '#FFB627',
  },
  {
    id: 'forest',
    label: 'Forest',
    palette: 'forest',
    tileColor: '#F4F0E6',
    tileEdgeColor: '#DDD5C2',
    shape1Color: '#2F7045',
    shape2Color: '#8C5E2A',
  },
  {
    id: 'neon',
    label: 'Neon',
    palette: 'neon',
    tileColor: '#1B1B1F',
    tileEdgeColor: '#0A0A0D',
    shape1Color: '#FF3CAC',
    shape2Color: '#00E5FF',
  },
];
