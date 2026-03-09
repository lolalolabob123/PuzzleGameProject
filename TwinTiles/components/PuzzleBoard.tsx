import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native"
import { useState, useEffect, useMemo } from "react"
import { SafeAreaView } from "react-native-safe-area-context"

import { calculateBoardLayout } from "../utils/boardLayout"
import { unlockNextLevel } from "../utils/progress"

export type PuzzleBoardProps = {
  size?: number
  levelData?: number[]
  chapterId: number
  level: number
}

export default function PuzzleBoard({
  size = 4,
  levelData,
  chapterId,
  level,
}: PuzzleBoardProps) {

  const { boardSize, cellSize } = calculateBoardLayout(size)

  const [cells, setCells] = useState<number[]>([])
  const [modalVisible, setModalVisible] = useState(false)

  /**
   * Locked cells (cells pre-filled in levelData)
   * Using Set instead of Array for faster lookup
   */
  const lockedIndexes = useMemo(() => {
    if (!levelData) return new Set<number>()

    return new Set(
      levelData
        .map((value, index) => (value !== 0 ? index : null))
        .filter((v): v is number => v !== null)
    )
  }, [levelData])

  /**
   * Reset board when level loads
   */
  useEffect(() => {
    setCells(levelData ?? Array(size * size).fill(0))
  }, [size, levelData])

  /**
   * Cycle cell value
   */
  const cycleCell = (index: number) => {
    if (lockedIndexes.has(index)) return

    setCells(prev => {
      const updated = [...prev]
      updated[index] = (updated[index] + 1) % 3

      return updated
    })
  }

  /**
   * Watch board for win condition
   */
  useEffect(() => {
    if (checkWin(cells)) {
      unlockNextLevel(chapterId, level)
      setModalVisible(true)
    }
  }, [cells])

  /**
   * Cell colors
   */
  const getBackgroundColor = (value: number) => {
    switch (value) {
      case 1:
        return "#4dabf7"
      case 2:
        return "#ff6b6b"
      default:
        return "#ffffff"
    }
  }

  /**
   * Helpers
   */

  const isBoardFull = (board: number[]) =>
    board.every(cell => cell !== 0)

  const hasEvenCount = (line: number[]) => {
    const ones = line.filter(c => c === 1).length
    const twos = line.filter(c => c === 2).length
    return ones === twos
  }

  const hasThreeInRow = (line: number[]) => {
    for (let i = 0; i < line.length - 2; i++) {
      if (
        line[i] !== 0 &&
        line[i] === line[i + 1] &&
        line[i] === line[i + 2]
      ) {
        return true
      }
    }
    return false
  }

  /**
   * Win condition check
   */
  const checkWin = (board: number[]) => {
    if (board.length === 0) return false
    if (!isBoardFull(board)) return false

    // Check rows
    for (let row = 0; row < size; row++) {
      const rowData = board.slice(row * size, row * size + size)

      if (!hasEvenCount(rowData) || hasThreeInRow(rowData)) {
        return false
      }
    }

    // Check columns
    for (let col = 0; col < size; col++) {
      const colData: number[] = []

      for (let row = 0; row < size; row++) {
        colData.push(board[row * size + col])
      }

      if (!hasEvenCount(colData) || hasThreeInRow(colData)) {
        return false
      }
    }

    return true
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* WIN MODAL */}

      <Modal transparent animationType="fade" visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎉 You Win! 🎉</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* BOARD */}

      <View
        style={[
          styles.board,
          {
            width: boardSize,
            height: boardSize,
          },
        ]}
      >
        {cells.map((value, index) => {

          const isLocked = lockedIndexes.has(index)

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  borderWidth: size >= 8 ? 0.5 : 1,
                  backgroundColor: getBackgroundColor(value),
                  opacity: isLocked ? 0.6 : 1,
                },
              ]}
              onPress={() => cycleCell(index)}
            >
              <Text style={{ fontSize: cellSize * 0.35 }}>
                {value !== 0 ? value : ""}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  board: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
  },

  cell: {
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#999",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 16,
    width: "80%",
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  modalButton: {
    backgroundColor: "#4dabf7",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },

  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

})