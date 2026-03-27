import { Dimensions } from "react-native";

export function calculateBoardLayout(size: number) {
  const screenWidth = Dimensions.get("window").width;

  const INDICATOR_WIDTH = 40;
  const HORIZONTAL_PADDING = Math.min(32, screenWidth * 0.08);

  const availableWidth =
    screenWidth - INDICATOR_WIDTH - HORIZONTAL_PADDING;

  const boardSize = availableWidth;
  const cellSize = boardSize / size;

  return { boardSize, cellSize };
}