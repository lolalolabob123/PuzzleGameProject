import React, { useMemo, useCallback } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";

import { GameScreenProps } from "../navigation/types";
import PuzzleBoard from "../components/PuzzleBoard";
import { chapters } from "../data/chapters";

import { useTheme } from "../context/ThemeContext";

import {
  spacing,
  radii,
  typography,
  shadows,
  UITheme,
} from "../constants/uiTheme";

import {
  getDailyLevel,
  getFixedLevel,
  getSeededVoids,
  getChapter4Level,
} from "../utils/levelGenerator";

import { todayKey } from "../utils/daily";

export default function GameScreen({
  route,
  navigation,
}: GameScreenProps) {
  const {
    levelId = 1,
    chapterId = 1,
    forcedReset = false,
    themeIndex = 0,
    daily = false,
  } = route.params || {};

  const { ui: uiTheme } = useTheme();

  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () => makeStyles(uiTheme, insets.top),
    [uiTheme, insets.top]
  );

  /*
   * ---------------------------------------------------------
   * LEVEL DATA
   * ---------------------------------------------------------
   *
   * Chapter 1-3:
   *   Uses the normal Takuzu-style generator.
   *
   * Chapter 3:
   *   Also receives seeded void cells.
   *
   * Chapter 4:
   *   Uses the dedicated cage generator.
   *
   * Daily:
   *   Uses the daily puzzle generator.
   */
  const levelData = useMemo(() => {
    /*
     * DAILY LEVEL
     */
    if (daily) {
      const dateKey = todayKey();

      const { grid, size } = getDailyLevel(dateKey);

      return {
        id: 0,
        size,
        grid,
      };
    }

    /*
     * All current normal levels use a 6x6 board.
     */
    const size = 6;

    /*
     * Difficulty of generated puzzles.
     */
    const difficulty = 0.55;

    /*
     * -------------------------------------------------------
     * CHAPTER 4
     * -------------------------------------------------------
     *
     * Chapter 4 is different from Chapters 1-3.
     *
     * It uses cages, so we MUST use getChapter4Level().
     *
     * getChapter4Level() returns:
     *
     * {
     *   grid: number[],
     *   cages: Cage[]
     * }
     *
     * PuzzleBoard then receives the cage information and
     * draws the cage borders, colours and targets.
     */
    if (chapterId === 4) {
      const { grid, cages } = getChapter4Level(
        levelId,
        size,
        difficulty
      );

      return {
        id: levelId,
        size,
        grid,
        cages,
      };
    }

    /*
     * -------------------------------------------------------
     * CHAPTERS 1-3
     * -------------------------------------------------------
     */

    /*
     * Chapter 3 uses void cells.
     *
     * Chapters 1 and 2 receive no voids.
     */
    const voids =
      chapterId === 3
        ? getSeededVoids(levelId, size, 2)
        : [];

    const grid = getFixedLevel(
      chapterId,
      levelId,
      size,
      difficulty,
      voids
    );

    return {
      id: levelId,
      size,
      grid,
      voids,
    };
  }, [chapterId, levelId, daily]);

  /*
   * ---------------------------------------------------------
   * NEXT LEVEL / CHAPTER PROGRESSION
   * ---------------------------------------------------------
   */
  const handleNextLevel = useCallback(() => {
    /*
     * Daily puzzles don't have a next level.
     */
    if (daily) {
      navigation.goBack();
      return;
    }

    /*
     * Find the current chapter.
     */
    const currentChapter = chapters[chapterId];

    if (!currentChapter) {
      navigation.goBack();
      return;
    }

    /*
     * -------------------------------------------------------
     * CHAPTER 3 -> CHAPTER 4
     * -------------------------------------------------------
     *
     * Chapter 3 has exactly 20 levels.
     *
     * Therefore:
     *
     * Chapter 3 Level 20
     *        ↓
     * Chapter 4 Level 1
     *
     * We explicitly stop Chapter 3 from generating
     * Level 21, Level 22, etc.
     */
    if (chapterId === 3 && levelId >= 20) {
      const nextChapter = chapters[4];

      if (
        nextChapter &&
        nextChapter.levels.length > 0
      ) {
        const firstLevel = nextChapter.levels[0];

        navigation.replace("Game", {
          levelId: firstLevel.id,
          chapterId: 4,
          forcedReset: true,
          themeIndex: themeIndex ?? 0,
        });
      } else {
        navigation.goBack();
      }

      return;
    }

    /*
     * -------------------------------------------------------
     * NORMAL NEXT LEVEL
     * -------------------------------------------------------
     */
    const currentIndex =
      currentChapter.levels.findIndex(
        (l) => l.id === levelId
      );

    /*
     * If another level exists inside the current chapter,
     * go to it.
     */
    if (
      currentIndex !== -1 &&
      currentIndex <
        currentChapter.levels.length - 1
    ) {
      const nextLevel =
        currentChapter.levels[currentIndex + 1];

      navigation.replace("Game", {
        levelId: nextLevel.id,
        chapterId,
        forcedReset: true,
        themeIndex: themeIndex ?? 0,
      });

      return;
    }

    /*
     * -------------------------------------------------------
     * END OF CHAPTER
     * -------------------------------------------------------
     *
     * If we reach the end of another chapter, move to the
     * first level of the next chapter.
     */
    const nextChapterId = chapterId + 1;

    const nextChapter =
      chapters[nextChapterId];

    if (
      nextChapter &&
      nextChapter.levels.length > 0
    ) {
      const firstLevel =
        nextChapter.levels[0];

      navigation.replace("Game", {
        levelId: firstLevel.id,
        chapterId: nextChapterId,
        forcedReset: true,
        themeIndex: themeIndex ?? 0,
      });
    } else {
      /*
       * No more chapters.
       */
      navigation.goBack();
    }
  }, [
    daily,
    chapterId,
    levelId,
    navigation,
    themeIndex,
  ]);

  /*
   * ---------------------------------------------------------
   * ERROR STATE
   * ---------------------------------------------------------
   */
  if (!levelData) {
    return (
      <ErrorState
        levelId={levelId}
        onBack={() => navigation.goBack()}
      />
    );
  }

  /*
   * ---------------------------------------------------------
   * BOARD KEY
   * ---------------------------------------------------------
   *
   * Changing this key forces PuzzleBoard to re-initialize
   * when changing levels.
   */
  const boardKey = daily
    ? `board-daily-${todayKey()}`
    : `board-${chapterId}-${levelId}`;

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom"]}
    >
      <TouchableOpacity
        style={styles.backFab}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
        hitSlop={{
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
        }}
      >
        <FontAwesome
          name="chevron-left"
          size={14}
          color={uiTheme.textPrimary}
        />
      </TouchableOpacity>

      <PuzzleBoard
        key={boardKey}
        levelData={levelData}
        chapterId={chapterId}
        level={levelId}
        size={levelData.size}
        onNextLevel={handleNextLevel}
        forcedReset={forcedReset}
        daily={daily}
      />
    </SafeAreaView>
  );
}

