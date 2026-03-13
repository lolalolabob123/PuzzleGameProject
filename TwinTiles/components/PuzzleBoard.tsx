import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { calculateBoardLayout } from "../utils/boardLayout";
import { unlockNextLevel, saveLevelState, getLevelState } from "../utils/progress";

interface PuzzleBoardProps {
  size: number;
  levelData: number[];
  chapterId: number;
  level: number;
  onNextLevel: () => void;
  forcedReset?: boolean;
}

export default function PuzzleBoard({
  size = 4,
  levelData,
  chapterId,
  level,
  onNextLevel,
  forcedReset = false,
}: PuzzleBoardProps) {
  const { boardSize, cellSize } = calculateBoardLayout(size);
  const [cells, setCells] = useState<number[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [winModalVisible, setWinModalVisible] = useState(false);

  // WIN LOGIC: Stays the same, ensuring all Binary Puzzle rules are met
  const checkWin = useCallback((board: number[]) => {
    if (board.length === 0 || board.some((c) => c === 0)) return false;
    const limit = size / 2;

    for (let i = 0; i < size; i++) {
      const row = board.slice(i * size, i * size + size);
      const col = [];
      for (let j = 0; j < size; j++) col.push(board[j * size + i]);

      if (row.filter((c) => c === 1).length !== limit || row.filter((c) => c === 2).length !== limit) return false;
      if (col.filter((c) => c === 1).length !== limit || col.filter((c) => c === 2).length !== limit) return false;

      for (let j = 0; j < size - 2; j++) {
        if (row[j] !== 0 && row[j] === row[j + 1] && row[j] === row[j + 2]) return false;
        if (col[j] !== 0 && col[j] === col[j + 1] && col[j] === col[j + 2]) return false;
      }
    }
    return true;
  }, [size]);

  // INITIAL LOAD: Sets the initial state from your fixed 'grid' data
  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsInitializing(true);
      try {
        const saved = await getLevelState(chapterId, level);
        
        if (active) {
          // If forcedReset or no save exists, we use your set 'levelData'
          // If the saved state is already a win, we also reset to the starting grid
          if (forcedReset || !saved || checkWin(saved)) {
            setCells([...levelData]); 
            await saveLevelState(chapterId, level, [...levelData]);
          } else {
            setCells(saved);
          }
        }
      } catch (e) {
        if (active) setCells([...levelData]);
      } finally {
        if (active) setIsInitializing(false);
      }
    };
    load();
    return () => { active = false; };
  }, [chapterId, level, forcedReset, levelData, checkWin]);

  // WIN MONITOR
  useEffect(() => {
    if (isInitializing || cells.length === 0) return;

    if (cells.every((c) => c !== 0) && checkWin(cells)) {
      const handleWin = async () => {
        await unlockNextLevel(chapterId, level);
        await saveLevelState(chapterId, level, [...levelData]);
        setWinModalVisible(true);
      };
      handleWin();
    }
  }, [cells, isInitializing, checkWin, chapterId, level, levelData]);

  const cycleCell = (index: number) => {
    if (isInitializing) return;

    const newCells = [...cells];
    newCells[index] = (newCells[index] + 1) % 3;
    setCells(newCells);
    saveLevelState(chapterId, level, newCells);
  };

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading Level...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Modal transparent visible={winModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎉 Level Complete! 🎉</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setWinModalVisible(false);
                onNextLevel();
              }}
            >
              <Text style={styles.modalButtonText}>Next Level</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={[styles.board, { width: boardSize, height: boardSize }]}>
        {cells.map((val, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => cycleCell(i)}
            activeOpacity={0.6}
            style={[
              styles.cell,
              {
                width: cellSize,
                height: cellSize,
                backgroundColor: 
                  val === 1 ? "#4dabf7" :
                  val === 2 ? "#ff6b6b" : "#fff",
                borderWidth: 1,
                borderColor: "#ced4da",
              },
            ]}
          >
            <Text
              style={{
                color: val === 0 ? "#000" : "#fff",
                fontWeight: "bold",
                fontSize: cellSize * 0.4,
              }}
            >
              {val !== 0 ? (val === 1 ? "1" : "2") : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8f9fa" },
  loadingText: { color: "#adb5bd", fontSize: 18, fontWeight: "500" },
  board: { flexDirection: "row", flexWrap: "wrap", backgroundColor: "#adb5bd", borderRadius: 8, overflow: "hidden" },
  cell: { justifyContent: "center", alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", padding: 25, borderRadius: 20, width: "80%", alignItems: "center" },
  modalTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  modalButton: { backgroundColor: "#4dabf7", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12 },
  modalButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});