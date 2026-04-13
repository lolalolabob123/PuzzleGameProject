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
  levelData = [],
  chapterId,
  level,
  onNextLevel,
  forcedReset = false,
  theme
}: PuzzleBoardProps) {

  const INDICATOR_WIDTH = 40;

  // 1. LAYOUT
  const { cellSize, boardSize } = useMemo(() => {
    const SCREEN_PADDING = 32;
    const screenWidth = Dimensions.get("window").width;
    // Account for the row indicators on the left
    const maxWidth = screenWidth - INDICATOR_WIDTH - SCREEN_PADDING;

    const { cellSize: raw } = calculateBoardLayout(size);
    const final = Math.min(Math.floor(raw), Math.floor(maxWidth / size));

    return {
      cellSize: final,
      boardSize: final * size
    };
  }, [size]);

  // 2. STATE
  const [cells, setCells] = useState<number[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [winModalVisible, setWinModalVisible] = useState(false);
  const [history, setHistory] = useState<number[][]>([]);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [moveCount, setMoveCount] = useState(0);

  const hasWonRef = useRef(false);

  // 3. ANIMATION
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(1)).current;
  const starAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  // 4. GAME LOGIC
  const limit = size / 2;

  const getValidationState = useCallback((arr: number[]) => {
    const counts = {
      one: arr.filter(c => c === 1).length,
      two: arr.filter(c => c === 2).length
    };
    const overLimit = counts.one > limit || counts.two > limit;

    let tripleFound = false;
    for (let i = 0; i < arr.length - 2; i++) {
      if (arr[i] !== 0 && arr[i] === arr[i + 1] && arr[i] === arr[i + 2]) {
        tripleFound = true;
        break;
      }
    }

    return {
      isInvalid: overLimit || tripleFound,
      isComplete: (counts.one + counts.two) === size && !overLimit && !tripleFound,
      counts
    };
  }, [limit, size]);

  const checkWin = useCallback((board: number[]) => {
    if (!board.length || board.some(c => c === 0)) return false;
    for (let i = 0; i < size; i++) {
      const row = board.slice(i * size, (i + 1) * size);
      const col = Array.from({ length: size }).map((_, r) => board[r * size + i]);
      if (!getValidationState(row).isComplete || !getValidationState(col).isComplete) return false;
    }
    return true;
  }, [size, getValidationState]);

  // 5. ACTIONS
  const giveHint = () => {
    if (hintsLeft <= 0 || hasWonRef.current) return;
    
    // Find the first empty cell to hint
    const emptyIdx = cells.findIndex((c) => c === 0);
    if (emptyIdx === -1) return;

    setHintIndex(emptyIdx);
    setHintsLeft(h => h - 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.sequence([
      Animated.timing(hintPulse, { toValue: 1.2, duration: 300, useNativeDriver: true }),
      Animated.timing(hintPulse, { toValue: 1.0, duration: 300, useNativeDriver: true }),
    ]).start(() => setHintIndex(null));
  };

  const triggerShake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const handleWin = async () => {
    if (hasWonRef.current) return;
    hasWonRef.current = true;

    const emptyCells = levelData.filter(c => c === 0).length || 1;
    let stars = (moveCount <= emptyCells * 1.6) ? 3 : (moveCount <= emptyCells * 2.2 ? 2 : 1);

    await saveLevelStars(chapterId, level, stars);
    await unlockNextLevel(chapterId, level);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setWinModalVisible(true);

    const anims = starAnims.slice(0, stars).map((a, i) =>
      Animated.spring(a, { toValue: 1, friction: 5, tension: 40, delay: i * 200, useNativeDriver: true })
    );
    Animated.parallel(anims).start();
  };

  const cycleCell = (index: number) => {
    if (isInitializing || levelData[index] !== 0 || hasWonRef.current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newCells = [...cells];
    newCells[index] = (newCells[index] + 1) % 3;

    setHistory(h => [...h, [...cells]].slice(-20));
    setCells(newCells);
    setMoveCount(m => m + 1);
    saveLevelState(chapterId, level, newCells);
  };

  const undo = () => {
    if (history.length === 0 || hasWonRef.current) return;
    const last = history[history.length - 1];
    setCells(last);
    setHistory(h => h.slice(0, -1));
  };

  // 6. INIT
  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      setWinModalVisible(false);
      setMoveCount(0);
      setHintsLeft(3);
      hasWonRef.current = false;
      starAnims.forEach(a => a.setValue(0));

      const saved = await getLevelState(chapterId, level);
      const useSaved = !forcedReset && saved?.length === levelData.length && saved.includes(0);

      setCells(useSaved ? saved : [...levelData]);
      setIsInitializing(false);
    };
    init();
  }, [level, chapterId, levelData, forcedReset]);

  // 7. WIN CHECK
  useEffect(() => {
    if (isInitializing || hasWonRef.current || cells.length === 0) return;
    if (!cells.every(c => c !== 0)) return;

    if (checkWin(cells)) handleWin();
    else triggerShake();
  }, [cells, isInitializing, checkWin]);

  if (isInitializing) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <WinModal visible={winModalVisible} stars={starAnims} moves={moveCount} onNext={onNextLevel} />

      <View style={styles.header}>
        <Text style={styles.moveText}>MOVES: {moveCount}</Text>
      </View>

      <View style={styles.gameWrapper}>
        {/* Column Indicators */}
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
          {/* Row Indicators */}
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

          {/* Board */}
          <View style={[styles.board, { width: boardSize, height: boardSize }]}>
            {cells.map((val, i) => {
              const isHinted = hintIndex === i;
              return (
                <Tile
                  key={i}
                  val={val}
                  isFixed={levelData[i] !== 0}
                  onPress={() => cycleCell(i)}
                  size={cellSize}
                  theme={theme}
                  isHinted={isHinted}
                  hintAnim={hintPulse}
                />
              )
            })}
          </View>
        </Animated.View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButton} onPress={undo}>
          <Text style={styles.buttonText}>Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#fcc419' }]} 
          onPress={giveHint}
        >
          <Text style={styles.buttonText}>Hint ({hintsLeft})</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const Tile = ({ val, isFixed, onPress, size, theme, isHinted, hintAnim }: any) => (
  <TouchableOpacity onPress={onPress} disabled={isFixed} style={{ width: size, height: size, padding: 2 }}>
    <Animated.View style={[{ flex: 1 }, isHinted && { transform: [{ scale: hintAnim }] }]}>
      <ImageBackground 
        source={theme?.tileBg} 
        style={styles.fullCell} 
        imageStyle={{ opacity: isFixed ? 0.4 : 1, borderRadius: 6 }}
      >
        {val !== 0 && (
          <Image 
            source={val === 1 ? theme.shape1 : theme.shape2} 
            style={{ width: size * 0.6, height: size * 0.6 }} 
            resizeMode="contain" 
          />
        )}
        {isHinted && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(252, 196, 25, 0.3)', borderRadius: 6 }]} />}
      </ImageBackground>
    </Animated.View>
  </TouchableOpacity>
);

const WinModal = ({ visible, stars, moves, onNext }: any) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.winTitle}>Level Complete!</Text>
        <View style={styles.starRow}>
          {stars.map((anim: any, i: number) => (
            <Animated.Text key={i} style={[styles.starText, { transform: [{ scale: anim }], opacity: anim, color: "#fcc419" }]}>
              ★
            </Animated.Text>
          ))}
        </View>
        <Text style={styles.statsText}>Solved in {moves} moves</Text>
        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextButtonText}>Next Level</Text>
        </TouchableOpacity>
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
  board: { flexDirection: "row", flexWrap: "wrap", backgroundColor: "#f1f3f5", borderRadius: 12, overflow: "hidden", elevation: 4 },
  fullCell: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  buttonRow: { flexDirection: "row", marginTop: 40, gap: 15 },
  actionButton: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: "#dee2e6", borderRadius: 12 },
  buttonText: { fontWeight: "bold", color: "#495057" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "white", padding: 30, borderRadius: 20, alignItems: "center", width: "80%" },
  winTitle: { fontSize: 28, fontWeight: "bold", marginBottom: 20, color: "#2f9e44" },
  starRow: { flexDirection: "row", marginBottom: 20, gap: 10 },
  starText: { fontSize: 40, fontWeight: 'bold' },
  statsText: { fontSize: 18, color: "#495057", marginBottom: 30 },
  nextButton: { backgroundColor: "#228be6", paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  nextButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});