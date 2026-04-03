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
  levelData = [],
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
  const [userHasMoved, setUserHasMoved] = useState(false);

  const hintPulse = useRef(new Animated.Value(1)).current;
  const star1Anim = useRef(new Animated.Value(0)).current;
  const star2Anim = useRef(new Animated.Value(0)).current;
  const star3Anim = useRef(new Animated.Value(0)).current;
  
  const nextLevelBtnRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);

  const INDICATOR_WIDTH = 40;
  const VISUAL_OFFSET = INDICATOR_WIDTH / 2;
  const limit = size / 2;

  // --- LOGIC HELPERS ---

  /**
   * Centralized validation for a single row or column array
   */
  const getValidationState = useCallback((arr: number[]) => {
    const counts = {
      one: arr.filter((c) => c === 1).length,
      two: arr.filter((c) => c === 2).length,
    };

    const overLimit = counts.one > limit || counts.two > limit;

    let tripleFound = false;
    for (let i = 0; i < arr.length - 2; i++) {
      if (arr[i] !== 0 && arr[i] === arr[i + 1] && arr[i] === arr[i + 2]) {
        tripleFound = true;
        break;
      }
    }

    const isFull = (counts.one + counts.two) === size;

    return {
      isInvalid: overLimit || tripleFound,
      isComplete: isFull && !overLimit && !tripleFound,
      counts
    };
  }, [limit, size]);

  const checkWin = useCallback((board: number[]) => {
    if (!board || board.length === 0 || board.some((c) => c === 0)) return false;

    for (let i = 0; i < size; i++) {
      const row = board.slice(i * size, (i + 1) * size);
      const col = [];
      for (let j = 0; j < size; j++) col.push(board[j * size + i]);

      const rowState = getValidationState(row);
      const colState = getValidationState(col);

      if (!rowState.isComplete || !colState.isComplete) return false;
    }
    return true;
  }, [size, getValidationState]);

  // --- EFFECTS ---

  useEffect(() => {
    if (winModalVisible) {
      const animateStar = (val: Animated.Value, delay: number) => 
        Animated.spring(val, { toValue: 1, tension: 50, friction: 4, delay, useNativeDriver: true });

      Animated.parallel([
        animateStar(star1Anim, 0),
        animateStar(star2Anim, 200),
        animateStar(star3Anim, 400),
      ]).start();

      setTimeout(() => {
        if (nextLevelBtnRef.current) (nextLevelBtnRef.current as any).focus?.();
      }, 100);
    } else {
      star1Anim.setValue(0);
      star2Anim.setValue(0);
      star3Anim.setValue(0);
    }
  }, [winModalVisible]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setIsInitializing(true);
      setWinModalVisible(false);
      try {
        const saved = await getLevelState(chapterId, level);
        if (!isMounted) return;
        if (!forcedReset && saved && saved.length === levelData.length && saved.includes(0)) {
          setCells(saved);
        } else {
          setCells([...levelData]);
        }
      } catch (err) {
        if (isMounted) setCells([...levelData]);
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };
    init();
    return () => { isMounted = false; };
  }, [level, chapterId, levelData, forcedReset]);

  useEffect(() => {
    if (userHasMoved && !isInitializing && cells.every(c => c !== 0)) {
      if (checkWin(cells)) {
        const handleWin = async () => {
          const finalStars = calculateStars();
          await saveLevelStars(chapterId, level, finalStars);
          await unlockNextLevel(chapterId, level);
          setWinModalVisible(true);
          setUserHasMoved(false);
        };
        handleWin();
      }
    }
  }, [cells, isInitializing, userHasMoved, checkWin]);

  const emptyCellsCount = levelData?.filter((c) => c === 0).length || 1;
  const goldThreshold = Math.ceil(emptyCellsCount * 1.5);
  const silverThreshold = Math.ceil(emptyCellsCount * 2.0);

  const calculateStars = useCallback(() => {
    if (moveCount <= goldThreshold) return 3;
    if (moveCount <= silverThreshold) return 2;
    return 1;
  }, [moveCount, goldThreshold, silverThreshold]);

  const cycleCell = (index: number) => {
    if (isInitializing || levelData[index] !== 0) return;
    setUserHasMoved(true);
    setHistory((prev) => [...prev, [...cells]].slice(-20));
    const newCells = [...cells];
    newCells[index] = (newCells[index] + 1) % 3;
    setCells(newCells);
    setMoveCount((prev) => prev + 1);
    saveLevelState(chapterId, level, newCells);
  };

  const undoMove = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCells(prev);
    setMoveCount((m) => m + 1);
    saveLevelState(chapterId, level, prev);
  };

  const giveHint = () => {
    if (hintsLeft <= 0) return;
    const emptyIdx = cells.findIndex((c) => c === 0);
    if (emptyIdx === -1) return;
    setHintIndex(emptyIdx);
    setHintsLeft(h => h - 1);
    Animated.sequence([
      Animated.timing(hintPulse, { toValue: 1.2, duration: 300, useNativeDriver: true }),
      Animated.timing(hintPulse, { toValue: 1.0, duration: 300, useNativeDriver: true }),
    ]).start(() => setHintIndex(null));
  };

  if (isInitializing) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  const starsEarned = calculateStars();

  return (
    <SafeAreaView style={styles.container}>
      <Modal transparent visible={winModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>LEVEL COMPLETE</Text>
            <View style={styles.starRow}>
              {[star1Anim, star2Anim, star3Anim].map((anim, idx) => (
                <Animated.Text 
                  key={idx} 
                  style={[styles.starIcon, { transform: [{ scale: anim }], color: (idx + 1) <= starsEarned ? "#fcc419" : "#e9ecef" }]}
                >
                  ★
                </Animated.Text>
              ))}
            </View>
            <TouchableOpacity ref={nextLevelBtnRef} style={styles.modalButton} onPress={onNextLevel}>
              <Text style={styles.modalButtonText}>NEXT LEVEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.moveText}>MOVES: {moveCount}</Text>
      </View>

      <View style={[styles.gameWrapper, { opacity: winModalVisible ? 0.5 : 1 }]}>
 {/* Column Indicators */}
<View style={{ flexDirection: "row" }}>
  <View style={{ width: INDICATOR_WIDTH }} />
  <View style={{ flexDirection: 'row', width: boardSize }}>
    {Array.from({ length: size }).map((_, colIdx) => {
      const col = Array.from({ length: size }).map((_, r) => cells[r * size + colIdx]);
      const { isInvalid, isComplete, counts } = getValidationState(col);
      return (
        <View key={colIdx} style={{ width: cellSize, alignItems: "center" }}>
          <Text style={[
            styles.indicatorText, 
            isInvalid && { color: "#fa5252" },
            isComplete && { color: "#40c057" }
          ]}>
            {counts.one}|{counts.two}
          </Text>
        </View>
      );
    })}
  </View>
</View>

        <View style={[styles.boardContainer, { marginLeft: -VISUAL_OFFSET }]}>
          {/* Row Indicators */}
          <View style={styles.rowIndicators}>
            {Array.from({ length: size }).map((_, rowIdx) => {
              const row = cells.slice(rowIdx * size, (rowIdx + 1) * size);
              const { isInvalid, isComplete, counts } = getValidationState(row);
              return (
                <View key={rowIdx} style={{ height: cellSize, justifyContent: "center" }}>
                  <Text style={[
                    styles.indicatorText, 
                    isInvalid && { color: "#fa5252" },
                    isComplete && { color: "#40c057" }
                  ]}>
                    {counts.one}|{counts.two}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={[styles.board, { width: boardSize, height: boardSize }]}>
            {cells.map((val, i) => {
              const isFixed = levelData[i] !== 0;
              const isHinted = hintIndex === i;
              return (
                <TouchableOpacity 
                  key={i} 
                  onPress={() => cycleCell(i)} 
                  disabled={isFixed}
                  style={{ width: cellSize, height: cellSize }}
                >
                  <ImageBackground 
                    source={theme?.tileBg} 
                    style={styles.fullCell}
                    imageStyle={{ opacity: isFixed ? 0.5 : 1, borderRadius: 4 }}
                  >
                    {val !== 0 && (
                      <Image 
                        source={val === 1 ? theme.shape1 : theme.shape2} 
                        style={{ width: cellSize * 0.7, height: cellSize * 0.7 }} 
                        resizeMode="contain" 
                      />
                    )}
                    {isHinted && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(252, 196, 25, 0.3)' }]} />}
                  </ImageBackground>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButton} onPress={undoMove}>
          <Text style={styles.buttonText}>Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#fcc419' }]} onPress={giveHint}>
          <Text style={styles.buttonText}>Hint ({hintsLeft})</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  header: { marginBottom: 20 },
  moveText: { fontSize: 20, fontWeight: "bold", color: "#495057" },
  gameWrapper: { alignItems: "center", justifyContent: "center", width: '100%' },
  boardContainer: { flexDirection: "row", alignItems: "center" },
  columnIndicators: { flexDirection: "row", marginBottom: 5 },
  rowIndicators: { width: 40, paddingRight: 5, alignItems: 'flex-end' },
  indicatorText: { fontSize: 12, fontWeight: "bold", color: "#868e96" },
  board: { flexDirection: "row", flexWrap: "wrap", backgroundColor: "#dee2e6", borderRadius: 8, overflow: "hidden" },
  fullCell: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  buttonRow: { flexDirection: "row", marginTop: 30, gap: 20 },
  actionButton: { paddingVertical: 12, paddingHorizontal: 25, backgroundColor: "#adb5bd", borderRadius: 10 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", padding: 30, borderRadius: 20, alignItems: "center", width: '80%' },
  modalTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  starRow: { flexDirection: "row", marginBottom: 20 },
  starIcon: { fontSize: 40, marginHorizontal: 5 },
  modalButton: { backgroundColor: "#4dabf7", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
  modalButtonText: { color: "#fff", fontWeight: "bold" },
});