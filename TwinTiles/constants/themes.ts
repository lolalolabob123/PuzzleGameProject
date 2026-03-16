export const AVAILABLE_THEMES = [
  {
    id: 'classic',
    label: 'Classic Set',
    shape1: require("../assets/Balls/Blue/ballBlue_06.png"),
    shape2: require("../assets/Balls/Yellow/ballYellow_06.png"),
    tileBg: require("../assets/Back_tiles/BackTile_16.png"),
  },
  {
    id: 'ink', // Changed from 'neon' since you don't have Red/Green balls
    label: 'Ink Set',
    shape1: require("../assets/Balls/Black/ballBlack_06.png"),
    shape2: require("../assets/Balls/Grey/ballGrey_06.png"),
    tileBg: require("../assets/Back_tiles/BackTile_02.png"),
  },
];

export type GameTheme = typeof AVAILABLE_THEMES[0];