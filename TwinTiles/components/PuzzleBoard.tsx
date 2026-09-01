import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import {
  spacing,
  radii,
  typography,
  shadows,
  UITheme,
} from "../constants/uiTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TILE_MARGIN = 3;

// Vibrant palette for distinct linked pair color-coding
const LINK_PALETTE = [
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#10B981", // Emerald Green
  "#F59E0B", // Amber Gold
  "#06B6D4", // Cyan
  "#F97316", // Orange
];

export interface Cage {
  id: number;
  indices: number[];
  target?: number;
  tint?: string;
}

export interface CageEdges {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
  target?: number;
  tint?: string;
}

export interface LevelData {
  id: number;
  size: number;
  grid: number[];
  cages?: Cage[];
  voids?: number[];
  linkedPairs?: any[];
  [key: string]: any;
}

interface PuzzleBoardProps {
  levelData: LevelData;
  chapterId: number;
  level: number;
  size: number;
  onNextLevel: () => void;
  forcedReset?: boolean;
  daily?: boolean;
}

interface TileProps {
  val: number;
  isFixed: boolean;
  linkedColor?: string;
  cageEdges?: CageEdges | null;
  isWrong?: boolean;
  wrongAnim?: Animated.Value;
  tileSize: number;
  margin: number;
  onPress: () => void;
}

interface WinModalProps {
  visible: boolean;
  starAnims: Animated.Value[];
  starCount: number;
  previousStars: number;
  moves: number;
  onNext: () => void;
}

/* -------------------------------------------------------------------------- */
/*                        DEEP LINK EXTRACTOR HELPER                          */
/* -------------------------------------------------------------------------- */

function extractLinkedColor(levelData: LevelData, index: number): string | undefined {
  if (!levelData) return undefined;

  const knownNonLinkKeys = new Set([
    "grid",
    "cages",
    "voids",
    "id",
    "size",
    "chapterId",
    "level",
  ]);

  const candidates: any[] = [];
  Object.keys(levelData).forEach((key) => {
    if (!knownNonLinkKeys.has(key) && levelData[key] != null) {
      candidates.push(levelData[key]);
    }
  });

  for (let c = 0; c < candidates.length; c++) {
    const source = candidates[c];
    if (!source) continue;

    // 1. Handle arrays
    if (Array.isArray(source)) {
      if (source.length === 0) continue;

      // Flat array matching grid length e.g. [1, 1, 0, 0, 2, 2]
      if (
        source.length === levelData.grid?.length &&
        typeof source[0] === "number"
      ) {
        const groupVal = source[index];
        if (groupVal && groupVal > 0) {
          return LINK_PALETTE[(groupVal - 1) % LINK_PALETTE.length];
        }
      }

      for (let i = 0; i < source.length; i++) {
        const item = source[i];
        if (!item) continue;

        // Nested index array e.g. [0, 1] or [4, 5]
        if (Array.isArray(item)) {
          if (item.includes(index)) {
            return LINK_PALETTE[i % LINK_PALETTE.length];
          }
        }
        // Object entry e.g. { indices: [0, 1] }, { pair: [0, 1] }, { a: 0, b: 1 }
        else if (typeof item === "object") {
          const idxs =
            item.indices ||
            item.pair ||
            item.cells ||
            item.nodes ||
            item.pairIndices ||
            item.group;

          if (Array.isArray(idxs) && idxs.includes(index)) {
            return item.color || LINK_PALETTE[i % LINK_PALETTE.length];
          }

          const p1 = item.a ?? item.cell1 ?? item.index1 ?? item.from ?? item.first;
          const p2 = item.b ?? item.cell2 ?? item.index2 ?? item.to ?? item.second;
          if (p1 === index || p2 === index) {
            return item.color || LINK_PALETTE[i % LINK_PALETTE.length];
          }
        }
      }
    }
    // 2. Handle map objects e.g. { "0": 1, "1": 1 }
    else if (typeof source === "object") {
      const val = source[index] ?? source[`${index}`];
      if (val !== undefined && val !== null && val !== false) {
        if (typeof val === "string" && val.startsWith("#")) return val;
        if (Array.isArray(val) && val.length > 0) {
          return LINK_PALETTE[0];
        }
        const numVal = typeof val === "number" ? val : parseInt(val, 10);
        if (!isNaN(numVal) && numVal > 0) {
          return LINK_PALETTE[(numVal - 1) % LINK_PALETTE.length];
        }
      }
    }
  }

  return undefined;
}

