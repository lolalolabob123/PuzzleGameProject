import { Dimensions } from "react-native"

export function calculateBoardLayout(size: number) {
  const { width, height } = Dimensions.get("window")

  const baseBoard = Math.min(width, height) * 0.9
  const maxBoardSize = Math.min(baseBoard, 520)

  let boardSize = maxBoardSize
  let cellSize = boardSize / size

  const minCellSize = 36

  if (cellSize < minCellSize) {
    cellSize = minCellSize
    boardSize = cellSize * size
  }

  return {
    boardSize,
    cellSize
  }
}