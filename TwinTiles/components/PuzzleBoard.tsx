import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, ImageBackground, Animated, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from 'expo-haptics';
import { calculateBoardLayout } from "../utils/boardLayout";
import { unlockNextLevel, saveLevelState, getLevelState, saveLevelStars } from "../utils/progress";
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
  // --- 1. LAYOUT CALCULATIONS ---
  const { cellSize, boardSize, indicatorWidth } = useMemo(() => {
    const INDICATOR_WIDTH = 40;
    const SCREEN_PADDING = 32;
    const screenWidth = Dimensions.get('window').width;
    const maxAvailableWidth = screenWidth - INDICATOR_WIDTH - SCREEN_PADDING;
    const { cellSize: rawCellSize } = calculateBoardLayout(size);
    const finalCellSize = Math.min(Math.floor(rawCellSize), Math.floor(maxAvailableWidth / size));
    return { 
      cellSize: finalCellSize, 
      boardSize: finalCellSize * size, 
      indicatorWidth: INDICATOR_WIDTH 
    };
  }, [size]);

  // --- 2. STATE ---
  const [cells, setCells] = useState<number[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [winModalVisible, setWinModalVisible] = useState(false);
  const [history, setHistory] = useState<number[][]>([]);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [moveCount, setMoveCount] = useState(0);
  const [userHasMoved, setUserHasMoved] = useState(false);

  // --- 3. ANIMATIONS ---
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const starAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  // --- 4. GAME LOGIC ---
  const limit = size / 2;

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

    return {
      isInvalid: overLimit || tripleFound,
      isComplete: (counts.one + counts.two) === size && !overLimit && !tripleFound,
      counts
    };
  }, [limit, size]);

  const checkWin = useCallback((board: number[]) => {
    if (!board.length || board.some((c) => c === 0)) return false;
    for (let i = 0; i < size; i++) {
      const row = board.slice(i * size, (i + 1) * size);
      const col = Array.from({ length: size }).map((_, r) => board[r * size + i]);
      if (!getValidationState(row).isComplete || !getValidationState(col).isComplete) return false;
    }
    return true;
  }, [size, getValidationState]);

  const cycleCell = (index: number) => {
    if (isInitializing || levelData[index] !== 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUserHasMoved(true);
    setHistory((prev) => [...prev, [...cells]].slice(-20));
    
    const newCells = [...cells];
    newCells[index] = (newCells[index] + 1) % 3;
    setCells(newCells);
    setMoveCount((prev) => prev + 1);
    saveLevelState(chapterId, level, newCells);
  };

  const triggerShake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // --- 5. EFFECTS ---
  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      setWinModalVisible(false);
      setMoveCount(0);
      starAnims.forEach(a => a.setValue(0));
      
      const saved = await getLevelState(chapterId, level);
      const useSaved = !forcedReset && saved?.length === levelData.length && saved.includes(0);
      
      setCells(useSaved ? saved : [...levelData]);
      setIsInitializing(false);
    };
    init();
  }, [level, chapterId, levelData, forcedReset]);

  useEffect(() => {
    if (userHasMoved && !isInitializing && cells.every(c => c !== 0)) {
      if (checkWin(cells)) {
        handleWin();
      } else {
        triggerShake();
      }
    }
  }, [cells]);

  const handleWin = async () => {
    const emptyCells = levelData.filter(c => c === 0).length || 1;
    const stars = moveCount <= Math.ceil(emptyCells * 1.6) ? 3 : 2;
    
    await saveLevelStars(chapterId, level, stars);
    await unlockNextLevel(chapterId, level);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setWinModalVisible(true);
    setUserHasMoved(false);

    const animations = starAnims.slice(0, stars).map((anim, i) => 
      Animated.spring(anim, { toValue: 1, tension: 40, friction: 5, delay: i * 200, useNativeDriver: true })
    );
    Animated.parallel(animations).start();
  };

  if (isInitializing) return <View style={styles.container}><Text>Loading Board...</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <WinModal 
        visible={winModalVisible} 
        stars={starAnims} 
        moves={moveCount} 
        onNext={() => { setWinModalVisible(false); onNextLevel(); }} 
      />

      <View style={styles.header}>
        <Text style={styles.moveText}>MOVES: {moveCount}</Text>
      </View>

      <Animated.View style={[styles.gameWrapper, { transform: [{ translateX: shakeAnim }] }]}>
        <View style={styles.rowLayout}>
          <View style={{ width: indicatorWidth }} />
          {Array.from({ length: size }).map((_, i) => (
            <Indicator 
              key={i} 
              data={Array.from({ length: size }).map((_, r) => cells[r * size + i])} 
              validate={getValidationState} 
              size={cellSize}
              vertical
            />
          ))}
        </View>

        <View style={styles.boardContainer}>
          <View style={{ width: indicatorWidth }}>
            {Array.from({ length: size }).map((_, i) => (
              <Indicator 
                key={i} 
                data={cells.slice(i * size, (i + 1) * size)} 
                validate={getValidationState} 
                size={cellSize}
              />
            ))}
          </View>

          <View style={[styles.board, { width: boardSize, height: boardSize }]}>
            {cells.map((val, i) => (
              <Tile 
                key={i}
                val={val}
                isFixed={levelData[i] !== 0}
                onPress={() => cycleCell(i)}
                size={cellSize}
                theme={theme}
              />
            ))}
          </View>
        </View>
      </Animated.View>

      <View style={styles.buttonRow}>
        <ActionButton label="Undo" onPress={() => {
          if (history.length > 0) {
            setCells(history[history.length - 1]);
            setHistory(prev => prev.slice(0, -1));
          }
        }} />
        <ActionButton 
          label={`Hint (${hintsLeft})`} 
          onPress={() => hintsLeft > 0 && setHintsLeft(h => h - 1)} 
          color="#fcc419" 
        />
      </View>
    </SafeAreaView>
  );
}

