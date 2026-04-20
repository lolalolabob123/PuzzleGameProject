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
  const INDICATOR_WIDTH = 45;
  const gridData = levelData?.grid || [];
  const { theme } = useTheme();

  const { cellSize, boardSize } = useMemo(() => {
    const SCREEN_PADDING = 32;
    const screenWidth = Dimensions.get("window").width;
    const maxWidth = screenWidth - INDICATOR_WIDTH - SCREEN_PADDING;
    const { cellSize: raw } = calculateBoardLayout(size);
    const final = Math.max(30, Math.min(Math.floor(raw), Math.floor(maxWidth / size)));
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

  // Replace your getValidationState inside PuzzleBoard.tsx with this:

  const getValidationState = useCallback((arr: number[]) => {
    const voidCount = arr.filter(c => c === -1).length;
    const playableSpace = size - voidCount;

    // The floor/ceil logic allows for odd-numbered playable spaces (Chapter 3)
    const minRequired = Math.floor(playableSpace / 2);
    const maxAllowed = Math.ceil(playableSpace / 2);

    const counts = {
      one: arr.filter(c => c === 1).length,
      two: arr.filter(c => c === 2).length
    };

    // Rule 1: No more than 2 of the same color directly next to each other
    let tripleFound = false;
    for (let i = 0; i < arr.length - 2; i++) {
      if (arr[i] > 0 && arr[i] === arr[i + 1] && arr[i] === arr[i + 2]) {
        tripleFound = true;
        break;
      }
    }

    // A line is INVALID if it breaks the triple rule or exceeds the max count
    const isInvalid = tripleFound || counts.one > maxAllowed || counts.two > maxAllowed;

    // A line is COMPLETE only when all spaces are filled and counts are balanced
    const filledCount = counts.one + counts.two;
    const isComplete =
      filledCount === playableSpace &&
      counts.one >= minRequired && counts.one <= maxAllowed &&
      counts.two >= minRequired && counts.two <= maxAllowed &&
      !tripleFound;

    return { isInvalid, isComplete, counts };
  }, [size]);

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
    const currentVal = cells[index];
    let nextVal = (currentVal + 1) % 3;

    const linkGroup = levelData.links?.find((group: any) => group.indices.includes(index));
    if (linkGroup) {
      linkGroup.indices.forEach((i: number) => { newCells[i] = nextVal; });
    } else {
      newCells[index] = nextVal;
    }

    if (currentVal === 0) setMoveCount(m => m + 1);
    setHistory(h => [...h, [...cells]].slice(-20));
    setCells(newCells);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveLevelState(chapterId, level, newCells);
  };

  const handleWin = async () => {
    if (hasWonRef.current) return;
    hasWonRef.current = true;

    const emptyCount = gridData.filter((c: number) => c === 0).length || 1;
    const multiplier = Math.max(1.1, 1.8 - (chapterId - 1) * 0.2);

    let stars = 1;
    if (moveCount <= emptyCount * multiplier) stars = 3;
    else if (moveCount <= emptyCount * (multiplier + 0.5)) stars = 2;

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
      const useSaved = !forcedReset && safeSaved.length === gridData.length && !isFinished;

      setCells(useSaved ? safeSaved : [...gridData]);
      setIsInitializing(false);
    };
    init();
  }, [level, chapterId, forcedReset, JSON.stringify(levelData?.grid)]);

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

      <View style={styles.header}>
        <Text style={styles.moveText}>MOVES: {moveCount}</Text>
      </View>

      <View style={styles.gameWrapper}>
        <View style={{ flexDirection: "row" }}>
          <View style={{ width: INDICATOR_WIDTH }} />
          <View style={{ flexDirection: 'row', width: boardSize }}>
            {Array.from({ length: size }).map((_, colIdx) => {
              const col = Array.from({ length: size }).map((_, r) => cells[r * size + colIdx]);
              const { isInvalid, isComplete, counts } = getValidationState(col);
              return (
                <View key={colIdx} style={{ width: cellSize, alignItems: "center" }}>
                  <Text style={[styles.indicatorText, isInvalid && styles.textRed, isComplete && styles.textGreen]}>
                    {counts.one}{"\n"}{counts.two}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <Animated.View style={[styles.boardRow, { transform: [{ translateX: shakeAnim }] }]}>
          <View style={[styles.rowIndicators, { width: INDICATOR_WIDTH }]}>
            {Array.from({ length: size }).map((_, rowIdx) => {
              const row = cells.slice(rowIdx * size, (rowIdx + 1) * size);
              const { isInvalid, isComplete, counts } = getValidationState(row);
              return (
                <View key={rowIdx} style={{ height: cellSize, justifyContent: "center" }}>
                  <Text style={[styles.indicatorText, { textAlign: 'right', paddingRight: 8 }, isInvalid && styles.textRed, isComplete && styles.textGreen]}>
                    {counts.one}|{counts.two}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={[styles.board, { width: boardSize, height: boardSize }]}>
            {cells.map((val, i) => (
              <Tile
                key={i}
                val={val}
                isFixed={gridData[i] !== 0}
                linkedColor={levelData.links?.find((g: any) => g.indices.includes(i))?.color}
                onPress={() => cycleCell(i)}
                size={cellSize}
                isHinted={hintIndex === i}
                hintAnim={hintPulse}
              />
            ))}
          </View>
        </Animated.View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => {
          const fresh = [...gridData];
          setCells(fresh);
          setHistory([]);
          setMoveCount(0);
          saveLevelState(chapterId, level, fresh);
        }}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => {
          if (history.length > 0) {
            const last = history[history.length - 1];
            setCells(last);
            setHistory(h => h.slice(0, -1));
          }
        }}>
          <Text style={styles.buttonText}>Undo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#fcc419' }]}
          onPress={() => {
            if (hintsLeft <= 0) return;
            const target = cells.findIndex(c => c === 0);
            if (target !== -1) {
              setHintIndex(target);
              setHintsLeft(h => h - 1);
              Animated.sequence([
                Animated.timing(hintPulse, { toValue: 1.3, duration: 300, useNativeDriver: true }),
                Animated.timing(hintPulse, { toValue: 1.0, duration: 300, useNativeDriver: true }),
              ]).start(() => setHintIndex(null));
            }
          }}
        >
          <Text style={styles.buttonText}>Hint ({hintsLeft})</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const Tile = ({ val, isFixed, linkedColor, onPress, size, isHinted, hintAnim }: any) => {
  const { theme } = useTheme();

  if (val === -1) {
    return (
      <View style={{ width: size, height: size, padding: 2 }}>
        <View style={[styles.fullCell, { backgroundColor: '#343a40', borderRadius: 6, opacity: 0.5 }]}>
          <Text style={{ color: '#fff', fontSize: size * 0.4 }}>×</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={isFixed} style={{ width: size, height: size, padding: 2 }}>
      <Animated.View style={[{ flex: 1 }, isHinted && { transform: [{ scale: hintAnim }] }]}>
        <ImageBackground
          source={theme.tileBg}
          style={styles.fullCell}
          imageStyle={{ opacity: isFixed ? 0.5 : 1, borderRadius: 6 }}
        >
          {val !== 0 && (
            <Image
              source={val === 1 ? theme.shape1 : theme.shape2}
              style={{ width: size * 0.65, height: size * 0.65 }}
              resizeMode="contain"
            />
          )}
          {linkedColor && !isFixed && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: linkedColor, borderRadius: 6, borderStyle: 'dashed', borderWidth: 1 }]} />
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
        <Text style={styles.winTitle}>Cleared!</Text>
        <View style={styles.starRow}>
          {stars.map((anim: any, i: number) => (
            <Animated.Text key={i} style={[styles.starText, { transform: [{ scale: anim }], opacity: anim }]}>★</Animated.Text>
          ))}
        </View>
        <Text style={styles.statsText}>{moves} moves taken</Text>
        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextButtonText}>Next Level</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  header: { marginBottom: 15 },
  moveText: { fontSize: 18, fontWeight: "800", color: "#495057", letterSpacing: 1 },
  gameWrapper: { alignItems: "center" },
  boardRow: { flexDirection: "row", alignItems: "center" },
  rowIndicators: { alignItems: 'flex-end' },
  indicatorText: { fontSize: 10, fontWeight: "bold", color: "#adb5bd" },
  textRed: { color: "#fa5252" },
  textGreen: { color: "#40c057" },
  board: { flexDirection: "row", flexWrap: "wrap", backgroundColor: "#f1f3f5", borderRadius: 8, overflow: "hidden" },
  fullCell: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  buttonRow: { flexDirection: "row", marginTop: 30, gap: 12 },
  actionButton: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: "#e9ecef", borderRadius: 12, minWidth: 85, alignItems: 'center' },
  buttonText: { fontWeight: "bold", color: "#495057" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "white", padding: 40, borderRadius: 24, alignItems: "center", width: "85%" },
  winTitle: { fontSize: 32, fontWeight: "900", marginBottom: 10, color: "#2f9e44" },
  starRow: { flexDirection: "row", marginBottom: 15, gap: 8 },
  starText: { fontSize: 48, color: "#fcc419" },
  statsText: { fontSize: 16, color: "#868e96", marginBottom: 25 },
  nextButton: { backgroundColor: "#228be6", paddingVertical: 14, paddingHorizontal: 45, borderRadius: 25 },
  nextButtonText: { color: "white", fontSize: 18, fontWeight: "bold" }
});