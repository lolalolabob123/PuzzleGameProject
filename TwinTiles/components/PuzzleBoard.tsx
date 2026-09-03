import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, Modal, Animated, StyleSheet, Dimensions, Alert, Platform } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getEffectCount, useEffectToken } from "../utils/coins";
import { initAudio, playSound } from "../utils/audio";
import { useTheme } from "../context/ThemeContext";
import { spacing, radii, typography, shadows, UITheme } from "../constants/uiTheme";
import {
  getLevelState,
  getActiveSession,
  saveActiveSession,
  clearActiveSession,
  unlockNextLevel,
  saveLevelStars,
} from "../utils/progress";
import { useIsFocused } from "@react-navigation/native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const TILE_MARGIN = 2;

export interface LevelData {
  id: number;
  size: number;
  grid: number[];
  cages?: any[];
  voids?: number[];
  linkedPairs?: any[];
  par?: number;
  minMoves?: number;
  [key: string]: any;
}

export interface PuzzleBoardProps {
  levelData: LevelData;
  chapterId: number;
  level: number;
  size: number;
  onNextLevel: () => void;
  forcedReset?: boolean;
  daily?: boolean;
  hintTrigger?: number;
}

function solvePuzzleGrid(initialGrid: number[], size: number, linkedPairs?: any[], voids?: number[]): number[] | null {
  const target = Math.floor(size / 2);
  const isVoid = (i: number) => voids?.includes(i) ?? false;

  function isValid(g: number[]): boolean {
    // Check horizontal constraints (count and max 2 adjacent)
    for (let r = 0; r < size; r++) {
      let r1 = 0, r2 = 0;
      for (let c = 0; c < size; c++) {
        const idx = r * size + c;
        if (isVoid(idx)) continue;
        const val = g[idx];
        if (val === 1) r1++;
        if (val === 2) r2++;
        if (r1 > target || r2 > target) return false;

        // Check for 3-in-a-row horizontally
        if (c >= 2) {
          const i1 = r * size + (c - 2), i2 = r * size + (c - 1), i3 = idx;
          if (!isVoid(i1) && !isVoid(i2) && !isVoid(i3)) {
            if (g[i1] !== 0 && g[i1] === g[i2] && g[i2] === g[i3]) return false;
          }
        }
      }
    }

    // Check vertical constraints (count and max 2 adjacent)
    for (let c = 0; c < size; c++) {
      let c1 = 0, c2 = 0;
      for (let r = 0; r < size; r++) {
        const idx = r * size + c;
        if (isVoid(idx)) continue;
        const val = g[idx];
        if (val === 1) c1++;
        if (val === 2) c2++;
        if (c1 > target || c2 > target) return false;

        // Check for 3-in-a-row vertically
        if (r >= 2) {
          const i1 = (r - 2) * size + c, i2 = (r - 1) * size + c, i3 = idx;
          if (!isVoid(i1) && !isVoid(i2) && !isVoid(i3)) {
            if (g[i1] !== 0 && g[i1] === g[i2] && g[i2] === g[i3]) return false;
          }
        }
      }
    }

    // Check linked pair constraints
    if (linkedPairs && Array.isArray(linkedPairs)) {
      for (const pair of linkedPairs) {
        let a: number | undefined, b: number | undefined, type = "equal";
        if (Array.isArray(pair)) {
          a = pair[0];
          b = pair[1];
        } else if (typeof pair === "object" && pair !== null) {
          a = pair.idx1 ?? pair.cell1 ?? pair.a ?? pair.from;
          b = pair.idx2 ?? pair.cell2 ?? pair.b ?? pair.to;
          if (pair.type) type = pair.type;
        }

        if (a !== undefined && b !== undefined) {
          const v1 = g[a], v2 = g[b];
          if (v1 !== 0 && v2 !== 0) {
            if (type === "equal" && v1 !== v2) return false;
            if (type === "opposite" && v1 === v2) return false;
          }
        }
      }
    }

    return true;
  }

  function backtrack(g: number[], idx: number): number[] | null {
    if (idx === g.length) {
      return isValid(g) ? g : null;
    }

    if (g[idx] !== 0 || isVoid(idx)) {
      return backtrack(g, idx + 1);
    }

    for (const val of [1, 2]) {
      g[idx] = val;
      if (isValid(g)) {
        const res = backtrack(g, idx + 1);
        if (res) return res;
      }
    }
    g[idx] = 0;
    return null;
  }

  return backtrack([...initialGrid], 0);
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  levelData,
  chapterId,
  level,
  size,
  onNextLevel,
  forcedReset,
  daily = false,
  hintTrigger = 0,
}) => {
  const { ui: uiTheme } = useTheme();
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);

  const [grid, setGrid] = useState<number[]>([...levelData.grid]);
  const [history, setHistory] = useState<number[][]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [starCount, setStarCount] = useState<number>(3);
  const [hintedIndex, setHintedIndex] = useState<number | null>(null);
  const [hintedValue, setHintedValue] = useState<number | null>(null);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  const isFocused = useIsFocused();
  const [hintsCount, setHintsCount] = useState<number>(0);

  const starAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    initAudio();
  }, []);

  const solutionGrid = useMemo(() => {
    return solvePuzzleGrid(levelData.grid, size, levelData.linkedPairs, levelData.voids);
  }, [levelData.grid, size, levelData.linkedPairs, levelData.voids]);

  const triggerHaptic = (type: "light" | "medium" | "success") => {
    try {
      if (type === "light") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (type === "medium") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (type === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Native haptics fallback
    }
  };

  const refreshHints = useCallback(async () => {
    const count = await getEffectCount("extra-hints");
    setHintsCount(count);
  }, []);

  useEffect(() => {
    if (isFocused) {
      refreshHints();
    }
  }, [isFocused, refreshHints]);

  const isFixedIndex = useCallback((idx: number) => levelData.grid[idx] !== 0, [levelData.grid]);
  const isVoidIndex = useCallback((idx: number) => levelData.voids?.includes(idx) ?? false, [levelData.voids]);

  const checkIsWon = useCallback((currentGrid: number[]) => {
    const isFilled = !currentGrid.some((val, i) => val === 0 && !isVoidIndex(i));
    if (!isFilled) return false;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size - 2; c++) {
        const i1 = r * size + c, i2 = r * size + (c + 1), i3 = r * size + (c + 2);
        if (isVoidIndex(i1) || isVoidIndex(i2) || isVoidIndex(i3)) continue;
        if (currentGrid[i1] !== 0 && currentGrid[i1] === currentGrid[i2] && currentGrid[i2] === currentGrid[i3]) {
          return false;
        }
      }
    }

    for (let c = 0; c < size; c++) {
      for (let r = 0; r < size - 2; r++) {
        const i1 = r * size + c, i2 = (r + 1) * size + c, i3 = (r + 2) * size + c;
        if (isVoidIndex(i1) || isVoidIndex(i2) || isVoidIndex(i3)) continue;
        if (currentGrid[i1] !== 0 && currentGrid[i1] === currentGrid[i2] && currentGrid[i2] === currentGrid[i3]) {
          return false;
        }
      }
    }

    if (levelData.linkedPairs && Array.isArray(levelData.linkedPairs)) {
      for (const pair of levelData.linkedPairs) {
        let idx1: number | undefined, idx2: number | undefined, expectedType = "equal";
        if (Array.isArray(pair)) {
          idx1 = pair[0];
          idx2 = pair[1];
        } else if (typeof pair === "object" && pair !== null) {
          idx1 = pair.idx1 ?? pair.cell1 ?? pair.a ?? pair.from;
          idx2 = pair.idx2 ?? pair.cell2 ?? pair.b ?? pair.to;
          if (pair.type) expectedType = pair.type;
        }

        if (idx1 !== undefined && idx2 !== undefined) {
          const val1 = currentGrid[idx1];
          const val2 = currentGrid[idx2];
          if (val1 === 0 || val2 === 0) return false;
          if (expectedType === "equal" && val1 !== val2) return false;
          if (expectedType === "opposite" && val1 === val2) return false;
        }
      }
    }

    return true;
  }, [isVoidIndex, size, levelData.linkedPairs]);

  const initialEmptyCount = useMemo(() => {
    return levelData.grid.filter((val, idx) => val === 0 && !isVoidIndex(idx)).length;
  }, [levelData.grid, isVoidIndex]);

  const estimatedOptionalMoves = useMemo(() => {
    if (levelData.par) return levelData.par;
    if (levelData.minMoves) return levelData.minMoves;
    return Math.ceil(initialEmptyCount * 1.5);
  }, [levelData.par, levelData.minMoves, initialEmptyCount]);

  const handleWinSequence = useCallback(async (finalGrid: number[], finalMoves: number) => {
    setIsWon(true);
    triggerHaptic("success");
    playSound("win");

    const par = estimatedOptionalMoves;
    const stars =
      finalMoves <= par + 3
        ? 3
        : finalMoves <= par + Math.max(6, Math.floor(par * 0.5))
          ? 2
          : 1;

    setStarCount(stars);

    await unlockNextLevel(chapterId, level);
    await saveLevelStars(chapterId, level, stars);
    await clearActiveSession(chapterId, level);

    starAnims.forEach((anim, i) => {
      anim.setValue(0);
      Animated.spring(anim, {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
        delay: i * 150,
      }).start();
    });
  }, [estimatedOptionalMoves, chapterId, level, starAnims]);

  const applyHintToBoard = useCallback(async () => {
    if (isWon || !solutionGrid) return;

    // 1. Highlight user errors if present
    let firstErrorIdx = -1;
    for (let i = 0; i < grid.length; i++) {
      if (isFixedIndex(i) || isVoidIndex(i)) continue;
      if (grid[i] !== 0 && grid[i] !== solutionGrid[i]) {
        firstErrorIdx = i;
        break;
      }
    }

    if (firstErrorIdx !== -1) {
      triggerHaptic("medium");
      playSound("hint");
      setErrorIndex(firstErrorIdx);
      setTimeout(() => setErrorIndex(null), 2500);
      return;
    }

    // 2. Suggest first empty slot with translucent ghost text preview
    const firstEmptyIdx = grid.findIndex((v, i) => v === 0 && !isVoidIndex(i));
    if (firstEmptyIdx === -1) return;

    triggerHaptic("light");
    playSound("hint");

    setHintedIndex(firstEmptyIdx);
    setHintedValue(solutionGrid[firstEmptyIdx]);

    setTimeout(() => {
      setHintedIndex(null);
      setHintedValue(null);
    }, 3000);
  }, [isWon, solutionGrid, grid, isFixedIndex, isVoidIndex]);

  const prevHintTrigger = useRef(hintTrigger);
  useEffect(() => {
    if (hintTrigger > prevHintTrigger.current) {
      applyHintToBoard();
      refreshHints();
    }
    prevHintTrigger.current = hintTrigger;
  }, [hintTrigger, applyHintToBoard, refreshHints]);

  const handleHintPress = async () => {
    if (isWon) return;

    if (hintsCount <= 0) {
      triggerHaptic("medium");
      playSound("undo");
      const msg = "You have no hints left. Visit the shop to get more!";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("No Hints", msg);
      return;
    }

    const success = await useEffectToken("extra-hints");
    if (success) {
      await refreshHints();
      await applyHintToBoard();
    }
  };

  const counterSize = 30;
  const maxAvailableWidth = SCREEN_WIDTH - spacing.md * 4;
  const maxAvailableHeight = SCREEN_HEIGHT * 0.55;
  const dimensionLimit = Math.min(maxAvailableWidth, maxAvailableHeight);

  const innerBoardWidth = dimensionLimit - counterSize - spacing.sm * 2;
  const tileSize = Math.floor((innerBoardWidth - size * (TILE_MARGIN * 2)) / size);

  useEffect(() => {
    let active = true;
    (async () => {
      const activeSession = await getActiveSession();
      if (
        active &&
        activeSession &&
        activeSession.chapterId === chapterId &&
        activeSession.levelId === level &&
        activeSession.grid.length === levelData.grid.length
      ) {
        setGrid(activeSession.grid);
        setMoves(activeSession.moves ?? 0);
        return;
      }

      const savedGrid = await getLevelState(chapterId, level);
      if (active) {
        setGrid(savedGrid && savedGrid.length === levelData.grid.length ? savedGrid : [...levelData.grid]);
        setMoves(0);
        setHistory([]);
        setIsWon(false);
      }
    })();
    return () => { active = false; };
  }, [levelData, chapterId, level, forcedReset]);

  const getLinkInfo = useCallback((idx1: number, idx2: number) => {
    const pairs = levelData.linkedPairs;
    if (!pairs || !Array.isArray(pairs)) return null;

    for (const pair of pairs) {
      let a: number | undefined, b: number | undefined, type = "equal";
      if (Array.isArray(pair)) {
        a = pair[0];
        b = pair[1];
      } else if (typeof pair === "object" && pair !== null) {
        a = pair.idx1 ?? pair.cell1 ?? pair.a ?? pair.from;
        b = pair.idx2 ?? pair.cell2 ?? pair.b ?? pair.to;
        if (pair.type) type = pair.type;
      }

      if ((a === idx1 && b === idx2) || (a === idx2 && b === idx1)) {
        return { linked: true, type };
      }
    }
    return null;
  }, [levelData.linkedPairs]);

  const getLinkedPartners = useCallback((idx: number) => {
    const pairs = levelData.linkedPairs;
    if (!pairs || !Array.isArray(pairs)) return [];

    const partners: { partnerIdx: number; type: string }[] = [];
    for (const pair of pairs) {
      let a: number | undefined, b: number | undefined, type = "equal";
      if (Array.isArray(pair)) {
        a = pair[0];
        b = pair[1];
      } else if (typeof pair === "object" && pair !== null) {
        a = pair.idx1 ?? pair.cell1 ?? pair.a ?? pair.from;
        b = pair.idx2 ?? pair.cell2 ?? pair.b ?? pair.to;
        if (pair.type) type = pair.type;
      }

      if (a === idx && b !== undefined) {
        partners.push({ partnerIdx: b, type });
      } else if (b === idx && a !== undefined) {
        partners.push({ partnerIdx: a, type });
      }
    }
    return partners;
  }, [levelData.linkedPairs]);

  const targetPerType = Math.floor(size / 2);

  const rowCounts = useMemo(() => {
    const counts = [];
    for (let r = 0; r < size; r++) {
      let ones = 0, twos = 0;
      for (let c = 0; c < size; c++) {
        const val = grid[r * size + c];
        if (val === 1) ones++;
        if (val === 2) twos++;
      }
      counts.push({ ones, twos });
    }
    return counts;
  }, [grid, size]);

  const colCounts = useMemo(() => {
    const counts = [];
    for (let c = 0; c < size; c++) {
      let ones = 0, twos = 0;
      for (let r = 0; r < size; r++) {
        const val = grid[r * size + c];
        if (val === 1) ones++;
        if (val === 2) twos++;
      }
      counts.push({ ones, twos });
    }
    return counts;
  }, [grid, size]);

  const handleTilePress = async (index: number) => {
    if (isFixedIndex(index) || isVoidIndex(index) || isWon) return;

    triggerHaptic("light");
    playSound("tilePlace");

    setHistory((prev) => [...prev, grid]);

    const nextVal = (grid[index] + 1) % 3;
    const nextGrid = [...grid];
    nextGrid[index] = nextVal;

    const partners = getLinkedPartners(index);
    partners.forEach(({ partnerIdx, type }) => {
      if (!isFixedIndex(partnerIdx) && !isVoidIndex(partnerIdx)) {
        if (type === "opposite") {
          nextGrid[partnerIdx] = nextVal === 1 ? 2 : nextVal === 2 ? 1 : 0;
        } else {
          nextGrid[partnerIdx] = nextVal;
        }
      }
    });

    setGrid(nextGrid);
    const newMoves = moves + 1;
    setMoves(newMoves);

    await saveActiveSession({ chapterId, levelId: level, grid: nextGrid, moves: newMoves });

    if (checkIsWon(nextGrid)) {
      handleWinSequence(nextGrid, newMoves);
    }
  };

  const handleUndo = async () => {
    if (history.length === 0 || isWon) return;

    triggerHaptic("medium");
    playSound("undo");

    const previousGrid = history[history.length - 1];
    setGrid(previousGrid);
    setHistory((prev) => prev.slice(0, -1));
    const newMoves = Math.max(0, moves - 1);
    setMoves(newMoves);
    await saveActiveSession({ chapterId, levelId: level, grid: previousGrid, moves: newMoves });
  };

  const handleRestart = async () => {
    if (isWon) return;

    triggerHaptic("medium");
    playSound("undo");

    setGrid([...levelData.grid]);
    setHistory([]);
    setMoves(0);
    await clearActiveSession(chapterId, level);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.moveText}>MOVES: {moves}</Text>
      </View>

      <View style={styles.boardCard}>
        {/* Top Column Counters */}
        <View style={styles.columnCountersRow}>
          {colCounts.map((col, cIdx) => (
            <View key={cIdx} style={[styles.colCounterBox, { width: tileSize, marginHorizontal: TILE_MARGIN }]}>
              <Text style={styles.counterText1}>{col.ones}/{targetPerType}</Text>
              <Text style={styles.counterText2}>{col.twos}/{targetPerType}</Text>
            </View>
          ))}
          <View style={{ width: counterSize }} />
        </View>

        {/* Board Rows & Cell Links */}
        {Array.from({ length: size }).map((_, rowIndex) => (
          <View key={rowIndex} style={styles.boardRow}>
            {Array.from({ length: size }).map((_, colIndex) => {
              const idx = rowIndex * size + colIndex;
              const val = grid[idx];
              const isFixed = isFixedIndex(idx);
              const isVoid = isVoidIndex(idx);

              const rightLink = colIndex < size - 1 ? getLinkInfo(idx, idx + 1) : null;
              const bottomLink = rowIndex < size - 1 ? getLinkInfo(idx, idx + size) : null;

              return (
                <View key={idx} style={{ position: "relative" }}>
                  {isVoid ? (
                    <View style={[styles.voidCell, { width: tileSize, height: tileSize, margin: TILE_MARGIN }]}>
                      <Text style={styles.voidCellMark}>✕</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={isFixed || isWon ? 1 : 0.7}
                      disabled={isFixed || isWon}
                      onPress={() => handleTilePress(idx)}
                      style={[
                        styles.tile,
                        { width: tileSize, height: tileSize, margin: TILE_MARGIN },
                        val === 0 && styles.tileEmpty,
                        val === 1 && styles.tileOne,
                        val === 2 && styles.tileTwo,
                        isFixed && styles.tileFixed,
                        hintedIndex === idx && styles.tileHinted,
                        errorIndex === idx && styles.tileError,
                      ]}
                    >
                      {val !== 0 ? (
                        <Text style={[styles.tileText, val === 1 ? styles.tileTextOne : styles.tileTextTwo]}>
                          {val}
                        </Text>
                      ) : (
                        hintedIndex === idx && hintedValue !== null && (
                          <Text style={styles.hintGhostText}>
                            {hintedValue}
                          </Text>
                        )
                      )}
                    </TouchableOpacity>
                  )}

                  {/* Horizontal Link Badge */}
                  {rightLink?.linked && (
                    <View style={styles.rightLinkConnector}>
                      <Text style={styles.linkSymbol}>{rightLink.type === "opposite" ? "≠" : "="}</Text>
                    </View>
                  )}

                  {/* Vertical Link Badge */}
                  {bottomLink?.linked && (
                    <View style={styles.bottomLinkConnector}>
                      <Text style={styles.linkSymbol}>{bottomLink.type === "opposite" ? "≠" : "="}</Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Row Counter Box */}
            <View style={[styles.rowCounterBox, { height: tileSize, width: counterSize, marginVertical: TILE_MARGIN }]}>
              <Text style={styles.counterText1}>{rowCounts[rowIndex].ones}/{targetPerType}</Text>
              <Text style={styles.counterText2}>{rowCounts[rowIndex].twos}/{targetPerType}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsBar}>
        <TouchableOpacity
          style={[styles.controlBtn, (history.length === 0 || isWon) && styles.controlBtnDisabled]}
          onPress={handleUndo}
          disabled={history.length === 0 || isWon}
        >
          <FontAwesome name="undo" size={16} color={history.length === 0 || isWon ? uiTheme.textDisabled : uiTheme.textPrimary} />
          <Text style={[styles.controlBtnText, (history.length === 0 || isWon) && styles.controlBtnTextDisabled]}>Undo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlBtn, isWon && styles.controlBtnDisabled]} onPress={handleRestart} disabled={isWon}>
          <FontAwesome name="refresh" size={16} color={isWon ? uiTheme.textDisabled : uiTheme.textPrimary} />
          <Text style={[styles.controlBtnText, isWon && styles.controlBtnTextDisabled]}>Restart</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlBtn, (isWon || hintsCount <= 0) && styles.controlBtnDisabled]} onPress={handleHintPress} disabled={isWon}>
          <FontAwesome name="lightbulb-o" size={16} color={isWon || hintsCount <= 0 ? uiTheme.textDisabled : uiTheme.warning} />
          <Text style={[styles.controlBtnText, { color: isWon || hintsCount <= 0 ? uiTheme.textDisabled : uiTheme.warning }]}>
            Hint ({hintsCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Victory Modal */}
      <Modal visible={isWon} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Level Cleared!</Text>
            <Text style={styles.modalSubtitle}>Completed in {moves} moves</Text>
            <View style={styles.starsRow}>
              {starAnims.map((anim, idx) => (
                <Animated.Text key={idx} style={[styles.starIcon, { transform: [{ scale: anim }], opacity: idx < starCount ? 1 : 0.3 }]}>
                  ★
                </Animated.Text>
              ))}
            </View>
            <TouchableOpacity style={styles.nextButton} onPress={onNextLevel}>
              <Text style={styles.nextButtonText}>Next Level</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PuzzleBoard;

const makeStyles = (uiTheme: UITheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.md,
    },
    header: {
      alignItems: "center",
    },
    moveText: {
      ...typography.title,
      fontSize: 16,
      color: uiTheme.textPrimary,
      letterSpacing: 1.5,
    },
    boardCard: {
      padding: spacing.sm,
      borderRadius: radii.xl,
      backgroundColor: uiTheme.surface,
      borderWidth: 1,
      borderColor: uiTheme.border,
      ...shadows.md,
    },
    columnCountersRow: {
      flexDirection: "row",
      marginBottom: spacing.xs,
    },
    colCounterBox: {
      alignItems: "center",
      justifyContent: "center",
    },
    rowCounterBox: {
      alignItems: "center",
      justifyContent: "center",
      marginLeft: spacing.xs,
    },
    counterText1: {
      fontSize: 9,
      fontWeight: "700",
      color: uiTheme.primary,
    },
    counterText2: {
      fontSize: 9,
      fontWeight: "700",
      color: uiTheme.textPrimary,
    },
    boardRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    tile: {
      justifyContent: "center",
      alignItems: "center",
      borderRadius: radii.sm,
    },
    tileEmpty: {
      backgroundColor: uiTheme.surfaceSunken,
    },
    tileOne: {
      backgroundColor: uiTheme.primary,
    },
    tileTwo: {
      backgroundColor: uiTheme.primaryDeep ?? "#2B3A4A",
    },
    tileFixed: {
      opacity: 0.85,
    },
    tileHinted: {
      borderWidth: 3,
      borderColor: uiTheme.warning,
    },
    tileError: {
      borderWidth: 3,
      borderColor: uiTheme.danger ?? "#E53E3E",
    },
    tileText: {
      ...typography.title,
      fontSize: 18,
      fontWeight: "800",
    },
    tileTextOne: {
      color: uiTheme.onPrimary,
    },
    tileTextTwo: {
      color: "#FFFFFF",
    },
    hintGhostText: {
      ...typography.title,
      fontSize: 18,
      fontWeight: "800",
      color: uiTheme.warning,
      opacity: 0.6,
    },
    voidCell: {
      justifyContent: "center",
      alignItems: "center",
    },
    voidCellMark: {
      color: uiTheme.textDisabled,
    },
    rightLinkConnector: {
      position: "absolute",
      right: -11,
      top: "50%",
      marginTop: -9,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: uiTheme.primary,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
      ...shadows.sm,
      elevation: 5,
    },
    bottomLinkConnector: {
      position: "absolute",
      bottom: -11,
      left: "50%",
      marginLeft: -9,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: uiTheme.primary,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
      ...shadows.sm,
      elevation: 5,
    },
    linkSymbol: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "bold",
      textAlign: "center",
      lineHeight: 13,
    },
    controlsBar: {
      flexDirection: "row",
      justifyContent: "space-around",
      width: "90%",
      marginTop: spacing.sm,
    },
    controlBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: uiTheme.surface,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: uiTheme.border,
      gap: spacing.xs,
      ...shadows.sm,
    },
    controlBtnDisabled: {
      opacity: 0.5,
    },
    controlBtnText: {
      ...typography.body,
      fontSize: 14,
      fontWeight: "600",
      color: uiTheme.textPrimary,
    },
    controlBtnTextDisabled: {
      color: uiTheme.textDisabled,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.65)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalCard: {
      width: "80%",
      backgroundColor: uiTheme.surface,
      borderRadius: radii.lg,
      padding: spacing.xl,
      alignItems: "center",
      ...shadows.md,
    },
    modalTitle: {
      ...typography.display,
      fontSize: 22,
      color: uiTheme.textPrimary,
    },
    modalSubtitle: {
      ...typography.caption,
      color: uiTheme.textMuted,
      marginVertical: spacing.xs,
    },
    starsRow: {
      flexDirection: "row",
      marginVertical: spacing.md,
      gap: spacing.xs,
    },
    starIcon: {
      fontSize: 36,
      color: uiTheme.star,
    },
    nextButton: {
      backgroundColor: uiTheme.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: radii.md,
      width: "100%",
      alignItems: "center",
    },
    nextButtonText: {
      ...typography.body,
      color: uiTheme.onPrimary,
      fontWeight: "700",
    },
  });