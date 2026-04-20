import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ImageBackground,
  Animated,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { calculateBoardLayout } from "../utils/boardLayout";
import {
  unlockNextLevel,
  saveLevelState,
  getLevelState,
  saveLevelStars
} from "../utils/progress";
import { GameTheme } from "../constants/themes";
import { useTheme } from "../context/ThemeContext";

interface PuzzleBoardProps {
  size: number;
  levelData: any;
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
  const INDICATOR_WIDTH = 40;
  const gridData = levelData?.grid || [];
  const { cellSize, boardSize } = useMemo(() => {
    const SCREEN_PADDING = 32;
    const screenWidth = Dimensions.get("window").width;
    const maxWidth = screenWidth - INDICATOR_WIDTH - SCREEN_PADDING;
    const { cellSize: raw } = calculateBoardLayout(size);
    const final = Math.min(Math.floor(raw), Math.floor(maxWidth / size));
    return { cellSize: final, boardSize: final * size };
  }, [size]);

  const [cells, setCells] = useState<number[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [winModalVisible, setWinModalVisible] = useState(false);
  const [history, setHistory] = useState<number[][]>([]);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [moveCount, setMoveCount] = useState(0);

  const hasWonRef = useRef(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(1)).current;
  const starAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  const { theme } = useTheme()

  const getValidationState = useCallback((arr: number[]) => {
    const voidCount = arr.filter(c => c === -1).length;
    const playableSpace = size - voidCount;
    const maxAllowed = Math.ceil(playableSpace / 2);

    const counts = {
      one: arr.filter(c => c === 1).length,
      two: arr.filter(c => c === 2).length
    };

    const overLimit = counts.one > maxAllowed || counts.two > maxAllowed;

    let tripleFound = false;
    for (let i = 0; i < arr.length - 2; i++) {
      if (arr[i] > 0 && arr[i] === arr[i + 1] && arr[i] === arr[i + 2]) {
        tripleFound = true;
        break;
      }
    }

    return {
      isInvalid: overLimit || tripleFound,
      isComplete: (counts.one + counts.two) === playableSpace && !overLimit && !tripleFound,
      counts
    };
  }, [size]);

  const getValidationStateForRowCol = useCallback((index: number, currentCells: number[]) => {
    const rowIndex = Math.floor(index / size);
    const colIndex = index % size;
    const row = currentCells.slice(rowIndex * size, (rowIndex + 1) * size);
    const col = Array.from({ length: size }).map((_, r) => currentCells[r * size + colIndex]);

    const rowRes = getValidationState(row);
    const colRes = getValidationState(col);

    return {
      isInvalid: rowRes.isInvalid || colRes.isInvalid,
      isComplete: rowRes.isComplete && colRes.isComplete
    };
  }, [size, getValidationState]);

  const checkWin = useCallback((board: number[]) => {
    if (!board.length || board.some(c => c === 0)) return false;
    for (let i = 0; i < size; i++) {
      const row = board.slice(i * size, (i + 1) * size);
      const col = Array.from({ length: size }).map((_, r) => board[r * size + i]);
      if (!getValidationState(row).isComplete || !getValidationState(col).isComplete) return false;
    }
    return true;
  }, [size, getValidationState]);

  const cycleCell = (index: number) => {
    if (isInitializing || gridData[index] !== 0 || hasWonRef.current) return;

    const newCells = [...cells];
    const currentVal = cells[index]
    let nextVal;

    if (theme.id === 'ink') {
      if (currentVal === 0) nextVal = 2
      else if (currentVal === 2) nextVal = 1
      else nextVal = 0
    } else {
      nextVal = (currentVal + 1) % 3
    }

    if (currentVal === 0) setMoveCount(m => m + 1)

    const link = levelData.links?.find((pair: number[]) => pair.includes(index))
    if (link) {
      link.forEach((i: number) => { newCells[i] = nextVal })
    } else {
      newCells[index] = nextVal
    }

    setHistory(h => [...h, [...cells]].slice(-20));
    setCells(newCells);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveLevelState(chapterId, level, newCells);
  };

  const resetLevel = () => {
    const freshGrid = [...gridData];
    setCells(freshGrid);
    setHistory([]);
    setMoveCount(0);
    saveLevelState(chapterId, level, freshGrid);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const giveHint = () => {
    if (hintsLeft <= 0 || hasWonRef.current) return;
    let bestHintIndex = -1;

    for (let i = 0; i < cells.length; i++) {
      if (cells[i] === 0) {
        const t1 = [...cells]; t1[i] = 1;
        const { isInvalid: inv1 } = getValidationStateForRowCol(i, t1);
        const t2 = [...cells]; t2[i] = 2;
        const { isInvalid: inv2 } = getValidationStateForRowCol(i, t2);
        if ((inv1 && !inv2) || (inv2 && !inv1)) {
          bestHintIndex = i;
          break;
        }
      }
    }

    const target = bestHintIndex !== -1 ? bestHintIndex : cells.findIndex(c => c === 0);
    if (target !== -1) {
      setHintIndex(target);
      setHintsLeft(h => h - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Animated.sequence([
        Animated.timing(hintPulse, { toValue: 1.4, duration: 400, useNativeDriver: true }),
        Animated.timing(hintPulse, { toValue: 1.0, duration: 400, useNativeDriver: true }),
      ]).start(() => setHintIndex(null));
    }
  };

  const handleWin = async () => {
    if (hasWonRef.current) return;
    hasWonRef.current = true;
    const emptyCount = gridData.filter((c: number) => c === 0).length || 1;
    let stars = (moveCount <= emptyCount * 1.8) ? 3 : (moveCount <= emptyCount * 2.5 ? 2 : 1);

    await saveLevelStars(chapterId, level, stars);
    await unlockNextLevel(chapterId, level);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setWinModalVisible(true);

    starAnims.slice(0, stars).forEach((a, i) => {
      Animated.spring(a, { toValue: 1, friction: 5, tension: 40, delay: i * 200, useNativeDriver: true }).start();
    });
  };

  const triggerShake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const gridString = JSON.stringify(levelData?.grid);

  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      setWinModalVisible(false);
      setMoveCount(0);
      setHintsLeft(3);
      hasWonRef.current = false;
      starAnims.forEach(a => a.setValue(0));

      const saved = await getLevelState(chapterId, level);

      const safeSaved = saved || [];
      const isFinished = safeSaved.length > 0 && !safeSaved.includes(0);

      const useSaved = !forcedReset &&
        safeSaved.length === gridData.length &&
        !isFinished;

      setCells(useSaved ? safeSaved : [...gridData]);
      setIsInitializing(false);
    };
    init();
  }, [level, chapterId, gridString, forcedReset]);

