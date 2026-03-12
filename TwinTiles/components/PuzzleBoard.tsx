import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { calculateBoardLayout } from "../utils/boardLayout";
// Ensure these are exported from your progress.ts
import { unlockNextLevel, saveLevelState, getLevelState } from "../utils/progress";

export type PuzzleBoardProps = {
  size?: number;
  levelData?: number[];
  chapterId: number;
  level: number;
};

export default function PuzzleBoard({
  size = 4,
  levelData,
  chapterId,
  level,
}: PuzzleBoardProps) {
  const { boardSize, cellSize } = calculateBoardLayout(size);
  const [cells, setCells] = useState<number[]>([]);
  const [winModalVisible, setWinModalVisible] = useState(false);
  const [tutorialModalVisible, setTutorialModalVisible] = useState(false);

  // Identify pre-filled tiles
  const lockedIndexes = useMemo(() => {
    if (!levelData) return new Set<number>();
    return new Set(
      levelData
        .map((value, index) => (value !== 0 ? index : null))
        .filter((v): v is number => v !== null)
    );
  }, [levelData]);

  // --- NEW: LOAD SAVED STATE OR INITIAL DATA ---
  useEffect(() => {
    const initializeBoard = async () => {
      const savedState = await getLevelState(chapterId, level);
      if (savedState) {
        setCells(savedState);
      } else {
        setCells(levelData ?? Array(size * size).fill(0));
      }
    };
    initializeBoard();
  }, [chapterId, level, levelData, size]);

  // Handle First Launch Tutorial
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem("HAS_SEEN_TUTORIAL");
        if (hasSeen === null && chapterId === 1 && level === 1) {
          setTutorialModalVisible(true);
        }
      } catch (error) {
        console.error("Error reading storage", error);
      }
    };
    checkFirstLaunch();
  }, [chapterId, level]);

  const closeTutorial = async () => {
    await AsyncStorage.setItem("HAS_SEEN_TUTORIAL", "true");
    setTutorialModalVisible(false);
  };

  const cycleCell = async (index: number) => {
    if (lockedIndexes.has(index)) return;
    
    const newCells = [...cells];
    newCells[index] = (newCells[index] + 1) % 3;
    
    setCells(newCells);
    
    // --- NEW: SAVE PROGRESS ON EVERY MOVE ---
    await saveLevelState(chapterId, level, newCells);
  };

  // CHECK WIN AND SAVE PROGRESS
  useEffect(() => {
    const handleWinState = async () => {
      // Check if board is actually initialized and win condition is met
      if (cells.length > 0 && checkWin(cells)) {
        await unlockNextLevel(chapterId, level);
        setWinModalVisible(true);
      }
    };
    handleWinState();
  }, [cells]);

  // Visuals and Logic remain the same...
  const getBackgroundColor = (value: number, isLocked: boolean) => {
    if (value === 1) return isLocked ? "#1c7ed6" : "#4dabf7";
    if (value === 2) return isLocked ? "#e03131" : "#ff6b6b";
    return "#ffffff";
  };

  const isBoardFull = (board: number[]) => board.length > 0 && board.every((cell) => cell !== 0);

  const hasEvenCount = (line: number[]) => {
    const ones = line.filter((c) => c === 1).length;
    const twos = line.filter((c) => c === 2).length;
    return ones === twos;
  };

  const hasThreeInRow = (line: number[]) => {
    for (let i = 0; i < line.length - 2; i++) {
      if (line[i] !== 0 && line[i] === line[i + 1] && line[i] === line[i + 2]) return true;
    }
    return false;
  };

  const checkWin = (board: number[]) => {
    if (board.length === 0 || !isBoardFull(board)) return false;
    for (let i = 0; i < size; i++) {
      const rowData = board.slice(i * size, i * size + size);
      const colData = [];
      for (let j = 0; j < size; j++) colData.push(board[j * size + i]);
      if (!hasEvenCount(rowData) || hasThreeInRow(rowData)) return false;
      if (!hasEvenCount(colData) || hasThreeInRow(colData)) return false;
    }
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ... (Tutorial and Win Modals remain the same) */}
      <Modal transparent animationType="slide" visible={tutorialModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.tutorialContent]}>
            <Text style={styles.modalTitle}>How to Play</Text>
            <ScrollView style={styles.ruleList}>
               <Text style={styles.ruleItem}>🎯 <Text style={styles.bold}>Goal:</Text> Fill the board with Blue and Red tiles.</Text>
               <Text style={styles.ruleItem}>⚖️ <Text style={styles.bold}>Rule 1:</Text> Each row and column must have an equal amount of each color.</Text>
               <Text style={styles.ruleItem}>🚫 <Text style={styles.bold}>Rule 2:</Text> No more than two tiles of the same color can be next to each other.</Text>
               <Text style={styles.ruleItem}>💡 <Text style={styles.bold}>Tip:</Text> Darker tiles are permanent level starters.</Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={closeTutorial}>
              <Text style={styles.modalButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={winModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎉 Level Complete! 🎉</Text>
            <Text style={styles.modalSubtitle}>Your progress has been saved.</Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setWinModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Next Level</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={[styles.board, { width: boardSize, height: boardSize }]}>
        {cells.map((value, index) => {
          const isLocked = lockedIndexes.has(index);
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={isLocked ? 1 : 0.7}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  borderWidth: size >= 8 ? 0.5 : 1,
                  backgroundColor: getBackgroundColor(value, isLocked),
                },
              ]}
              onPress={() => cycleCell(index)}
            >
              <Text style={{ 
                fontSize: cellSize * 0.35, 
                fontWeight: isLocked ? "900" : "500", 
                color: value === 0 ? "#000" : "#fff",
                textShadowColor: isLocked ? 'rgba(0, 0, 0, 0.2)' : 'transparent',
                textShadowRadius: 2
              }}>
                {value !== 0 ? (value === 1 ? "1" : "2") : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: '#f8f9fa' },
  board: { flexDirection: "row", flexWrap: "wrap", backgroundColor: "#adb5bd", borderRadius: 8, overflow: "hidden" },
  cell: { justifyContent: "center", alignItems: "center", borderColor: "#ced4da" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", padding: 25, borderRadius: 20, width: "80%", alignItems: "center" },
  tutorialContent: { width: '85%', maxHeight: '60%' },
  modalTitle: { fontSize: 24, fontWeight: "bold", color: '#212529', marginBottom: 10 },
  modalSubtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  ruleList: { width: '100%', marginVertical: 10 },
  ruleItem: { fontSize: 16, color: '#495057', marginBottom: 12, lineHeight: 22 },
  bold: { fontWeight: '700', color: '#212529' },
  modalButton: { backgroundColor: "#4dabf7", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, marginTop: 10 },
  modalButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});