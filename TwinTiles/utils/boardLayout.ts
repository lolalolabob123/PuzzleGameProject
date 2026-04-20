import { Dimensions } from "react-native";

export function calculateBoardLayout(size: number) {
  const {width: screenWidth, height: screenHeight} = Dimensions.get("window")

  const INDICATOR_WIDTH = 40;
  const UI_SPACING = 160;

  const horizontalPadding = 40;
  const maxAvailableWidth = screenWidth - INDICATOR_WIDTH - horizontalPadding;

  const maxAvailableHeight = screenHeight - INDICATOR_WIDTH - UI_SPACING;

  const boardSize = Math.min(maxAvailableWidth, maxAvailableHeight);
  const cellSize = boardSize / size;

  return {boardSize, cellSize};
}