/* -------------------------------------------------------------------------- */
/*                               TILE COMPONENT                               */
/* -------------------------------------------------------------------------- */

export const Tile: React.FC<TileProps> = ({
  val,
  isFixed,
  linkedColor,
  cageEdges,
  isWrong,
  wrongAnim,
  tileSize,
  margin,
  onPress,
}) => {
  const { ui: uiTheme } = useTheme();
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);
  const cageBorderThickness = 3;

  const getEmptyBackground = () => {
    if (cageEdges?.tint) return { backgroundColor: cageEdges.tint };
    if (linkedColor && val === 0) return { backgroundColor: `${linkedColor}1F` };
    return styles.tileEmpty;
  };

  return (
    <TouchableOpacity
      activeOpacity={isFixed ? 1 : 0.7}
      onPress={onPress}
      disabled={isFixed}
      style={{
        width: tileSize,
        height: tileSize,
        margin,
      }}
    >
      <Animated.View
        style={[
          styles.fullCell,
          val === 0 && getEmptyBackground(),
          val === 1 && styles.tileOne,
          val === 2 && styles.tileTwo,
          isFixed && styles.tileFixed,
          isWrong && wrongAnim && {
            opacity: wrongAnim,
            borderColor: uiTheme.danger,
            borderWidth: 2,
          },
        ]}
      >
        {/* Linked Pair Border Highlight */}
        {linkedColor && (
          <View
            pointerEvents="none"
            style={[
              styles.linkedBorderOverlay,
              { borderColor: linkedColor },
            ]}
          />
        )}

        {/* Cage Border Overlay */}
        {cageEdges && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              styles.cageOverlay,
              {
                borderTopWidth: cageEdges.top ? cageBorderThickness : 0,
                borderBottomWidth: cageEdges.bottom ? cageBorderThickness : 0,
                borderLeftWidth: cageEdges.left ? cageBorderThickness : 0,
                borderRightWidth: cageEdges.right ? cageBorderThickness : 0,
                borderColor: uiTheme.cageBorder || "#F59E0B",
              },
            ]}
          />
        )}

        {/* Linked Badge Overlay */}
        {linkedColor && (
          <View
            pointerEvents="none"
            style={[
              styles.linkedBadge,
              { backgroundColor: linkedColor },
            ]}
          >
            <FontAwesome name="link" size={9} color="#FFFFFF" />
          </View>
        )}

        {/* Cage Target Badge */}
        {cageEdges?.target !== undefined && (
          <View style={styles.cageTargetBadge}>
            <Text style={styles.cageTargetText}>{cageEdges.target}</Text>
          </View>
        )}

        {/* Tile Value */}
        {val !== 0 && (
          <Text
            style={[
              styles.tileText,
              val === 1 ? styles.tileTextOne : styles.tileTextTwo,
              isFixed && styles.tileTextFixed,
            ]}
          >
            {val}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

/* -------------------------------------------------------------------------- */
/*                              WIN MODAL COMPONENT                           */
/* -------------------------------------------------------------------------- */

export const WinModal: React.FC<WinModalProps> = ({
  visible,
  starAnims,
  starCount,
  previousStars,
  moves,
  onNext,
}) => {
  const { ui: uiTheme } = useTheme();
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Level Cleared!</Text>
          <Text style={styles.modalSubtitle}>Completed in {moves} moves</Text>

          <View style={styles.starsRow}>
            {starAnims.map((anim, idx) => {
              const isEarned = idx < starCount;
              return (
                <Animated.Text
                  key={idx}
                  style={[
                    styles.starIcon,
                    {
                      transform: [{ scale: anim }],
                      opacity: isEarned ? 1 : 0.3,
                    },
                  ]}
                >
                  ★
                </Animated.Text>
              );
            })}
          </View>

          {starCount > previousStars && previousStars > 0 && (
            <Text style={styles.newBestText}>New High Score!</Text>
          )}

          <TouchableOpacity style={styles.nextButton} onPress={onNext}>
            <Text style={styles.nextButtonText}>Next Level</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/*                            PUZZLE BOARD COMPONENT                          */
/* -------------------------------------------------------------------------- */

export default function PuzzleBoard({
  levelData,
  chapterId,
  level,
  size,
  onNextLevel,
  forcedReset,
  daily,
}: PuzzleBoardProps) {
  const { ui: uiTheme } = useTheme();
  const styles = useMemo(() => makeStyles(uiTheme), [uiTheme]);

  const [grid, setGrid] = useState<number[]>([...levelData.grid]);
  const [moves, setMoves] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [starCount, setStarCount] = useState<number>(3);
  const wrongAnim = useRef(new Animated.Value(1)).current;
  const starAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const maxBoardWidth = SCREEN_WIDTH - spacing.lg * 2;
  const innerWidth = maxBoardWidth - spacing.md * 2;
  const tileSize = Math.floor((innerWidth - size * (TILE_MARGIN * 2)) / size);

  useEffect(() => {
    setGrid([...levelData.grid]);
    setMoves(0);
    setIsWon(false);
  }, [levelData, forcedReset]);

  const isFixedIndex = useCallback(
    (index: number) => levelData.grid[index] !== 0,
    [levelData.grid]
  );

  const isVoidIndex = useCallback(
    (index: number) => levelData.voids?.includes(index) ?? false,
    [levelData.voids]
  );

  const checkIsWon = (currentGrid: number[]) => {
    const isFilled = !currentGrid.some((val, i) => val === 0 && !isVoidIndex(i));
    if (!isFilled) return false;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size - 2; c++) {
        const i1 = r * size + c;
        const i2 = r * size + (c + 1);
        const i3 = r * size + (c + 2);
        if (isVoidIndex(i1) || isVoidIndex(i2) || isVoidIndex(i3)) continue;
        if (
          currentGrid[i1] !== 0 &&
          currentGrid[i1] === currentGrid[i2] &&
          currentGrid[i2] === currentGrid[i3]
        ) {
          return false;
        }
      }
    }

    for (let c = 0; c < size; c++) {
      for (let r = 0; r < size - 2; r++) {
        const i1 = r * size + c;
        const i2 = (r + 1) * size + c;
        const i3 = (r + 2) * size + c;
        if (isVoidIndex(i1) || isVoidIndex(i2) || isVoidIndex(i3)) continue;
        if (
          currentGrid[i1] !== 0 &&
          currentGrid[i1] === currentGrid[i2] &&
          currentGrid[i2] === currentGrid[i3]
        ) {
          return false;
        }
      }
    }

    return true;
  };

  const handleTilePress = (index: number) => {
    if (isFixedIndex(index) || isVoidIndex(index) || isWon) return;

    const nextGrid = [...grid];
    nextGrid[index] = (nextGrid[index] + 1) % 3;
    setGrid(nextGrid);
    const newMoves = moves + 1;
    setMoves(newMoves);

    if (checkIsWon(nextGrid)) {
      setIsWon(true);
      setStarCount(newMoves < 15 ? 3 : newMoves < 25 ? 2 : 1);
      starAnims.forEach((anim, i) => {
        Animated.spring(anim, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
          delay: i * 150,
        }).start();
      });
    }
  };

  const getCageEdgesForIndex = (index: number): CageEdges | null => {
    if (!levelData.cages) return null;
    const cage = levelData.cages.find((c) => c.indices.includes(index));
    if (!cage) return null;

    const row = Math.floor(index / size);
    const col = index % size;
    const isTop = row === 0 || !cage.indices.includes((row - 1) * size + col);
    const isBottom =
      row === size - 1 || !cage.indices.includes((row + 1) * size + col);
    const isLeft = col === 0 || !cage.indices.includes(row * size + (col - 1));
    const isRight =
      col === size - 1 || !cage.indices.includes(row * size + (col + 1));

    const isFirstInCage = cage.indices[0] === index;

    return {
      top: isTop,
      bottom: isBottom,
      left: isLeft,
      right: isRight,
      target: isFirstInCage ? cage.target : undefined,
      tint: cage.tint,
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.moveText}>MOVES: {moves}</Text>
      </View>

      <View style={styles.gameWrapper}>
        <View style={styles.boardCard}>
          {Array.from({ length: size }).map((_, rowIndex) => (
            <View key={rowIndex} style={styles.boardRow}>
              {Array.from({ length: size }).map((_, colIndex) => {
                const idx = rowIndex * size + colIndex;
                const val = grid[idx];

                if (isVoidIndex(idx)) {
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.voidCell,
                        {
                          width: tileSize,
                          height: tileSize,
                          margin: TILE_MARGIN,
                        },
                      ]}
                    >
                      <Text style={styles.voidCellMark}>✕</Text>
                    </View>
                  );
                }

                return (
                  <Tile
                    key={idx}
                    val={val}
                    isFixed={isFixedIndex(idx)}
                    linkedColor={extractLinkedColor(levelData, idx)}
                    cageEdges={getCageEdgesForIndex(idx)}
                    wrongAnim={wrongAnim}
                    tileSize={tileSize}
                    margin={TILE_MARGIN}
                    onPress={() => handleTilePress(idx)}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <WinModal
        visible={isWon}
        starAnims={starAnims}
        starCount={starCount}
        previousStars={0}
        moves={moves}
        onNext={onNextLevel}
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const makeStyles = (uiTheme: UITheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: uiTheme.background,
    },
    header: {
      marginBottom: spacing.lg,
      alignItems: "center",
    },
    moveText: {
      ...typography.title,
      color: uiTheme.textPrimary,
      letterSpacing: 1.5,
    },
    gameWrapper: {
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    boardCard: {
      alignSelf: "center",
      padding: spacing.md,
      borderRadius: radii.xl,
      backgroundColor: uiTheme.surface,
      borderWidth: 1,
      borderColor: uiTheme.border,
      ...shadows.md,
    },
    boardRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    fullCell: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: radii.sm,
      position: "relative",
    },
    voidCell: {
      backgroundColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
    },
    voidCellMark: {
      ...typography.body,
      color: uiTheme.textDisabled,
    },
    tileEmpty: {
      backgroundColor: uiTheme.surfaceSunken,
    },
    tileOne: {
      backgroundColor: uiTheme.primary,
    },
    tileTwo: {
      backgroundColor: uiTheme.primaryDeep,
    },
    tileFixed: {
      opacity: 0.9,
    },
    tileText: {
      ...typography.title,
      fontSize: 22,
      fontWeight: "800",
    },
    tileTextOne: {
      color: uiTheme.onPrimary,
    },
    tileTextTwo: {
      color: "#FFFFFF",
    },
    tileTextFixed: {
      fontWeight: "900",
    },
    cageOverlay: {
      borderRadius: radii.sm,
      zIndex: 2,
    },
    cageTargetBadge: {
      position: "absolute",
      top: 2,
      left: 4,
      zIndex: 10,
    },
    cageTargetText: {
      ...typography.micro,
      fontSize: 10,
      fontWeight: "700",
      color: uiTheme.textMuted || "#A1A1AA",
    },
    linkedBorderOverlay: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: radii.sm,
      borderWidth: 2,
      zIndex: 3,
    },
    linkedBadge: {
      position: "absolute",
      top: 3,
      right: 3,
      width: 17,
      height: 17,
      borderRadius: 8.5,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.25,
      shadowRadius: 1.5,
      elevation: 3,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
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
      fontSize: 24,
      color: uiTheme.textPrimary,
      marginBottom: spacing.xs,
    },
    modalSubtitle: {
      ...typography.caption,
      color: uiTheme.textMuted,
      marginBottom: spacing.md,
    },
    starsRow: {
      flexDirection: "row",
      marginVertical: spacing.md,
      gap: spacing.xs,
    },
    starIcon: {
      fontSize: 40,
      color: uiTheme.star,
    },
    newBestText: {
      ...typography.caption,
      color: uiTheme.success,
      marginBottom: spacing.sm,
    },
    nextButton: {
      marginTop: spacing.md,
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