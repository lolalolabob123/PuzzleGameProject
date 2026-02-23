import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal } from "react-native"
import { useState, useEffect } from "react"
import { SafeAreaView } from "react-native-safe-area-context"

export type PuzzleBoardProps = {
  size?: number
  levelData?: number[]
}

// Example 4x4 level
export const level1_4x4 = [
  1, 0, 0, 2,
  0, 2, 1, 0,
  0, 1, 2, 0,
  2, 0, 0, 1,
]

export default function PuzzleBoard({ size = 4, levelData }: PuzzleBoardProps) {
  const screenWidth = Dimensions.get("window").width
  const boardSize = screenWidth - 40
  const cellSize = boardSize / size

  const [modalVisible, setModalVisible] = useState(false)
  const [cells, setCells] = useState<number[]>(Array(size * size).fill(0))

  // Locked cells: cannot be changed by the player
  const lockedIndexes: number[] = levelData
    ? levelData
        .map((value, index) => (value !== 0 ? index : null))
        .filter((v): v is number => v !== null)
    : []

  useEffect(() => {
    setCells(levelData ?? Array(size * size).fill(0))
  }, [size, levelData])

  const cycleCell = (index: number) => {
    if (lockedIndexes.includes(index)) return

    setCells(prev => {
      const updated = [...prev]
      updated[index] = (updated[index] + 1) % 3

      if (checkWin(updated)) {
        setModalVisible(true)
      }

      return updated
    })
  }

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

  const isBoardFull = (board: number[]) => board.every(cell => cell !== 0)

  const hasEvenCount = (line: number[]) => {
    const ones = line.filter(c => c === 1).length
    const twos = line.filter(c => c === 2).length
    return ones === twos
  }

  const hasThreeInRow = (line: number[]) => {
    for (let i = 0; i < line.length - 2; i++) {
      if (line[i] !== 0 && line[i] === line[i + 1] && line[i] === line[i + 2]) {
        return true
      }
    }
    return false
  }

  const checkWin = (board: number[]) => {
    if (!isBoardFull(board)) return false

    for (let row = 0; row < size; row++) {
      const rowData = board.slice(row * size, row * size + size)
      if (!hasEvenCount(rowData) || hasThreeInRow(rowData)) return false
    }

    for (let col = 0; col < size; col++) {
      const colData: number[] = []
      for (let row = 0; row < size; row++) {
        colData.push(board[row * size + col])
      }
      if (!hasEvenCount(colData) || hasThreeInRow(colData)) return false
    }

    return true
  }

  return (
    <SafeAreaView>
      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎉 You Win! 🎉</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={[styles.board, { width: boardSize, height: boardSize }]}>
        {cells.map((value, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.cell,
              {
                width: cellSize,
                height: cellSize,
                backgroundColor: getBackgroundColor(value),
                opacity: lockedIndexes.includes(index) ? 0.6 : 1,
              },
            ]}
            onPress={() => cycleCell(index)}
          >
            <Text>{value !== 0 ? value : ""}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  board: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 20,
  },
  cell: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
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