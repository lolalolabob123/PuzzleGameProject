import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { calculateBoardLayout } from "../utils/boardLayout";
import { unlockNextLevel, saveLevelState, getLevelState } from "../utils/progress";
import { GameTheme } from "../constants/themes";

interface PuzzleBoardProps {
  size: number;
  levelData: number[];
  chapterId: number;
  level: number;
  onNextLevel: () => void;
  forcedReset?: boolean;
  theme: GameTheme;
}

export default function PuzzleBoard({
  size = 4,
  levelData,
  chapterId,
  level,
  onNextLevel,
  forcedReset = false,
  theme,
}: PuzzleBoardProps) {
  const { boardSize, cellSize } = calculateBoardLayout(size);
  const [cells, setCells] = useState<number[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [winModalVisible, setWinModalVisible] = useState(false);

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

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsInitializing(true);
      try {
        const saved = await getLevelState(chapterId, level);
        if (active) {
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

  useEffect(() => {
    if (isInitializing || cells.length === 0) return;
    if (cells.every((c) => c !== 0) && checkWin(cells)) {
      const handleWin = async () => {
        await unlockNextLevel(chapterId, level);
        setWinModalVisible(true);
      };
      handleWin();
    }
  }, [cells, isInitializing, checkWin, chapterId, level]);

  const cycleCell = (index: number) => {
    if (isInitializing) return;

    // RULE: If the levelData originally had a value here, it's a "fixed" hint.
    // The player shouldn't be able to change it.
    if (levelData[index] !== 0) return;

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
        {cells.map((val, i) => {
          const isFixed = levelData[i] !== 0; // Check if this was a hint tile

          return (
            <TouchableOpacity
              key={i}
              onPress={() => cycleCell(i)}
              activeOpacity={isFixed ? 1 : 0.7} // Visual feedback: non-clickable if fixed
              style={{ width: cellSize, height: cellSize }}
            >
<ImageBackground
  // CHANGED: Use theme.tileBg instead of ASSETS.tileBackground
  source={theme?.tileBg} 
  style={styles.fullCell}
  imageStyle={{ opacity: isFixed ? 0.6 : 1 }}
>
  {val !== 0 && (
    <Image
      // CHANGED: Use theme.shape1 and theme.shape2
      source={val === 1 ? theme.shape1 : theme.shape2}
      style={{
        width: cellSize * 0.7,
        height: cellSize * 0.7,
        opacity: isFixed ? 0.8 : 1, 
      }}
      resizeMode="contain"
    />
  )}
</ImageBackground>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8f9fa" },
  loadingText: { color: "#adb5bd", fontSize: 18, fontWeight: "500" },
  board: { flexDirection: "row", flexWrap: "wrap", backgroundColor: "transparent" },
  fullCell: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", padding: 25, borderRadius: 20, width: "80%", alignItems: "center" },
  modalTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  modalButton: { backgroundColor: "#4dabf7", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12 },
  modalButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});