import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  LayoutChangeEvent,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  getFreeHintAvailable,
  recordFreeHintUsed,
  getNextReplenishMS,
  HINT_REPLENISH_MS
} from "../utils/hints"
import {
  unlockNextLevel,
  saveLevelState,
  getLevelState,
  saveLevelStars,
} from "../utils/progress";
import { useTheme } from "../context/ThemeContext";
import { Level } from "../data/chapters";
import { colorCages } from "../utils/levelGenerator";
import { getEffectCount, incrementEffect } from "../utils/coins"
import { checkAndGrantAchievements } from "../utils/achievements";
import {
  spacing,
  radii,
  typography,
  shadows,
  UITheme,
} from "../constants/uiTheme";

interface PuzzleBoardProps {
  size: number;
  levelData: Level;
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
  const { theme, ui: uiTheme } = useTheme();
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);

  // Measure actual available width from layout instead of guessing from Dimensions
  const [containerWidth, setContainerWidth] = useState(0);

  const { cellSize, boardSize } = useMemo(() => {
    if (containerWidth === 0) return { cellSize: 0, boardSize: 0 };
    const PADDING = spacing.lg * 2; // paddingHorizontal applies to both sides
    const BOARD_BORDER = 2; // styles.board has borderWidth: 1 on each side
    const maxWidth = containerWidth - INDICATOR_WIDTH - PADDING;
    const finalCellSize = Math.max(
      30,
      Math.floor((maxWidth - BOARD_BORDER) / size)
    );
    // Board's outer width must include the border so the inner content area
    // is exactly cellSize * size — otherwise the last column wraps and gets
    // clipped by overflow:hidden.
    return {
      cellSize: finalCellSize,
      boardSize: finalCellSize * size + BOARD_BORDER,
    };
  }, [containerWidth, size]);

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    const { width, height, x, y } = e.nativeEvent.layout;
    console.log("CONTAINER LAYOUT:", { width, height, x, y });
    if (width > 0) setContainerWidth(width);
  };

  const [cells, setCells] = useState<number[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [winModalVisible, setWinModalVisible] = useState(false);
  const [history, setHistory] = useState<number[][]>([]);
  const [freeHints, setFreeHints] = useState(0)
  const [extraHints, setExtraHints] = useState(0)
  const [nextReplenishMs, setNextReplenishMs] = useState<number | null>(null)
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [moveCount, setMoveCount] = useState(0);

  const hasWonRef = useRef(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(1)).current;
  const wrongPulse = useRef(new Animated.Value(1)).current;
  const starAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const refreshHintState = useCallback(async () => {
    setFreeHints(await getFreeHintAvailable())
    setExtraHints(await getEffectCount("extra-hints"))
    setNextReplenishMs(await getNextReplenishMS())
  }, [])

  const formatCountdown = (ms: number): string => {
    const total = Math.max(0, Math.ceil(ms / 1000))
    const m = Math.floor(total / 60)
    const s = total % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  const getValidationState = useCallback(
    (arr: number[]) => {
      const voidCount = arr.filter((c) => c === -1).length;
      const playableSpace = size - voidCount;

      const minRequired = Math.floor(playableSpace / 2);
      const maxAllowed = Math.ceil(playableSpace / 2);

      const counts = {
        one: arr.filter((c) => c === 1).length,
        two: arr.filter((c) => c === 2).length,
      };

      let tripleFound = false;
      for (let i = 0; i < arr.length - 2; i++) {
        if (arr[i] > 0 && arr[i] === arr[i + 1] && arr[i] === arr[i + 2]) {
          tripleFound = true;
          break;
        }
      }

      const isInvalid =
        tripleFound || counts.one > maxAllowed || counts.two > maxAllowed;

      const filledCount = counts.one + counts.two;
      const isComplete =
        filledCount === playableSpace &&
        counts.one >= minRequired &&
        counts.one <= maxAllowed &&
        counts.two >= minRequired &&
        counts.two <= maxAllowed &&
        !tripleFound;

      return { isInvalid, isComplete, counts };
    },
    [size]
  );

  const checkWin = useCallback(
    (board: number[]) => {
      if (!board.length || board.some((c) => c === 0)) return false;

      for (let i = 0; i < size; i++) {
        const row = board.slice(i * size, (i + 1) * size);
        const col = Array.from({ length: size }).map(
          (_, r) => board[r * size + i]
        );
        if (
          !getValidationState(row).isComplete ||
          !getValidationState(col).isComplete
        )
          return false;
      }

      if (levelData.cages) {
        for (const cage of levelData.cages) {
          if (cage.target === undefined) continue;
          const sum = cage.indices.reduce(
            (acc, idx) => acc + (board[idx] > 0 ? board[idx] : 0),
            0
          );
          if (sum !== cage.target) return false;
        }
      }

      return true;
    },
    [size, getValidationState, levelData.cages]
  );

  const cycleCell = (index: number) => {
    if (isInitializing || gridData[index] !== 0 || hasWonRef.current) return;

    const newCells = [...cells];
    const currentVal = cells[index];
    const nextVal = (currentVal + 1) % 3;

    const linkGroup = levelData.links?.find((group) =>
      group.indices.includes(index)
    );
    if (linkGroup) {
      linkGroup.indices.forEach((i) => {
        newCells[i] = nextVal;
      });
    } else {
      newCells[index] = nextVal;
    }

    if (currentVal === 0) setMoveCount((m) => m + 1);
    setHistory((h) => [...h, [...cells]].slice(-20));
    setCells(newCells);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveLevelState(chapterId, level, newCells);
  };

  const handleWin = async () => {
    if (hasWonRef.current) return;
    hasWonRef.current = true;

    const emptyCount = gridData.filter((c: number) => c === 0).length || 1;
    const multiplier =
      chapterId === 4 ? 1.15 : Math.max(1.1, 1.8 - (chapterId - 1) * 0.2);

    let stars = 1;
    if (moveCount <= emptyCount * multiplier) stars = 3;
    else if (moveCount <= emptyCount * (multiplier + 0.5)) stars = 2;

    await saveLevelStars(chapterId, level, stars);
    await unlockNextLevel(chapterId, level);

    const newlyEarned = await checkAndGrantAchievements()
    if (newlyEarned.length > 0) {
      const list = newlyEarned.map(a => `🏆 ${a.title} (+${a.reward} coins)`).join("\n")
      Platform.OS === "web" ? window.alert(list) : Alert.alert("Achievement unlocked!", list)
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setWinModalVisible(true);

    starAnims.slice(0, stars).forEach((a, i) => {
      Animated.spring(a, {
        toValue: 1,
        friction: 5,
        tension: 40,
        delay: i * 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const triggerShake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      setWinModalVisible(false);
      setMoveCount(0);
      await refreshHintState()
      hasWonRef.current = false;
      starAnims.forEach((a) => a.setValue(0));

      const purchasedHints = await getEffectCount("extra-hints")
      setExtraHints(purchasedHints)

      const saved = await getLevelState(chapterId, level);
      const safeSaved = saved || [];
      const lengthMatches = safeSaved.length === gridData.length;

      const hintsMatch =
        lengthMatches &&
        gridData.every((v, i) => v === 0 || safeSaved[i] === v);
      const isFinished = lengthMatches && !safeSaved.includes(0);
      const useSaved = !forcedReset && hintsMatch && !isFinished;

      setCells(useSaved ? safeSaved : [...gridData]);
      setIsInitializing(false);
    };
    init();
  }, [level, chapterId, forcedReset, JSON.stringify(levelData?.grid)]);

  const suspectCellIndices = useMemo(() => {
    const empty = new Set<number>()
    if (!cells.length || cells.some((c) => c === 0)) return empty
    if (!levelData.cages) return empty

    for (let i = 0; i < size; i++) {
      const row = cells.slice(i * size, (i + 1) * size)
      const col = Array.from({ length: size }, (_, r) => cells[r * size + i])
      if (!getValidationState(row).isComplete) return empty
      if (!getValidationState(col).isComplete) return empty
    }

    const suspect = new Set<number>()
    for (const cage of levelData.cages) {
      if (cage.target === undefined) continue
      const sum = cage.indices.reduce(
        (acc, idx) => acc + (cells[idx] > 0 ? cells[idx] : 0),
        0
      )
      if (sum !== cage.target) {
        cage.indices.forEach((i) => suspect.add(i))
      }
    }
    return suspect
  }, [cells, size, getValidationState, levelData.cages])

  useEffect(() => {
    if (isInitializing || hasWonRef.current || cells.length === 0) return;
    if (cells.every((c) => c !== 0)) {
      if (checkWin(cells)) handleWin();
      else if (suspectCellIndices.size === 0) triggerShake();
    }
  }, [cells, isInitializing, checkWin]);

  useEffect(() => {
    if (suspectCellIndices.size === 0) {
      wrongPulse.setValue(1)
      return
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(wrongPulse, {
          toValue: 0.35,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(wrongPulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    )

    animation.start()

    return () => {
      animation.stop()
      wrongPulse.setValue(1)
    }
  }, [suspectCellIndices, wrongPulse])

  const handleReset = () => {
    const fresh = [...gridData];
    hasWonRef.current = false;
    setWinModalVisible(false);
    setCells(fresh);
    setHistory([]);
    setMoveCount(0);
    setHintIndex(null);
    starAnims.forEach((a) => a.setValue(0));
    saveLevelState(chapterId, level, fresh);

    useEffect(() => {
      if (nextReplenishMs === null) return
      const id = setInterval(refreshHintState, 15_000)
      return () => clearInterval(id)
    }, [nextReplenishMs, refreshHintState])

  };

  const cageInfo = useMemo(() => {
    const byIndex: number[] = new Array(size * size).fill(-1);
    const targetByIndex: Record<number, number> = {};
    const colorByIndex: string[] = new Array(size * size).fill("transparent");

    if (levelData.cages) {
      const tintAssignments = colorCages(
        levelData.cages,
        size,
        uiTheme.cageTints.length
      );

      levelData.cages.forEach((cage, cageIdx) => {
        const tint = uiTheme.cageTints[tintAssignments[cageIdx]];
        cage.indices.forEach((i) => {
          byIndex[i] = cageIdx;
          colorByIndex[i] = tint;
        });
        if (cage.target !== undefined) {
          const representativeIndex = Math.min(...cage.indices);
          targetByIndex[representativeIndex] = cage.target;
        }
      });
    }
    return { byIndex, targetByIndex, colorByIndex };
  }, [levelData.cages, size, uiTheme]);

  const getCageEdges = useCallback(
    (index: number) => {
      const myCage = cageInfo.byIndex[index];
      if (myCage === -1) return null;

      const row = Math.floor(index / size);
      const col = index % size;

      const differs = (nRow: number, nCol: number, nIdx: number) => {
        if (nRow < 0 || nRow >= size || nCol < 0 || nCol >= size) return true;
        return cageInfo.byIndex[nIdx] !== myCage;
      };

      return {
        top: differs(row - 1, col, index - size),
        bottom: differs(row + 1, col, index + size),
        left: differs(row, col - 1, index - 1),
        right: differs(row, col + 1, index + 1),
        target: cageInfo.targetByIndex[index],
        tint: cageInfo.colorByIndex[index],
      };
    },
    [cageInfo, size]
  );

  if (isInitializing) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <WinModal
        visible={winModalVisible}
        stars={starAnims}
        moves={moveCount}
        onNext={onNextLevel}
      />

      <View style={styles.header}>
        <Text style={styles.moveText}>MOVES: {moveCount}</Text>
      </View>

      {/* This View measures the true available width after safe area insets */}
      <View style={styles.gameWrapper} onLayout={handleContainerLayout}>
        {containerWidth > 0 && cellSize > 0 && (
          <>
            {/* Column indicators */}
            <View style={{ flexDirection: "row" }}>
              <View style={{ width: INDICATOR_WIDTH }} />
              <View
                style={{
                  flexDirection: "row",
                  width: boardSize,
                  paddingHorizontal: 1, // align with board's inner content (1px border)
                }}
              >
                {Array.from({ length: size }).map((_, colIdx) => {
                  const col = Array.from({ length: size }).map(
                    (_, r) => cells[r * size + colIdx]
                  );
                  const { isInvalid, isComplete, counts } =
                    getValidationState(col);
                  return (
                    <View
                      key={colIdx}
                      style={{ width: cellSize, alignItems: "center" }}
                    >
                      <Text
                        style={[
                          styles.indicatorText,
                          isInvalid && styles.textRed,
                          isComplete && styles.textGreen,
                        ]}
                      >
                        {counts.one}
                        {"\n"}
                        {counts.two}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Board row with row indicators */}
            <Animated.View
              style={[
                styles.boardRow,
                { transform: [{ translateX: shakeAnim }] },
              ]}
            >
              <View
                style={[
                  styles.rowIndicators,
                  {
                    width: INDICATOR_WIDTH,
                    paddingVertical: 1, // align with board's inner content (1px border)
                  },
                ]}
              >
                {Array.from({ length: size }).map((_, rowIdx) => {
                  const row = cells.slice(rowIdx * size, (rowIdx + 1) * size);
                  const { isInvalid, isComplete, counts } =
                    getValidationState(row);
                  return (
                    <View
                      key={rowIdx}
                      style={{ height: cellSize, justifyContent: "center" }}
                    >
                      <Text
                        style={[
                          styles.indicatorText,
                          { textAlign: "right", paddingRight: 8 },
                          isInvalid && styles.textRed,
                          isComplete && styles.textGreen,
                        ]}
                      >
                        {counts.one}|{counts.two}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View
                style={[styles.board, { width: boardSize, height: boardSize }]}
                onLayout={(e) => console.log("BOARD LAYOUT:", e.nativeEvent.layout)}
              >
                {cells.map((val, i) => (
                  <Tile
                    key={i}
                    val={val}
                    isFixed={gridData[i] !== 0}
                    linkedColor={
                      levelData.links?.find((g) => g.indices.includes(i))
                        ?.color
                    }
                    onPress={() => cycleCell(i)}
                    size={cellSize}
                    isHinted={hintIndex === i}
                    hintAnim={hintPulse}
                    cageEdges={getCageEdges(i)}
                    chapterId={chapterId}
                    isWrong={suspectCellIndices.has(i)}
                    wrongAnim={wrongPulse}
                  />
                ))}
              </View>
            </Animated.View>
          </>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handleReset}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            if (history.length > 0) {
              const last = history[history.length - 1];
              setCells(last);
              setHistory((h) => h.slice(0, -1));
            }
          }}
        >
          <Text style={styles.buttonText}>Undo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.hintButton]}
          onPress={async () => {
            if (freeHints + extraHints <= 0) return

            const target = cells.findIndex((c) => c === 0)

            setHintIndex(target)

            if (freeHints > 0) {
              await recordFreeHintUsed()
            } else {
              await incrementEffect("extra-hints", -1)
            }
            await refreshHintState()

            Animated.sequence([
              Animated.timing(hintPulse, { toValue: 1.3, duration: 300, useNativeDriver: true }),
              Animated.timing(hintPulse, { toValue: 1.0, duration: 300, useNativeDriver: true }),
            ]).start(() => setHintIndex(null))
          }}
        >
          <Text style={styles.hintButtonText}>
            Hint ({freeHints + extraHints})
          </Text>
          {nextReplenishMs !== null && freeHints < 3 && (
            <Text style={styles.hintCountdownText}>
              +1 in {formatCountdown(nextReplenishMs)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

type TileProps = {
  val: number;
  isFixed: boolean;
  linkedColor?: string;
  onPress: () => void;
  size: number;
  isHinted: boolean;
  hintAnim: Animated.Value;
  cageEdges: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
    target?: number;
    tint?: string;
  } | null;
  chapterId: number;
  isWrong: boolean;
  wrongAnim: Animated.Value;
};

const Tile = ({
  val,
  isFixed,
  linkedColor,
  onPress,
  size,
  isHinted,
  hintAnim,
  cageEdges,
  chapterId,
  isWrong,
  wrongAnim,
}: TileProps) => {
  const { theme, ui: uiTheme } = useTheme();
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);

  if (val === -1) {
    return (
      <View style={{ width: size, height: size, padding: 2 }}>
        <View
          style={[
            styles.fullCell,
            styles.voidCell,
            { borderRadius: radii.sm },
          ]}
        >
          <Text style={[styles.voidCellMark, { fontSize: size * 0.4 }]}>
            ×
          </Text>
        </View>
      </View>
    );
  }

  const cageBorderThickness = uiTheme.name === "mono" ? 4 : 3.5;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isFixed}
      style={{ width: size, height: size, padding: 2 }}
    >
      <Animated.View
        style={[{ flex: 1 }, isHinted && { transform: [{ scale: hintAnim }] }]}
      >
        <View
          style={[
            styles.fullCell,
            {
              backgroundColor: theme.tileColor,
              borderRadius: radii.sm,
              borderWidth: 1.5,
              borderColor: theme.tileEdgeColor,
              opacity: isFixed ? 0.65 : 1,
            },
          ]}
        >
          {val !== 0 && (
            <View
              style={{
                width: size * 0.6,
                height: size * 0.6,
                borderRadius: size * 0.3,
                backgroundColor: val === 1 ? theme.shape1Color : theme.shape2Color,
                ...shadows.sm,
              }}
            />
          )}

          {val !== 0 && chapterId === 4 && (
            <Text style={[styles.tileValueOverlay, { fontSize: size * 0.3 }]}>
              {val}
            </Text>
          )}

          {linkedColor && !isFixed && (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: linkedColor,
                  borderRadius: radii.sm,
                  borderWidth: 1.5,
                  borderColor: linkedColor.replace(/[\d.]+\)$/, "0.6)"),
                },
              ]}
            />
          )}

          {cageEdges && (
            <>
              {cageEdges.tint && (
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      backgroundColor: cageEdges.tint,
                      borderRadius: radii.sm - 2,
                    },
                  ]}
                />
              )}
              <View
                pointerEvents="none"
                style={{
                  ...StyleSheet.absoluteFillObject,
                  borderColor: uiTheme.cageBorder,
                  borderTopWidth: cageEdges.top ? cageBorderThickness : 0,
                  borderBottomWidth: cageEdges.bottom
                    ? cageBorderThickness
                    : 0,
                  borderLeftWidth: cageEdges.left ? cageBorderThickness : 0,
                  borderRightWidth: cageEdges.right ? cageBorderThickness : 0,
                }}
              />
            </>
          )}

          {cageEdges?.target !== undefined && (
            <Text
              style={[
                styles.cageTargetText,
                { fontSize: Math.max(11, size * 0.22) },
              ]}
            >
              {cageEdges.target}
            </Text>
          )}
          {isWrong && (
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                {
                  borderRadius: radii.sm,
                  borderWidth: 3,
                  borderColor: uiTheme.danger,
                }
              ]}></Animated.View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

type WinModalProps = {
  visible: boolean;
  stars: Animated.Value[];
  moves: number;
  onNext: () => void;
};

const WinModal = ({ visible, stars, moves, onNext }: WinModalProps) => {
  const { ui: uiTheme } = useTheme();
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.winTitle}>Cleared!</Text>
          <View style={styles.starRow}>
            {stars.map((anim: any, i: number) => (
              <Animated.Text
                key={i}
                style={[
                  styles.starText,
                  { transform: [{ scale: anim }], opacity: anim },
                ]}
              >
                ★
              </Animated.Text>
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
};

const makeStyles = (uiTheme: UITheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: uiTheme.background,
    },
    loadingText: {
      ...typography.body,
      color: uiTheme.textMuted,
    },
    header: {
      marginBottom: spacing.lg,
      alignSelf: "center"
    },
    moveText: {
      ...typography.title,
      color: uiTheme.textSecondary,
      letterSpacing: 1,
    },
    gameWrapper: {
      alignSelf: "stretch",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
    },
    boardRow: {
      flexDirection: "row",
    },
    rowIndicators: {
      alignItems: "flex-end",
    },
    indicatorText: {
      ...typography.micro,
      color: uiTheme.textMuted,
    },
    textRed: {
      color: uiTheme.danger,
    },
    textGreen: {
      color: uiTheme.success,
    },
    board: {
      flexDirection: "row",
      flexWrap: "wrap",
      backgroundColor: uiTheme.surfaceMuted,
      borderRadius: radii.md,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: uiTheme.border,
    },
    fullCell: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    voidCell: {
      backgroundColor: uiTheme.textSecondary,
      opacity: 0.6,
    },
    voidCellMark: {
      color: uiTheme.surface,
      fontWeight: "800",
    },
    tileValueOverlay: {
      position: "absolute",
      fontWeight: "900",
      color: uiTheme.surface,
      textShadowColor: "rgba(0,0,0,0.6)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    cageTargetText: {
      position: "absolute",
      top: 2,
      left: 4,
      fontWeight: "800",
      color: uiTheme.textPrimary,
      textShadowColor:
        uiTheme.name === "mono"
          ? "rgba(255,255,255,0.9)"
          : "rgba(255,255,255,0.85)",
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 2,
    },
    buttonRow: {
      flexDirection: "row",
      marginTop: spacing.xxl,
      gap: spacing.md,
      alignSelf: "center",
      justifyContent: "center"
    },
    actionButton: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: uiTheme.surface,
      borderRadius: radii.md,
      minWidth: 85,
      alignItems: "center",
      borderWidth: 1,
      borderColor: uiTheme.border,
      ...shadows.sm,
    },
    buttonText: {
      ...typography.caption,
      color: uiTheme.textSecondary,
    },
    hintButton: {
      backgroundColor: uiTheme.star,
      borderColor: uiTheme.star,
    },
    hintButtonText: {
      ...typography.caption,
      color: uiTheme.name === "mono" ? uiTheme.textPrimary : "#FFFFFF",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: uiTheme.surface,
      padding: spacing.xxl + spacing.sm,
      borderRadius: radii.xl,
      alignItems: "center",
      width: "85%",
      borderWidth: 1,
      borderColor: uiTheme.border,
      ...shadows.md,
    },
    winTitle: {
      ...typography.display,
      fontSize: 32,
      color: uiTheme.successDeep,
      marginBottom: spacing.sm,
    },
    starRow: {
      flexDirection: "row",
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    starText: {
      fontSize: 48,
      color: uiTheme.star,
    },
    statsText: {
      ...typography.body,
      color: uiTheme.textMuted,
      marginBottom: spacing.xl + spacing.xs,
    },
    nextButton: {
      backgroundColor: uiTheme.primary,
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.xxl + spacing.md,
      borderRadius: radii.pill,
      ...shadows.sm,
    },
    nextButtonText: {
      color: uiTheme.name === "mono" ? uiTheme.surface : "#FFFFFF",
      fontSize: 18,
      fontWeight: "bold",
    },
    hintCountdownText: {
      ...typography.micro,
      color: uiTheme.name === 'mono' ? uiTheme.textPrimary : '#FFFFFF',
      marginTop: 1,
      opacity: 0.85,
    },
  });