  useEffect(() => {
    if (isInitializing || hasWonRef.current || cells.length === 0) return;
    if (cells.every(c => c !== 0)) {
      if (checkWin(cells)) handleWin();
      else triggerShake();
    }
  }, [cells, isInitializing, checkWin]);

  if (isInitializing) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <WinModal visible={winModalVisible} stars={starAnims} moves={moveCount} onNext={onNextLevel} />
      <View style={styles.header}><Text style={styles.moveText}>MOVES: {moveCount}</Text></View>

      <View style={styles.gameWrapper}>
        <View style={{ flexDirection: "row" }}>
          <View style={{ width: INDICATOR_WIDTH }} />
          <View style={{ flexDirection: 'row', width: boardSize }}>
            {Array.from({ length: size }).map((_, colIdx) => {
              const col = Array.from({ length: size }).map((_, r) => cells[r * size + colIdx]);
              const { isInvalid, isComplete, counts } = getValidationState(col);
              return (
                <View key={colIdx} style={{ width: cellSize, alignItems: "center" }}>
                  <Text style={[styles.indicatorText, isInvalid && { color: "#fa5252" }, isComplete && { color: "#40c057" }]}>
                    {counts.one}{"\n"}{counts.two}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <Animated.View style={[styles.boardContainer, { transform: [{ translateX: shakeAnim }] }]}>
          <View style={[styles.rowIndicators, { width: INDICATOR_WIDTH }]}>
            {Array.from({ length: size }).map((_, rowIdx) => {
              const row = cells.slice(rowIdx * size, (rowIdx + 1) * size);
              const { isInvalid, isComplete, counts } = getValidationState(row);
              return (
                <View key={rowIdx} style={{ height: cellSize, justifyContent: "center" }}>
                  <Text style={[styles.indicatorText, { textAlign: 'right', paddingRight: 8 }, isInvalid && { color: "#fa5252" }, isComplete && { color: "#40c057" }]}>
                    {counts.one}|{counts.two}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={[styles.board, { width: boardSize, height: boardSize }]}>
            {cells.map((val, i) => {
              const isLinked = levelData.links?.some((pair: number[]) => pair.includes(i))
              return (
                <Tile
                  key={i}
                  val={val}
                  isFixed={gridData[i] !== 0}
                  isLinked={isLinked}
                  onPress={() => cycleCell(i)}
                  size={cellSize}
                  isHinted={hintIndex === i}
                  hintAnim={hintPulse}
                />
              )
            })}
          </View>
        </Animated.View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButton} onPress={resetLevel}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => {
          if (history.length > 0) {
            setCells(history[history.length - 1]);
            setHistory(h => h.slice(0, -1));
          }
        }}>
          <Text style={styles.buttonText}>Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#fcc419' }]} onPress={giveHint}>
          <Text style={styles.buttonText}>Hint ({hintsLeft})</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const Tile = ({ val, isFixed, isLinked, onPress, size, isHinted, hintAnim }: any) => {
  const { theme } = useTheme()
  if (val === -1) {
    return (
      <View style={{ width: size, height: size, padding: 2 }}>
        <View style={[styles.fullCell, { backgroundColor: '#343a40', borderRadius: 6, opacity: 0.6 }]}>
          <Text style={{ color: '#555', fontWeight: 'bold' }}>X</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={isFixed} style={{ width: size, height: size, padding: 2 }}>
      <Animated.View style={[
        { flex: 1 }, 
        isHinted && { transform: [{ scale: hintAnim }] }, 
        isLinked && !isFixed && { borderWidth: 2, borderColor: '#228be6', borderRadius: 8 }
      ]}>
        <ImageBackground source={theme.tileBg} style={styles.fullCell} imageStyle={{ opacity: isFixed ? 0.4 : 1, borderRadius: 6 }}>
          {val !== 0 && (
            <Image source={val === 1 ? theme.shape1 : theme.shape2} style={{ width: size * 0.6, height: size * 0.6 }} resizeMode="contain" />
          )}
          {isLinked && !isFixed && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(34, 139, 230, 0.15)', borderRadius: 6 }]} />
          )}
          {isHinted && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(252, 196, 25, 0.5)', borderRadius: 6 }]} />
          )}
        </ImageBackground>
      </Animated.View>
    </TouchableOpacity>
  );
};

const WinModal = ({ visible, stars, moves, onNext }: any) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.winTitle}>Level Complete!</Text>
        <View style={styles.starRow}>
          {stars.map((anim: any, i: number) => (
            <Animated.Text key={i} style={[styles.starText, { transform: [{ scale: anim }], opacity: anim, color: "#fcc419" }]}>★</Animated.Text>
          ))}
        </View>
        <Text style={styles.statsText}>Solved in {moves} moves</Text>
        <TouchableOpacity style={styles.nextButton} onPress={onNext}><Text style={styles.nextButtonText}>Next Level</Text></TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  header: { marginBottom: 20 },
  moveText: { fontSize: 20, fontWeight: "bold", color: "#495057" },
  gameWrapper: { alignItems: "center" },
  boardContainer: { flexDirection: "row", alignItems: "center" },
  rowIndicators: { alignItems: 'flex-end' },
  indicatorText: { fontSize: 11, fontWeight: "bold", color: "#adb5bd", lineHeight: 12 },
  board: { flexDirection: "row", flexWrap: "wrap", backgroundColor: "#f1f3f5", borderRadius: 12, overflow: "hidden" },
  fullCell: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  buttonRow: { flexDirection: "row", marginTop: 40, gap: 10 }, // Slightly reduced gap for 3 buttons
  actionButton: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: "#dee2e6", borderRadius: 12, minWidth: 80, alignItems: 'center' },
  buttonText: { fontWeight: "bold", color: "#495057" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "white", padding: 30, borderRadius: 20, alignItems: "center", width: "80%" },
  winTitle: { fontSize: 28, fontWeight: "bold", marginBottom: 20, color: "#2f9e44" },
  starRow: { flexDirection: "row", marginBottom: 20, gap: 10 },
  starText: { fontSize: 40, fontWeight: 'bold' },
  statsText: { fontSize: 18, color: "#495057", marginBottom: 30 },
  nextButton: { backgroundColor: "#228be6", paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  nextButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  linkedIndicator: {position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 3, backgroundColor: '#228be6', borderColor: 'white'}
});