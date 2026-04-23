import type { PaletteName } from './uiTheme';

export const AVAILABLE_THEMES = [
  {
    id: 'classic',
    label: 'Classic Set',
    palette: 'blue' as PaletteName,
    shape1: require("../assets/Balls/Blue/ballBlue_06.png"),
    shape2: require("../assets/Balls/Yellow/ballYellow_06.png"),
    tileBg: require("../assets/Back_tiles/BackTile_16.png"),
  },
  {
    id: 'ink',
    label: 'Ink Set',
    palette: 'mono' as PaletteName,
    shape1: require("../assets/Balls/Black/ballBlack_06.png"),
    shape2: require("../assets/Balls/Grey/ballGrey_06.png"),
    tileBg: require("../assets/Back_tiles/BackTile_02.png"),
  },
];

export type GameTheme = typeof AVAILABLE_THEMES[0];