/*
 * -----------------------------------------------------------
 * ERROR STATE
 * -----------------------------------------------------------
 */

const ErrorState = ({
  levelId,
  onBack,
}: {
  levelId: number;
  onBack: () => void;
}) => {
  const { ui: uiTheme } = useTheme();

  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () => makeStyles(uiTheme, insets.top),
    [uiTheme, insets.top]
  );

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>
        Level {levelId} not found!
      </Text>

      <Text style={styles.errorSubtext}>
        This level might not be added to your chapter
        data yet.
      </Text>

      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        activeOpacity={0.8}
      >
        <Text style={styles.backButtonText}>
          Go Back
        </Text>
      </TouchableOpacity>
    </View>
  );
};

/*
 * -----------------------------------------------------------
 * STYLES
 * -----------------------------------------------------------
 */

const makeStyles = (
  uiTheme: UITheme,
  topInset: number
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: uiTheme.background,
    },

    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
      backgroundColor: uiTheme.background,
    },

    errorText: {
      ...typography.title,
      fontSize: 22,
      color: uiTheme.danger,
    },

    errorSubtext: {
      ...typography.body,
      color: uiTheme.textMuted,
      textAlign: "center",
      marginVertical: spacing.sm + 2,
    },

    backButton: {
      marginTop: spacing.xl,
      paddingHorizontal: spacing.xxl - 8,
      paddingVertical: spacing.md,
      backgroundColor: uiTheme.primary,
      borderRadius: radii.md,
      ...shadows.sm,
    },

    backButtonText: {
      color: uiTheme.onPrimary,
      fontWeight: "bold",
    },

    backFab: {
      position: "absolute",
      top: topInset + spacing.xs,
      left: spacing.md,
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: uiTheme.surface,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: uiTheme.border,
      ...shadows.sm,
    },
  });