// --- SUB-COMPONENTS ---

const Tile = ({ val, isFixed, onPress, size, theme }: any) => (
  <TouchableOpacity onPress={onPress} disabled={isFixed} style={{ width: size, height: size, padding: 2 }}>
    <ImageBackground 
      source={theme?.tileBg} 
      style={styles.fullCell} 
      imageStyle={{ opacity: isFixed ? 0.4 : 1, borderRadius: 6 }}
    >
      {val !== 0 && (
        <Image source={val === 1 ? theme.shape1 : theme.shape2} style={{ width: size * 0.6, height: size * 0.6 }} resizeMode="contain" />
      )}
    </ImageBackground>
  </TouchableOpacity>
);

const Indicator = ({ data, validate, size, vertical = false }: any) => {
  const { isInvalid, isComplete, counts } = validate(data);
  const textStyle = [
    styles.indicatorText,
    isInvalid && { color: "#fa5252" },
    isComplete && { color: "#40c057" },
    !vertical && { textAlign: 'right', paddingRight: 8 }
  ];

  return (
    <View style={{ width: vertical ? size : '100%', height: vertical ? 'auto' : size, justifyContent: 'center', alignItems: vertical ? 'center' : 'flex-end' }}>
      <Text style={textStyle}>
        {counts.one}{vertical ? "\n" : "|"}{counts.two}
      </Text>
    </View>
  );
};

const WinModal = ({ visible, stars, moves, onNext }: any) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.winTitle}>Level Complete!</Text>
        <View style={styles.starRow}>
          {stars.map((anim: any, i: number) => (
            <Animated.Text key={i} style={[styles.starText, { transform: [{ scale: anim }], opacity: anim }]}>⭐</Animated.Text>
          ))}
        </View>
        <Text style={styles.statsText}>Moves: {moves}</Text>
        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextButtonText}>Next Level</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const ActionButton = ({ label, onPress, color = "#dee2e6" }: any) => (
  <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]} onPress={onPress}>
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>
);

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  header: { marginBottom: 20 },
  moveText: { fontSize: 20, fontWeight: "bold", color: "#495057" },
  gameWrapper: { alignItems: "center" },
  rowLayout: { flexDirection: "row", marginBottom: 8 },
  boardContainer: { flexDirection: "row", alignItems: "center" },
  indicatorText: { fontSize: 11, fontWeight: "bold", color: "#adb5bd", lineHeight: 12 },
  board: { flexDirection: "row", flexWrap: "wrap", backgroundColor: "#f1f3f5", borderRadius: 12, overflow: "hidden", elevation: 4 },
  fullCell: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  buttonRow: { flexDirection: "row", marginTop: 40, gap: 15 },
  actionButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  buttonText: { fontWeight: "bold", color: "#495057" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "white", padding: 30, borderRadius: 20, alignItems: "center", width: "80%" },
  winTitle: { fontSize: 28, fontWeight: "bold", marginBottom: 20, color: "#2f9e44" },
  starRow: { flexDirection: "row", marginBottom: 20, gap: 10 },
  starText: { fontSize: 40 },
  statsText: { fontSize: 18, color: "#495057", marginBottom: 30 },
  nextButton: { backgroundColor: "#228be6", paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  nextButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});