import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ImageBackground,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { calculateBoardLayout } from "../utils/boardLayout";
import {
  unlockNextLevel,
  saveLevelState,
  getLevelState,
  saveLevelStars,
} from "../utils/progress";
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
  levelData = [], // Default to empty array
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
  const [history, setHistory] = useState<number[][]>([]);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [moveCount, setMoveCount] = useState(0);

  const hintPulse = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const INDICATOR_WIDTH = 40;
  const VISUAL_OFFSET = INDICATOR_WIDTH / 2;
  const limit = size / 2;

  // Star Logic
  const emptyCellsCount = levelData?.filter((c) => c === 0).length || 1;
  const perfectTaps = Math.ceil(emptyCellsCount * 1.5);
  const goldThreshold = Math.ceil(perfectTaps * 1.25);
  const silverThreshold = Math.ceil(perfectTaps * 1.75);

  const calculateStars = useCallback(() => {
    if (moveCount <= goldThreshold) return 3;
    if (moveCount <= silverThreshold) return 2;
    return 1;
  }, [moveCount, goldThreshold, silverThreshold]);

  const getCounts = (arr: number[]) => ({
    one: arr.filter((c) => c === 1).length,
    two: arr.filter((c) => c === 2).length,
  });

  const hasThreeInARow = (arr: number[]) => {
    for (let i = 0; i < arr.length - 2; i++) {
      if (arr[i] !== 0 && arr[i] === arr[i + 1] && arr[i] === arr[i + 2]) return true;
    }
    return false;
  };

  const checkWin = useCallback((board: number[]) => {
    if (!board || board.length === 0 || board.some((c) => c === 0)) return false;
    for (let i = 0; i < size; i++) {
      const row = board.slice(i * size, (i + 1) * size);
      const col = [];
      for (let j = 0; j < size; j++) col.push(board[j * size + i]);
      const rC = getCounts(row);
      const cC = getCounts(col);
      if (rC.one !== limit || rC.two !== limit || cC.one !== limit || cC.two !== limit) return false;
      if (hasThreeInARow(row) || hasThreeInARow(col)) return false;
    }
    return true;
  }, [size, limit]);

  // Unified Loading Logic
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setIsInitializing(true);
      setWinModalVisible(false);
      setHistory([]);
      setMoveCount(0);
      setHintsLeft(3);

      try {
        const saved = await getLevelState(chapterId, level);
        if (isMounted) {
          if (forcedReset || !saved || checkWin(saved)) {
            setCells([...levelData]);
          } else {
            setCells(saved);
          }
        }
      } catch (err) {
        if (isMounted) setCells([...levelData]);
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    if (levelData && levelData.length > 0) {
      init();
    }

    return () => { isMounted = false; };
  }, [level, chapterId, forcedReset, levelData]); // Only re-run when level/data changes

  // Win Detection
  useEffect(() => {
    if (!isInitializing && cells.length > 0 && cells.every(c => c !== 0)) {
      if (checkWin(cells)) {
        const handleWin = async () => {
          const finalStars = calculateStars();
          await saveLevelStars(chapterId, level, finalStars);
          await unlockNextLevel(chapterId, level);
          setWinModalVisible(true);
        };
        handleWin();
      }
    }
  }, [cells, isInitializing, checkWin, calculateStars, chapterId, level]);

  const cycleCell = (index: number) => {
    if (isInitializing || levelData[index] !== 0) return;
    setHintIndex(null);
    setHistory((prev) => [...prev, [...cells]].slice(-20));
    const newCells = [...cells];
    newCells[index] = (newCells[index] + 1) % 3;
    setCells(newCells);
    setMoveCount((prev) => prev + 1);
    saveLevelState(chapterId, level, newCells);
  };

  const undoMove = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCells(previousState);
    setMoveCount((prev) => prev + 1);
    saveLevelState(chapterId, level, previousState);
  };

  const giveHint = () => {
    if (hintsLeft <= 0) {
       Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      return;
    }
    const emptyIdx = cells.findIndex((c) => c === 0);
    if (emptyIdx === -1) return;
    setHintIndex(emptyIdx);
    setHintsLeft(h => h - 1);
    Animated.sequence([
      Animated.timing(hintPulse, { toValue: 1.2, duration: 300, useNativeDriver: true }),
      Animated.timing(hintPulse, { toValue: 1.0, duration: 300, useNativeDriver: true }),
    ]).start(() => setHintIndex(null));
  };

  if (isInitializing || cells.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: '#fff' }]}>
        <Text style={{ color: '#adb5bd' }}>Loading level data...</Text>
      </View>
    );
  }

  const starsEarned = calculateStars();

  return (
    <SafeAreaView style={styles.container}>
      <Modal transparent visible={winModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {starsEarned === 3 && <Text style={styles.perfectBadge}>PERFECT!</Text>}
            <Text style={styles.modalTitle}>LEVEL COMPLETE</Text>
            <View style={styles.starRow}>
              {[1, 2, 3].map((s) => (
                <Text key={s} style={[styles.starIcon, { color: s <= starsEarned ? "#fcc419" : "#e9ecef" }]}>★</Text>
              ))}
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={onNextLevel}>
              <Text style={styles.modalButtonText}>NEXT LEVEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.moveText}>MOVES: {moveCount}</Text>
      </View>

      <View style={styles.gameWrapper}>
        <View style={{ flexDirection: "row" }}>
          <View style={{ width: INDICATOR_WIDTH }} />
          <View style={[styles.columnIndicators, { width: boardSize }]}>
            {Array.from({ length: size }).map((_, colIdx) => {
              const col = Array.from({ length: size }).map((_, r) => cells[r * size + colIdx]);
              const counts = getCounts(col);
              const isInvalid = counts.one > limit || counts.two > limit || hasThreeInARow(col);
              return (
                <View key={colIdx} style={{ width: cellSize, alignItems: "center" }}>
                  <Text style={[styles.indicatorText, isInvalid && { color: "#fa5252" }]}>{counts.one}|{counts.two}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.boardContainer, { marginLeft: -VISUAL_OFFSET }]}>
          <View style={styles.rowIndicators}>
            {Array.from({ length: size }).map((_, rowIdx) => {
              const row = cells.slice(rowIdx * size, (rowIdx + 1) * size);
              const counts = getCounts(row);
              const isInvalid = counts.one > limit || counts.two > limit || hasThreeInARow(row);
              return (
                <View key={rowIdx} style={{ height: cellSize, justifyContent: "center" }}>
                  <Text style={[styles.indicatorText, { textAlign: "right" }, isInvalid && { color: "#fa5252" }]}>{counts.one}|{counts.two}</Text>
                </View>
              );
            })}
          </View>

          <View style={[styles.board, { width: boardSize, height: boardSize }]}>
            {cells.map((val, i) => {
              const isFixed = levelData[i] !== 0;
              const isHinted = hintIndex === i;
              const Tile = (
                <ImageBackground source={theme?.tileBg} style={[styles.fullCell, isHinted && styles.hintTileOverlay]} imageStyle={{ opacity: isFixed ? 0.6 : 1 }}>
                  {val !== 0 && <Image source={val === 1 ? theme.shape1 : theme.shape2} style={{ width: cellSize * 0.7, height: cellSize * 0.7 }} resizeMode="contain" />}
                </ImageBackground>
              );
              return (
                <TouchableOpacity key={i} onPress={() => cycleCell(i)} activeOpacity={isFixed ? 1 : 0.7} style={{ width: cellSize, height: cellSize }}>
                  {isHinted ? <Animated.View style={{ transform: [{ scale: hintPulse }], flex: 1 }}>{Tile}</Animated.View> : Tile}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.actionButton, history.length === 0 && { opacity: 0.5 }]} onPress={undoMove} disabled={history.length === 0}>
          <Text style={styles.buttonText}>Undo</Text>
        </TouchableOpacity>
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: hintsLeft > 0 ? "#fcc419" : "#ced4da" }]} onPress={giveHint}>
            <Text style={[styles.buttonText, { color: hintsLeft > 0 ? "#000" : "#868e96" }]}>Hint ({hintsLeft})</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  header: { marginBottom: 20 },
  moveText: { fontSize: 18, fontWeight: "900", color: "#495057", letterSpacing: 1 },
  gameWrapper: { alignItems: "center", justifyContent: "center" },
  boardContainer: { flexDirection: "row", alignItems: "center" },
  columnIndicators: { flexDirection: "row", marginBottom: 5 },
  rowIndicators: { width: 40, paddingRight: 5 },
  indicatorText: { fontSize: 11, fontWeight: "bold", color: "#444" },
  board: { flexDirection: "row", flexWrap: "wrap", backgroundColor: "#ccc", borderRadius: 5, overflow: "hidden" },
  fullCell: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  hintTileOverlay: { borderWidth: 3, borderColor: "#fcc419", backgroundColor: "rgba(252, 196, 25, 0.4)", borderRadius: 4 },
  buttonRow: { flexDirection: "row", marginTop: 40, gap: 20 },
  actionButton: { paddingVertical: 12, paddingHorizontal: 25, backgroundColor: "#b0b4b8", borderRadius: 10, minWidth: 100, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", padding: 30, borderRadius: 25, width: "85%", alignItems: "center" },
  perfectBadge: { color: "#fcc419", fontWeight: "900", fontSize: 20, marginBottom: 5 },
  modalTitle: { fontSize: 24, fontWeight: "900", color: "#212529", marginBottom: 10 },
  starRow: { flexDirection: "row", marginBottom: 15 },
  starIcon: { fontSize: 45, marginHorizontal: 5 },
  modalButton: { backgroundColor: "#4dabf7", paddingVertical: 15, paddingHorizontal: 40, borderRadius: 15 },
  modalButtonText: { color: "#fff", fontWeight: "900", fontSize: 18 },
});